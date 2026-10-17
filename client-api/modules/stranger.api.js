import httpClient from '../httpClient.js';

/**
 * 🌟 STRANGER MODE API SERVICE (Trips, Meetups, Plans, Reels)
 * Connects to: /api/v1/stranger
 */
export const strangerApi = {
  // --- 1. STRANGER TRIPS ---
  /**
   * Search / List Stranger Trips
   * @param {Object} query - { vibe, isWomenOnly, search }
   */
  getTrips: async (query = {}) => {
    return await httpClient.get('/stranger/trips', { params: query });
  },

  getTripById: async (tripId) => {
    return await httpClient.get(`/stranger/trips/${tripId}`);
  },

  createTrip: async (tripData) => {
    return await httpClient.post('/stranger/trips', tripData);
  },

  joinTrip: async (tripId) => {
    return await httpClient.post(`/stranger/trips/${tripId}/join`);
  },

  // --- 2. STRANGER MEETUPS ---
  /**
   * List Meetups by category
   * @param {Object} query - { category }
   */
  getMeetups: async (query = {}) => {
    return await httpClient.get('/stranger/meetups', { params: query });
  },

  getMeetupById: async (meetupId) => {
    return await httpClient.get(`/stranger/meetups/${meetupId}`);
  },

  createMeetup: async (meetupData) => {
    return await httpClient.post('/stranger/meetups', meetupData);
  },

  rsvpMeetup: async (meetupId) => {
    return await httpClient.post(`/stranger/meetups/${meetupId}/rsvp`);
  },

  // --- 3. STRANGER PLANS ---
  /**
   * List Plans (Trending / Upcoming)
   * @param {Object} query - { filter: 'trending' | 'upcoming' | 'all' }
   */
  getPlans: async (query = {}) => {
    return await httpClient.get('/stranger/plans', { params: query });
  },

  getPlanById: async (planId) => {
    return await httpClient.get(`/stranger/plans/${planId}`);
  },

  createPlan: async (planData) => {
    return await httpClient.post('/stranger/plans', planData);
  },

  joinPlan: async (planId) => {
    return await httpClient.post(`/stranger/plans/${planId}/join`);
  },

  // --- 4. STRANGER REELS ---
  getReels: async () => {
    return await httpClient.get('/stranger/reels');
  },

  createReel: async (reelData) => {
    return await httpClient.post('/stranger/reels', reelData);
  },

  likeReel: async (reelId) => {
    return await httpClient.post(`/stranger/reels/${reelId}/like`);
  },
};

export default strangerApi;
