import { prisma } from '../../config/db.js';

// Auto-provisions conversation and participants with accurate 1-to-1 DIRECT vs GROUP distinction
async function ensureConversationAndParticipant(conversationId, userId) {
  const isExplicitGroup = conversationId.startsWith('meetup_chat_') ||
    conversationId.startsWith('meetup_') ||
    conversationId.startsWith('plan_chat_') ||
    conversationId.startsWith('plan_group_') ||
    conversationId.startsWith('community_');

  const isDirect = !isExplicitGroup;

  let conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: { select: { userId: true } },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        id: conversationId,
        type: isDirect ? 'DIRECT' : (conversationId.startsWith('meetup_') ? 'MEETUP_GROUP' : 'COMMUNITY_GROUP'),
        title: isDirect ? 'Direct Message' : 'Group Chat',
      },
      include: {
        participants: { select: { userId: true } },
      },
    });
  } else if (isDirect && conversation.type !== 'DIRECT') {
    // Correct previously mislabeled group conversation to DIRECT
    conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { type: 'DIRECT', title: 'Direct Message' },
      include: { participants: { select: { userId: true } } },
    });
  }

  // Ensure current user is registered as participant
  let participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    include: {
      conversation: {
        include: { participants: { select: { userId: true } } },
      },
    },
  });

  if (!participant) {
    participant = await prisma.conversationParticipant.create({
      data: { conversationId, userId },
      include: {
        conversation: {
          include: { participants: { select: { userId: true } } },
        },
      },
    });
  }

  // If 1-to-1 direct conversation, also ensure peer user is added as participant
  if (isDirect) {
    let peerUserId = null;
    if (conversationId.startsWith('trip_')) {
      const parts = conversationId.split('_');
      if (parts.length >= 3 && parts[parts.length - 1] !== userId) {
        peerUserId = parts[parts.length - 1];
      }
    } else if (conversationId.startsWith('direct_')) {
      const parts = conversationId.split('_');
      if (parts.length >= 3) {
        peerUserId = parts[1] === userId ? parts[2] : parts[1];
      }
    } else if (conversationId.startsWith('passenger_')) {
      peerUserId = conversationId.replace('passenger_', '');
    } else if (conversationId.startsWith('driver_')) {
      peerUserId = conversationId.replace('driver_', '');
    }

    if (peerUserId && peerUserId !== userId) {
      const peerExists = await prisma.user.findUnique({ where: { id: peerUserId } });
      if (peerExists) {
        await prisma.conversationParticipant.upsert({
          where: { conversationId_userId: { conversationId, userId: peerUserId } },
          update: {},
          create: { conversationId, userId: peerUserId },
        }).catch(() => {});
      }
    }
  }

  return participant;
}

export const registerChatSocketHandlers = (io, socket) => {
  const userId = socket.user.id;

  // 1. Automatically join user's private notification channel
  socket.join(`user:${userId}`);

  // 2. Join conversation room with auto-provisioning
  socket.on('join_conversation', async ({ conversationId }) => {
    try {
      if (!conversationId) return;

      await ensureConversationAndParticipant(conversationId, userId);

      socket.join(`conv:${conversationId}`);
      socket.emit('joined_conversation', { conversationId });
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

  // 4. Send message (supports TEXT, LOCATION_SHARE, IMAGE)
  socket.on(
    'send_message',
    async ({ conversationId, content, messageType = 'TEXT', latitude, longitude, mediaUrl }) => {
      try {
        if (!conversationId) return;

        const participant = await ensureConversationAndParticipant(conversationId, userId);

        if (participant.conversation.isArchived) {
          return socket.emit('chat_error', {
            conversationId,
            message: 'This conversation has been archived and is now read-only',
          });
        }

        // Persist message in Prisma
        const message = await prisma.chatMessage.create({
          data: {
            conversationId,
            senderId: userId,
            messageType,
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
            where: { id: conversationId },
            data: { lastMessageAt: new Date() },
          }),
          prisma.conversationParticipant.update({
            where: {
              conversationId_userId: {
                conversationId,
                userId,
              },
            },
            data: { lastReadAt: new Date() },
          }),
        ]);

        // Real-time broadcast to all clients currently inside the conversation room
        io.to(`conv:${conversationId}`).emit('new_message', message);

        // Real-time notification badge alert to participants outside the room
        participant.conversation.participants.forEach((p) => {
          if (p.userId !== userId) {
            io.to(`user:${p.userId}`).emit('message_notification', {
              conversationId,
              conversationType: participant.conversation.type,
              senderName: socket.user.displayName,
              preview: messageType === 'LOCATION_SHARE' ? '📍 Shared a location pin' : content,
              createdAt: message.createdAt,
            });
          }
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

  // 7. VoIP 1-to-1 Calling Events (User ID to User ID)
  socket.on('call:initiate', ({ toUserId, callType = 'AUDIO' }) => {
    if (!toUserId) return;
    io.to(`user:${toUserId}`).emit('call:incoming', {
      callerId: userId,
      callerName: socket.user.displayName || socket.user.username,
      callerAvatar: socket.user.avatarUrl,
      callType,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('call:accept', ({ callerId }) => {
    if (!callerId) return;
    io.to(`user:${callerId}`).emit('call:accepted', {
      receiverId: userId,
      receiverName: socket.user.displayName || socket.user.username,
    });
  });

  socket.on('call:reject', ({ callerId, reason = 'DECLINED' }) => {
    if (!callerId) return;
    io.to(`user:${callerId}`).emit('call:rejected', {
      receiverId: userId,
      reason,
    });
  });

  socket.on('call:missed', async ({ toUserId, callType = 'AUDIO', conversationId }) => {
    if (!toUserId) return;
    io.to(`user:${toUserId}`).emit('call:missed', {
      callerId: userId,
      callerName: socket.user.displayName || socket.user.username,
      callerAvatar: socket.user.avatarUrl,
      callType,
      timestamp: new Date().toISOString(),
    });

    // Auto-record missed call in direct conversation so both parties see it in chat history
    try {
      const targetConvId = conversationId || `direct_${[userId, toUserId].sort().join('_')}`;
      await ensureConversationAndParticipant(targetConvId, userId);
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
        senderId: message.senderId,
        senderName: message.sender?.displayName || 'User',
        senderAvatar: message.sender?.avatarUrl,
        content: message.content,
        messageType: 'MISSED_CALL',
        createdAt: message.createdAt.toISOString(),
      };

      io.to(`conv:${targetConvId}`).emit('new_message', socketPayload);
      io.to(`user:${userId}`).emit('new_message', socketPayload);
      io.to(`user:${toUserId}`).emit('new_message', socketPayload);
    } catch (err) {
      // Non-blocking fallback
    }
  });

  socket.on('call:signal', ({ toUserId, signalData }) => {
    if (!toUserId || !signalData) return;
    io.to(`user:${toUserId}`).emit('call:signal', {
      fromUserId: userId,
      signalData,
    });
  });

  socket.on('call:end', ({ toUserId, reason = 'HUNG_UP' }) => {
    if (!toUserId) return;
    io.to(`user:${toUserId}`).emit('call:ended', {
      byUserId: userId,
      reason,
    });
  });

  socket.on('disconnect', () => {
    // Clean socket disconnect
  });
};
