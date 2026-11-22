import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');

let firebaseApp = null;
const userFcmTokens = new Map();
const tokenStorePath = path.join(__dirname, 'fcm_tokens.json');

const loadTokens = () => {
  try {
    if (fs.existsSync(tokenStorePath)) {
      const data = JSON.parse(fs.readFileSync(tokenStorePath, 'utf8'));
      for (const [userId, tokens] of Object.entries(data)) {
        userFcmTokens.set(userId, new Set(Array.isArray(tokens) ? tokens : [tokens]));
      }
    }
  } catch (_) {}
};

const saveTokens = () => {
  try {
    const obj = {};
    for (const [userId, set] of userFcmTokens.entries()) {
      obj[userId] = Array.from(set);
    }
    fs.writeFileSync(tokenStorePath, JSON.stringify(obj, null, 2));
  } catch (_) {}
};

loadTokens();

try {
  let serviceAccount = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (_) {}
  }

  if (!serviceAccount && fs.existsSync(serviceAccountPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  }

  if (serviceAccount) {
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    });
    console.log('🔥 [Firebase Admin] Initialized successfully for project:', serviceAccount.project_id);
  } else {
    console.warn('⚠️ [Firebase Admin] Service account not found in env FIREBASE_SERVICE_ACCOUNT or file:', serviceAccountPath);
  }
} catch (e) {
  console.error('❌ [Firebase Admin] Initialization failed:', e.message);
}

export const registerUserFcmToken = async (userId, fcmToken) => {
  if (!userId || !fcmToken) return;
  // A device token belongs to exactly one account. If another account used
  // this phone before, stop sending that account's calls/pushes here.
  for (const [otherUserId, set] of userFcmTokens.entries()) {
    if (otherUserId !== userId && set.delete(fcmToken) && set.size === 0) {
      userFcmTokens.delete(otherUserId);
    }
  }
  if (!userFcmTokens.has(userId)) {
    userFcmTokens.set(userId, new Set());
  }
  userFcmTokens.get(userId).add(fcmToken);
  saveTokens();
  console.log(`📱 [FCM] Registered token for user ${userId}`);

  // Persist to userDevice in database
  try {
    await prisma.userDevice.upsert({
      where: { deviceToken: fcmToken },
      update: {
        userId,
        appVersion: 'FCM_TOKEN',
        lastActiveAt: new Date(),
      },
      create: {
        userId,
        deviceToken: fcmToken,
        deviceType: 'ANDROID',
        appVersion: 'FCM_TOKEN',
        lastActiveAt: new Date(),
      },
    });
  } catch (err) {
    console.warn('⚠️ [FCM] userDevice upsert warning:', err.message);
  }
};

export const getUserFcmTokens = (userId) => {
  const set = userFcmTokens.get(userId);
  return set ? Array.from(set) : [];
};

/**
 * All push tokens for a user: in-memory cache + database. FCM tokens contain
 * ':'; other userDevice rows are hardware device IDs used for session control.
 */
const getDeliverableTokens = async (userId) => {
  const tokens = new Set(getUserFcmTokens(userId));
  try {
    const devices = await prisma.userDevice.findMany({
      where: { userId, deviceToken: { contains: ':' } },
      select: { deviceToken: true },
    });
    devices.forEach((d) => d.deviceToken && tokens.add(d.deviceToken));
  } catch (_) {}
  return Array.from(tokens);
};

const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

/** Forget a token FCM says is dead (app uninstalled / token rotated). */
const pruneDeadToken = async (userId, token) => {
  const set = userFcmTokens.get(userId);
  if (set?.delete(token)) {
    if (set.size === 0) userFcmTokens.delete(userId);
    saveTokens();
  }
  try {
    await prisma.userDevice.deleteMany({ where: { deviceToken: token } });
  } catch (_) {}
};

