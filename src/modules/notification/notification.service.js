import { prisma, withDbTimeout } from '../../config/db.js';
import { getIO } from '../../config/socket.js';
import { sendRideNotificationPush } from '../../config/firebase.js';

// In-memory fallback notification store for resilient local development
const inMemoryNotifications = [];

export const formatTimeAgo = (date) => {
  if (!date) return 'Just now';
  const diffMs = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const mapNotificationMetadata = (notif) => {
  const type = notif.type;
  let category = 'rides';
  let route = '/my-rides';
  let iconName = 'notifications_rounded';
  let iconColor = '#10B981';

  switch (type) {
    case 'BOOKING_REQUEST':
    case 'TRIP_JOIN_REQUEST':
      category = 'bookings';
      route = '/my-rides';
      iconName = 'airline_seat_recline_extra_rounded';
      iconColor = '#10B981';
      break;
    case 'BOOKING_ACCEPTED':
    case 'TRIP_JOIN_ACCEPTED':
      category = 'bookings';
      route = '/active-ride';
      iconName = 'check_circle_rounded';
      iconColor = '#10B981';
      break;
    case 'BOOKING_REJECTED':
    case 'TRIP_JOIN_REJECTED':
      category = 'bookings';
      route = '/my-rides';
      iconName = 'cancel_rounded';
      iconColor = '#EF4444';
      break;
    case 'CHAT_MESSAGE':
      category = 'messages';
      route = '/messages';
      iconName = 'chat_bubble_rounded';
      iconColor = '#10B981';
      break;
    case 'VERIFICATION_UPDATE':
      category = 'safety';
      route = '/profile';
      iconName = 'verified_rounded';
      iconColor = '#10B981';
      break;
    case 'COMMUNITY_ALERT':
      category = 'safety';
      route = '/communities';
      iconName = 'groups_rounded';
      iconColor = '#3B82F6';
      break;
    case 'RATING_REQUEST':
      category = 'safety';
      route = '/active-ride';
      iconName = 'star_rounded';
      iconColor = '#F59E0B';
      break;
    case 'RIDE_REMINDER':
      category = 'rides';
      route = '/my-rides';
      iconName = 'schedule_rounded';
      iconColor = '#F59E0B';
      break;
    case 'RIDE_CANCELLED':
    case 'TRIP_CANCELLED':
      category = 'rides';
      route = '/search';
      iconName = 'error_rounded';
      iconColor = '#EF4444';
      break;
    default:
      category = 'rides';
      route = '/my-rides';
      iconName = 'notifications_rounded';
      iconColor = '#10B981';
  }

  let parsedData = {};
  if (typeof notif.data === 'string') {
    try {
      parsedData = JSON.parse(notif.data);
    } catch (_) {}
  } else if (typeof notif.data === 'object' && notif.data !== null) {
    parsedData = notif.data;
  }

  if (parsedData && parsedData.route) {
    route = parsedData.route;
  }

  return {
    id: notif.id,
    title: notif.title,
    subtitle: notif.message,
    message: notif.message,
    type: notif.type,
    category,
    icon: iconName,
    iconColor,
    route,
    data: parsedData,
    isRead: notif.readAt !== null && notif.readAt !== undefined,
    readAt: notif.readAt,
    createdAt: notif.createdAt ? new Date(notif.createdAt).toISOString() : new Date().toISOString(),
    time: formatTimeAgo(notif.createdAt),
  };
};

export const getUnreadCount = async (userId) => {
  if (!userId) return 0;
  return await withDbTimeout(
    async () => {
      return await prisma.notification.count({
        where: {
          userId,
          readAt: null,
        },
      });
    },
    () => inMemoryNotifications.filter((n) => n.userId === userId && !n.readAt).length
  );
};

/**
 * Centralized Notification Dispatcher
 */
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  data = {},
  sendPush = true,
}) => {
  if (!userId || !title || !message) return null;

  // Resolve target userId if provided as driverProfile ID
  let targetUserId = userId;
  try {
    const dp = await prisma.driverProfile.findUnique({
      where: { id: userId },
      select: { userId: true },
    });
    if (dp?.userId) targetUserId = dp.userId;
  } catch (_) {}

  const stringifiedData = typeof data === 'string' ? data : JSON.stringify(data);

  let newNotif = null;

  // 1. Persist to Database
  try {
    newNotif = await withDbTimeout(
      async () => {
        return await prisma.notification.create({
          data: {
            userId: targetUserId,
            type,
            title,
            message,
            data: stringifiedData,
          },
        });
      },
      null
    );
  } catch (err) {
    console.warn('[NotificationService] Database insert error:', err.message);
  }

  // Fallback in-memory record for resilience
  if (!newNotif) {
    newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: targetUserId,
      type,
      title,
      message,
      data: stringifiedData,
      readAt: null,
      createdAt: new Date(),
    };
    inMemoryNotifications.unshift(newNotif);
    if (inMemoryNotifications.length > 200) inMemoryNotifications.pop();
  }

  const formatted = mapNotificationMetadata(newNotif);

  // 2. Real-time WebSocket emission to User
  try {
    const io = getIO();
    if (io) {
      io.to(`user:${targetUserId}`).emit('notification:new', formatted);
      const unreadCount = await getUnreadCount(targetUserId);
      io.to(`user:${targetUserId}`).emit('notification_count', { unreadCount });
    }
  } catch (_) {}

  // 3. FCM Push Notification dispatch
  if (sendPush) {
    try {
      await sendRideNotificationPush({
        recipientUserId: targetUserId,
        title,
        body: message,
        data: {
          ...data,
          notificationId: formatted.id,
          type: formatted.type,
          route: formatted.route,
        },
      });
    } catch (pushErr) {
      console.warn('[NotificationService] Push delivery error:', pushErr.message);
    }
  }

  return formatted;
};

