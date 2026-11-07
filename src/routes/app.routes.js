import { Router } from 'express';

// 🎯 Core Persona Modules (Flutter Mobile App Driven)
import userPersonaRoutes from '../modules/user/user.routes.js';
import riderPersonaRoutes from '../modules/rider/rider.routes.js';
import strangerPersonaRoutes from '../modules/stranger/stranger.routes.js';

const router = Router();

/**
 * ==============================================================================
 * 📱 MOBILE APP API GATEWAY (/api/v1/...)
 * ==============================================================================
 * Cleanly partitioned into two distinct personas matching the mobile app screens:
 *
 * 1. 👤 USER SIDE (Passenger / Commuter / Guest)
 *    - Search rides with pickup, drop, date, time filters (/user/rides/search)
 *    - Request seat & book ride (/user/rides/:id/request-seat)
 *    - View personal booking history & active ride tracking (/user/my-rides)
 *    - Rate & review driver upon trip completion (/user/rides/:id/feedback)
 *    - Manage trusted emergency contacts (/user/trusted-contacts)
 *    - Stranger Mode social trips & roadtrip reels (/user/stranger, /stranger)
 *
 * 2. 🚗 RIDER SIDE (Host / Driver / Vehicle Owner)
 *    - Apply for driver verification with DL & identity docs (/rider/apply)
 *    - Manage vehicles: cars, bikes, RC & insurance details (/rider/vehicles)
 *    - Publish & offer rides (/rider/rides/offer)
 *    - Manage passenger bookings: accept, decline, onboard (/rider/requests/...)
 *    - Trip lifecycle controls: start trip, complete trip, cancel (/rider/rides/...)
 *    - Host stranger trips & co-travel itineraries (/rider/stranger/...)
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// 👤 1. USER SIDE (Passenger / Commuter)
// ------------------------------------------------------------------------------
router.use('/user/stranger', strangerPersonaRoutes);
router.use('/stranger', strangerPersonaRoutes);
router.use('/user', userPersonaRoutes);

// ------------------------------------------------------------------------------
// 🚗 2. RIDER SIDE (Host / Driver / Vehicle Owner)
// ------------------------------------------------------------------------------
router.use('/rider', riderPersonaRoutes);

export default router;

