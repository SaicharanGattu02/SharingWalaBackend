import jwt from 'jsonwebtoken';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { env } from '../../config/env.js';
import { prisma } from '../../config/db.js';
import { getIO } from '../../config/socket.js';
import { endSessionBetween } from './call.session.js';
import * as chatService from './chat.service.js';

export const getOrCreateDirectChat = asyncHandler(async (req, res) => {
  const recipientId = req.body.recipientUserId || req.body.recipientId || req.body.peerUserId || req.body.userId;
  const conversation = await chatService.getOrCreateDirectConversation(
    req.user.id,
    recipientId
  );
  res.status(200).json(new ApiResponse(200, conversation, 'Direct conversation ready'));
});

export const getMyConversations = asyncHandler(async (req, res) => {
  const type = req.query.type || req.query.category;
  const search = req.query.search || req.query.q;
  const conversations = await chatService.getUserConversations(req.user.id, type, search);
  res.status(200).json(new ApiResponse(200, conversations, 'Conversations retrieved'));
});

export const getMessages = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 30;
  const result = await chatService.getConversationMessages(req.user.id, req.params.id, { page, limit });
  res.status(200).json(new ApiResponse(200, result, 'Messages retrieved'));
});

export const sendMessage = asyncHandler(async (req, res) => {
  const message = await chatService.sendChatMessage(req.user.id, req.params.id, req.body);
  res.status(201).json(new ApiResponse(201, message, 'Message sent successfully'));
});

import { isUserOnline, getUserLastSeen, notifyCallRinging, initiateCallSession } from './chat.socket.js';

/**
 * These two endpoints are called from the phone's push handler while the app
 * is closed, where the stored access token may already be expired. We still
 * require a token signed by us (signature verified, expiry ignored) so nobody
 * can fake "ringing"/"declined" for someone else's call.
 */
const resolveCallActorId = (req) => {
  if (req.user?.id) return req.user.id;
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(header.split(' ')[1], env.jwt.secret, { ignoreExpiration: true });
    return decoded?.userId || null;
  } catch (_) {
    return null;
  }
};

export const reportCallRinging = asyncHandler(async (req, res) => {
  const { callerId, conversationId } = req.body;
  const receiverId = resolveCallActorId(req);
  if (!receiverId || !callerId) {
    return res.status(401).json(new ApiResponse(401, { success: false }, 'Invalid call ringing report'));
  }

  // fromSocket: false — the app is still closed, it can't take replayed signals yet.
  await notifyCallRinging({ callerId, receiverId, conversationId, fromSocket: false });
  res.status(200).json(new ApiResponse(200, { success: true }, 'Call ringing dispatched'));
});

export const reportCallRejected = asyncHandler(async (req, res) => {
  const { callerId, reason = 'DECLINED' } = req.body;
  const receiverId = resolveCallActorId(req);
  if (!receiverId || !callerId) {
    return res.status(401).json(new ApiResponse(401, { success: false }, 'Invalid call rejection report'));
  }

  endSessionBetween(receiverId, callerId);
  try {
    getIO().to(`user:${callerId}`).emit('call:rejected', { receiverId, reason });
  } catch (err) {
    console.warn('⚠️ [Call] Failed to emit call:rejected:', err.message);
  }
  res.status(200).json(new ApiResponse(200, { success: true }, 'Call rejection dispatched'));
});

export const initiateCall = asyncHandler(async (req, res) => {
  const { toUserId, conversationId, callType } = req.body;
  const result = await initiateCallSession({
    callerId: req.user.id,
    callerUser: req.user,
    toUserId,
    conversationId,
    callType,
  });
  res.status(200).json(new ApiResponse(200, result, 'Call initiated'));
});

export const markAsRead = asyncHandler(async (req, res) => {
  const result = await chatService.markAsRead(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Conversation marked as read'));
});

export const getUserOnlineStatus = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;
  const isOnline = isUserOnline(targetUserId);
  let lastSeen = getUserLastSeen(targetUserId);
  if (!isOnline && !lastSeen) {
    try {
      const u = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { updatedAt: true, lastLoginAt: true },
      });
      if (u) {
        lastSeen = (u.updatedAt || u.lastLoginAt)?.toISOString() || null;
      }
    } catch (_) {}
  }
  res.status(200).json(
    new ApiResponse(200, { userId: targetUserId, isOnline, lastSeen }, 'User online status retrieved')
  );
});