/**
 * Fetch Notifications for Authenticated User / Rider
 */
export const getUserNotifications = async (userId, { category, type, role, unreadOnly, page = 1, limit = 40 } = {}) => {
  const isUnreadOnly = unreadOnly === 'true' || unreadOnly === true;
  const filterType = (type || category || '').trim();

  // Category to Enum NotificationType mapping
  const categoryTypeMap = {
    rides: ['RIDE_REMINDER', 'RIDE_CANCELLED', 'TRIP_CANCELLED'],
    bookings: ['BOOKING_REQUEST', 'TRIP_JOIN_REQUEST', 'BOOKING_ACCEPTED', 'TRIP_JOIN_ACCEPTED', 'BOOKING_REJECTED', 'TRIP_JOIN_REJECTED'],
    messages: ['CHAT_MESSAGE'],
    safety: ['VERIFICATION_UPDATE', 'COMMUNITY_ALERT', 'RATING_REQUEST'],
  };

  let typeFilter = null;
  if (filterType && filterType.toLowerCase() !== 'all') {
    const lower = filterType.toLowerCase();
    if (categoryTypeMap[lower]) {
      typeFilter = { in: categoryTypeMap[lower] };
    } else {
      typeFilter = filterType.toUpperCase();
    }
  }

  const dbResult = await withDbTimeout(
    async () => {
      const where = {
        userId,
        ...(isUnreadOnly ? { readAt: null } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
      };

      const [notifications, totalCount, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId, readAt: null } }),
      ]);

      return { notifications, totalCount, unreadCount };
    },
    () => {
      let filtered = inMemoryNotifications.filter((n) => n.userId === userId);
      if (isUnreadOnly) filtered = filtered.filter((n) => !n.readAt);
      if (typeFilter) {
        if (typeFilter.in) {
          filtered = filtered.filter((n) => typeFilter.in.includes(n.type));
        } else {
          filtered = filtered.filter((n) => n.type === typeFilter);
        }
      }

      const unreadCount = inMemoryNotifications.filter((n) => n.userId === userId && !n.readAt).length;
      return {
        notifications: filtered.slice((page - 1) * limit, page * limit),
        totalCount: filtered.length,
        unreadCount,
      };
    }
  );

  let formatted = dbResult.notifications.map(mapNotificationMetadata);

  // Filter verification in memory
  if (filterType && filterType.toLowerCase() !== 'all') {
    formatted = formatted.filter(
      (n) =>
        n.category.toLowerCase() === filterType.toLowerCase() ||
        n.type.toLowerCase() === filterType.toLowerCase()
    );
  }

  return {
    notifications: formatted,
    total: dbResult.totalCount,
    unreadCount: dbResult.unreadCount,
    page: Number(page),
    limit: Number(limit),
  };
};

/**
 * Mark Specific Notification as Read
 */
export const markNotificationAsRead = async (userId, notificationId) => {
  await withDbTimeout(
    async () => {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { readAt: new Date() },
      });
    },
    () => {
      const found = inMemoryNotifications.find((n) => n.id === notificationId && n.userId === userId);
      if (found) found.readAt = new Date();
    }
  );

  const unreadCount = await getUnreadCount(userId);
  try {
    const io = getIO();
    if (io) io.to(`user:${userId}`).emit('notification_count', { unreadCount });
  } catch (_) {}

  return { success: true, notificationId, unreadCount };
};

/**
 * Mark All Notifications as Read for User
 */
export const markAllNotificationsAsRead = async (userId) => {
  await withDbTimeout(
    async () => {
      await prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      });
    },
    () => {
      inMemoryNotifications.forEach((n) => {
        if (n.userId === userId && !n.readAt) n.readAt = new Date();
      });
    }
  );

  try {
    const io = getIO();
    if (io) io.to(`user:${userId}`).emit('notification_count', { unreadCount: 0 });
  } catch (_) {}

  return { success: true, unreadCount: 0, message: 'All notifications marked as read' };
};

/**
 * Delete Notification
 */
export const deleteNotification = async (userId, notificationId) => {
  await withDbTimeout(
    async () => {
      await prisma.notification.deleteMany({
        where: { id: notificationId, userId },
      });
    },
    () => {
      const idx = inMemoryNotifications.findIndex((n) => n.id === notificationId && n.userId === userId);
      if (idx !== -1) inMemoryNotifications.splice(idx, 1);
    }
  );

  const unreadCount = await getUnreadCount(userId);
  return { success: true, notificationId, unreadCount };
};

