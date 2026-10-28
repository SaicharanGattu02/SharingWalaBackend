import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as strangerService from './stranger.service.js';

// --- Trips ---
export const getTrips = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id || req.query.userId;
  const trips = await strangerService.getStrangerTrips(req.query, currentUserId);
  res.status(200).json(new ApiResponse(200, trips, 'Stranger trips retrieved'));
});

export const getTripById = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id || req.query.userId;
  const trip = await strangerService.getStrangerTripById(req.params.id, currentUserId);
  res.status(200).json(new ApiResponse(200, trip, 'Trip details retrieved'));
});

export const createTrip = asyncHandler(async (req, res) => {
  const trip = await strangerService.createStrangerTrip(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, trip, 'Stranger trip created successfully'));
});

export const updateTrip = asyncHandler(async (req, res) => {
  const trip = await strangerService.updateStrangerTrip(req.user.id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, trip, 'Stranger trip updated successfully'));
});

export const deleteTrip = asyncHandler(async (req, res) => {
  const result = await strangerService.deleteStrangerTrip(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Stranger trip deleted successfully'));
});

export const joinTrip = asyncHandler(async (req, res) => {
  const result = await strangerService.joinStrangerTrip(req.user.id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const respondToRequest = asyncHandler(async (req, res) => {
  const action = req.body.action || req.body.status || 'ACCEPT';
  const result = await strangerService.respondToStrangerTripRequest(
    req.user.id,
    req.params.id,
    req.params.requestId,
    action
  );
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const acceptRequest = asyncHandler(async (req, res) => {
  const result = await strangerService.respondToStrangerTripRequest(
    req.user.id,
    req.params.id,
    req.params.requestId,
    'ACCEPT'
  );
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const result = await strangerService.respondToStrangerTripRequest(
    req.user.id,
    req.params.id,
    req.params.requestId,
    'REJECT'
  );
  res.status(200).json(new ApiResponse(200, result, result.message));
});

// --- Meetups ---
export const getMeetups = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id || req.query.userId;
  const meetups = await strangerService.getStrangerMeetups(req.query, currentUserId);
  res.status(200).json(new ApiResponse(200, meetups, 'Stranger meetups retrieved'));
});

export const getMeetupById = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id || req.query.userId;
  const meetup = await strangerService.getStrangerMeetupById(req.params.id, currentUserId);
  res.status(200).json(new ApiResponse(200, meetup, 'Meetup details retrieved'));
});

export const createMeetup = asyncHandler(async (req, res) => {
  const meetup = await strangerService.createStrangerMeetup(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, meetup, 'Meetup posted successfully'));
});

export const rsvpMeetup = asyncHandler(async (req, res) => {
  const result = await strangerService.rsvpStrangerMeetup(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

// --- Plans ---
export const getPlans = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id || req.query.userId;
  const currentUserGender = req.user?.gender || req.query.gender;
  const plans = await strangerService.getStrangerPlans(req.query, currentUserId, currentUserGender);
  res.status(200).json(new ApiResponse(200, plans, 'Travel plans retrieved'));
});

export const getTrendingPlans = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id || req.query.userId;
  const currentUserGender = req.user?.gender || req.query.gender;
  const plans = await strangerService.getTrendingPlans(req.query, currentUserId, currentUserGender);
  res.status(200).json(new ApiResponse(200, plans, 'Trending plans retrieved'));
});

export const getUpcomingPlans = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id || req.query.userId;
  const currentUserGender = req.user?.gender || req.query.gender;
  const plans = await strangerService.getUpcomingPlans(req.query, currentUserId, currentUserGender);
  res.status(200).json(new ApiResponse(200, plans, 'Upcoming plans retrieved'));
});

export const getPlansByInterest = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id || req.query.userId;
  const currentUserGender = req.user?.gender || req.query.gender;
  const result = await strangerService.getPlansByInterest(req.query, currentUserId, currentUserGender);
  res.status(200).json(new ApiResponse(200, result, 'Plans by interest retrieved'));
});

export const getPlanById = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id || req.query.userId;
  const currentUserGender = req.user?.gender || req.query.gender;
  const plan = await strangerService.getStrangerPlanById(req.params.id, currentUserId, currentUserGender);
  res.status(200).json(new ApiResponse(200, plan, 'Plan details retrieved'));
});

export const createPlan = asyncHandler(async (req, res) => {
  const plan = await strangerService.createStrangerPlan(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, plan, 'Travel plan posted successfully'));
});

export const joinPlan = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id || req.body?.userId || req.query?.userId;
  const bodyWithGender = {
    ...req.body,
    gender: req.user?.gender || req.body?.gender || req.query?.gender,
  };
  const result = await strangerService.joinStrangerPlan(currentUserId, req.params.id, bodyWithGender);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const leavePlan = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id || req.body?.userId || req.query?.userId;
  const result = await strangerService.leaveStrangerPlan(currentUserId, req.params.id);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

// --- Reels ---
export const getReels = asyncHandler(async (req, res) => {
  const reels = await strangerService.getStrangerReels();
  res.status(200).json(new ApiResponse(200, reels, 'Stranger reels retrieved'));
});

export const createReel = asyncHandler(async (req, res) => {
  const reel = await strangerService.createStrangerReel(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, reel, 'Reel uploaded successfully'));
});

export const likeReel = asyncHandler(async (req, res) => {
  const result = await strangerService.toggleLikeReel(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Reel like updated'));
});
