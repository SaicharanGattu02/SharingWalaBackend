import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import * as notificationService from './notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { category, role, unreadOnly, page, limit } = req.query;

  const result = await notificationService.getUserNotifications(userId, {
    category,
    role,
    unreadOnly,
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 40,
  });

  return res.status(200).json(
    new ApiResponse(200, result, 'Notifications fetched successfully')
  );
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const unreadCount = await notificationService.getUnreadCount(userId);

  return res.status(200).json(
    new ApiResponse(200, { unreadCount }, 'Unread count fetched successfully')
  );
});

export const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, 'Notification ID is required');
  }

  const result = await notificationService.markNotificationAsRead(userId, id);

  return res.status(200).json(
    new ApiResponse(200, result, 'Notification marked as read')
  );
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await notificationService.markAllNotificationsAsRead(userId);

  return res.status(200).json(
    new ApiResponse(200, result, 'All notifications marked as read')
  );
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, 'Notification ID is required');
  }

  const result = await notificationService.deleteNotification(userId, id);

  return res.status(200).json(
    new ApiResponse(200, result, 'Notification deleted successfully')
  );
});

