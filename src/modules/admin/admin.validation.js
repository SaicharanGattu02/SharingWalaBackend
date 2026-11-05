import { z } from 'zod';

// ==============================================================================
// 1. ADMIN AUTHENTICATION VALIDATION
// ==============================================================================

export const adminLoginSchema = {
  body: z.object({
    email: z.string().email('Please provide a valid administrative email'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
};

export const adminRefreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().min(10, 'Refresh token is required'),
  }),
};

export const adminChangePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(6, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
  }),
};

// ==============================================================================
// 2. USER MANAGEMENT VALIDATION
// ==============================================================================

export const getUsersQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED']).optional(),
    role: z.enum(['USER', 'RIDER', 'GUEST', 'ALL']).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    sortBy: z.enum(['createdAt', 'displayName', 'lastLoginAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
};

export const updateUserStatusSchema = {
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED']),
    reason: z.string().max(500).optional(),
  }),
};

export const updateUserDetailsSchema = {
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    displayName: z.string().min(2).max(100).optional(),
    email: z.string().email().optional().nullable(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    homeArea: z.string().max(255).optional().nullable(),
    workArea: z.string().max(255).optional().nullable(),
    isDriverMode: z.boolean().optional(),
  }),
};

// ==============================================================================
// 3. DRIVER & DOCUMENT VERIFICATION VALIDATION
// ==============================================================================

export const getDriversQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).optional(),
  }),
};

export const verifyDriverSchema = {
  params: z.object({
    id: z.string().min(1, 'Driver Profile ID is required'),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED']),
    rejectionReason: z.string().max(500).optional(),
  }),
};

export const verifyDriverDocumentSchema = {
  params: z.object({
    id: z.string().min(1, 'Document ID is required'),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().max(500).optional(),
  }),
};

// ==============================================================================
// 4. VEHICLE & INSURANCE VERIFICATION VALIDATION
// ==============================================================================

export const getVehiclesQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    vehicleType: z.enum(['CAR', 'BIKE']).optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).optional(),
  }),
};

export const verifyVehicleSchema = {
  params: z.object({
    id: z.string().min(1, 'Vehicle ID is required'),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().max(500).optional(),
  }),
};

export const verifyVehicleInsuranceSchema = {
  params: z.object({
    id: z.string().min(1, 'Insurance ID is required'),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().max(500).optional(),
  }),
};

// ==============================================================================
// 5. RIDES, TRIPS & BOOKINGS VALIDATION
// ==============================================================================

export const getRidesQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['DRAFT', 'PUBLISHED', 'FULL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED']).optional(),
    rideType: z.enum(['DAILY_COMMUTE', 'LONG_DISTANCE', 'RECURRING_INSTANCE', 'ONE_TIME']).optional(),
    search: z.string().optional(),
    driverId: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
};

export const adminCancelRideSchema = {
  params: z.object({
    id: z.string().min(1, 'Ride ID is required'),
  }),
  body: z.object({
    cancellationReason: z.string().min(5, 'Please provide an explicit cancellation reason').max(500),
  }),
};

export const getTripsQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(['ALL', 'SOCIAL_JOURNEY', 'BIKER_TRIP', 'STRANGER_TRIP']).default('ALL'),
    status: z.string().optional(),
    search: z.string().optional(),
  }),
};

export const getBookingsQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
    rideId: z.string().optional(),
    passengerId: z.string().optional(),
    search: z.string().optional(),
  }),
};

export const adminUpdateBookingStatusSchema = {
  params: z.object({
    id: z.string().min(1, 'Booking ID is required'),
  }),
  body: z.object({
    status: z.enum(['ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
    adminNotes: z.string().max(500).optional(),
  }),
};

// ==============================================================================
// 6. SAFETY & INCIDENT REPORTS VALIDATION
// ==============================================================================

export const getReportsQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'DISMISSED']).optional(),
    reason: z.enum([
      'UNSAFE_DRIVING',
      'HARASSMENT',
      'FAKE_PROFILE',
      'WRONG_VEHICLE',
      'NO_SHOW',
      'FRAUD',
      'COMMERCIAL_FARE_DEMAND',
      'OTHER',
    ]).optional(),
  }),
};

export const resolveReportSchema = {
  params: z.object({
    id: z.string().min(1, 'Report ID is required'),
  }),
  body: z.object({
    status: z.enum(['RESOLVED', 'DISMISSED', 'UNDER_INVESTIGATION']),
    adminNotes: z.string().min(5, 'Admin resolution notes are required').max(1000),
    penalizeUser: z.boolean().default(false),
    penalizeAction: z.enum(['NONE', 'SUSPEND', 'BLOCK']).default('NONE'),
  }),
};

// ==============================================================================
// 7. COMMUNITIES VALIDATION
// ==============================================================================

