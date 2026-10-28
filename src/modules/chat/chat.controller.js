import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as chatService from './chat.service.js';

export const getOrCreateDirectChat = asyncHandler(async (req, res) => {
  const conversation = await chatService.getOrCreateDirectConversation(
    req.user.id,
    req.body.recipientUserId
  );
  res.status(200).json(new ApiResponse(200, conversation, 'Direct conversation ready'));
});

export const getMyConversations = asyncHandler(async (req, res) => {
  const type = req.query.type || req.query.category;
  const conversations = await chatService.getUserConversations(req.user.id, type);
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

export const markAsRead = asyncHandler(async (req, res) => {
  const result = await chatService.markAsRead(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Conversation marked as read'));
});
