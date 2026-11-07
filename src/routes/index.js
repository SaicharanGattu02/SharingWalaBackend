import { Router } from 'express';

// 🛡️ 1. Platform Administration Gateway
import adminRoutes from './admin.routes.js';

// 📱 2. Mobile App Gateway (User & Rider sides)
import appRoutes from './app.routes.js';

// 🛠️ 3. Centralized Common & Reusable Services
import commonRoutes from './common.routes.js';

const router = Router();

/**
 * ==============================================================================
 * 🌟 SHARE2GO CENTRAL API GATEWAY (/api/v1)
 * ==============================================================================
 *
 * 🛡️ 1. ADMIN PLATFORM
 *    /api/v1/admin/...               -> Admin Portal, Staff Auth, KYC, Controls
 *    /api/v1/admin/sos/...           -> Admin Emergency Incident Center
 *
 * 📱 2. APP PLATFORM
 *    👤 USER SIDE (Passenger / Commuter):
 *       /api/v1/user/...             -> Search rides, book seats, history, reviews
 *       /api/v1/stranger/...         -> Stranger Mode trips, meetups, roadtrip reels
 *       /api/v1/user/stranger/...    -> Alternate mapped stranger endpoint
 *
 *    🚗 RIDER SIDE (Driver / Vehicle Owner / Host):
 *       /api/v1/rider/...            -> Verification apply, vehicles, offer rides, trip lifecycle
 *
 * 🛠️ 3. COMMON & SHARED SERVICES
 *    /api/v1/auth/...                -> Phone OTP, JWT tokens, profile
 *    /api/v1/chat/...                -> Real-time 1-on-1 messaging & call signaling
 *    /api/v1/sos/...                 -> Emergency SOS panic trigger & location
 *    /api/v1/communities/...         -> Corporate, tech park, and campus circles
 *    /api/v1/upload/...              -> Universal file & media uploads
 *    /api/v1/support/...             -> Customer care tickets & FAQs
 *    /api/v1/common/...              -> Dynamic home banners, city lists, app config
 *    /api/v1/banners/...             -> Promotional banners
 *    /api/v1/health/...              -> MySQL connection & server health
 * ==============================================================================
 */

// 🛡️ 1. Mount Admin Platform
router.use(adminRoutes);

// 📱 2. Mount Mobile App Platform (User & Rider personas)
router.use(appRoutes);

// 🛠️ 3. Mount Centralized Reusable Common Services
router.use(commonRoutes);

export default router;