export const getCommunitiesQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(['OFFICE', 'APARTMENT', 'COLLEGE', 'COMPANY', 'LOCAL_COMMUNITY']).optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().optional(),
  }),
};

export const createCommunityAdminSchema = {
  body: z.object({
    name: z.string().min(3).max(150),
    type: z.enum(['OFFICE', 'APARTMENT', 'COLLEGE', 'COMPANY', 'LOCAL_COMMUNITY']),
    description: z.string().max(1000).optional(),
    domainRestriction: z.string().max(100).optional(),
    logoUrl: z.string().url().optional(),
    isActive: z.boolean().default(true),
  }),
};

export const updateCommunityAdminSchema = {
  params: z.object({
    id: z.string().min(1, 'Community ID is required'),
  }),
  body: z.object({
    name: z.string().min(3).max(150).optional(),
    type: z.enum(['OFFICE', 'APARTMENT', 'COLLEGE', 'COMPANY', 'LOCAL_COMMUNITY']).optional(),
    description: z.string().max(1000).optional(),
    domainRestriction: z.string().max(100).optional(),
    logoUrl: z.string().url().optional(),
    isActive: z.boolean().optional(),
  }),
};

// ==============================================================================
// 8. PRICING RULES VALIDATION
// ==============================================================================

export const createPricingRuleSchema = {
  body: z.object({
    vehicleType: z.enum(['CAR', 'BIKE']),
    minimumDistanceKm: z.coerce.number().min(0.5).max(100),
    maximumDistanceKm: z.coerce.number().min(10).max(5000),
    ratePerKm: z.coerce.number().min(0.1).max(50),
    maxContributionPerKm: z.coerce.number().min(0.1).max(100),
    isActive: z.boolean().default(true),
  }),
};

export const updatePricingRuleSchema = {
  params: z.object({
    id: z.string().min(1, 'Rule ID is required'),
  }),
  body: z.object({
    minimumDistanceKm: z.coerce.number().min(0.5).max(100).optional(),
    maximumDistanceKm: z.coerce.number().min(10).max(5000).optional(),
    ratePerKm: z.coerce.number().min(0.1).max(50).optional(),
    maxContributionPerKm: z.coerce.number().min(0.1).max(100).optional(),
    isActive: z.boolean().optional(),
  }),
};

// ==============================================================================
// 9. PROMOTIONAL BANNERS VALIDATION
// ==============================================================================

export const createBannerSchema = {
  body: z.object({
    title: z.string().min(3).max(150),
    subtitle: z.string().max(255).optional(),
    description: z.string().max(500).optional(),
    imageUrl: z.string().url('A valid image URL is required'),
    targetRole: z.enum(['USER', 'RIDER', 'STRANGER', 'ALL']).default('ALL'),
    category: z.string().min(2).max(50).default('PROMOTION'),
    badge: z.string().max(50).optional(),
    ctaText: z.string().max(50).default('Learn More'),
    actionType: z.enum(['NAVIGATE', 'OPEN_URL', 'DIALOG']).default('NAVIGATE'),
    actionUrl: z.string().optional(),
    deepLink: z.string().optional(),
    gradientColors: z.array(z.string()).min(2).optional(),
    priority: z.coerce.number().int().min(1).max(100).default(1),
    isActive: z.boolean().default(true),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
};

export const updateBannerSchema = {
  params: z.object({
    id: z.string().min(1, 'Banner ID is required'),
  }),
  body: z.object({
    title: z.string().min(3).max(150).optional(),
    subtitle: z.string().max(255).optional(),
    description: z.string().max(500).optional(),
    imageUrl: z.string().url().optional(),
    targetRole: z.enum(['USER', 'RIDER', 'STRANGER', 'ALL']).optional(),
    category: z.string().min(2).max(50).optional(),
    badge: z.string().max(50).optional(),
    ctaText: z.string().max(50).optional(),
    actionType: z.enum(['NAVIGATE', 'OPEN_URL', 'DIALOG']).optional(),
    actionUrl: z.string().optional(),
    deepLink: z.string().optional(),
    gradientColors: z.array(z.string()).min(2).optional(),
    priority: z.coerce.number().int().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
};

// ==============================================================================
// 10. STAFF RBAC & AUDIT LOGS VALIDATION
// ==============================================================================

export const createStaffSchema = {
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    roleIds: z.array(z.string()).min(1, 'At least one role must be assigned'),
  }),
};

export const updateStaffSchema = {
  params: z.object({
    id: z.string().min(1, 'Staff ID is required'),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    roleIds: z.array(z.string()).min(1).optional(),
    isActive: z.boolean().optional(),
  }),
};

export const getAuditLogsQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(30),
    adminId: z.string().optional(),
    entityType: z.string().optional(),
    action: z.string().optional(),
  }),
};