const handleSendResults = (results, tokens, userId, label) => {
  let successCount = 0;
  results.forEach((res, index) => {
    if (res.status === 'fulfilled') {
      successCount++;
    } else {
      console.warn(`⚠️ [FCM] ${label} delivery failed: ${res.reason?.message}`);
      if (DEAD_TOKEN_CODES.has(res.reason?.code)) {
        pruneDeadToken(userId, tokens[index]);
      }
    }
  });
  return successCount;
};

/** Stop all pushes to this user (call on logout). */
export const unregisterUserFcmTokens = async (userId) => {
  if (!userId) return;
  if (userFcmTokens.delete(userId)) saveTokens();
  try {
    await prisma.userDevice.deleteMany({
      where: { userId, deviceToken: { contains: ':' } },
    });
  } catch (err) {
    console.warn('⚠️ [FCM] Failed to clear tokens on logout:', err.message);
  }
};

/**
 * Send High-Priority Incoming Call Push Notification
 * Wakes up device in background/killed/locked state and triggers the full-screen IncomingCallScreen
 */
export const sendIncomingCallPush = async ({
  recipientUserId,
  callerId,
  callerName,
  callerAvatar,
  callType = 'AUDIO',
  conversationId,
}) => {
  if (!firebaseApp) {
    console.warn('⚠️ [Firebase Admin] Cannot send push notification: Firebase not initialized');
    return false;
  }

  // Defensive: If recipient is a DriverProfile ID, resolve to User ID
  let targetUserId = recipientUserId;
  try {
    const dp = await prisma.driverProfile.findUnique({
      where: { id: recipientUserId },
      select: { userId: true },
    });
    if (dp?.userId) {
      targetUserId = dp.userId;
    }
  } catch (_) {}

  // Defensive: If recipient is a conversation ID, resolve to the peer user ID
  if (targetUserId && (targetUserId.startsWith('direct_') || targetUserId.startsWith('trip_') || targetUserId.startsWith('cm'))) {
    try {
      if (targetUserId.startsWith('direct_')) {
        const raw = targetUserId.replace('direct_', '');
        const parts = raw.split('_').filter(Boolean);
        const other = parts.find((p) => p !== callerId);
        if (other) targetUserId = other;
      } else {
        const conv = await prisma.conversation.findUnique({
          where: { id: targetUserId },
          include: { participants: { select: { userId: true } } },
        });
        if (conv?.participants) {
          const other = conv.participants.find((p) => p.userId !== callerId);
          if (other?.userId) targetUserId = other.userId;
        }
      }
    } catch (_) {}
  }

  const tokens = await getDeliverableTokens(targetUserId);
  if (tokens.length === 0) {
    console.log(`ℹ️ [FCM] No registered push token for user ${targetUserId}`);
    return false;
  }

  console.log(`📲 [FCM] Sending high-priority incoming call push to user ${targetUserId} (${tokens.length} devices)`);

  // NOTE: For Android VoIP / Incoming calls to wake up from killed/swiped-from-recents state,
  // the push MUST be a pure DATA-ONLY payload (no top-level 'notification' block).
  // A top-level 'notification' key causes Android OS to swallow the message in the tray,
  // bypassing Flutter's _firebaseMessagingBackgroundHandler!
  const payloadData = {
    type: 'CALL_INCOMING',
    callerId: String(callerId || ''),
    callerName: String(callerName || 'Caller'),
    callerAvatar: String(callerAvatar || ''),
    callType: String(callType || 'AUDIO'),
    conversationId: String(conversationId || ''),
    title: `Incoming ${callType === 'VIDEO' ? 'Video' : 'Voice'} Call`,
    body: `${callerName || 'Someone'} is calling you...`,
    timestamp: new Date().toISOString(),
  };

  const results = await Promise.allSettled(
    tokens.map((token) =>
      getMessaging(firebaseApp).send({
        token,
        data: payloadData,
        android: {
          priority: 'high',
          ttl: 60 * 1000, // 60 seconds (ttl in Firebase Admin SDK is in milliseconds)
        },
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'background',
          },
          payload: {
            aps: {
              contentAvailable: true,
              sound: 'default',
            },
          },
        },
      })
    )
  );

  const successCount = handleSendResults(results, tokens, targetUserId, 'Incoming call push');
  return successCount > 0;
};

