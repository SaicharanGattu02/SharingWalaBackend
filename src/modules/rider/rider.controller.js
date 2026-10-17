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

export const offerRide = asyncHandler(async (req, res) => {
  const ride = await riderService.offerRide(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, ride, 'Ride offered successfully'));
});

export const getMyOfferedRides = asyncHandler(async (req, res) => {
  const rides = await riderService.getMyOfferedRides(req.user.id);
  res.status(200).json(new ApiResponse(200, rides, 'Offered rides retrieved'));
});

export const respondToRequest = asyncHandler(async (req, res) => {
  const result = await riderService.respondToPassengerRequest(req.user.id, req.params.bookingId, req.body.action);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const updateRideStatus = asyncHandler(async (req, res) => {
  const result = await riderService.updateOfferedRideStatus(req.user.id, req.params.rideId, req.body.status);
  res.status(200).json(new ApiResponse(200, result, result.message));
});
