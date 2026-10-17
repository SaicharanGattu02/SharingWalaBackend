import httpClient from '../httpClient.js';

/**
 * 👤 USER (GUEST / COMMUTER / PASSENGER) API SERVICE
 * Connects to: /api/v1/user
 */
export const userApi = {
  /**
   * 1. Get Logged-in User Profile & Preferences
   * Corresponds to: profile_setup_screen.dart & dashboard
   */
  getProfile: async () => {
    return await httpClient.get('/user/profile');
  },

  /**
   * 2. Update Profile & Commute Preferences
   * homeArea, workArea, preferredMode, rolePreference, womenOnlyPreference
   */
  updateProfile: async (data) => {
    return await httpClient.put('/user/profile', data);
  },

  /**
   * 3. Trusted Emergency Contacts
   */
  getTrustedContacts: async () => {
    return await httpClient.get('/user/trusted-contacts');
  },

  addTrustedContact: async (contact) => {
    return await httpClient.post('/user/trusted-contacts', contact);
  },

  deleteTrustedContact: async (id) => {
    return await httpClient.delete(`/user/trusted-contacts/${id}`);
  },

  /**
   * 4. Search Available Rides (Carpool, Bikepool, Other)
   * Corresponds to: search_rides_screen.dart
   * @param {Object} query - { origin, destination, date, mode: 'carpool'|'bikepool'|'other'|'all', womenOnly: 'true'|'false' }
   */
  searchRides: async (query = {}) => {
    return await httpClient.get('/user/rides/search', { params: query });
  },

  /**
   * 5. Get Ride Details by ID
   * Corresponds to: ride_details_screen.dart
   */
  getRideDetails: async (rideId) => {
    return await httpClient.get(`/user/rides/${rideId}`);
  },

  /**
   * 6. Request a Seat on a Ride
   * Corresponds to: request_seat_bottom_sheet.dart
   * @param {string} rideId
   * @param {Object} data - { seats, pickupPoint, dropoffPoint, notes }
   */
  requestSeat: async (rideId, data = {}) => {
    return await httpClient.post(`/user/rides/${rideId}/request-seat`, data);
  },

  /**
   * 7. My Rides (Categorized: Active, Upcoming, Completed)
   * Corresponds to: my_rides_screen.dart & my_ride_card.dart
   */
  getMyRides: async () => {
    return await httpClient.get('/user/my-rides');
  },

  /**
   * 8. Active Ride Live Tracking & Safety Sheet
   * Corresponds to: active_ride_details_sheet.dart
   */
  getActiveRideTracking: async (rideId) => {
    return await httpClient.get(`/user/rides/${rideId}/active`);
  },
};

export default userApi;
