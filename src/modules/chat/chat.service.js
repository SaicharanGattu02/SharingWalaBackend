import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/apiError.js';
import { getIO } from '../../config/socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, '../stranger/stranger_store.json');

// Auto-provision or update conversation with strict 1-to-1 DIRECT vs GROUP classification
async function ensureConversationRecord(conversationId, userId) {
  const isExplicitGroup =
    conversationId.startsWith('meetup_chat_') ||
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
    // Fix existing erroneously mislabeled group conversation to DIRECT
    conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { type: 'DIRECT', title: 'Direct Message' },
      include: { participants: { select: { userId: true } } },
    });
  }

  // Ensure current user is a participant
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

  // If 1-to-1 direct conversation, also auto-register peer user if discoverable
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

function resolveConversationMetadata(conv, currentUserId) {
  let strangerStore = { strangerMeetups: [], strangerTrips: [], strangerPlans: [] };
  try {
    if (fs.existsSync(storePath)) {
      strangerStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    }
  } catch (_) {}

  const convId = conv.id || '';
  const rawType = (conv.type || '').toUpperCase();

  // 1. Explicit 1-to-1 Individual / Direct Conversations
  const isDirect =
    rawType === 'DIRECT' ||
    convId.startsWith('trip_') ||
    convId.startsWith('direct_') ||
    convId.startsWith('passenger_') ||
    convId.startsWith('driver_') ||
    (convId.startsWith('stranger_') && !convId.startsWith('stranger_meetup_'));

  if (isDirect) {
    const otherParticipant = conv.participants?.find((part) => part.userId !== currentUserId);
    const otherUser = otherParticipant?.user;

    let title = otherUser?.displayName;
    if (!title && conv.ride) {
      title = currentUserId === conv.ride.driverId ? 'Passenger' : (conv.ride.driverName || 'Trip Captain');
    }
    if (!title) {
      title = conv.title && conv.title !== 'Group Chat' && conv.title !== 'Road Trip Group Chat' ? conv.title : 'Direct Message';
    }

    let subtitle = 'Direct 1-on-1 Conversation';
    if (conv.ride) {
      subtitle = `1-on-1 Trip • ${conv.ride.startLocationName || 'Origin'} ➔ ${conv.ride.endLocationName || 'Destination'}`;
    }

    return {
      title,
      subtitle,
      avatarUrl: otherUser?.avatarUrl || '',
      isGroup: false,
    };
  }

  // 2. Meetup Groups
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

  // 3. Plan Groups
  if (convId.startsWith('plan_chat_') || convId.startsWith('plan_group_')) {
    const tripId = convId.replace('plan_chat_', '').replace('plan_group_', '');
    const p = (strangerStore.strangerPlans || []).find((x) => x.id === tripId || x.code === tripId);
    if (p) {
      return {
        title: p.title,
        subtitle: `Road Trip Group • ${p.location || 'Curated Trip'}`,
        avatarUrl: p.imageUrl || '',
        isGroup: true,
      };
    }
    return {
      title: 'Road Trip Group',
      subtitle: 'Road Trip Group • Commute Trip',
      avatarUrl: '',
      isGroup: true,
    };
  }

  // 4. Community Groups
  if (conv.community || rawType === 'COMMUNITY_GROUP') {
    return {
      title: conv.community?.name || conv.title || 'Community Hub',
      subtitle: 'Community Group • Verified Members',
      avatarUrl: conv.community?.logoUrl || '',
      isGroup: true,
    };
  }

  // 5. Explicit Ride Group (multi-passenger trip group)
  if (rawType === 'RIDE_GROUP') {
    return {
      title: conv.ride
        ? `${conv.ride.startLocationName || 'Start'} ➔ ${conv.ride.endLocationName || 'Destination'}`
        : (conv.title || 'Ride Group Chat'),
      subtitle: conv.ride ? `Carpool Group • Ride #${conv.ride.id}` : 'Carpool Ride Group',
      avatarUrl: '',
      isGroup: true,
    };
  }

  return {
    title: conv.title && conv.title !== 'Group Chat' ? conv.title : 'Direct Message',
    subtitle: 'Direct Conversation',
    avatarUrl: '',
    isGroup: false,
  };
}

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
      title: 'Direct Message',
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
      whereClause.conversation = {
        OR: [
          { type: 'DIRECT' },
          { id: { startsWith: 'trip_' } },
          { id: { startsWith: 'direct_' } },
          { id: { startsWith: 'passenger_' } },
          { id: { startsWith: 'driver_' } },
        ],
      };
    } else if (filter === 'GROUPS' || filter === 'GROUP') {
      whereClause.conversation = {
        type: { in: ['COMMUNITY_GROUP', 'RIDE_GROUP', 'TRIP_GROUP', 'JOURNEY_GROUP', 'MEETUP_GROUP'] },
        AND: [
          { NOT: { id: { startsWith: 'trip_' } } },
          { NOT: { id: { startsWith: 'direct_' } } },
          { NOT: { id: { startsWith: 'passenger_' } } },
          { NOT: { id: { startsWith: 'driver_' } } },
        ],
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
              driverId: true,
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
      const otherParticipant = conv.participants?.find((part) => part.userId !== userId);

      return {
        id: conv.id,
        uuid: conv.uuid,
        type: meta.isGroup ? conv.type : 'DIRECT',
        isGroup: meta.isGroup,
        category: meta.isGroup ? 'groups' : 'direct',
        title: meta.title,
        subtitle: meta.subtitle,
        avatarUrl: meta.avatarUrl,
        peerId: otherParticipant?.userId || otherParticipant?.user?.id || null,
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
  // Validate or auto-provision participant membership
  const participant = await ensureConversationRecord(conversationId, userId);

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
  const participant = await ensureConversationRecord(conversationId, userId);

  if (participant.conversation && participant.conversation.isArchived) {
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
    if (participant.conversation && participant.conversation.participants) {
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
    }
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
