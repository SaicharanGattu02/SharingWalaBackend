import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/apiError.js';

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

  return membership;
};

export const listCommunities = async () => {
  return await prisma.community.findMany({
    where: { isActive: true, deletedAt: null },
    include: {
      _count: {
        select: { members: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getMyCommunities = async (userId) => {
  const memberships = await prisma.communityMember.findMany({
    where: { userId, isApproved: true },
    include: {
      community: true,
    },
  });

  return memberships.map((m) => m.community);
};
