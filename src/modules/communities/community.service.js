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

  // Domain verification check if required
  if (community.domainRestriction) {
    if (!user.email || !user.email.endsWith(community.domainRestriction)) {
      throw new ApiError(
        403,
        `Joining this community requires a verified email ending with ${community.domainRestriction}`
      );
    }
  }

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
