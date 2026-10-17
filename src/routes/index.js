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

const router = Router();

// ==============================================================================
// 1. PRIMARY PERSONA MODULES
// ==============================================================================

// 👤 A. User Module (Guest / Commuter / Passenger)
router.use('/user', userPersonaRoutes);

// 🚗 B. Rider Module (Host / Driver / Vehicle Owner)
router.use('/rider', riderPersonaRoutes);

// 🌟 C. Stranger Mode Module (Trips, Meetups, Plans, Reels)
router.use('/stranger', strangerPersonaRoutes);

// ==============================================================================
// 2. COMMON & PLATFORM SERVICES
// ==============================================================================

// 🔐 Authentication & Session
router.use('/auth', authRoutes);

// 💬 Real-Time Messaging & Chat
router.use('/chat', chatRoutes);

// 🏢 Corporate & Commute Communities
router.use('/communities', communityRoutes);

// 📡 System & Database Health
router.use('/health', healthRoutes);

export default router;