/**
 * Send High-Priority Call Ended / Cancelled Push Notification
 * Silences background ringtone and cancels incoming call notification on receiver device
 */
export const sendCallEndedPush = async ({ recipientUserId, callerId }) => {
  if (!firebaseApp) return false;
  const targetUserId = recipientUserId;
  const tokens = await getDeliverableTokens(targetUserId);
  if (tokens.length === 0) return false;

  const payloadData = {
    type: 'CALL_ENDED',
    callerId: String(callerId || ''),
    timestamp: new Date().toISOString(),
  };

  try {
    await Promise.allSettled(
      tokens.map((token) =>
        getMessaging(firebaseApp).send({
          token,
          data: payloadData,
          android: {
            priority: 'high',
            ttl: 30 * 1000,
          },
          apns: {
            headers: {
              'apns-priority': '10',
              'apns-push-type': 'background',
            },
            payload: { aps: { contentAvailable: true } },
          },
        })
      )
    );
  } catch (_) {}
  return true;
};

/**
 * Send Standard Push Notification (for Ride Requests, Seat Confirmed, Cancellations, etc.)
 */
export const sendRideNotificationPush = async ({
  recipientUserId,
  title,
  body,
  data = {},
}) => {
  if (!firebaseApp) {
    console.warn('⚠️ [Firebase Admin] Cannot send push notification: Firebase not initialized');
    return false;
  }

  let targetUserId = recipientUserId;
  try {
    const dp = await prisma.driverProfile.findUnique({
      where: { id: recipientUserId },
      select: { userId: true },
    });
    if (dp?.userId) targetUserId = dp.userId;
  } catch (_) {}

  const tokens = await getDeliverableTokens(targetUserId);
  if (tokens.length === 0) {
    console.log(`ℹ️ [FCM] No registered push token for user ${targetUserId}`);
    return false;
  }

  console.log(`📲 [FCM] Sending ride notification push to user ${targetUserId}: "${title}"`);

  const payloadData = {
    ...data,
    title: String(title),
    body: String(body),
    timestamp: new Date().toISOString(),
  };

  const stringifiedData = {};
  for (const [k, v] of Object.entries(payloadData)) {
    stringifiedData[k] = String(v ?? '');
  }
  stringifiedData.click_action = 'FLUTTER_NOTIFICATION_CLICK';

  const isChatMessage = data.type === 'CHAT_MESSAGE' || Boolean(data.conversationId);
  const targetChannelId = isChatMessage ? 'chat_messages_channel_v1' : 'high_importance_channel_v4';

  const results = await Promise.allSettled(
    tokens.map((token) => {
      const message = {
        token,
        data: stringifiedData,
        android: {
          priority: 'high',
          ttl: 24 * 60 * 60 * 1000, // 24 hours (ttl in Firebase Admin SDK is in milliseconds)
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              alert: {
                title: String(title),
                body: String(body),
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      // For non-chat notifications (rides/bookings), include native notification block so OS tray
      // can display even if process is suspended. For chat messages, high-priority data payload
      // wakes _firebaseMessagingBackgroundHandler to display WhatsApp-style inline interactive reply box.
      if (!isChatMessage) {
        message.notification = {
          title: String(title),
          body: String(body),
        };
        message.android.notification = {
          channelId: targetChannelId,
          sound: 'default',
          priority: 'max',
          defaultSound: true,
          defaultVibrateTimings: true,
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          visibility: 'public',
        };
      }

      return getMessaging(firebaseApp).send(message);
    })
  );

  const successCount = handleSendResults(results, tokens, targetUserId, 'Ride notification');

  console.log(`📲 [FCM] Delivered push notification to ${successCount}/${tokens.length} devices for user ${targetUserId}`);
  return successCount > 0;
};
