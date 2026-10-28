import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, '../stranger/stranger_store.json');

function resolveConversationMetadata(conv, currentUserId) {
  let strangerStore = { strangerMeetups: [], strangerTrips: [], strangerPlans: [] };
  try {
    if (fs.existsSync(storePath)) {
      strangerStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    }
  } catch (_) {}

  const convId = conv.id || '';
  const isGroup = conv.type !== 'DIRECT';

  if (convId.startsWith('meetup_chat_') || convId.startsWith('meetup_')) {
    const meetupId = convId.replace('meetup_chat_', '');
    const m = (strangerStore.strangerMeetups || []).find((x) => x.id === meetupId);
    if (m) {
      return {
        title: m.title,
        subtitle: `Meetup Group • ${m.venueName || m.area || m.category || 'Jubilee Hills'}`,
        avatarUrl: m.imageUrl || m.hostAvatar || '',
        isGroup: true,
      };
    }
    return {
      title: 'Weekend Commute Meetup',
      subtitle: 'Meetup Group • Stranger Mode',
      avatarUrl: '',
      isGroup: true,
    };
  }

  if (convId.startsWith('plan_') || convId.startsWith('stranger_')) {
    const tripId = convId.replace('plan_chat_', '').replace('plan_stranger_', '');
    const t = (strangerStore.strangerTrips || []).find((x) => x.id === tripId || x.id === `stranger_${tripId}`);
    if (t) {
      return {
        title: `${t.origin} ➔ ${t.destination} Road Trip`,
        subtitle: `Road Trip Group • ${t.mode === 'bikepool' ? 'Bikepool' : 'Carpool'} • ${t.date || 'Weekend Commute'}`,
        avatarUrl: t.imageUrl || '',
        isGroup: true,
      };
    }
    const p = (strangerStore.strangerPlans || []).find((x) => x.id === tripId || x.code === tripId);
    if (p) {
      return {
        title: p.title,
        subtitle: `Road Trip Group • ${p.location || 'Curated Trip'}`,
        avatarUrl: p.imageUrl || '',
        isGroup: true,
      };
    }
  }

  if (conv.community) {
    return {
      title: conv.community.name,
      subtitle: 'Community Group • Verified Members',
      avatarUrl: conv.community.logoUrl || '',
      isGroup: true,
    };
  }

  if (conv.ride) {
    return {
      title: `${conv.ride.startLocationName || 'Start'} ➔ ${conv.ride.endLocationName || 'Destination'}`,
      subtitle: `Carpool Group • Ride #${conv.ride.id}`,
      avatarUrl: '',
      isGroup: true,
    };
  }

  if (conv.type === 'DIRECT') {
    const otherParticipant = conv.participants?.find((part) => part.userId !== currentUserId);
    return {
      title: otherParticipant?.user?.displayName || 'Direct Chat',
      subtitle: 'Direct Conversation',
      avatarUrl: otherParticipant?.user?.avatarUrl || '',
      isGroup: false,
    };
  }

  return {
    title: conv.title && conv.title !== 'Group Chat' && conv.title !== 'Chat Room' ? conv.title : (isGroup ? 'Commute Group' : 'Direct Chat'),
    subtitle: isGroup ? 'Commute Group Chat' : 'Direct Conversation',
    avatarUrl: '',
    isGroup,
  };
}
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

export const getUserConversations = async (userId, typeFilter = null) => {
  const whereClause = { userId };

  if (typeFilter) {
    const filter = String(typeFilter).toUpperCase().trim();
    if (filter === 'DIRECT') {
      whereClause.conversation = { type: 'DIRECT' };
    } else if (filter === 'GROUPS' || filter === 'GROUP') {
      whereClause.conversation = {
        type: { in: ['COMMUNITY_GROUP', 'RIDE_GROUP', 'TRIP_GROUP', 'JOURNEY_GROUP'] },
      };
    } else if (['RIDE_GROUP', 'COMMUNITY_GROUP', 'TRIP_GROUP', 'JOURNEY_GROUP'].includes(filter)) {
      whereClause.conversation = { type: filter };
    }
  }

  const participations = await prisma.conversationParticipant.findMany({
    where: whereClause,
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

      const meta = resolveConversationMetadata(conv, userId);

      return {
        id: conv.id,
        uuid: conv.uuid,
        type: conv.type,
        isGroup: meta.isGroup,
        category: meta.isGroup ? 'groups' : 'direct',
        title: meta.title,
        subtitle: meta.subtitle,
        avatarUrl: meta.avatarUrl,
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
  let participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
    include: { conversation: true },
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
          title: conversationId.startsWith('meetup_chat_')
            ? 'Meetup Group Chat'
            : conversationId.startsWith('plan_chat_')
            ? 'Road Trip Group Chat'
            : 'Group Chat',
        },
      });
    }
    participant = await prisma.conversationParticipant.create({
      data: {
        conversationId,
        userId,
      },
      include: { conversation: true },
    });
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
          preview: message.messageType === 'LOCATION_SHARE' ? 'ðŸ“ Shared a location' : message.content,
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
