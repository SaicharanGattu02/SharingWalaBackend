import { Router } from 'express';

// 🛠️ Centralized Reusable Services
import authRoutes from '../modules/auth/auth.routes.js';
import chatRoutes from '../modules/chat/chat.routes.js';
import communityRoutes from '../modules/communities/community.routes.js';
import healthRoutes from '../modules/health/health.routes.js';
import commonRoutes from '../modules/common/common.routes.js';
import supportRoutes from '../modules/support/support.routes.js';
import uploadRoutes from '../modules/upload/upload.routes.js';
import { userSosRouter } from '../modules/sos/sos.routes.js';
import notificationRoutes from '../modules/notification/notification.routes.js';

const router = Router();

/**
 * ==============================================================================
 * 🛠️ CENTRALIZED COMMON & REUSABLE SERVICES (/api/v1/...)
 * ==============================================================================
 * Shared cross-cutting platform capabilities utilized across both User and Rider personas:
 * - 🔐 Auth: Phone OTP login, JWT access & refresh tokens, account security (/auth)
 * - 💬 Chat: Direct 1-on-1 messaging, call signaling & socket event dispatch (/chat)
 * - 🚨 SOS: Panic button activation, instant emergency broadcast & location (/sos)
 * - 🏢 Communities: Corporate, university, and residential commute hubs (/communities)
 * - 📁 Upload: Universal file upload for avatars, ride media, and documents (/upload)
 * - 🎫 Support: Customer support tickets, inquiry resolution, FAQs (/support)
 * - 📢 Common & Banners: Home carousel banners, dynamic cities, app config (/common, /banners)
 * - 📡 Health: Server uptime, memory, and MySQL database connection health (/health)
 * ==============================================================================
 */

// 🔐 Authentication & Session
router.use('/auth', authRoutes);

// 💬 Real-Time Messaging & Chat
router.use('/chat', chatRoutes);

// 🔔 Centralized In-App Notifications (User & Rider)
router.use('/notifications', notificationRoutes);
router.use('/user/notifications', notificationRoutes);
router.use('/rider/notifications', notificationRoutes);

// 🚨 Emergency SOS (User / Commuter trigger)
router.use('/user/sos', userSosRouter);
router.use('/sos', userSosRouter);

// 🏢 Commute Communities & Circles
router.use('/communities', communityRoutes);

// 📁 Uploads (Avatars, Videos, Vehicle Documents)
router.use('/upload', uploadRoutes);

// 🎫 Help & Customer Support
router.use('/common/support', supportRoutes);
router.use('/support', supportRoutes);

// 📢 Common Banners & Dynamic App Configuration
router.use('/common', commonRoutes);
router.use('/banners', commonRoutes);

// 📡 System & Database Health Check
router.use('/health', healthRoutes);

export default router;

