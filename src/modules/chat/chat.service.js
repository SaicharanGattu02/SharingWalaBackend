import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/apiError.js';
import { getIO } from '../../config/socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, '../stranger/stranger_store.json');

/**
 * Broadcasts real-time read receipt across socket rooms and private channels
 */
export async function broadcastReadReceipt(userId, conversationId, targetConvId) {
  try {
    const io = getIO();
    const payload = {
      conversationId: targetConvId,
      aliasConversationId: conversationId !== targetConvId ? conversationId : undefined,
      readByUserId: userId,
      readAt: new Date().toISOString(),
    };

    io.to(`conv:${targetConvId}`).emit('read_receipt', payload);
    io.to(`conv:${targetConvId}`).emit('messages_read_receipt', payload);
    io.to(`conv:${targetConvId}`).emit('message:read', payload);

    if (conversationId && conversationId !== targetConvId) {
      io.to(`conv:${conversationId}`).emit('read_receipt', payload);
      io.to(`conv:${conversationId}`).emit('messages_read_receipt', payload);
      io.to(`conv:${conversationId}`).emit('message:read', payload);
    }

    // Also notify other participants directly on their user channel
    const conv = await prisma.conversation.findUnique({
      where: { id: targetConvId },
      include: { participants: { select: { userId: true } } },
    });

    if (conv?.participants) {
      conv.participants.forEach((p) => {
        if (p.userId !== userId) {
          io.to(`user:${p.userId}`).emit('read_receipt', payload);
          io.to(`user:${p.userId}`).emit('messages_read_receipt', payload);
          io.to(`user:${p.userId}`).emit('message:read', payload);
        }
      });
    }
  } catch (_) {}
}

/**
 * Resolves the peer user ID from any conversation ID format
 * Validates that candidate IDs actually exist in the DB (prevents foreign key errors on mock IDs)
 */
export async function resolvePeerUserId(conversationId, currentUserId) {
  if (!conversationId || typeof conversationId !== 'string') return null;

  // Skip sample / mock trip chats like trip_match_01, trip_match_02
  if (conversationId.startsWith('trip_match_')) {
    return null;
  }

  let candidateId = null;

  // 1. direct_${id1}_${id2}
  if (conversationId.startsWith('direct_')) {
    const parts = conversationId.split('_');
    if (parts.length >= 3) {
      candidateId = parts[1] === currentUserId ? parts[2] : parts[1];
    }
  }

  // 2. passenger_${userId}
  else if (conversationId.startsWith('passenger_')) {
    candidateId = conversationId.replace('passenger_', '');
  }

  // 3. driver_${userId}
  else if (conversationId.startsWith('driver_')) {
    candidateId = conversationId.replace('driver_', '');
  }

  // 4. trip_${rideId}_${peer}
  else if (conversationId.startsWith('trip_')) {
    const parts = conversationId.split('_');
    if (parts.length >= 3) {
      const rideId = parts[1];
      const rawPeer = parts.slice(2).join('_');

      try {
        const ride = await prisma.ride.findUnique({
          where: { id: rideId },
          include: {
            driver: { select: { userId: true, id: true } },
          },
        });
        if (ride) {
          const driverUserId = ride.driver?.userId;
          if (driverUserId) {
            if (driverUserId !== currentUserId) {
              candidateId = driverUserId;
            } else if (rawPeer === driverUserId || rawPeer === ride.driver?.id) {
              candidateId = currentUserId;
            }
          }
        }
      } catch (_) {}

      if (!candidateId) {
        try {
          const driverProfile = await prisma.driverProfile.findUnique({
            where: { id: rawPeer },
            select: { userId: true },
          });
          if (driverProfile?.userId) {
            candidateId = driverProfile.userId;
          }
        } catch (_) {}
      }

      if (!candidateId && rawPeer && rawPeer !== 'host' && rawPeer.length > 5) {
        candidateId = rawPeer;
      }
    }
  }

  // 5. stranger_${id} or plan_${id}
  else if (conversationId.startsWith('stranger_') || conversationId.startsWith('plan_')) {
    const rawId = conversationId.replace('stranger_', '').replace('plan_', '');
    try {
      if (fs.existsSync(storePath)) {
        const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
        const allItems = [
          ...(store.strangerTrips || []),
          ...(store.strangerPlans || []),
        ];
        const match = allItems.find((x) => x.id === rawId || x.code === rawId);
        if (match && match.hostId) {
          candidateId = match.hostId;
        }
      }
    } catch (_) {}
  }

  // 6. Check existing conversation in DB
  if (!candidateId) {
    try {
      const existing = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: { select: { userId: true } },
        },
      });
      if (existing && existing.type === 'DIRECT') {
        const other = existing.participants.find((p) => p.userId !== currentUserId);
        if (other) candidateId = other.userId;
      }
    } catch (_) {}
  }

  // Self check: if candidate is current user, return currentUserId so caller can reject self-chat
  if (candidateId === currentUserId) {
    return currentUserId;
  }

  // Critical Validation: verify that candidateId exists in the user database
  if (candidateId) {
    try {
      const userExists = await prisma.user.findUnique({
        where: { id: candidateId },
        select: { id: true },
      });
      if (userExists) {
        return userExists.id;
      }
    } catch (_) {}
  }

  return null;
}

