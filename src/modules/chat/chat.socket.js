import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { getIO } from '../../config/socket.js';
import { ensureConversationRecord, markAsRead, resolvePeerUserId } from './chat.service.js';
import { hasBlocked, recipientsWhoBlocked, unhideConversationFor } from './chat.privacy.service.js';
import { sendIncomingCallPush, sendCallEndedPush, registerUserFcmToken } from '../../config/firebase.js';
import { createNotification } from '../notification/notification.service.js';
import {
  bufferSignalIfNeeded,
  endSession,
  endSessionBetween,
  getSessionForCallee,
  getUnansweredOutgoingSessions,
  isDuplicateInitiation,
  markAccepted,
  markCalleeReady,
  startSession,
} from './call.session.js';

const ALLOWED_MESSAGE_TYPES = new Set(['TEXT', 'LOCATION_SHARE', 'IMAGE', 'SYSTEM_ALERT', 'MISSED_CALL']);
const CALLER_OFFLINE_GRACE_MS = 15 * 1000;
const REDELIVER_INCOMING_WITHIN_MS = 45 * 1000;

/** Replay WebRTC signals the callee missed while its app was waking up. */
const replaySignals = (io, calleeId, callerId, signals) => {
  if (!io || !signals || signals.length === 0) return;
  console.log(`📞 [Call] Replaying ${signals.length} buffered signal(s) from ${callerId} to ${calleeId}`);
  signals.forEach((signalData) => {
    io.to(`user:${calleeId}`).emit('call:signal', { fromUserId: callerId, signalData });
  });
};

// In-memory active connected socket tracking per user
const onlineUsers = new Map(); // userId -> Set<socketId>
const userLastSeen = new Map(); // userId -> string ISO

export const isUserOnline = (userId) => {
  const set = onlineUsers.get(userId);
  return Boolean(set && set.size > 0);
};

export const getUserLastSeen = (userId) => {
  return userLastSeen.get(userId) || null;
};

/**
 * @param fromSocket true when the receiver's app itself is connected (socket
 *   event). False for the REST call made by the push handler while the app is
 *   still closed — in that case the app can't receive replayed signals yet.
 */
export const notifyCallRinging = async ({ callerId, receiverId, conversationId, fromSocket = false }) => {
  if (!callerId) return;
  let targetId = callerId;
  try {
    const dp = await prisma.driverProfile.findUnique({
      where: { id: callerId },
      select: { userId: true },
    });
    if (dp?.userId) targetId = dp.userId;
  } catch (_) {}

  console.log(`📞 [Socket/API] Dispatching call:ringing from receiver ${receiverId} to caller ${targetId}`);
  try {
    const io = getIO();
    if (fromSocket && receiverId) {
      replaySignals(io, receiverId, targetId, markCalleeReady(receiverId, targetId));
    }
    io.to(`user:${targetId}`).emit('call:ringing', {
      receiverId,
      conversationId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('⚠️ [Call] Failed to emit call:ringing:', err.message);
  }
};

export const resolveTargetUsers = async (inputIdentifier, convId, currentUserId) => {
  const resolved = new Set();
  let candidate = (inputIdentifier || '').trim();
  if (candidate.startsWith('passenger_')) candidate = candidate.replace('passenger_', '');
  if (candidate.startsWith('driver_')) candidate = candidate.replace('driver_', '');

  if (candidate && candidate !== 'host' && candidate !== currentUserId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: candidate },
        select: { id: true },
      });
      if (user) resolved.add(user.id);
    } catch (_) {}

    if (resolved.size === 0) {
      try {
        const dp = await prisma.driverProfile.findUnique({
          where: { id: candidate },
          select: { userId: true },
        });
        if (dp?.userId) resolved.add(dp.userId);
      } catch (_) {}
    }

    if (resolved.size === 0) {
      try {
        const booking = await prisma.booking.findUnique({
          where: { id: candidate },
          select: { passengerId: true, ride: { select: { driver: { select: { userId: true } } } } },
        });
        if (booking) {
          if (booking.passengerId && booking.passengerId !== currentUserId) {
            resolved.add(booking.passengerId);
          } else if (booking.ride?.driver?.userId && booking.ride.driver.userId !== currentUserId) {
            resolved.add(booking.ride.driver.userId);
          }
        }
      } catch (_) {}
    }
  }

  const potentialConvId =
    convId ||
    (candidate.startsWith('direct_') ||
    candidate.startsWith('conv_') ||
    candidate.startsWith('trip_')
      ? candidate
      : null);
  if (potentialConvId) {
    try {
      const conv = await prisma.conversation.findUnique({
        where: { id: potentialConvId },
        include: { participants: { select: { userId: true } } },
      });
      if (conv?.participants) {
        conv.participants.forEach((p) => {
          if (p.userId && p.userId !== currentUserId) resolved.add(p.userId);
        });
      }
    } catch (_) {}

    if (potentialConvId.startsWith('trip_')) {
      try {
        const peer = await resolvePeerUserId(potentialConvId, currentUserId);
        if (peer && peer !== currentUserId) {
          resolved.add(peer);
        }
      } catch (_) {}
    }

    if (potentialConvId.startsWith('direct_')) {
      const raw = potentialConvId.replace('direct_', '');
      if (raw.includes(currentUserId)) {
        const peer = raw.replace(currentUserId, '').replace(/^_+|_+$/g, '');
        if (peer) resolved.add(peer);
      }
    }
  }

  if (resolved.size === 0 && candidate && candidate !== 'host' && candidate !== currentUserId) {
    resolved.add(candidate);
  }

  if (currentUserId) {
    resolved.delete(currentUserId);
  }
  return Array.from(resolved);
};

