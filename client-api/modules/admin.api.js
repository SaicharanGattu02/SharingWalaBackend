import httpClient from '../httpClient.js';

/**
 * 🛡️ PLATFORM ADMINISTRATION API SERVICE
 * Connects to: /api/v1/admin
 * Powering the SHARE2GO Admin Web Panel (sharingwalaadmin)
 */
export const adminApi = {
  // ==========================================
  // 1. Staff Authentication
  // ==========================================
  login: async (credentials) => {
    return await httpClient.post('/admin/auth/login', credentials);
  },

  refreshToken: async (refreshToken) => {
    return await httpClient.post('/admin/auth/refresh', { refreshToken });
  },

  getMe: async () => {
    return await httpClient.get('/admin/auth/me');
  },

  logout: async () => {
    return await httpClient.post('/admin/auth/logout');
  },

  changePassword: async (passwords) => {
    return await httpClient.put('/admin/auth/change-password', passwords);
  },

  // ==========================================
  // 2. Dashboard KPIs & Analytics
  // ==========================================
  getDashboardStats: async () => {
    return await httpClient.get('/admin/dashboard/stats');
  },

  getDashboardCharts: async (params = {}) => {
    return await httpClient.get('/admin/dashboard/charts', { params });
  },

  getDashboardRecentActivity: async () => {
    return await httpClient.get('/admin/dashboard/recent-activity');
  },

  // ==========================================
  // 3. User Management (Commuters & Drivers)
  // ==========================================
  getUsers: async (params = {}) => {
    return await httpClient.get('/admin/users', { params });
  },

  getUserDetails: async (id) => {
    return await httpClient.get(`/admin/users/${id}`);
  },

  updateUserDetails: async (id, data) => {
    return await httpClient.put(`/admin/users/${id}`, data);
  },

  updateUserStatus: async (id, status, reason = '') => {
    return await httpClient.patch(`/admin/users/${id}/status`, { status, reason });
  },

  // ==========================================
  // 4. Driver KYC & Verification
  // ==========================================
  getDrivers: async (params = {}) => {
    return await httpClient.get('/admin/drivers', { params });
  },

  getDriverDetails: async (id) => {
    return await httpClient.get(`/admin/drivers/${id}`);
  },

  verifyDriver: async (id, status, notes = '') => {
    return await httpClient.patch(`/admin/drivers/${id}/verify`, { status, notes });
  },

  verifyDriverDocument: async (id, data) => {
    return await httpClient.patch(`/admin/drivers/${id}/documents`, data);
  },

  // ==========================================
  // 5. Vehicle Inspection & Verification
  // ==========================================
  getVehicles: async (params = {}) => {
    return await httpClient.get('/admin/vehicles', { params });
  },

  getVehicleDetails: async (id) => {
    return await httpClient.get(`/admin/vehicles/${id}`);
  },

  verifyVehicle: async (id, status, notes = '') => {
    return await httpClient.patch(`/admin/vehicles/${id}/verify`, { status, notes });
  },

  // ==========================================
  // 6. Platform Rides Oversight
  // ==========================================
  getRides: async (params = {}) => {
    return await httpClient.get('/admin/rides', { params });
  },

  getRideDetails: async (id) => {
    return await httpClient.get(`/admin/rides/${id}`);
  },

  cancelRide: async (id, reason) => {
    return await httpClient.post(`/admin/rides/${id}/cancel`, { reason });
  },

  // ==========================================
  // 7. Stranger Mode Trips Oversight
  // ==========================================
  getTrips: async (params = {}) => {
    return await httpClient.get('/admin/trips', { params });
  },

  getTripDetails: async (id) => {
    return await httpClient.get(`/admin/trips/${id}`);
  },

  cancelTrip: async (id, reason) => {
    return await httpClient.post(`/admin/trips/${id}/cancel`, { reason });
  },

  // ==========================================
  // 8. Bookings Oversight
  // ==========================================
  getBookings: async (params = {}) => {
    return await httpClient.get('/admin/bookings', { params });
  },

  updateBookingStatus: async (id, status, reason = '') => {
    return await httpClient.patch(`/admin/bookings/${id}/status`, { status, reason });
  },

  // ==========================================
  // 9. Emergency SOS Incidents
  // ==========================================
  getSosIncidents: async (params = {}) => {
    return await httpClient.get('/admin/sos/incidents', { params });
  },

  updateSosStatus: async (id, status, resolutionNotes = '') => {
    return await httpClient.patch(`/admin/sos/incidents/${id}`, { status, resolutionNotes });
  },

  // ==========================================
  // 10. Safety Reports & Flags
  // ==========================================
  getReports: async (params = {}) => {
    return await httpClient.get('/admin/reports', { params });
  },

  resolveReport: async (id, resolution, actionTaken = '') => {
    return await httpClient.patch(`/admin/reports/${id}/resolve`, { resolution, actionTaken });
  },

  // ==========================================
  // 11. Commute Communities
  // ==========================================
  getCommunities: async (params = {}) => {
    return await httpClient.get('/admin/communities', { params });
  },

  createCommunity: async (data) => {
    return await httpClient.post('/admin/communities', data);
  },

  updateCommunity: async (id, data) => {
    return await httpClient.put(`/admin/communities/${id}`, data);
  },

  deleteCommunity: async (id) => {
    return await httpClient.delete(`/admin/communities/${id}`);
  },

  // ==========================================
  // 12. Dynamic Pricing & Commission Rules
  // ==========================================
  getPricingRules: async () => {
    return await httpClient.get('/admin/pricing-rules');
  },

  createPricingRule: async (data) => {
    return await httpClient.post('/admin/pricing-rules', data);
  },

  updatePricingRule: async (id, data) => {
    return await httpClient.put(`/admin/pricing-rules/${id}`, data);
  },

  // ==========================================
  // 13. Promotional Banners & App Config
  // ==========================================
  getBanners: async () => {
    return await httpClient.get('/admin/banners');
  },

  createBanner: async (data) => {
    return await httpClient.post('/admin/banners', data);
  },

  updateBanner: async (id, data) => {
    return await httpClient.put(`/admin/banners/${id}`, data);
  },

  deleteBanner: async (id) => {
    return await httpClient.delete(`/admin/banners/${id}`);
  },

  // ==========================================
  // 14. Staff Management & Roles
  // ==========================================
  getStaff: async (params = {}) => {
    return await httpClient.get('/admin/staff', { params });
  },

  createStaff: async (data) => {
    return await httpClient.post('/admin/staff', data);
  },

  updateStaff: async (id, data) => {
    return await httpClient.put(`/admin/staff/${id}`, data);
  },

  deleteStaff: async (id) => {
    return await httpClient.delete(`/admin/staff/${id}`);
  },

  // ==========================================
  // 15. System Audit Logs
  // ==========================================
  getAuditLogs: async (params = {}) => {
    return await httpClient.get('/admin/audit-logs', { params });
  },
};

export default adminApi;

