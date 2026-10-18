import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as riderService from './rider.service.js';

export const getStatus = asyncHandler(async (req, res) => {
  const status = await riderService.getRiderStatus(req.user.id);
  res.status(200).json(new ApiResponse(200, status, 'Driver status retrieved'));
});

export const apply = asyncHandler(async (req, res) => {
  const result = await riderService.applyAsDriver(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, result, result.message));
});

export const getVehicles = asyncHandler(async (req, res) => {
  const vehicles = await riderService.getRiderVehicles(req.user.id);
  res.status(200).json(new ApiResponse(200, vehicles, 'Vehicles retrieved'));
});

export const addVehicle = asyncHandler(async (req, res) => {
  const vehicle = await riderService.addRiderVehicle(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, vehicle, 'Vehicle registered successfully'));
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await riderService.updateRiderVehicle(req.user.id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, vehicle, 'Vehicle updated successfully'));
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const result = await riderService.deleteRiderVehicle(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Vehicle removed successfully'));
});

export const offerRide = asyncHandler(async (req, res) => {
  const ride = await riderService.offerRide(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, ride, 'Ride offered successfully'));
});

export const getMyOfferedRides = asyncHandler(async (req, res) => {
  const rides = await riderService.getMyOfferedRides(req.user.id);
  res.status(200).json(new ApiResponse(200, rides, 'Offered rides retrieved'));
});

export const getRidePassengers = asyncHandler(async (req, res) => {
  const result = await riderService.getOfferedRidePassengers(req.user.id, req.params.rideId || req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Passenger bookings retrieved successfully'));
});

export const respondToRequest = asyncHandler(async (req, res) => {
  const bookingId = req.params.bookingId || req.params.id;
  const actionOrStatus = req.body.action || req.body.status;
  const result = await riderService.respondToPassengerRequest(req.user.id, bookingId, actionOrStatus);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const updateRideStatus = asyncHandler(async (req, res) => {
  const result = await riderService.updateOfferedRideStatus(req.user.id, req.params.rideId, req.body.status);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const updateOfferRide = asyncHandler(async (req, res) => {
  const ride = await riderService.updateOfferedRide(req.user.id, req.params.id || req.params.rideId, req.body);
  res.status(200).json(new ApiResponse(200, ride, 'Offered ride updated successfully'));
});

export const deleteOfferRide = asyncHandler(async (req, res) => {
  const result = await riderService.deleteOfferedRide(req.user.id, req.params.id || req.params.rideId);
  res.status(200).json(new ApiResponse(200, result, result.message));
});
