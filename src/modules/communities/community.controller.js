import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as communityService from './community.service.js';

export const createCommunity = asyncHandler(async (req, res) => {
  const community = await communityService.createCommunity(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, community, 'Community created successfully'));
});

export const joinCommunity = asyncHandler(async (req, res) => {
  const membership = await communityService.joinCommunity(req.user.id, req.body.communityId);
  res.status(200).json(new ApiResponse(200, membership, 'Joined community successfully'));
});

export const listCommunities = asyncHandler(async (req, res) => {
  const communities = await communityService.listCommunities();
  res.status(200).json(new ApiResponse(200, communities, 'Communities retrieved'));
});

export const getMyCommunities = asyncHandler(async (req, res) => {
  const communities = await communityService.getMyCommunities(req.user.id);
  res.status(200).json(new ApiResponse(200, communities, 'My communities retrieved'));
});
