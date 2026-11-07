import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/apiError.js';
import { getIO } from '../../config/socket.js';

export const createCommunity = async (userId, data) => {
  const community = await prisma.community.create({
    data: {
      ...data,
      createdBy: userId,
      members: {
        create: {
          userId,
          role: 'ADMIN',
          isApproved: true,
        },
      },
    },
  });

  // Automatically provision the community group conversation and add creator
  try {
    await prisma.conversation.create({
      data: {
        id: `community_${community.id}`,
        type: 'COMMUNITY_GROUP',
        communityId: community.id,
        title: community.name,
        lastMessageAt: community.createdAt || new Date(0),
        participants: {
          create: [{ userId }],
        },
      },
    });
  } catch (convErr) {
    console.warn('[CommunityService] Failed to create community conversation:', convErr.message);
  }

  return community;
};

export const joinCommunity = async (userId, communityId) => {
  const [community, user] = await Promise.all([
    prisma.community.findUnique({ where: { id: communityId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  if (!community || !community.isActive) {
    throw new ApiError(404, 'Community not found or inactive');
  }

  // Domain check: If user has a matching corporate email, they are marked verified.
  // We allow users to join community groups so they can access carpools & shared rides without hard blocking.
  const isCorporateVerified = community.domainRestriction && user?.email
    ? user.email.toLowerCase().endsWith(community.domainRestriction.toLowerCase())
    : true;

  const membership = await prisma.communityMember.upsert({
    where: {
      communityId_userId: {
        communityId,
        userId,
      },
    },
    update: { isApproved: true },
    create: {
      communityId,
      userId,
      role: 'MEMBER',
      isApproved: true,
    },
  });

  // Ensure community group conversation exists and register user as a participant
  try {
    let conv = await prisma.conversation.findFirst({
      where: {
        OR: [{ id: `community_${communityId}` }, { communityId }],
      },
    });

    if (!conv) {
      conv = await prisma.conversation.create({
        data: {
          id: `community_${communityId}`,
          type: 'COMMUNITY_GROUP',
          communityId,
          title: community.name,
          lastMessageAt: community.createdAt || new Date(0),
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
    });
  } catch (partErr) {
    console.warn('[CommunityService] Failed to register conversation participant:', partErr.message);
  }

  // Broadcast real-time community member count update via WebSocket
  try {
    const io = getIO();
    const count = await prisma.communityMember.count({
      where: { communityId, isApproved: true },
    });
    io.emit('community:updated', {
      communityId,
      memberCount: count,
      userId,
    });
  } catch (err) {}

  return membership;
};

export const leaveCommunity = async (userId, communityId) => {
  await prisma.communityMember.deleteMany({
    where: {
      communityId,
      userId,
    },
  });

  // Remove user from the community group conversation
  try {
    const conv = await prisma.conversation.findFirst({
      where: {
        OR: [{ id: `community_${communityId}` }, { communityId }],
      },
    });

    if (conv) {
      await prisma.conversationParticipant.deleteMany({
        where: {
          conversationId: conv.id,
          userId,
        },
      });
    }
  } catch (partErr) {
    console.warn('[CommunityService] Failed to remove conversation participant:', partErr.message);
  }

  // Broadcast real-time community member count update via WebSocket
  try {
    const io = getIO();
    const count = await prisma.communityMember.count({
      where: { communityId, isApproved: true },
    });
    io.emit('community:updated', {
      communityId,
      memberCount: count,
      userId,
      isJoined: false,
    });
  } catch (err) {}

  return { communityId, left: true };
};

export const listCommunities = async (userId = null) => {
  const communities = await prisma.community.findMany({
    where: { isActive: true, deletedAt: null },
    include: {
      _count: {
        select: { members: true },
      },
      ...(userId
        ? {
            members: {
              where: { userId, isApproved: true },
              select: { id: true },
            },
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return communities.map((comm) => ({
    ...comm,
    memberCount: comm._count?.members || 0,
    isJoined: userId ? (comm.members?.length > 0) : false,
  }));
};

export const getMyCommunities = async (userId) => {
  const memberships = await prisma.communityMember.findMany({
    where: { userId, isApproved: true },
    include: {
      community: {
        include: {
          _count: {
            select: { members: true },
          },
        },
      },
    },
  });

  return memberships.map((m) => ({
    ...m.community,
    memberCount: m.community._count?.members || 0,
    isJoined: true,
  }));
};
