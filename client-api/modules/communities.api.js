import httpClient from '../httpClient.js';

/**
 * Commute Circles & Corporate Communities API Service
 */
export const communitiesApi = {
  /**
   * List all available public/corporate communities
   */
  listCommunities: async () => {
    return await httpClient.get('/communities');
  },

  /**
   * Get communities joined by the logged-in user
   */
  getMyCommunities: async () => {
    return await httpClient.get('/communities/my-communities');
  },

  /**
   * Create a new community (e.g. Campus, Company circle)
   * @param {Object} data - { name, description, domain, isPrivate }
   */
  createCommunity: async (data) => {
    return await httpClient.post('/communities', data);
  },

  /**
   * Join a community
   * @param {string} communityId
   */
  joinCommunity: async (communityId) => {
    return await httpClient.post('/communities/join', { communityId });
  },
};

export default communitiesApi;