export const initiateCallSession = async ({
  callerId,
  callerUser,
  toUserId,
  conversationId,
  callType = 'AUDIO',
}) => {
  const targets = await resolveTargetUsers(toUserId, conversationId, callerId);
  if (targets.length === 0 && toUserId) {
    targets.push(toUserId.trim());
  }

  const payload = {
    callerId,
    callerName: callerUser?.displayName || callerUser?.username || 'Caller',
    callerAvatar: callerUser?.avatarUrl,
    callType,
    conversationId: conversationId || (toUserId && toUserId.startsWith('trip_') ? toUserId : null),
    timestamp: new Date().toISOString(),
  };

  console.log(`📞 [Call] initiateCallSession from ${callerId} (${payload.callerName}) ➔ to users:`, targets);

  let io;
  try {
    io = getIO();
  } catch (_) {}

  // Blocked either way: the call silently never rings (the caller just sees
  // it go unanswered), like WhatsApp.
  const blockedTargets = new Set();
  for (const targetId of targets) {
    if ((await hasBlocked(targetId, callerId)) || (await hasBlocked(callerId, targetId))) {
      blockedTargets.add(targetId);
    }
  }

  targets.forEach((targetId) => {
    if (blockedTargets.has(targetId)) {
      console.log(`📞 [Call] Not ringing ${targetId}: blocked`);
      return;
    }
    // The app starts every call over both socket and REST; ring only once.
    if (isDuplicateInitiation(callerId, targetId)) {
      console.log(`📞 [Call] Ignoring duplicate initiation ${callerId} ➔ ${targetId}`);
      return;
    }
    startSession({ callerId, calleeId: targetId, payload });

    // 1. Live WebSocket delivery for Foreground / Locked / Active Background states
    if (io) {
      io.to(`user:${targetId}`).emit('call:incoming', payload);
    }

    // 2. High-Priority Data-Only FCM Push for Killed / Swiped Away states
    sendIncomingCallPush({
      recipientUserId: targetId,
      callerId: payload.callerId,
      callerName: payload.callerName,
      callerAvatar: payload.callerAvatar,
      callType: payload.callType,
      conversationId: payload.conversationId,
    }).catch((err) => console.error('FCM call push error:', err));
  });

  if (conversationId && io) {
    io.to(`conv:${conversationId}`).emit('call:incoming_in_room', {
      ...payload,
      toUserIds: targets.filter((t) => !blockedTargets.has(t)),
    });
  }

  return { success: true, targets, payload };
};

export const disconnectUserSockets = (userId) => {
  try {
    const io = getIO();
    const set = onlineUsers.get(userId);
    if (set) {
      for (const socketId of set) {
        const s = io.sockets.sockets.get(socketId);
        if (s) {
          s.disconnect(true);
        }
      }
      onlineUsers.delete(userId);
    }
  } catch (_) {}
};