// Auto-provision or update conversation with strict 1-to-1 DIRECT vs GROUP classification
export async function ensureConversationRecord(conversationId, userId) {
  const isExplicitGroup =
    conversationId.startsWith('meetup_chat_') ||
    conversationId.startsWith('meetup_') ||
    conversationId.startsWith('plan_chat_') ||
    conversationId.startsWith('plan_group_') ||
    conversationId.startsWith('community_') ||
    conversationId.startsWith('ride_group_');

  const isDirect = !isExplicitGroup;

  // 1-on-1 Direct Chats: Canonical deterministic ID direct_${[u1, u2].sort().join('_')}
  if (isDirect) {
    const peerUserId = await resolvePeerUserId(conversationId, userId);

    if (peerUserId && peerUserId === userId) {
      throw new ApiError(400, 'You cannot start a direct conversation with yourself');
    }

    const targetConvId = peerUserId
      ? `direct_${[userId, peerUserId].sort().join('_')}`
      : conversationId;

    let conversation = await prisma.conversation.findUnique({
      where: { id: targetConvId },
      include: {
        participants: { select: { userId: true, lastReadAt: true } },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          id: targetConvId,
          type: 'DIRECT',
          title: 'Direct Message',
          participants: {
            create: peerUserId
              ? [{ userId }, { userId: peerUserId }]
              : [{ userId }],
          },
        },
        include: {
          participants: { select: { userId: true, lastReadAt: true } },
        },
      });
    } else {
      if (conversation.type !== 'DIRECT') {
        conversation = await prisma.conversation.update({
          where: { id: targetConvId },
          data: { type: 'DIRECT', title: 'Direct Message' },
          include: { participants: { select: { userId: true, lastReadAt: true } } },
        });
      }

      // Ensure both current user and peer are participants
      await prisma.conversationParticipant.upsert({
        where: { conversationId_userId: { conversationId: targetConvId, userId } },
        update: {},
        create: { conversationId: targetConvId, userId },
      }).catch(() => {});

      if (peerUserId) {
        await prisma.conversationParticipant.upsert({
          where: { conversationId_userId: { conversationId: targetConvId, userId: peerUserId } },
          update: {},
          create: { conversationId: targetConvId, userId: peerUserId },
        }).catch(() => {});
      }
    }

    // Migrate any legacy messages that were sent under an alias conversationId
    if (conversationId !== targetConvId) {
      try {
        await prisma.chatMessage.updateMany({
          where: { conversationId },
          data: { conversationId: targetConvId },
        });
      } catch (_) {}
    }

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: targetConvId, userId } },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, displayName: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });

    return {
      ...participant,
      targetConvId,
      peerUserId,
    };
  }

  // Explicit Group Handling
  let conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: { select: { userId: true, lastReadAt: true } },
    },
  });

  if (!conversation) {
    let communityId = null;
    let groupTitle = 'Group Chat';
    if (conversationId.startsWith('community_')) {
      communityId = conversationId.replace('community_', '');
      try {
        const c = await prisma.community.findUnique({
          where: { id: communityId },
          select: { name: true },
        });
        if (c?.name) groupTitle = c.name;
      } catch (_) {}
    }

    conversation = await prisma.conversation.create({
      data: {
        id: conversationId,
        type: conversationId.startsWith('community_')
          ? 'COMMUNITY_GROUP'
          : 'TRIP_GROUP',
        communityId,
        title: groupTitle,
      },
      include: {
        participants: { select: { userId: true, lastReadAt: true } },
      },
    });
  }

  let participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    include: {
      conversation: {
        include: {
          participants: {
            include: {
              user: { select: { id: true, displayName: true, avatarUrl: true } },
            },
          },
        },
      },
    },
  });

  if (!participant) {
    participant = await prisma.conversationParticipant.create({
      data: { conversationId, userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, displayName: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });
  }

  return {
    ...participant,
    targetConvId: conversationId,
    peerUserId: null,
  };
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
  if (!recipientUserId) {
    throw new ApiError(400, 'Recipient user ID is required');
  }

  if (userId === recipientUserId) {
    throw new ApiError(400, 'You cannot start a direct chat with yourself');
  }

  const recipient = await prisma.user.findUnique({
    where: { id: recipientUserId },
    select: { id: true, displayName: true, status: true, avatarUrl: true },
  });

  if (!recipient || recipient.status !== 'ACTIVE') {
    throw new ApiError(404, 'Recipient user not found or inactive');
  }

  const canonicalId = `direct_${[userId, recipientUserId].sort().join('_')}`;

  let conv = await prisma.conversation.findUnique({
    where: { id: canonicalId },
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

  if (!conv) {
    conv = await prisma.conversation.create({
      data: {
        id: canonicalId,
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
  } else {
    // Ensure both are participants
    await Promise.all([
      prisma.conversationParticipant.upsert({
        where: { conversationId_userId: { conversationId: canonicalId, userId } },
        update: {},
        create: { conversationId: canonicalId, userId },
      }),
      prisma.conversationParticipant.upsert({
        where: { conversationId_userId: { conversationId: canonicalId, userId: recipientUserId } },
        update: {},
        create: { conversationId: canonicalId, userId: recipientUserId },
      }),
    ]);
  }

  return conv;
};

export const getUserConversations = async (userId, typeFilter = null, search = null) => {
  // Auto-sync / backfill community group conversations for the user's approved memberships
  try {
    const userMemberships = await prisma.communityMember.findMany({
      where: { userId, isApproved: true },
      include: {
        community: { select: { id: true, name: true, isActive: true } },
      },
    });

    for (const m of userMemberships) {
      if (!m.community || !m.community.isActive) continue;
      const convId = `community_${m.community.id}`;
      let conv = await prisma.conversation.findFirst({
        where: { OR: [{ id: convId }, { communityId: m.community.id }] },
      });
      if (!conv) {
        conv = await prisma.conversation.create({
          data: {
            id: convId,
            type: 'COMMUNITY_GROUP',
            communityId: m.community.id,
            title: m.community.name,
            lastMessageAt: m.community.createdAt || new Date(0),
          },
        });
      }
      await prisma.conversationParticipant.upsert({
        where: {
          conversationId_userId: {
            conversationId: conv.id,
            userId,
          },
        },
        update: {},
        create: {
          conversationId: conv.id,
          userId,
        },
      }).catch(() => {});
    }
  } catch (syncErr) {
    console.warn('[ChatService] Community auto-sync error:', syncErr.message);
  }

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
        type: { in: ['COMMUNITY_GROUP', 'RIDE_GROUP', 'TRIP_GROUP', 'JOURNEY_GROUP'] },
        AND: [
          { NOT: { id: { startsWith: 'trip_' } } },
          { NOT: { id: { startsWith: 'direct_' } } },
          { NOT: { id: { startsWith: 'passenger_' } } },
          { NOT: { id: { startsWith: 'driver_' } } },
        ],
      };
    } else if (filter === 'COMMUNITIES' || filter === 'COMMUNITY') {
      whereClause.conversation = { type: 'COMMUNITY_GROUP' };
    } else if (['RIDE_GROUP', 'COMMUNITY_GROUP', 'TRIP_GROUP', 'JOURNEY_GROUP', 'DIRECT'].includes(filter)) {
      whereClause.conversation = { type: filter };
    }
  }

  if (search && typeof search === 'string' && search.trim().length > 0) {
    const s = search.trim();
    const searchCondition = {
      OR: [
        { title: { contains: s } },
        {
          messages: {
            some: {
              content: { contains: s },
            },
          },
        },
        {
          participants: {
            some: {
              user: {
                displayName: { contains: s },
              },
            },
          },
        },
      ],
    };
    if (whereClause.conversation) {
      whereClause.conversation = {
        AND: [whereClause.conversation, searchCondition],
      };
    } else {
      whereClause.conversation = searchCondition;
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

      const lastMsg = conv.messages[0] || null;
      let formattedLastMessage = null;
      let effectiveTime = null;

      if (lastMsg) {
        effectiveTime = lastMsg.createdAt;
        formattedLastMessage = {
          id: lastMsg.id,
          conversationId: conv.id,
          senderId: lastMsg.senderId,
          content: lastMsg.content,
          messageType: lastMsg.messageType,
          createdAt: lastMsg.createdAt.toISOString(),
          sender: lastMsg.sender,
          isMe: lastMsg.senderId === userId,
        };
      } else {
        effectiveTime = conv.createdAt || new Date(0);
      }

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
        lastMessage: formattedLastMessage,
        unreadCount,
        isArchived: conv.isArchived,
        lastMessageAt: effectiveTime ? new Date(effectiveTime).toISOString() : new Date(0).toISOString(),
      };
    })
  );

  // Group and deduplicate direct conversations by peerId or peer title so each peer user appears EXACTLY ONCE
  const directMap = new Map();
  const groupList = [];

  for (const item of results) {
    if (!item.isGroup && item.peerId && item.peerId === userId) {
      continue;
    }

    if (item.isGroup) {
      groupList.push(item);
    } else {
      const peerKey = item.peerId || (item.title ? item.title.trim().toLowerCase() : item.id);
      if (!directMap.has(peerKey)) {
        directMap.set(peerKey, item);
      } else {
        const existing = directMap.get(peerKey);
        const existingTime = existing.lastMessageAt ? new Date(existing.lastMessageAt).getTime() : 0;
        const itemTime = item.lastMessageAt ? new Date(item.lastMessageAt).getTime() : 0;

        existing.unreadCount = (existing.unreadCount || 0) + (item.unreadCount || 0);

        if (itemTime > existingTime) {
          existing.id = item.id;
          existing.uuid = item.uuid;
          existing.lastMessage = item.lastMessage;
          existing.lastMessageAt = item.lastMessageAt;
          existing.title = item.title;
          existing.subtitle = item.subtitle;
          existing.avatarUrl = item.avatarUrl || existing.avatarUrl;
        }
      }
    }
  }

  const finalResults = [...groupList, ...Array.from(directMap.values())];
  finalResults.sort((a, b) => {
    const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return timeB - timeA;
  });

  return finalResults;
};

