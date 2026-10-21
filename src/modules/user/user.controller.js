import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as userService from './user.service.js';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getUserProfile(req.user.id);
  res.status(200).json(new ApiResponse(200, profile, 'User profile retrieved'));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updated = await userService.updateUserProfile(req.user.id, req.body);
  res.status(200).json(new ApiResponse(200, updated, 'Profile updated successfully'));
});

export const switchRole = asyncHandler(async (req, res) => {
  const updated = await userService.switchRole(req.user.id, req.body);
  res.status(200).json(new ApiResponse(200, updated, `Switched role to ${updated.activeRole}`));
});

export const getTrustedContacts = asyncHandler(async (req, res) => {
  const contacts = await userService.getTrustedContacts(req.user.id);
  res.status(200).json(new ApiResponse(200, contacts, 'Trusted contacts retrieved'));
});

export const addTrustedContact = asyncHandler(async (req, res) => {
  const contact = await userService.addTrustedContact(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, contact, 'Contact added successfully'));
});

export const updateTrustedContact = asyncHandler(async (req, res) => {
  const contact = await userService.updateTrustedContact(req.user.id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, contact, 'Contact updated successfully'));
});

export const deleteTrustedContact = asyncHandler(async (req, res) => {
  const result = await userService.deleteTrustedContact(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Contact deleted successfully'));
});

export const searchRides = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id || req.query.userId || req.query.passengerId;
  const rides = await userService.searchUserRides(req.query, currentUserId);
  res.status(200).json(new ApiResponse(200, rides, 'Available rides found'));
});

export const getRideDetails = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id || req.query.userId || req.query.passengerId;
  const ride = await userService.getRideDetails(req.params.id, currentUserId);
  res.status(200).json(new ApiResponse(200, ride, 'Ride details retrieved'));
});

export const requestSeat = asyncHandler(async (req, res) => {
  const result = await userService.requestSeatOnRide(req.user.id, req.params.id, req.body);
  res.status(201).json(new ApiResponse(201, result, result.message));
});

export const getMyRides = asyncHandler(async (req, res) => {
  const categorizedRides = await userService.getUserMyRides(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, categorizedRides, 'My rides list retrieved'));
});

export const getActiveRideTracking = asyncHandler(async (req, res) => {
  const liveInfo = await userService.getActiveRideTracking(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, liveInfo, 'Active ride live tracking info'));
});

export const submitRideFeedback = asyncHandler(async (req, res) => {
  const result = await userService.submitRideFeedback(req.user.id, req.params.id, req.body);
  res.status(201).json(new ApiResponse(201, result, result.message));
});

export const getRideFeedback = asyncHandler(async (req, res) => {
  const result = await userService.getRideFeedback(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Ride feedback retrieved'));
});

