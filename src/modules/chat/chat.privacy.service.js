// WhatsApp-style chat privacy: archive, delete chat (for me), block / unblock.
//
// All of these are per-user: archiving or deleting a chat never changes what
// the other person sees, and blocking is silent (the blocked person is not
// told; their messages and calls simply stop reaching the blocker).
import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/apiError.js';
import { resolvePeerUserId } from './chat.service.js';

const GROUP_PREFIXES = [
  'meetup_chat_',
  'meetup_',
  'plan_chat_',
  'plan_group_',
  'community_',
  'ride_group_',
];

const isGroupId = (id) => GROUP_PREFIXES.some((p) => id.startsWith(p));

/**
 * The conversation row this user actually participates in (direct chats are
 * stored under a canonical `direct_<a>_<b>` id) plus the peer for 1-on-1s.
 */
export const resolveMyConversation = async (userId, conversationId) => {
  if (!conversationId) throw new ApiError(400, 'Conversation id is required');
  let targetConvId = conversationId;
  let peerUserId = null;
  if (!isGroupId(conversationId)) {
    peerUserId = await resolvePeerUserId(conversationId, userId).catch(() => null);
    if (peerUserId && peerUserId !== userId) {
      targetConvId = `direct_${[userId, peerUserId].sort().join('_')}`;
    }
  }
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: targetConvId, userId } },
  });
  if (!participant) throw new ApiError(404, 'Chat not found');
  return { targetConvId, peerUserId, participant };
};

// --- Archive -------------------------------------------------------------

export const setConversationArchived = async (userId, conversationId, archived) => {
  const { targetConvId } = await resolveMyConversation(userId, conversationId);
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: targetConvId, userId } },
    data: { isArchived: Boolean(archived), archivedAt: archived ? new Date() : null },
  });
  return {
    conversationId: targetConvId,
    isArchived: Boolean(archived),
    message: archived ? 'Chat archived' : 'Chat unarchived',
  };
};

// --- Delete chat (for me) -------------------------------------------------

/**
 * Removes the chat from my list and clears my copy of its history. The other
 * person keeps theirs. If a new message arrives later, the chat comes back
 * showing only messages after this point.
 */
export const deleteConversationForMe = async (userId, conversationId) => {
  const { targetConvId } = await resolveMyConversation(userId, conversationId);
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: targetConvId, userId } },
    data: {
      isHidden: true,
      clearedAt: new Date(),
      isArchived: false,
      archivedAt: null,
      lastReadAt: new Date(),
    },
  });
  return { conversationId: targetConvId, message: 'Chat deleted' };
};

/** Clear messages but keep the chat in the list. */
export const clearConversationForMe = async (userId, conversationId) => {
  const { targetConvId } = await resolveMyConversation(userId, conversationId);
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: targetConvId, userId } },
    data: { clearedAt: new Date(), lastReadAt: new Date() },
  });
  return { conversationId: targetConvId, message: 'Chat cleared' };
};

/** A new message brings deleted chats back for everyone who should see it. */
export const unhideConversationFor = async (conversationId, userIds) => {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return;
  await prisma.conversationParticipant
    .updateMany({
      where: { conversationId, userId: { in: ids }, isHidden: true },
      data: { isHidden: false },
    })
    .catch(() => {});
};

// --- Block / unblock ------------------------------------------------------

export const blockUser = async (userId, targetUserId, reason = null) => {
  if (!targetUserId) throw new ApiError(400, 'User to block is required');
  if (targetUserId === userId) throw new ApiError(400, "You can't block yourself");
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, displayName: true },
  });
  if (!target) throw new ApiError(404, 'User not found');

  await prisma.userBlock.upsert({
    where: { userId_blockedUserId: { userId, blockedUserId: targetUserId } },
    update: {},
    create: { userId, blockedUserId: targetUserId, reason: reason ? String(reason).slice(0, 200) : null },
  });
  return {
    blockedUserId: targetUserId,
    isBlocked: true,
    message: `${target.displayName || 'Contact'} blocked`,
  };
};

export const unblockUser = async (userId, targetUserId) => {
  await prisma.userBlock
    .delete({ where: { userId_blockedUserId: { userId, blockedUserId: targetUserId } } })
    .catch(() => {});
  return { blockedUserId: targetUserId, isBlocked: false, message: 'Contact unblocked' };
};

export const getBlockedUsers = async (userId) => {
  const rows = await prisma.userBlock.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { blockedUser: { select: { id: true, displayName: true, avatarUrl: true } } },
  });
  return rows.map((r) => ({
    id: r.blockedUser.id,
    displayName: r.blockedUser.displayName || 'User',
    avatarUrl: r.blockedUser.avatarUrl || '',
    blockedAt: r.createdAt.toISOString(),
  }));
};

/** Map of userId → time I blocked them, for the users I have blocked. */
export const getMyBlockMap = async (userId) => {
  const rows = await prisma.userBlock.findMany({
    where: { userId },
    select: { blockedUserId: true, createdAt: true },
  });
  return new Map(rows.map((r) => [r.blockedUserId, r.createdAt]));
};

/** Of [recipientIds], the ones who have blocked [senderId]. */
export const recipientsWhoBlocked = async (senderId, recipientIds) => {
  const ids = [...new Set(recipientIds.filter(Boolean))];
  if (!senderId || !ids.length) return new Set();
  const rows = await prisma.userBlock.findMany({
    where: { blockedUserId: senderId, userId: { in: ids } },
    select: { userId: true },
  });
  return new Set(rows.map((r) => r.userId));
};

export const hasBlocked = async (userId, otherUserId) => {
  if (!userId || !otherUserId) return false;
  const row = await prisma.userBlock.findUnique({
    where: { userId_blockedUserId: { userId, blockedUserId: otherUserId } },
    select: { id: true },
  });
  return Boolean(row);
};

/**
 * Prisma `where` for the messages [userId] may see in a conversation:
 * nothing from before they cleared/deleted the chat, and nothing from people
 * they blocked sent after the block.
 */
export const visibleMessagesWhere = (userId, participant, blockMap) => {
  const and = [];
  if (participant?.clearedAt) and.push({ createdAt: { gt: participant.clearedAt } });
  for (const [blockedId, since] of blockMap || []) {
    and.push({ NOT: { AND: [{ senderId: blockedId }, { createdAt: { gte: since } }] } });
  }
  return and.length ? { AND: and } : {};
};
