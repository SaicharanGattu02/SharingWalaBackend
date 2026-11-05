import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as commonService from './common.service.js';

/**
 * GET /api/v1/common/banners
 * Single Unified Banners API with Persona Filter (type=USER | RIDER | STRANGER | ALL)
 */
export const getBanners = asyncHandler(async (req, res) => {
  const banners = await commonService.getBanners(req.query);
  const typeLabel = req.query.type ? req.query.type.toUpperCase() : 'ALL';
  res.status(200).json(
    new ApiResponse(200, banners, `Banners retrieved successfully for [${typeLabel}]`)
  );
});

/**
 * GET /api/v1/common/banners/:id
 * Retrieve details for a specific banner
 */
export const getBannerById = asyncHandler(async (req, res) => {
  const banner = await commonService.getBannerById(req.params.id);
  res.status(200).json(
    new ApiResponse(200, banner, 'Banner details retrieved successfully')
  );
});

/**
 * GET /api/v1/common/app-update?platform=android&version=1.0.0
 * Check if app update or force update is required
 */
export const checkAppUpdate = asyncHandler(async (req, res) => {
  const updateInfo = await commonService.checkAppUpdate(req.query);
  res.status(200).json(
    new ApiResponse(200, updateInfo, 'App update status retrieved successfully')
  );
});

/**
 * GET /api/v1/common/config
 * Retrieve global app configuration
 */
export const getAppConfig = asyncHandler(async (req, res) => {
  const config = await commonService.getAppConfig();
  res.status(200).json(
    new ApiResponse(200, config, 'App configuration retrieved successfully')
  );
});

/**
 * PUT /api/v1/common/config (Admin)
 * Update app configuration (latest version, force update toggle, notes, store urls)
 */
export const updateAppConfig = asyncHandler(async (req, res) => {
  const config = await commonService.updateAppConfig(req.body);
  res.status(200).json(
    new ApiResponse(200, config, 'App configuration updated successfully')
  );
});

