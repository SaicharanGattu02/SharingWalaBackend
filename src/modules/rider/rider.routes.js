import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  applyDriverSchema,
  addVehicleSchema,
  updateVehicleSchema,
  offerRideSchema,
  updateOfferRideSchema,
  respondBookingSchema,
  updateRideStatusSchema,
} from './rider.validation.js';
import * as riderController from './rider.controller.js';
import * as userController from '../user/user.controller.js';
import {
  trustedContactSchema,
  updateTrustedContactSchema,
  updateProfileSchema,
} from '../user/user.validation.js';

const router = Router();

// All Rider endpoints require authentication
router.use(authenticate);

// Profile & Preferences (Rider / Host)
router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);

// Driver Verification
router.get('/status', riderController.getStatus);
router.post('/apply', validate(applyDriverSchema), riderController.apply);

// Vehicles (Cars & Bikes)
router.get('/vehicles', riderController.getVehicles);
router.post('/vehicles', validate(addVehicleSchema), riderController.addVehicle);
router.put('/vehicles/:id', validate(updateVehicleSchema), riderController.updateVehicle);
router.delete('/vehicles/:id', riderController.deleteVehicle);

// Ride Offering & Management
router.post('/rides/offer', validate(offerRideSchema), riderController.offerRide);
router.get('/my-offered-rides', riderController.getMyOfferedRides);
router.get('/my-rides', riderController.getMyRides);
router.put('/rides/:id', validate(updateOfferRideSchema), riderController.updateOfferRide);
router.delete('/rides/:id', riderController.deleteOfferRide);
router.post('/rides/:id/cancel', riderController.cancelOfferRide);
router.patch('/rides/:id/cancel', riderController.cancelOfferRide);
router.put('/rides/offer/:id', validate(updateOfferRideSchema), riderController.updateOfferRide);
router.delete('/rides/offer/:id', riderController.deleteOfferRide);
router.post('/rides/offer/:id/cancel', riderController.cancelOfferRide);
router.patch('/rides/:rideId/status', validate(updateRideStatusSchema), riderController.updateRideStatus);
router.post('/rides/:rideId/status', validate(updateRideStatusSchema), riderController.updateRideStatus);

// Trip Lifecycle (Start Trip & Complete Trip)
router.post('/rides/:rideId/start', riderController.startTrip);
router.patch('/rides/:rideId/start', riderController.startTrip);
router.post('/rides/:rideId/start-trip', riderController.startTrip);
router.patch('/rides/:rideId/start-trip', riderController.startTrip);
router.post('/rides/start/:rideId', riderController.startTrip);
router.post('/trips/:rideId/start', riderController.startTrip);
router.patch('/trips/:rideId/start', riderController.startTrip);

router.post('/rides/:rideId/complete', riderController.completeTrip);
router.patch('/rides/:rideId/complete', riderController.completeTrip);
router.post('/rides/:rideId/complete-trip', riderController.completeTrip);
router.patch('/rides/:rideId/complete-trip', riderController.completeTrip);
router.post('/rides/complete/:rideId', riderController.completeTrip);
router.post('/trips/:rideId/complete', riderController.completeTrip);
router.patch('/trips/:rideId/complete', riderController.completeTrip);

// Manage Passengers (Bookings & Requests on Offered Ride)
router.get('/rides/:rideId/passengers', riderController.getRidePassengers);
router.get('/rides/:rideId/bookings', riderController.getRidePassengers);
router.get('/rides/:rideId/requests', riderController.getRidePassengers);

router.post('/requests/:bookingId/respond', validate(respondBookingSchema), riderController.respondToRequest);
router.patch('/requests/:bookingId/respond', validate(respondBookingSchema), riderController.respondToRequest);
router.post('/bookings/:bookingId/respond', validate(respondBookingSchema), riderController.respondToRequest);
router.patch('/bookings/:bookingId/respond', validate(respondBookingSchema), riderController.respondToRequest);
router.post('/rides/:rideId/passengers/:bookingId', validate(respondBookingSchema), riderController.respondToRequest);
router.patch('/rides/:rideId/passengers/:bookingId', validate(respondBookingSchema), riderController.respondToRequest);
router.post('/rides/:rideId/requests/:bookingId', validate(respondBookingSchema), riderController.respondToRequest);
router.patch('/rides/:rideId/requests/:bookingId', validate(respondBookingSchema), riderController.respondToRequest);

router.post('/requests/:bookingId/onboard', riderController.onboardPassenger);
router.patch('/requests/:bookingId/onboard', riderController.onboardPassenger);
router.post('/bookings/:bookingId/onboard', riderController.onboardPassenger);
router.patch('/bookings/:bookingId/onboard', riderController.onboardPassenger);
router.post('/rides/:rideId/passengers/:bookingId/onboard', riderController.onboardPassenger);
router.patch('/rides/:rideId/passengers/:bookingId/onboard', riderController.onboardPassenger);

// Trusted Contacts (Safety / SOS for Rider / Host)
router.get('/trusted-contacts', userController.getTrustedContacts);
router.post('/trusted-contacts', validate(trustedContactSchema), userController.addTrustedContact);
router.put('/trusted-contacts/:id', validate(updateTrustedContactSchema), userController.updateTrustedContact);
router.delete('/trusted-contacts/:id', userController.deleteTrustedContact);

export default router;
