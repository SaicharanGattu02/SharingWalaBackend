import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
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

// Host reviews who asked to join a plan
export const getPlanRequests = asyncHandler(async (req, res) => {
  const result = await strangerService.getStrangerPlanRequests(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Join requests retrieved'));
});

export const respondToPlanRequest = asyncHandler(async (req, res) => {
  const action =
    req.body?.action ||
    req.body?.status ||
    (req.path.endsWith('/accept') ? 'ACCEPT' : req.path.endsWith('/reject') ? 'REJECT' : '');
  const result = await strangerService.respondToStrangerPlanRequest(
    req.user.id,
    req.params.id,
    req.params.requestId,
    action
  );
  res.status(200).json(new ApiResponse(200, result, result.message));
});

// Passenger withdraws a pending trip request
export const cancelTripRequest = asyncHandler(async (req, res) => {
  const result = await strangerService.cancelStrangerTripRequest(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

// --- Reels ---
export const getReels = asyncHandler(async (req, res) => {
  const reels = await strangerService.getStrangerReels(req.user?.id, req);
  res.status(200).json(new ApiResponse(200, reels, 'Stranger reels retrieved'));
});

export const createReel = asyncHandler(async (req, res) => {
  const reel = await strangerService.createStrangerReel(req.user.id, req.body, req);
  res.status(201).json(new ApiResponse(201, reel, 'Reel uploaded successfully'));
});

export const likeReel = asyncHandler(async (req, res) => {
  const result = await strangerService.toggleLikeReel(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Reel like updated'));
});

export const getReelComments = asyncHandler(async (req, res) => {
  const comments = await strangerService.getReelComments(req.params.id);
  res.status(200).json(new ApiResponse(200, comments, 'Reel comments retrieved'));
});

export const addReelComment = asyncHandler(async (req, res) => {
  const text = req.body.comment || req.body.text;
  if (!text || !text.trim()) {
    throw new ApiError(400, 'Comment text is required');
  }
  const comment = await strangerService.addReelComment(req.user.id, req.params.id, text.trim());
  res.status(201).json(new ApiResponse(201, comment, 'Comment posted successfully'));
});

export const deleteReel = asyncHandler(async (req, res) => {
  const result = await strangerService.deleteStrangerReel(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Reel deleted successfully'));
});

// --- Globe ---
export const getGlobeDestinations = asyncHandler(async (req, res) => {
  const result = await strangerService.getGlobeDestinations({
    origin: req.query.origin,
    region: req.query.region,
    lat: req.query.lat,
    lon: req.query.lon,
    days: req.query.days,
    travelers: req.query.travelers,
    q: req.query.q,
    search: req.query.search,
    query: req.query.query,
    sort: req.query.sort,
    sortBy: req.query.sortBy,
    vibe: req.query.vibe,
    category: req.query.category,
    minBudget: req.query.minBudget,
    maxBudget: req.query.maxBudget,
    budget: req.query.budget,
    minDays: req.query.minDays,
    maxDays: req.query.maxDays,
    onlyLive: req.query.onlyLive,
  });
  res.status(200).json(new ApiResponse(200, result, 'Globe destinations retrieved'));
});

export const getGlobeWeather = asyncHandler(async (req, res) => {
  const result = await strangerService.getGlobeWeather({
    lat: req.query.lat,
    lon: req.query.lon,
  });
  res.status(200).json(new ApiResponse(200, result, 'Globe weather retrieved'));
});

// --- Globe Admin Panel Config ---
export const adminGetGlobeConfig = asyncHandler(async (req, res) => {
  const result = await strangerService.adminGetGlobeConfig();
  res.status(200).json(new ApiResponse(200, result, 'Globe admin config retrieved'));
});

export const adminUpdateGlobePricingConfig = asyncHandler(async (req, res) => {
  const result = await strangerService.adminUpdateGlobePricingConfig(req.body);
  res.status(200).json(new ApiResponse(200, result, 'Globe pricing config updated'));
});

export const adminCreateGlobeDestination = asyncHandler(async (req, res) => {
  const result = await strangerService.adminCreateGlobeDestination(req.body);
  res.status(201).json(new ApiResponse(201, result, 'Globe destination created'));
});

export const adminUpdateGlobeDestination = asyncHandler(async (req, res) => {
  const result = await strangerService.adminUpdateGlobeDestination(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, 'Globe destination updated'));
});

export const adminDeleteGlobeDestination = asyncHandler(async (req, res) => {
  const result = await strangerService.adminDeleteGlobeDestination(req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Globe destination deleted'));
});

export const adminExportGlobeCatalog = asyncHandler(async (req, res) => {
  const data = await strangerService.adminGetGlobeConfig();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="globe_catalog.json"');
  res.status(200).send(JSON.stringify(data, null, 2));
});

export const adminImportGlobeCatalog = asyncHandler(async (req, res) => {
  let payload = req.body;
  if (req.file && req.file.buffer) {
    try {
      payload = JSON.parse(req.file.buffer.toString('utf8'));
    } catch {
      return res.status(400).json(new ApiResponse(400, null, 'Invalid JSON file uploaded'));
    }
  } else if (Array.isArray(payload)) {
    payload = { destinations: payload };
  }

  const mode = (req.query.mode || req.body?.mode || 'merge').toString().toLowerCase();
  const result = await strangerService.adminImportGlobeCatalog({
    pricingConfig: payload?.pricingConfig,
    destinations: payload?.destinations,
    mode,
  });
  res.status(200).json(new ApiResponse(200, result, 'Globe catalog imported and applied'));
});
