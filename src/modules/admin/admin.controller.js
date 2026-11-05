import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as adminService from './admin.service.js';

// ==============================================================================
// 1. ADMIN AUTHENTICATION CONTROLLER
// ==============================================================================

export const login = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.adminLogin(req.body, ipAddress);
  res.status(200).json(new ApiResponse(200, result, 'Admin logged in successfully'));
});

export const refreshToken = asyncHandler(async (req, res) => {
  const result = await adminService.adminRefreshToken(req.body);
  res.status(200).json({
    statusCode: 200,
    success: true,
    message: 'Admin token refreshed successfully',
    data: result,
    accessToken: result.accessToken,
    token: result.accessToken,
    refreshToken: result.refreshToken,
    expiresIn: result.expiresIn,
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const profile = await adminService.adminGetMe(req.admin.id);
  res.status(200).json(new ApiResponse(200, profile, 'Admin profile retrieved'));
});

export const changePassword = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.adminChangePassword(req.admin.id, req.body, ipAddress);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const logout = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  await adminService.logAdminActivity({
    adminId: req.admin.id,
    action: 'ADMIN_LOGOUT',
    entityType: 'ADMIN_AUTH',
    entityId: req.admin.id,
    ipAddress,
  });
  res.status(200).json(new ApiResponse(200, { success: true }, 'Admin logged out successfully'));
});

// ==============================================================================
// 2. DASHBOARD & ANALYTICS CONTROLLER
// ==============================================================================

export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res.status(200).json(new ApiResponse(200, stats, 'Platform dashboard statistics retrieved'));
});

export const getDashboardCharts = asyncHandler(async (req, res) => {
  const charts = await adminService.getDashboardCharts();
  res.status(200).json(new ApiResponse(200, charts, 'Dashboard charts retrieved'));
});

export const getDashboardRecentActivities = asyncHandler(async (req, res) => {
  const activities = await adminService.getDashboardRecentActivities();
  res.status(200).json(new ApiResponse(200, activities, 'Recent administrative activities retrieved'));
});

// ==============================================================================
// 3. USER MANAGEMENT CONTROLLER
// ==============================================================================

export const getUsers = asyncHandler(async (req, res) => {
  const users = await adminService.getUsers(req.query);
  res.status(200).json(new ApiResponse(200, users, 'Users retrieved successfully'));
});

