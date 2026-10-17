import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/apiError.js';
import { getIO } from '../../config/socket.js';

export const getOrCreateDirectConversation = async (userId, recipientUserId) => {
  if (userId === recipientUserId) {
    throw new ApiError(400, 'You cannot start a direct chat with yourself');
  }

  const recipient = await prisma.user.findUnique({
    where: { id: recipientUserId },
    select: { id: true, displayName: true, status: true },
  });

  if (!recipient || recipient.status !== 'ACTIVE') {
    throw new ApiError(404, 'Recipient user not found or inactive');
  }

  // Look for existing DIRECT conversation containing both participants
  const existingConv = await prisma.conversation.findFirst({
    where: {
      type: 'DIRECT',
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: recipientUserId } } },
      ],
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      },
    },
  });

  if (existingConv) {
    return existingConv;
  }

  // Create new DIRECT conversation with both participants
  const newConversation = await prisma.conversation.create({
    data: {
      type: 'DIRECT',
      participants: {
        create: [{ userId }, { userId: recipientUserId }],
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      },
    },
  });

  return newConversation;
};

export const getUserConversations = async (userId) => {
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          ride: {
            select: {
              id: true,
              startLocationName: true,
              endLocationName: true,
              departureAt: true,
              status: true,
            },
          },
          community: {
            select: { id: true, name: true, logoUrl: true },
          },
          bikerTrip: {
            select: {
              id: true,
              title: true,
              coverImageUrl: true,
              startDate: true,
              status: true,
            },
          },
          participants: {
            include: {
              user: {
                select: { id: true, displayName: true, avatarUrl: true },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: { id: true, displayName: true },
              },
            },
          },
        },
      },
    },
    orderBy: {
      conversation: {
        lastMessageAt: 'desc',
      },
    },
  });

  // Calculate unread counts for each conversation
  const results = await Promise.all(
    participations.map(async (p) => {
      const conv = p.conversation;
      const lastRead = p.lastReadAt || new Date(0);

      const unreadCount = await prisma.chatMessage.count({
        where: {
          conversationId: conv.id,
          createdAt: { gt: lastRead },
          senderId: { not: userId },
        },
      });

      return {
        id: conv.id,
        uuid: conv.uuid,
        type: conv.type,
        title:
          conv.title ||
          (conv.type === 'DIRECT'
            ? conv.participants.find((part) => part.userId !== userId)?.user.displayName || 'Direct Chat'
            : 'Chat Room'),
        ride: conv.ride,
        community: conv.community,
        bikerTrip: conv.bikerTrip,
        lastMessage: conv.messages[0] || null,
        unreadCount,
        isArchived: conv.isArchived,
        lastMessageAt: conv.lastMessageAt,
      };
    })
  );

  return results;
};

export const getConversationMessages = async (userId, conversationId, { page = 1, limit = 30 }) => {
  // Validate participant membership
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
    include: { conversation: true },
  });

  if (!participant) {
    throw new ApiError(403, 'You are not a participant in this conversation');
  }

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { conversationId, isDeleted: false },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    }),
    prisma.chatMessage.count({
      where: { conversationId, isDeleted: false },
    }),
  ]);

  // Mark conversation as read upon fetching messages
  await prisma.conversationParticipant.update({
    where: {
      conversationId_userId: { conversationId, userId },
    },
    data: { lastReadAt: new Date() },
  });

  return {
    messages: messages.reverse(), // Ascending chronological order for chat UI
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const sendChatMessage = async (userId, conversationId, data) => {
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
    throw new ApiError(403, 'You are not a participant in this conversation');
  }

  if (participant.conversation.isArchived) {
    throw new ApiError(400, 'This conversation has been archived and is read-only');
  }

  const message = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderId: userId,
      messageType: data.messageType || 'TEXT',
      content: data.content ? data.content.trim() : '',
      latitude: data.latitude ? String(data.latitude) : null,
      longitude: data.longitude ? String(data.longitude) : null,
      mediaUrl: data.mediaUrl,
    },
    include: {
      sender: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });

  await Promise.all([
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
    prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: { lastReadAt: new Date() },
    }),
  ]);

  // Broadcast via Socket.io if active
  try {
    const io = getIO();
    io.to(`conv:${conversationId}`).emit('new_message', message);
    participant.conversation.participants.forEach((p) => {
      if (p.userId !== userId) {
        io.to(`user:${p.userId}`).emit('message_notification', {
          conversationId,
          conversationType: participant.conversation.type,
          senderName: message.sender.displayName,
          preview: message.messageType === 'LOCATION_SHARE' ? '📍 Shared a location' : message.content,
          createdAt: message.createdAt,
        });
      }
    });
  } catch (err) {
    // Socket broadcast is best-effort for REST endpoint
  }

  return message;
};

export const markAsRead = async (userId, conversationId) => {
  await prisma.conversationParticipant.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
    data: { lastReadAt: new Date() },
  });

  return { conversationId, readAt: new Date() };
};
