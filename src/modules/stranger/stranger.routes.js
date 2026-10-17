import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createStrangerTripSchema,
  createStrangerMeetupSchema,
  createStrangerPlanSchema,
  createStrangerReelSchema,
} from './stranger.validation.js';
import * as strangerController from './stranger.controller.js';

const router = Router();

// --- 1. STRANGER TRIPS ---
router.get('/trips', strangerController.getTrips);
router.get('/trips/:id', strangerController.getTripById);
router.post('/trips', authenticate, validate(createStrangerTripSchema), strangerController.createTrip);
router.post('/trips/:id/join', authenticate, strangerController.joinTrip);

// --- 2. STRANGER MEETUPS ---
router.get('/meetups', strangerController.getMeetups);
router.get('/meetups/:id', strangerController.getMeetupById);
router.post('/meetups', authenticate, validate(createStrangerMeetupSchema), strangerController.createMeetup);
router.post('/meetups/:id/rsvp', authenticate, strangerController.rsvpMeetup);

// --- 3. STRANGER PLANS ---
router.get('/plans', strangerController.getPlans);
router.get('/plans/:id', strangerController.getPlanById);
router.post('/plans', authenticate, validate(createStrangerPlanSchema), strangerController.createPlan);
router.post('/plans/:id/join', authenticate, strangerController.joinPlan);

// --- 4. STRANGER REELS ---
router.get('/reels', strangerController.getReels);
router.post('/reels', authenticate, validate(createStrangerReelSchema), strangerController.createReel);
router.post('/reels/:id/like', authenticate, strangerController.likeReel);

export default router;
