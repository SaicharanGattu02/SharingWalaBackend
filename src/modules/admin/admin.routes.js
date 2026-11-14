import { Router } from 'express';
import { authenticateAdmin, requireAdminPermission } from '../../middlewares/adminAuth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as adminController from './admin.controller.js';
import {
  adminLoginSchema,
  adminVerifyOtpSchema,
  adminResendOtpSchema,
  adminRefreshTokenSchema,
  adminChangePasswordSchema,
  getUsersQuerySchema,
  updateUserStatusSchema,
  updateUserDetailsSchema,
  getDriversQuerySchema,
  verifyDriverSchema,
  verifyDriverDocumentSchema,
  getVehiclesQuerySchema,
  verifyVehicleSchema,
  verifyVehicleInsuranceSchema,
  getRidesQuerySchema,
  adminCancelRideSchema,
  getTripsQuerySchema,
  getBookingsQuerySchema,
  adminUpdateBookingStatusSchema,
  getReportsQuerySchema,
  resolveReportSchema,
  getCommunitiesQuerySchema,
  createCommunityAdminSchema,
  updateCommunityAdminSchema,
  createPricingRuleSchema,
  updatePricingRuleSchema,
  createBannerSchema,
  updateBannerSchema,
  createStaffSchema,
  updateStaffSchema,
  getAuditLogsQuerySchema,
} from './admin.validation.js';

const router = Router();

// ==============================================================================
// 1. ADMIN AUTHENTICATION ROUTES (Public & Profile)
// ==============================================================================

// Staff Login (Credentials -> OTP triggered to 7674952516)
router.post('/auth/login', validate(adminLoginSchema), adminController.login);

// Staff 2FA OTP Verification
router.post('/auth/verify-otp', validate(adminVerifyOtpSchema), adminController.verifyOtp);

// Staff 2FA Resend OTP
router.post('/auth/resend-otp', validate(adminResendOtpSchema), adminController.resendOtp);

// Refresh Access Token
router.post('/auth/refresh', validate(adminRefreshTokenSchema), adminController.refreshToken);

// All subsequent routes require valid administrative authentication
router.use(authenticateAdmin);

// Current Logged-in Staff Profile & Roles
router.get('/auth/me', adminController.getMe);
router.post('/auth/logout', adminController.logout);
router.put('/auth/change-password', validate(adminChangePasswordSchema), adminController.changePassword);

// ==============================================================================
// 2. DASHBOARD & SYSTEM METRICS
// ==============================================================================

// High-level KPI metrics & statistics
router.get('/dashboard/stats', adminController.getDashboardStats);

// Growth and volume chart data
router.get('/dashboard/charts', adminController.getDashboardCharts);

// Real-time incident & verification activity feed
router.get('/dashboard/recent-activity', adminController.getDashboardRecentActivities);

// ==============================================================================
// 3. USER MANAGEMENT (Commuters & Drivers)
// ==============================================================================

// Paginated users directory with advanced filters
router.get(
  '/users',
  requireAdminPermission('users.view'),
  validate(getUsersQuerySchema),
  adminController.getUsers
);

// Deep inspection of user profile, rides, ratings & safety history
router.get('/users/:id', requireAdminPermission('users.view'), adminController.getUserDetails);

// Modify user profile details
router.put(
  '/users/:id',
  requireAdminPermission('users.update'),
  validate(updateUserDetailsSchema),
  adminController.updateUserDetails
);

// Toggle account status (ACTIVE, SUSPENDED, BLOCKED)
router.patch(
  '/users/:id/status',
  requireAdminPermission('users.block'),
  validate(updateUserStatusSchema),
  adminController.updateUserStatus
);

// Soft delete / delete user account
router.delete('/users/:id', requireAdminPermission('users.block'), adminController.deleteUser);

// ==============================================================================
// 4. DRIVER & DOCUMENT VERIFICATION
// ==============================================================================

// List driver applications by status (PENDING, APPROVED, REJECTED)
router.get(
  '/drivers',
  requireAdminPermission('drivers.verify'),
  validate(getDriversQuerySchema),
  adminController.getDrivers
);

