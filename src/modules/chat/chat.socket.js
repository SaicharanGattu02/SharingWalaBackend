import { prisma } from '../../config/db.js';

export const registerChatSocketHandlers = (io, socket) => {
  const userId = socket.user.id;

  // 1. Automatically join user's private notification channel
  socket.join(`user:${userId}`);

  // 2. Join conversation room with auto-provisioning
  socket.on('join_conversation', async ({ conversationId }) => {
    try {
      if (!conversationId) return;

      // Ensure conversation exists
      let conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            id: conversationId,
            type: 'TRIP_GROUP',
            title: conversationId.startsWith('meetup_chat_')
              ? 'Meetup Group Chat'
              : conversationId.startsWith('plan_chat_')
              ? 'Road Trip Group Chat'
              : 'Group Chat',
          },
        });
      }

      // Ensure user is registered as participant
      let participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      });

      if (!participant) {
        participant = await prisma.conversationParticipant.create({
          data: {
            conversationId,
            userId,
          },
        });
      }

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

        // Auto-provision conversation and participant if needed
        let participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
          include: {
            conversation: {
              include: {
                participants: {
                  select: { userId: true },
                },
              },
            },
          },
        });

        if (!participant) {
          let conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
          });

          if (!conversation) {
            conversation = await prisma.conversation.create({
              data: {
                id: conversationId,
                type: 'TRIP_GROUP',
                title: 'Group Chat',
              },
            });
          }

          participant = await prisma.conversationParticipant.create({
            data: {
              conversationId,
              userId,
            },
            include: {
              conversation: {
                include: {
                  participants: {
                    select: { userId: true },
                  },
                },
              },
            },
          });
        }

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

  // 5. Typing Indicators
  socket.on('typing_start', ({ conversationId }) => {
    socket.to(`conv:${conversationId}`).emit('user_typing', {
      conversationId,
      userId,
      displayName: socket.user.displayName,
    });
  });

  socket.on('typing_stop', ({ conversationId }) => {
    socket.to(`conv:${conversationId}`).emit('user_stopped_typing', {
      conversationId,
      userId,
    });
  });

  // 6. Mark Conversation Read
  socket.on('mark_as_read', async ({ conversationId }) => {
    try {
      await prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
        data: { lastReadAt: new Date() },
      });

      socket.emit('marked_read', { conversationId });
      socket.to(`conv:${conversationId}`).emit('messages_read_receipt', {
        conversationId,
        readerId: userId,
        readAt: new Date(),
      });
    } catch (error) {
      socket.emit('chat_error', { message: error.message });
    }
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
