import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as sosService from './sos.service.js';

/**
 * POST /api/v1/user/sos
 * Trigger emergency SOS alert from User mobile app
 */
export const triggerSos = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await sosService.triggerSos(userId, req.body);
  return res.status(201).json(
    new ApiResponse(201, result, '🚨 SOS Emergency Alert broadcasted successfully. Help is on the way.')
  );
});

/**
 * GET /api/v1/admin/sos
 * Admin list all SOS incidents with filter & pagination
 */
export const getSosIncidents = asyncHandler(async (req, res) => {
  const data = await sosService.getSosIncidents(req.query);
  return res.status(200).json(
    new ApiResponse(200, data, 'SOS Emergency Incidents retrieved successfully')
  );
});

/**
 * GET /api/v1/admin/sos/:id
 * Admin get single SOS incident details
 */
export const getSosIncidentById = asyncHandler(async (req, res) => {
  const incident = await sosService.getSosIncidentById(req.params.id);
  return res.status(200).json(
    new ApiResponse(200, incident, 'SOS Incident details retrieved successfully')
  );
});

/**
 * PUT /api/v1/admin/sos/:id/status
 * Admin update incident status (ACTIVE -> INVESTIGATING -> POLICE_NOTIFIED -> RESOLVED)
 */
export const updateSosStatus = asyncHandler(async (req, res) => {
  const adminId = req.user?.id || req.admin?.id;
  const incident = await sosService.updateSosIncidentStatus(adminId, req.params.id, req.body);
  return res.status(200).json(
    new ApiResponse(200, incident, `SOS Incident status updated to [${incident.status}]`)
  );
});