// Driver details with submitted license and vehicle records
router.get('/drivers/:id', requireAdminPermission('drivers.verify'), adminController.getDriverDetails);

// Approve or reject driver profile
router.patch(
  '/drivers/:id/verify',
  requireAdminPermission('drivers.verify'),
  validate(verifyDriverSchema),
  adminController.verifyDriver
);

// Verify specific driver document (Driving License, National ID, etc.)
router.patch(
  '/driver-documents/:id/verify',
  requireAdminPermission('drivers.verify'),
  validate(verifyDriverDocumentSchema),
  adminController.verifyDriverDocument
);

// ==============================================================================
// 5. VEHICLE & INSURANCE VERIFICATION
// ==============================================================================

// List all vehicles registered by drivers with status filters
router.get(
  '/vehicles',
  requireAdminPermission('vehicles.verify'),
  validate(getVehiclesQuerySchema),
  adminController.getVehicles
);

// Single vehicle full inspection
router.get('/vehicles/:id', requireAdminPermission('vehicles.verify'), adminController.getVehicleDetails);

// Approve or reject vehicle RC / registration
router.patch(
  '/vehicles/:id/verify',
  requireAdminPermission('vehicles.verify'),
  validate(verifyVehicleSchema),
  adminController.verifyVehicle
);

// Approve or reject vehicle insurance certificate
router.patch(
  '/vehicle-insurances/:id/verify',
  requireAdminPermission('vehicles.verify'),
  validate(verifyVehicleInsuranceSchema),
  adminController.verifyVehicleInsurance
);

// ==============================================================================
// 6. RIDES & TRIP MODERATION
// ==============================================================================

// List carpool / bikepool rides across platform
router.get(
  '/rides',
  requireAdminPermission('rides.view'),
  validate(getRidesQuerySchema),
  adminController.getRides
);

// Deep ride details (route, stops, passengers, pricing, reports)
router.get('/rides/:id', requireAdminPermission('rides.view'), adminController.getRideDetails);

// Admin emergency ride cancellation
router.post(
  '/rides/:id/cancel',
  requireAdminPermission('rides.cancel'),
  validate(adminCancelRideSchema),
  adminController.cancelRide
);

// Explore social journeys and long-distance biker trips
router.get(
  '/trips',
  requireAdminPermission('rides.view'),
  validate(getTripsQuerySchema),
  adminController.getTrips
);

// ==============================================================================
// 7. BOOKINGS & PASSENGER REQUESTS
// ==============================================================================

// List all seat bookings and reservations
router.get(
  '/bookings',
  requireAdminPermission('rides.view'),
  validate(getBookingsQuerySchema),
  adminController.getBookings
);

// Booking details
router.get('/bookings/:id', requireAdminPermission('rides.view'), adminController.getBookingDetails);

// Admin override on booking status (Dispute resolution)
router.patch(
  '/bookings/:id/status',
  requireAdminPermission('rides.cancel'),
  validate(adminUpdateBookingStatusSchema),
  adminController.updateBookingStatus
);

// ==============================================================================
// 8. TRUST & SAFETY (Incident & User Reports)
// ==============================================================================

// List user complaints & safety reports
router.get(
  '/reports',
  requireAdminPermission('reports.view'),
  validate(getReportsQuerySchema),
  adminController.getSafetyReports
);

// Full report details with reporter and accused user history
router.get('/reports/:id', requireAdminPermission('reports.view'), adminController.getSafetyReportDetails);

// Resolve report with admin notes and optional user penalties
router.patch(
  '/reports/:id/resolve',
  requireAdminPermission('reports.resolve'),
  validate(resolveReportSchema),
  adminController.resolveSafetyReport
);

// ==============================================================================
// 9. COMMUNITIES (Corporate, Campus & Local Hubs)
// ==============================================================================

// List communities
router.get(
  '/communities',
  requireAdminPermission('communities.manage'),
  validate(getCommunitiesQuerySchema),
  adminController.getCommunities
);

// Community details & members
router.get(
  '/communities/:id',
  requireAdminPermission('communities.manage'),
  adminController.getCommunityDetails
);

