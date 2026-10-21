import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createStrangerTripSchema,
  updateStrangerTripSchema,
  createStrangerMeetupSchema,
  createStrangerPlanSchema,
  createStrangerReelSchema,
} from './stranger.validation.js';
import * as strangerController from './stranger.controller.js';

const router = Router();

// --- 1. STRANGER TRIPS ---
router.get('/trips', optionalAuthenticate, strangerController.getTrips);
router.get('/trips/upcoming', optionalAuthenticate, strangerController.getTrips);
router.get('/trips/:id', optionalAuthenticate, strangerController.getTripById);
router.post('/trips', authenticate, validate(createStrangerTripSchema), strangerController.createTrip);
router.put('/trips/:id', authenticate, validate(updateStrangerTripSchema), strangerController.updateTrip);
router.delete('/trips/:id', authenticate, strangerController.deleteTrip);
router.post('/trips/:id/join', authenticate, strangerController.joinTrip);
router.post('/trips/:id/connect', authenticate, strangerController.joinTrip);
router.post('/trips/:id/request', authenticate, strangerController.joinTrip);
router.post('/trips/:id/opt-in', authenticate, strangerController.joinTrip);
router.post('/trips/:id/requests/:requestId/respond', authenticate, strangerController.respondToRequest);
router.post('/trips/:id/requests/:requestId/accept', authenticate, strangerController.acceptRequest);
router.post('/trips/:id/requests/:requestId/reject', authenticate, strangerController.rejectRequest);

// --- 2. STRANGER MEETUPS ---
router.get('/meetups', optionalAuthenticate, strangerController.getMeetups);
router.get('/meetups/:id', optionalAuthenticate, strangerController.getMeetupById);
router.post('/meetups', authenticate, validate(createStrangerMeetupSchema), strangerController.createMeetup);
router.post('/meetups/:id/rsvp', authenticate, strangerController.rsvpMeetup);

// --- 3. STRANGER PLANS ---
router.get('/plans', optionalAuthenticate, strangerController.getPlans);
router.get('/plans/trending', optionalAuthenticate, strangerController.getTrendingPlans);
router.get('/plans/upcoming', optionalAuthenticate, strangerController.getUpcomingPlans);
router.get('/plans/by-interest', optionalAuthenticate, strangerController.getPlansByInterest);
router.get('/plans/:id', optionalAuthenticate, strangerController.getPlanById);
router.post('/plans', authenticate, validate(createStrangerPlanSchema), strangerController.createPlan);
router.post('/plans/:id/join', authenticate, strangerController.joinPlan);
router.post('/plans/:id/request', authenticate, strangerController.joinPlan);
router.post('/plans/:id/opt-in', authenticate, strangerController.joinPlan);

// --- 4. STRANGER REELS ---
router.get('/reels', optionalAuthenticate, strangerController.getReels);
router.post('/reels', authenticate, validate(createStrangerReelSchema), strangerController.createReel);
router.post('/reels/:id/like', authenticate, strangerController.likeReel);

export default router;
