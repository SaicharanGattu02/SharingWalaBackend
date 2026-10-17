import { prisma } from '../../config/db.js';

export const registerChatSocketHandlers = (io, socket) => {
  const userId = socket.user.id;

  // 1. Automatically join user's private notification channel
  socket.join(`user:${userId}`);

  // 2. Join conversation room with membership check
  socket.on('join_conversation', async ({ conversationId }) => {
    try {
      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      });

      if (!participant) {
        return socket.emit('chat_error', {
          conversationId,
          message: 'Access denied: You are not an active participant in this conversation',
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
    socket.leave(`conv:${conversationId}`);
    socket.emit('left_conversation', { conversationId });
  });

  // 4. Send message (supports TEXT, LOCATION_SHARE, IMAGE)
  socket.on(
    'send_message',
    async ({ conversationId, content, messageType = 'TEXT', latitude, longitude, mediaUrl }) => {
      try {
        // Validate participant & active conversation status
        const participant = await prisma.conversationParticipant.findUnique({
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
          return socket.emit('chat_error', {
            conversationId,
            message: 'You are not authorized to send messages in this conversation',
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

        // Real-time notification badge alert to participants who are not currently in the room
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

  socket.on('disconnect', () => {
    // Clean socket disconnect
  });
};
