import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  updateProfileSchema,
  switchRoleSchema,
  trustedContactSchema,
  updateTrustedContactSchema,
  searchRidesQuerySchema,
  requestSeatSchema,
  submitFeedbackSchema,
} from './user.validation.js';
import * as userController from './user.controller.js';

const router = Router();

// Public / Semi-authenticated ride search & details
router.get('/rides/search', optionalAuthenticate, validate({ query: searchRidesQuerySchema }), userController.searchRides);
router.get('/rides/active', authenticate, userController.getActiveRideTracking);
router.get('/rides/:id', optionalAuthenticate, userController.getRideDetails);

// Authenticated Passenger / Commuter Routes
router.use(authenticate);

// Profile & Preferences
router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.patch('/switch-role', validate(switchRoleSchema), userController.switchRole);
router.post('/switch-role', validate(switchRoleSchema), userController.switchRole);

// Trusted Contacts (Emergency / SOS)
router.get('/trusted-contacts', userController.getTrustedContacts);
router.post('/trusted-contacts', validate(trustedContactSchema), userController.addTrustedContact);
router.put('/trusted-contacts/:id', validate(updateTrustedContactSchema), userController.updateTrustedContact);
router.delete('/trusted-contacts/:id', userController.deleteTrustedContact);

// Bookings & Rides
router.post('/rides/:id/request-seat', validate(requestSeatSchema), userController.requestSeat);
router.get('/my-rides', userController.getMyRides);
router.get('/active-ride', userController.getActiveRideTracking);
router.get('/active-trip', userController.getActiveRideTracking);
router.get('/rides/active', userController.getActiveRideTracking);
router.get('/rides/:id/active', userController.getActiveRideTracking);
router.get('/rides/active/:id', userController.getActiveRideTracking);

// Feedback, Rating & Review (After trip completion)
router.post('/rides/:id/feedback', validate(submitFeedbackSchema), userController.submitRideFeedback);
router.post('/rides/:id/rating', validate(submitFeedbackSchema), userController.submitRideFeedback);
router.post('/rides/:id/rate', validate(submitFeedbackSchema), userController.submitRideFeedback);
router.post('/rides/:id/review', validate(submitFeedbackSchema), userController.submitRideFeedback);
router.get('/rides/:id/feedback', userController.getRideFeedback);
router.get('/rides/:id/rating', userController.getRideFeedback);


export default router;
