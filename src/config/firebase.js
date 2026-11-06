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

export const registerUserFcmToken = (userId, fcmToken) => {
  if (!userId || !fcmToken) return;
  if (!userFcmTokens.has(userId)) {
    userFcmTokens.set(userId, new Set());
  }
  userFcmTokens.get(userId).add(fcmToken);
  saveTokens();
  console.log(`📱 [FCM] Registered token for user ${userId}`);
};

export const getUserFcmTokens = (userId) => {
  const set = userFcmTokens.get(userId);
  return set ? Array.from(set) : [];
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

  let tokens = getUserFcmTokens(targetUserId);
  if (!tokens || tokens.length === 0) {
    try {
      const devices = await prisma.userDevice.findMany({
        where: { userId: targetUserId },
        select: { fcmToken: true },
      });
      tokens = devices.map((d) => d.fcmToken).filter(Boolean);
      tokens.forEach((t) => registerUserFcmToken(targetUserId, t));
    } catch (_) {}
  }

  if (!tokens || tokens.length === 0) {
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
          ttl: 60, // 60 seconds
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

  let successCount = 0;
  results.forEach((res, index) => {
    if (res.status === 'fulfilled') {
      successCount++;
    } else {
      console.warn(`⚠️ [FCM] Failed to deliver push to token: ${res.reason?.message}`);
      if (res.reason?.code === 'messaging/registration-token-not-registered') {
        const set = userFcmTokens.get(targetUserId);
        if (set) {
          set.delete(tokens[index]);
          saveTokens();
        }
      }
    }
  });

  return successCount > 0;
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

  let tokens = getUserFcmTokens(targetUserId);
  if (!tokens || tokens.length === 0) {
    try {
      const devices = await prisma.userDevice.findMany({
        where: { userId: targetUserId },
        select: { fcmToken: true },
      });
      tokens = devices.map((d) => d.fcmToken).filter(Boolean);
      tokens.forEach((t) => registerUserFcmToken(targetUserId, t));
    } catch (_) {}
  }

  if (!tokens || tokens.length === 0) {
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

  await Promise.allSettled(
    tokens.map((token) =>
      getMessaging(firebaseApp).send({
        token,
        notification: {
          title: String(title),
          body: String(body),
        },
        data: stringifiedData,
        android: {
          priority: 'high',
          notification: {
            channelId: 'high_importance_channel',
            sound: 'default',
          },
        },
      })
    )
  );

  return true;
};