export const getConversationMessages = async (userId, conversationId, { page = 1, limit = 30 }) => {
  // Validate or auto-provision participant membership
  const participant = await ensureConversationRecord(conversationId, userId);
  const targetConvId = participant.targetConvId || conversationId;
  const conv = participant.conversation;

  // Find other participant's last read timestamp for seen receipts
  const otherParticipant = conv?.participants?.find((p) => p.userId !== userId);
  const otherLastRead = otherParticipant?.lastReadAt
    ? new Date(otherParticipant.lastReadAt).getTime()
    : 0;

  const skip = (page - 1) * limit;

  // Search messages in target canonical conversation OR legacy conversation ID
  const searchConvIds = targetConvId === conversationId ? [targetConvId] : [targetConvId, conversationId];

  const [messages, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where: {
        conversationId: { in: searchConvIds },
        isDeleted: false,
      },
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
      where: {
        conversationId: { in: searchConvIds },
        isDeleted: false,
      },
    }),
  ]);

  // Mark conversation as read upon fetching messages
  await prisma.conversationParticipant.update({
    where: {
      conversationId_userId: { conversationId: targetConvId, userId },
    },
    data: { lastReadAt: new Date() },
  }).catch(() => {});

  // Real-time socket broadcast read receipt
  broadcastReadReceipt(userId, conversationId, targetConvId);

  // Map messages and compute accurate isRead / status
  const formattedMessages = messages.reverse().map((m) => {
    const isMe = m.senderId === userId;
    const msgTime = new Date(m.createdAt).getTime();

    let isRead = false;
    let status = 'SENT';

    if (isMe) {
      if (otherLastRead >= msgTime) {
        isRead = true;
        status = 'READ';
      } else {
        isRead = false;
        status = 'DELIVERED';
      }
    } else {
      isRead = true;
      status = 'READ';
    }

    return {
      id: m.id,
      conversationId: targetConvId,
      senderId: m.senderId,
      senderName: m.sender?.displayName || 'User',
      senderAvatar: m.sender?.avatarUrl || '',
      content: m.content,
      messageType: m.messageType,
      latitude: m.latitude,
      longitude: m.longitude,
      mediaUrl: m.mediaUrl,
      isMe,
      isRead,
      status, // 'READ' | 'DELIVERED' | 'SENT'
      createdAt: m.createdAt.toISOString(),
      sender: m.sender,
    };
  });

  return {
    conversationId: targetConvId,
    messages: formattedMessages,
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
  const targetConvId = participant.targetConvId || conversationId;

  if (participant.conversation && participant.conversation.isArchived) {
    throw new ApiError(400, 'This conversation has been archived and is read-only');
  }

  const message = await prisma.chatMessage.create({
    data: {
      conversationId: targetConvId,
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
      where: { id: targetConvId },
      data: { lastMessageAt: new Date() },
    }),
    prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId: targetConvId, userId },
      },
      data: { lastReadAt: new Date() },
    }),
  ]);

  // Broadcast via Socket.io if active
  try {
    const io = getIO();
    const payload = {
      id: message.id,
      conversationId: targetConvId,
      aliasConversationId: conversationId !== targetConvId ? conversationId : undefined,
      senderId: message.senderId,
      senderName: message.sender?.displayName || 'User',
      senderAvatar: message.sender?.avatarUrl,
      content: message.content,
      messageType: message.messageType,
      latitude: message.latitude,
      longitude: message.longitude,
      mediaUrl: message.mediaUrl,
      isRead: false,
      status: 'SENT',
      createdAt: message.createdAt.toISOString(),
    };

    io.to(`conv:${targetConvId}`).emit('new_message', payload);
    if (conversationId !== targetConvId) {
      io.to(`conv:${conversationId}`).emit('new_message', payload);
    }

    if (participant.conversation && participant.conversation.participants) {
      participant.conversation.participants.forEach((p) => {
        if (p.userId !== userId) {
          io.to(`user:${p.userId}`).emit('message_notification', {
            conversationId: targetConvId,
            conversationType: participant.conversation.type,
            senderName: message.sender.displayName,
            preview: message.messageType === 'LOCATION_SHARE' ? '📍 Shared a location' : message.content,
            createdAt: message.createdAt,
          });
          io.to(`user:${p.userId}`).emit('new_message', payload);
        }
      });
    }
  } catch (err) {
    // Socket broadcast is best-effort for REST endpoint
  }

  return message;
};

export const markAsRead = async (userId, conversationId) => {
  const peerUserId = await resolvePeerUserId(conversationId, userId);
  const targetConvId = peerUserId
    ? `direct_${[userId, peerUserId].sort().join('_')}`
    : conversationId;

  await prisma.conversationParticipant.update({
    where: {
      conversationId_userId: {
        conversationId: targetConvId,
        userId,
      },
    },
    data: { lastReadAt: new Date() },
  }).catch(() => {});

  // Real-time socket broadcast read receipt
  broadcastReadReceipt(userId, conversationId, targetConvId);

  return { conversationId: targetConvId, readAt: new Date() };
};