// Create an official verified community
router.post(
  '/communities',
  requireAdminPermission('communities.manage'),
  validate(createCommunityAdminSchema),
  adminController.createCommunity
);

// Update community details
router.put(
  '/communities/:id',
  requireAdminPermission('communities.manage'),
  validate(updateCommunityAdminSchema),
  adminController.updateCommunity
);

// Delete / Archive community
router.delete(
  '/communities/:id',
  requireAdminPermission('communities.manage'),
  adminController.deleteCommunity
);

// ==============================================================================
// 10. PRICING RULES (Non-commercial Fuel Cost Caps)
// ==============================================================================

// List pricing rules per vehicle type
router.get(
  '/pricing-rules',
  requireAdminPermission('pricing.manage'),
  adminController.getPricingRules
);

// Create new vehicle pricing rule
router.post(
  '/pricing-rules',
  requireAdminPermission('pricing.manage'),
  validate(createPricingRuleSchema),
  adminController.createPricingRule
);

// Update pricing rule
router.put(
  '/pricing-rules/:id',
  requireAdminPermission('pricing.manage'),
  validate(updatePricingRuleSchema),
  adminController.updatePricingRule
);

// Delete pricing rule
router.delete(
  '/pricing-rules/:id',
  requireAdminPermission('pricing.manage'),
  adminController.deletePricingRule
);

// ==============================================================================
// 11. PROMOTIONAL BANNERS MANAGEMENT
// ==============================================================================

// List all banners
router.get(
  '/banners',
  requireAdminPermission('banners.manage'),
  adminController.getBanners
);

// Banner details
router.get(
  '/banners/:id',
  requireAdminPermission('banners.manage'),
  adminController.getBannerById
);

// Create banner
router.post(
  '/banners',
  requireAdminPermission('banners.manage'),
  validate(createBannerSchema),
  adminController.createBanner
);

// Update banner
router.put(
  '/banners/:id',
  requireAdminPermission('banners.manage'),
  validate(updateBannerSchema),
  adminController.updateBanner
);

// Delete banner
router.delete(
  '/banners/:id',
  requireAdminPermission('banners.manage'),
  adminController.deleteBanner
);

// ==============================================================================
// 12. STAFF RBAC & AUDIT LOGS
// ==============================================================================

// List staff accounts
router.get(
  '/staff',
  requireAdminPermission('staff.manage'),
  adminController.getStaffUsers
);

// Create new staff admin user
router.post(
  '/staff',
  requireAdminPermission('staff.manage'),
  validate(createStaffSchema),
  adminController.createStaffUser
);

// Update staff account / roles
router.put(
  '/staff/:id',
  requireAdminPermission('staff.manage'),
  validate(updateStaffSchema),
  adminController.updateStaffUser
);

// List available roles and permissions
router.get(
  '/roles',
  requireAdminPermission('staff.manage'),
  adminController.getRolesAndPermissions
);

// Audit logs trail of all admin operations
router.get(
  '/audit-logs',
  validate(getAuditLogsQuerySchema),
  adminController.getAuditLogs
);

// ==============================================================================
// 13. STRANGER SECTION ADMINISTRATION (Trips, Meetups, Plans, Reels)
// ==============================================================================

// Stranger stats (Trips, Meetups, Plans, Reels count)
router.get('/stranger/stats', adminController.getStrangerStats);

// Stranger Trips
router.get('/stranger/trips', adminController.getStrangerTrips);
router.delete('/stranger/trips/:id', adminController.deleteStrangerTrip);

// Stranger Meetups
router.get('/stranger/meetups', adminController.getStrangerMeetups);
router.delete('/stranger/meetups/:id', adminController.deleteStrangerMeetup);

// Stranger Plans
router.get('/stranger/plans', adminController.getStrangerPlans);
router.delete('/stranger/plans/:id', adminController.deleteStrangerPlan);

// Stranger Reels
router.get('/stranger/reels', adminController.getStrangerReels);
router.post('/stranger/reels', adminController.createStrangerReel);
router.delete('/stranger/reels/:id', adminController.deleteStrangerReel);

export default router;

