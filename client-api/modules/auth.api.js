import httpClient from '../httpClient.js';
import { tokenStorage } from '../config.js';
import { connectSocket, disconnectSocket } from '../socketClient.js';

/**
 * Authentication API Service
 */
export const authApi = {
  /**
   * Send OTP to phone number
   * @param {Object} data - { phone }
   */
  sendOtp: async (data) => {
    return await httpClient.post('/auth/send-otp', data);
  },

  /**
   * Request OTP or login with phone number
   * @param {Object} data - { phone, otp? }
   */
  phoneLogin: async (data) => {
    return await httpClient.post('/auth/phone-login', data);
  },

  /**
   * Verify OTP and receive accessToken, refreshToken, expiryTime, role, and profile info
   * @param {Object} data - { phone, otp }
   */
  verifyOtp: async ({ phone, otp }) => {
    const result = await httpClient.post('/auth/verify-otp', { phone, otp });
    const token = result.accessToken || result.token;
    if (token) {
      tokenStorage.setToken(token);
      connectSocket();
    }
    return result;
  },

  /**
   * Refresh expired access token using refreshToken
   * @param {string} refreshToken
   */
  refreshToken: async (refreshToken) => {
    const result = await httpClient.post('/auth/refresh-token', { refreshToken });
    const token = result.accessToken || result.token;
    if (token) {
      tokenStorage.setToken(token);
    }
    return result;
  },

  /**
   * Register a new user
   * @param {Object} data - { username, displayName, phone, password, gender, email }
   */
  register: async (data) => {
    const result = await httpClient.post('/auth/register', data);
    const token = result.accessToken || result.token;
    if (token) {
      tokenStorage.setToken(token);
      connectSocket();
    }
    return result;
  },

  /**
   * Login with phone, username, or email
   * @param {Object} credentials - { identifier, password }
   */
  login: async (credentials) => {
    const result = await httpClient.post('/auth/login', credentials);
    const token = result.accessToken || result.token;
    if (token) {
      tokenStorage.setToken(token);
      connectSocket();
    }
    return result;
  },

  /**
   * Fetch current authenticated user profile
   */
  getMe: async () => {
    return await httpClient.get('/auth/me');
  },

  /**
   * Client-side logout: clear token & disconnect socket
   */
  logout: () => {
    tokenStorage.removeToken();
    disconnectSocket();
  },

  /**
   * Check if user is currently logged in (has local token)
   */
  isAuthenticated: () => {
    return !!tokenStorage.getToken();
  },
};

export default authApi;