export const getUserDetails = asyncHandler(async (req, res) => {
  const user = await adminService.getUserDetails(req.params.id);
  res.status(200).json(new ApiResponse(200, user, 'User details retrieved'));
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.updateUserStatus(req.admin.id, req.params.id, req.body, ipAddress);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const updateUserDetails = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const user = await adminService.updateUserDetails(req.admin.id, req.params.id, req.body, ipAddress);
  res.status(200).json(new ApiResponse(200, user, 'User updated successfully'));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.deleteUser(req.admin.id, req.params.id, ipAddress);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

// ==============================================================================
// 4. DRIVER VERIFICATION CONTROLLER
// ==============================================================================

export const getDrivers = asyncHandler(async (req, res) => {
  const drivers = await adminService.getDrivers(req.query);
  res.status(200).json(new ApiResponse(200, drivers, 'Driver profiles retrieved'));
});

export const getDriverDetails = asyncHandler(async (req, res) => {
  const driver = await adminService.getDriverDetails(req.params.id);
  res.status(200).json(new ApiResponse(200, driver, 'Driver details retrieved'));
});

export const verifyDriver = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.verifyDriver(req.admin.id, req.params.id, req.body, ipAddress);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const verifyDriverDocument = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.verifyDriverDocument(req.admin.id, req.params.id, req.body, ipAddress);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

// ==============================================================================
// 5. VEHICLE VERIFICATION CONTROLLER
// ==============================================================================

export const getVehicles = asyncHandler(async (req, res) => {
  const vehicles = await adminService.getVehicles(req.query);
  res.status(200).json(new ApiResponse(200, vehicles, 'Vehicles retrieved'));
});

export const getVehicleDetails = asyncHandler(async (req, res) => {
  const vehicle = await adminService.getVehicleDetails(req.params.id);
  res.status(200).json(new ApiResponse(200, vehicle, 'Vehicle details retrieved'));
});

export const verifyVehicle = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.verifyVehicle(req.admin.id, req.params.id, req.body, ipAddress);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const verifyVehicleInsurance = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.verifyVehicleInsurance(req.admin.id, req.params.id, req.body, ipAddress);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

// ==============================================================================
// 6. RIDES, TRIPS & BOOKINGS MODERATION CONTROLLER
// ==============================================================================

export const getRides = asyncHandler(async (req, res) => {
  const rides = await adminService.getRides(req.query);
  res.status(200).json(new ApiResponse(200, rides, 'Platform rides retrieved'));
});

export const getRideDetails = asyncHandler(async (req, res) => {
  const ride = await adminService.getRideDetails(req.params.id);
  res.status(200).json(new ApiResponse(200, ride, 'Ride details retrieved'));
});

export const cancelRide = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.cancelRideByAdmin(req.admin.id, req.params.id, req.body, ipAddress);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const getTrips = asyncHandler(async (req, res) => {
  const trips = await adminService.getTrips(req.query);
  res.status(200).json(new ApiResponse(200, trips, 'Trips and journeys retrieved'));
});

export const getBookings = asyncHandler(async (req, res) => {
  const bookings = await adminService.getBookings(req.query);
  res.status(200).json(new ApiResponse(200, bookings, 'Bookings retrieved'));
});

export const getBookingDetails = asyncHandler(async (req, res) => {
  const booking = await adminService.getBookingDetails(req.params.id);
  res.status(200).json(new ApiResponse(200, booking, 'Booking details retrieved'));
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.updateBookingStatusByAdmin(req.admin.id, req.params.id, req.body, ipAddress);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

// ==============================================================================
// 7. SAFETY & INCIDENT REPORTS CONTROLLER
// ==============================================================================

export const getSafetyReports = asyncHandler(async (req, res) => {
  const reports = await adminService.getSafetyReports(req.query);
  res.status(200).json(new ApiResponse(200, reports, 'Safety reports retrieved'));
});

export const getSafetyReportDetails = asyncHandler(async (req, res) => {
  const report = await adminService.getSafetyReportDetails(req.params.id);
  res.status(200).json(new ApiResponse(200, report, 'Safety report details retrieved'));
});

export const resolveSafetyReport = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.resolveSafetyReport(req.admin.id, req.params.id, req.body, ipAddress);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

// ==============================================================================
// 8. COMMUNITIES CONTROLLER
// ==============================================================================

export const getCommunities = asyncHandler(async (req, res) => {
  const communities = await adminService.getCommunities(req.query);
  res.status(200).json(new ApiResponse(200, communities, 'Communities retrieved'));
});

export const getCommunityDetails = asyncHandler(async (req, res) => {
  const community = await adminService.getCommunityDetails(req.params.id);
  res.status(200).json(new ApiResponse(200, community, 'Community details retrieved'));
});

export const createCommunity = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const community = await adminService.createCommunityByAdmin(req.admin.id, req.body, ipAddress);
  res.status(201).json(new ApiResponse(201, community, 'Community created successfully'));
});

export const updateCommunity = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const community = await adminService.updateCommunityByAdmin(req.admin.id, req.params.id, req.body, ipAddress);
  res.status(200).json(new ApiResponse(200, community, 'Community updated successfully'));
});

export const deleteCommunity = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.deleteCommunityByAdmin(req.admin.id, req.params.id, ipAddress);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

// ==============================================================================
// 9. PRICING RULES CONTROLLER
// ==============================================================================

export const getPricingRules = asyncHandler(async (req, res) => {
  const rules = await adminService.getPricingRules();
  res.status(200).json(new ApiResponse(200, rules, 'Pricing rules retrieved'));
});

export const createPricingRule = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const rule = await adminService.createPricingRule(req.admin.id, req.body, ipAddress);
  res.status(201).json(new ApiResponse(201, rule, 'Pricing rule created successfully'));
});

export const updatePricingRule = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const rule = await adminService.updatePricingRule(req.admin.id, req.params.id, req.body, ipAddress);
  res.status(200).json(new ApiResponse(200, rule, 'Pricing rule updated successfully'));
});

