import { Router } from 'express';

// 🎯 Core Persona Modules (Flutter Architecture Driven)
import userPersonaRoutes from '../modules/user/user.routes.js';
import riderPersonaRoutes from '../modules/rider/rider.routes.js';
import strangerPersonaRoutes from '../modules/stranger/stranger.routes.js';

// 🛠️ Shared Services
import authRoutes from '../modules/auth/auth.routes.js';
import chatRoutes from '../modules/chat/chat.routes.js';
import communityRoutes from '../modules/communities/community.routes.js';
import healthRoutes from '../modules/health/health.routes.js';
import commonRoutes from '../modules/common/common.routes.js';
import supportRoutes from '../modules/support/support.routes.js';
import uploadRoutes from '../modules/upload/upload.routes.js';
import { userSosRouter, adminSosRouter } from '../modules/sos/sos.routes.js';

// 🛡️ Platform Administration Module
import adminRoutes from '../modules/admin/admin.routes.js';

const router = Router();

// ==============================================================================
// 1. PRIMARY PERSONA MODULES
// ==============================================================================

// 🌟 C. Stranger Mode Module (Trips, Meetups, Plans, Reels)
router.use('/user/stranger', strangerPersonaRoutes);
router.use('/stranger', strangerPersonaRoutes);

// 👤 A. User Module (Guest / Commuter / Passenger)
router.use('/user', userPersonaRoutes);

// 🚗 B. Rider Module (Host / Driver / Vehicle Owner)
router.use('/rider', riderPersonaRoutes);

// ==============================================================================
// 2. COMMON & PLATFORM SERVICES
// ==============================================================================

// 📢 Common Banners & App Config
router.use('/common/support', supportRoutes);
router.use('/support', supportRoutes);
router.use('/common', commonRoutes);
router.use('/banners', commonRoutes);

// 🔐 Authentication & Session
router.use('/auth', authRoutes);

// 💬 Real-Time Messaging & Chat
router.use('/chat', chatRoutes);

// 🚨 Emergency SOS System
router.use('/user/sos', userSosRouter);
router.use('/sos', userSosRouter);
router.use('/admin/sos', adminSosRouter);

// 🏢 Corporate & Commute Communities
router.use('/communities', communityRoutes);

// 📁 Uploads (Videos, Photos, Reels)
router.use('/upload', uploadRoutes);

// 📡 System & Database Health
router.use('/health', healthRoutes);

// ==============================================================================
// 3. PLATFORM ADMINISTRATION & OPERATIONS
// ==============================================================================
router.use('/admin', adminRoutes);

export default router;