export const registerChatSocketHandlers = (io, socket) => {
  const userId = socket.user.id;

  // Track online status
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  const userSockets = onlineUsers.get(userId);
  const wasOffline = userSockets.size === 0;
  userSockets.add(socket.id);

  if (wasOffline) {
    io.emit('user:status', {
      userId,
      isOnline: true,
      lastSeen: new Date().toISOString(),
    });
  }

  // 1. Automatically join user's private notification channel
  socket.join(`user:${userId}`);

  // 1b. Someone is calling this user and the call is still ringing (e.g. the
  // user opened the app from the launcher instead of the call notification).
  // Re-deliver it so the incoming call screen shows. The app ignores
  // duplicates of a call it already shows.
  const ringingCall = getSessionForCallee(userId);
  if (
    ringingCall &&
    !ringingCall.accepted &&
    Date.now() - ringingCall.createdAt < REDELIVER_INCOMING_WITHIN_MS
  ) {
    console.log(`📞 [Call] Re-delivering ringing call from ${ringingCall.callerId} to reconnected ${userId}`);
    socket.emit('call:incoming', ringingCall.payload);
  }

  // Query real-time status of another user
  socket.on('get_user_status', async ({ targetUserId }, callback) => {
    if (!targetUserId) return;
    const isOnline = isUserOnline(targetUserId);
    let lastSeen = getUserLastSeen(targetUserId);
    if (!isOnline && !lastSeen) {
      try {
        const u = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { updatedAt: true, lastLoginAt: true },
        });
        if (u) {
          lastSeen = (u.updatedAt || u.lastLoginAt)?.toISOString() || null;
        }
      } catch (_) {}
    }
    const result = { userId: targetUserId, isOnline, lastSeen };
    if (typeof callback === 'function') {
      callback(result);
    } else {
      socket.emit('user:status', result);
    }
  });

  // 2. Join conversation room with auto-provisioning and canonical resolution
  socket.on('join_conversation', async ({ conversationId }) => {
    try {
      if (!conversationId) return;

      const participant = await ensureConversationRecord(conversationId, userId);
      const targetConvId = participant.targetConvId || conversationId;

      socket.join(`conv:${targetConvId}`);
      if (conversationId !== targetConvId) {
        socket.join(`conv:${conversationId}`);
      }
      socket.emit('joined_conversation', { conversationId, targetConvId });
    } catch (error) {
      socket.emit('chat_error', { message: error.message });
    }
  });

  // 3. Leave conversation room
  socket.on('leave_conversation', ({ conversationId }) => {
    if (!conversationId) return;
    socket.leave(`conv:${conversationId}`);
    socket.emit('left_conversation', { conversationId });
  });

  // Dynamic re-authentication if token refreshed or session switched
  socket.on('reauthenticate', async ({ token }, callback) => {
    try {
      if (!token) return;
      const decoded = jwt.verify(token, env.jwt.secret);
      if (decoded?.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, username: true, displayName: true, avatarUrl: true, status: true },
        });
        if (dbUser && dbUser.status === 'ACTIVE') {
          if (socket.user?.id && socket.user.id !== dbUser.id) {
            socket.leave(`user:${socket.user.id}`);
            const oldSet = onlineUsers.get(socket.user.id);
            if (oldSet) {
              oldSet.delete(socket.id);
              if (oldSet.size === 0) onlineUsers.delete(socket.user.id);
            }
          }
          socket.user = dbUser;
          socket.join(`user:${dbUser.id}`);
          if (!onlineUsers.has(dbUser.id)) onlineUsers.set(dbUser.id, new Set());
          onlineUsers.get(dbUser.id).add(socket.id);
          if (typeof callback === 'function') callback({ success: true, userId: dbUser.id });
        }
      }
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // 4. Send message (supports TEXT, LOCATION_SHARE, IMAGE)
  socket.on(
    'send_message',
    async ({ conversationId, content, messageType = 'TEXT', latitude, longitude, mediaUrl, token }) => {
      try {
        if (!conversationId) return;
        const safeMessageType = ALLOWED_MESSAGE_TYPES.has(messageType) ? messageType : 'TEXT';

        let effectiveUserId = socket.user?.id;
        // Verify token in payload to guarantee 100% identity accuracy and prevent stale session echoes
        if (token) {
          try {
            const decoded = jwt.verify(token, env.jwt.secret);
            if (decoded?.userId) {
              const refreshedUser = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, displayName: true, avatarUrl: true, status: true },
              });
              if (refreshedUser && refreshedUser.status !== 'ACTIVE') {
                return socket.emit('chat_error', { conversationId, message: 'Account access restricted' });
              }
              effectiveUserId = decoded.userId;
              if (refreshedUser && (!socket.user || socket.user.id !== decoded.userId)) {
                socket.user = refreshedUser;
              }
            }
          } catch (_) {}
        }

        if (!effectiveUserId) return;

        const participant = await ensureConversationRecord(conversationId, effectiveUserId);
        const targetConvId = participant.targetConvId || conversationId;

        if (participant.conversation && participant.conversation.isArchived) {
          return socket.emit('chat_error', {
            conversationId,
            message: 'This conversation has been archived and is now read-only',
          });
        }
        if (participant.peerUserId && (await hasBlocked(effectiveUserId, participant.peerUserId))) {
          return socket.emit('chat_error', {
            conversationId,
            code: 'BLOCKED_BY_YOU',
            message: 'You blocked this contact. Unblock them to send a message.',
          });
        }

        // Persist message in Prisma under canonical conversation ID
        const message = await prisma.chatMessage.create({
          data: {
            conversationId: targetConvId,
            senderId: effectiveUserId,
            messageType: safeMessageType,
            content: content ? content.trim() : '',
            latitude: latitude ? String(latitude) : null,
            longitude: longitude ? String(longitude) : null,
            mediaUrl,
          },
          include: {
            sender: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        });

        // Update conversation lastMessageAt and sender's lastReadAt
        await Promise.all([
          prisma.conversation.update({
            where: { id: targetConvId },
            data: { lastMessageAt: new Date() },
          }),
          prisma.conversationParticipant.update({
            where: {
              conversationId_userId: {
                conversationId: targetConvId,
                userId: effectiveUserId,
              },
            },
            data: { lastReadAt: new Date() },
          }),
        ]);

        const socketPayload = {
          id: message.id,
          conversationId: targetConvId,
          aliasConversationId: conversationId !== targetConvId ? conversationId : undefined,
          senderId: message.senderId,
          senderName: message.sender?.displayName || socket.user?.displayName || 'User',
          senderAvatar: message.sender?.avatarUrl || socket.user?.avatarUrl,
          content: message.content,
          messageType: message.messageType,
          latitude: message.latitude,
          longitude: message.longitude,
          mediaUrl: message.mediaUrl,
          createdAt: message.createdAt.toISOString(),
        };

        const recipientUserIds = new Set();
        if (participant.conversation && participant.conversation.participants) {
          participant.conversation.participants.forEach((p) => {
            if (p.userId !== effectiveUserId) recipientUserIds.add(p.userId);
          });
        }
        if (participant.peerUserId && participant.peerUserId !== effectiveUserId) {
          recipientUserIds.add(participant.peerUserId);
        }

        // People who blocked the sender silently never receive it.
        const silent = await recipientsWhoBlocked(effectiveUserId, [...recipientUserIds]);
        silent.forEach((id) => recipientUserIds.delete(id));
        // A deleted chat comes back when a new message arrives.
        await unhideConversationFor(targetConvId, [effectiveUserId, ...recipientUserIds]);

        // Real-time broadcast to clients inside the conversation room
        const roomEmit = (room) => {
          let target = io.to(room);
          silent.forEach((id) => {
            target = target.except(`user:${id}`);
          });
          target.emit('new_message', socketPayload);
        };
        roomEmit(`conv:${targetConvId}`);
        if (conversationId !== targetConvId) roomEmit(`conv:${conversationId}`);

        // Notification badge alert to participants outside the room

        recipientUserIds.forEach((recipientUserId) => {
          if (!recipientUserId || recipientUserId === effectiveUserId) return;

          const msgPreview = messageType === 'LOCATION_SHARE' ? '📍 Shared a location pin' : content;
          io.to(`user:${recipientUserId}`).emit('message_notification', {
            conversationId: targetConvId,
            conversationType: participant.conversation?.type || 'DIRECT',
            senderId: effectiveUserId,
            senderName: socketPayload.senderName,
            senderAvatar: socketPayload.senderAvatar || '',
            preview: msgPreview,
            createdAt: message.createdAt,
          });
          io.to(`user:${recipientUserId}`).emit('new_message', socketPayload);

          // WhatsApp-style instant push notification
          // Flutter client handles in-app active conversation suppression automatically
          createNotification({
            userId: recipientUserId,
            type: 'CHAT_MESSAGE',
            title: socketPayload.senderName,
            message: msgPreview,
            data: {
              conversationId: targetConvId,
              senderId: effectiveUserId,
              senderName: socketPayload.senderName,
              senderAvatar: socketPayload.senderAvatar || '',
              route: '/chat-conversation',
            },
            sendPush: true,
          }).catch((e) => console.warn('Failed to dispatch message notification:', e.message));
        });
      } catch (error) {
        socket.emit('chat_error', { message: error.message });
      }
    }
  );

  // 5. Typing indicator
  socket.on('typing_start', ({ conversationId }) => {
    if (!conversationId) return;
    socket.to(`conv:${conversationId}`).emit('user_typing', {
      conversationId,
      userId,
      displayName: socket.user.displayName,
      isTyping: true,
    });
  });

  socket.on('typing_stop', ({ conversationId }) => {
    if (!conversationId) return;
    socket.to(`conv:${conversationId}`).emit('user_typing', {
      conversationId,
      userId,
      displayName: socket.user.displayName,
      isTyping: false,
    });
  });

  // 5b. Read Receipts & Mark As Read Handler
  const handleReadReceipt = async ({ conversationId }) => {
    if (!conversationId) return;
    try {
      await markAsRead(userId, conversationId);
    } catch (_) {}
  };

  socket.on('read_receipt', handleReadReceipt);
  socket.on('messages_read_receipt', handleReadReceipt);
  socket.on('message_read', handleReadReceipt);
  socket.on('mark_as_read', handleReadReceipt);

  // 6. Community event broadcast
  socket.on('community_event', ({ communityId, eventType, data }) => {
    if (!communityId) return;
    io.to(`conv:community_${communityId}`).emit('community_update', {
      communityId,
      eventType,
      data,
      emittedBy: socket.user.displayName,
    });
  });

  // 7. VoIP 1-to-1 Calling Events (User ID to User ID & Conversation Room)
  socket.on('call:initiate', async ({ toUserId, callType = 'AUDIO', conversationId }) => {
    if (!toUserId && !conversationId) return;
    await initiateCallSession({
      callerId: userId,
      callerUser: socket.user,
      toUserId,
      conversationId,
      callType,
    });
  });

  socket.on('register_fcm_token', ({ fcmToken }) => {
    if (fcmToken && userId) {
      registerUserFcmToken(userId, fcmToken);
    }
  });

  socket.on('call:ringing', async ({ callerId, conversationId }) => {
    if (!callerId) return;
    await notifyCallRinging({ callerId, receiverId: userId, conversationId, fromSocket: true });
  });

  socket.on('call:accept', async ({ callerId }) => {
    if (!callerId) return;
    const targets = await resolveTargetUsers(callerId, null, userId);
    const targetId = targets[0] || callerId;
    console.log(`📞 [Socket] call:accept from ${userId} to caller ${targetId}`);
    // Deliver any offer/ICE the receiver has not seen yet before telling the caller.
    replaySignals(io, userId, targetId, markAccepted(userId, targetId));
    io.to(`user:${targetId}`).emit('call:accepted', {
      receiverId: userId,
      receiverName: socket.user.displayName || socket.user.username,
    });
  });

  socket.on('call:reject', async ({ callerId, reason = 'DECLINED' }) => {
    if (!callerId) return;
    const targets = await resolveTargetUsers(callerId, null, userId);
    const targetId = targets[0] || callerId;
    console.log(`📞 [Socket] call:reject from ${userId} to caller ${targetId} (reason: ${reason})`);
    // A BUSY reject comes from a receiver on another call: only end the session
    // if it is for this caller (endSessionBetween checks that).
    endSessionBetween(userId, targetId);
    io.to(`user:${targetId}`).emit('call:rejected', {
      receiverId: userId,
      reason,
    });
  });

  socket.on('call:missed', async ({ toUserId, callType = 'AUDIO', conversationId }) => {
    if (!toUserId) return;
    const targets = await resolveTargetUsers(toUserId, conversationId, userId);
    const targetId = (targets && targets.length > 0 ? targets[0] : null) || toUserId;
    io.to(`user:${targetId}`).emit('call:missed', {
      callerId: userId,
      callerName: socket.user.displayName || socket.user.username,
      callerAvatar: socket.user.avatarUrl,
      callType,
      timestamp: new Date().toISOString(),
    });

    // Auto-record missed call in direct conversation so both parties see it in chat history
    try {
      const convLookup = conversationId || `direct_${[userId, targetId].sort().join('_')}`;
      const participant = await ensureConversationRecord(convLookup, userId);
      const targetConvId = participant.targetConvId || convLookup;

      // Debounce: Avoid duplicate missed call messages within 4 seconds
      const recentMissed = await prisma.chatMessage.findFirst({
        where: {
          conversationId: targetConvId,
          messageType: 'MISSED_CALL',
          createdAt: { gte: new Date(Date.now() - 4000) },
        },
      });
      if (recentMissed) return;

      const isVideo = callType === 'VIDEO';
      const content = isVideo ? 'Missed video call' : 'Missed voice call';

      const message = await prisma.chatMessage.create({
        data: {
          conversationId: targetConvId,
          senderId: userId,
          messageType: 'MISSED_CALL',
          content,
        },
        include: {
          sender: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      });

      await prisma.conversation.update({
        where: { id: targetConvId },
        data: { lastMessageAt: new Date() },
      }).catch(() => {});

      const socketPayload = {
        id: message.id,
        conversationId: targetConvId,
        aliasConversationId: conversationId !== targetConvId ? conversationId : undefined,
        senderId: message.senderId,
        senderName: message.sender?.displayName || socket.user?.displayName || 'User',
        senderAvatar: message.sender?.avatarUrl || socket.user?.avatarUrl,
        content: message.content,
        messageType: 'MISSED_CALL',
        createdAt: message.createdAt.toISOString(),
      };

      console.log(`📞 [Socket] Recorded missed call in ${targetConvId} from ${userId} to ${targetId}`);
      io.to(`conv:${targetConvId}`).emit('new_message', socketPayload);
      if (conversationId && conversationId !== targetConvId) {
        io.to(`conv:${conversationId}`).emit('new_message', socketPayload);
      }
      io.to(`user:${userId}`).emit('new_message', socketPayload);
      io.to(`user:${targetId}`).emit('new_message', socketPayload);

      // Dispatch in-app notification & push for missed call
      createNotification({
        userId: targetId,
        type: 'CHAT_MESSAGE',
        title: socketPayload.senderName,
        message: `📞 ${content}`,
        data: {
          conversationId: targetConvId,
          senderId: userId,
          senderName: socketPayload.senderName,
          route: '/chat-conversation',
        },
        sendPush: true,
      }).catch((e) => console.warn('Failed to dispatch missed call notification:', e.message));
    } catch (err) {
      console.error('❌ [Socket] call:missed auto-record error:', err);
    }
  });

  socket.on('call:signal', async ({ toUserId, signalData }) => {
    if (!toUserId || !signalData) return;
    const targets = await resolveTargetUsers(toUserId, null, userId);
    const targetId = targets[0] || toUserId;
    // Receiver may still be waking up from a push — keep a copy to replay.
    bufferSignalIfNeeded({ fromUserId: userId, toUserId: targetId, signalData });
    io.to(`user:${targetId}`).emit('call:signal', {
      fromUserId: userId,
      signalData,
    });
  });

  socket.on('call:end', async ({ toUserId, reason = 'HUNG_UP' }) => {
    if (!toUserId) return;
    const targets = await resolveTargetUsers(toUserId, null, userId);
    const targetId = targets[0] || toUserId;
    endSessionBetween(userId, targetId);
    io.to(`user:${targetId}`).emit('call:ended', {
      byUserId: userId,
      reason,
    });
    // Send high-priority data push so recipient's device stops ringing if in background or killed
    sendCallEndedPush({
      recipientUserId: targetId,
      callerId: userId,
    }).catch(() => {});
  });

  socket.on('disconnect', () => {
    const sockets = onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);

        // Caller went offline while their call was still ringing (app killed,
        // network lost). If they don't come back quickly, stop the ringing on
        // the receiver's phone instead of letting it ring for a dead call.
        getUnansweredOutgoingSessions(userId).forEach((session) => {
          if (session.callerOfflineTimer) clearTimeout(session.callerOfflineTimer);
          session.callerOfflineTimer = setTimeout(() => {
            if (isUserOnline(userId)) return;
            const current = getSessionForCallee(session.calleeId);
            if (current !== session || current.accepted) return;
            console.log(`📞 [Call] Caller ${userId} offline — ending ringing call to ${session.calleeId}`);
            endSession(session.calleeId);
            io.to(`user:${session.calleeId}`).emit('call:ended', {
              byUserId: userId,
              reason: 'CALLER_DISCONNECTED',
            });
            sendCallEndedPush({ recipientUserId: session.calleeId, callerId: userId }).catch(() => {});
          }, CALLER_OFFLINE_GRACE_MS);
        });

        const lastSeen = new Date().toISOString();
        userLastSeen.set(userId, lastSeen);
        io.emit('user:status', {
          userId,
          isOnline: false,
          lastSeen,
        });
      }
    }
  });
};
