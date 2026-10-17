import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  applyDriverSchema,
  addVehicleSchema,
  offerRideSchema,
  respondBookingSchema,
  updateRideStatusSchema,
} from './rider.validation.js';
import * as riderController from './rider.controller.js';

const router = Router();

// All Rider endpoints require authentication
router.use(authenticate);

// Driver Verification
router.get('/status', riderController.getStatus);
router.post('/apply', validate(applyDriverSchema), riderController.apply);

// Vehicles (Cars & Bikes)
router.get('/vehicles', riderController.getVehicles);
router.post('/vehicles', validate(addVehicleSchema), riderController.addVehicle);

// Ride Offering & Management
router.post('/rides/offer', validate(offerRideSchema), riderController.offerRide);
router.get('/my-offered-rides', riderController.getMyOfferedRides);
router.patch('/requests/:bookingId/respond', validate(respondBookingSchema), riderController.respondToRequest);
router.patch('/rides/:rideId/status', validate(updateRideStatusSchema), riderController.updateRideStatus);

export default router;
