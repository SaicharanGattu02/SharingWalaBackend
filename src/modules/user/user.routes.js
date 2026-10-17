import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  updateProfileSchema,
  trustedContactSchema,
  searchRidesQuerySchema,
  requestSeatSchema,
} from './user.validation.js';
import * as userController from './user.controller.js';

const router = Router();

// Public ride search
router.get('/rides/search', validate({ query: searchRidesQuerySchema }), userController.searchRides);
router.get('/rides/:id', userController.getRideDetails);

// Authenticated Passenger / Commuter Routes
router.use(authenticate);

// Profile & Preferences
router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);

// Trusted Contacts
router.get('/trusted-contacts', userController.getTrustedContacts);
router.post('/trusted-contacts', validate(trustedContactSchema), userController.addTrustedContact);
router.delete('/trusted-contacts/:id', userController.deleteTrustedContact);

// Bookings & Rides
router.post('/rides/:id/request-seat', validate(requestSeatSchema), userController.requestSeat);
router.get('/my-rides', userController.getMyRides);
router.get('/rides/:id/active', userController.getActiveRideTracking);

export default router;