export const deletePricingRule = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.deletePricingRule(req.admin.id, req.params.id, ipAddress);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

// ==============================================================================
// 10. PROMOTIONAL BANNERS CONTROLLER
// ==============================================================================

export const getBanners = asyncHandler(async (req, res) => {
  const banners = await adminService.getBanners(req.query);
  res.status(200).json(new ApiResponse(200, banners, 'Banners retrieved successfully'));
});

export const getBannerById = asyncHandler(async (req, res) => {
  const banner = await adminService.getBannerById(req.params.id);
  res.status(200).json(new ApiResponse(200, banner, 'Banner details retrieved'));
});

export const createBanner = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const banner = await adminService.createBanner(req.admin.id, req.body, ipAddress);
  res.status(201).json(new ApiResponse(201, banner, 'Banner created successfully'));
});

export const updateBanner = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const banner = await adminService.updateBanner(req.admin.id, req.params.id, req.body, ipAddress);
  res.status(200).json(new ApiResponse(200, banner, 'Banner updated successfully'));
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.deleteBanner(req.admin.id, req.params.id, ipAddress);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

// ==============================================================================
// 11. STAFF RBAC & AUDIT LOGS CONTROLLER
// ==============================================================================

export const getStaffUsers = asyncHandler(async (req, res) => {
  const staff = await adminService.getStaffUsers();
  res.status(200).json(new ApiResponse(200, staff, 'Staff users retrieved'));
});

export const createStaffUser = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const staff = await adminService.createStaffUser(req.admin.id, req.body, ipAddress);
  res.status(201).json(new ApiResponse(201, staff, 'Staff member registered successfully'));
});

export const updateStaffUser = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const staff = await adminService.updateStaffUser(req.admin.id, req.params.id, req.body, ipAddress);
  res.status(200).json(new ApiResponse(200, staff, 'Staff member updated successfully'));
});

export const getRolesAndPermissions = asyncHandler(async (req, res) => {
  const rolesAndPerms = await adminService.getRolesAndPermissions();
  res.status(200).json(new ApiResponse(200, rolesAndPerms, 'Roles and permissions retrieved'));
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await adminService.getAuditLogs(req.query);
  res.status(200).json(new ApiResponse(200, logs, 'Administrative audit logs retrieved'));
});

// ==============================================================================
// 12. STRANGER SECTION CONTROLLER (Trips, Meetups, Plans, Reels)
// ==============================================================================

export const getStrangerStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getStrangerStats();
  res.status(200).json(new ApiResponse(200, stats, 'Stranger section stats retrieved'));
});

export const getStrangerTrips = asyncHandler(async (req, res) => {
  const trips = await adminService.getAdminStrangerTrips(req.query);
  res.status(200).json(new ApiResponse(200, trips, 'Stranger trips retrieved'));
});

export const deleteStrangerTrip = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.deleteAdminStrangerTrip(req.admin.id, req.params.id, ipAddress);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const getStrangerMeetups = asyncHandler(async (req, res) => {
  const meetups = await adminService.getAdminStrangerMeetups(req.query);
  res.status(200).json(new ApiResponse(200, meetups, 'Stranger meetups retrieved'));
});

export const deleteStrangerMeetup = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.deleteAdminStrangerMeetup(req.admin.id, req.params.id, ipAddress);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const getStrangerPlans = asyncHandler(async (req, res) => {
  const plans = await adminService.getAdminStrangerPlans(req.query);
  res.status(200).json(new ApiResponse(200, plans, 'Stranger travel plans retrieved'));
});

export const deleteStrangerPlan = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.deleteAdminStrangerPlan(req.admin.id, req.params.id, ipAddress);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const getStrangerReels = asyncHandler(async (req, res) => {
  const reels = await adminService.getAdminStrangerReels();
  res.status(200).json(new ApiResponse(200, reels, 'Stranger reels retrieved'));
});

export const deleteStrangerReel = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const result = await adminService.deleteAdminStrangerReel(req.admin.id, req.params.id, ipAddress);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const createStrangerReel = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const newReel = await adminService.createAdminStrangerReel(req.admin.id, req.body, ipAddress);
  res.status(201).json(new ApiResponse(201, newReel, 'Stranger reel published successfully'));
});

