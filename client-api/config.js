/**
 * Centralized API Configuration for Frontend Applications
 * Works across Web (React, Vue, Next.js) and Mobile (React Native, Expo)
 */

export const API_CONFIG = {
  // Network IP: Accessible across physical devices, emulators, and browsers
  BASE_URL: process.env.REACT_APP_API_URL 
    || process.env.EXPO_PUBLIC_API_URL 
    || process.env.VITE_API_URL 
    || 'http://172.20.10.2:5000/api/v1',

  SOCKET_URL: process.env.REACT_APP_SOCKET_URL 
    || process.env.EXPO_PUBLIC_SOCKET_URL 
    || process.env.VITE_SOCKET_URL 
    || 'http://172.20.10.2:5000',

  TIMEOUT: 15000, // 15 seconds request timeout
  STORAGE_TOKEN_KEY: 'share2go_auth_token',
  STORAGE_USER_KEY: 'share2go_user_profile',
};

/**
 * Universal Token Storage Helper
 * Supports browser localStorage and fallback memory for React Native / SSR
 */
let memoryStorage = {};

export const tokenStorage = {
  getToken: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(API_CONFIG.STORAGE_TOKEN_KEY);
      }
      return memoryStorage[API_CONFIG.STORAGE_TOKEN_KEY] || null;
    } catch {
      return memoryStorage[API_CONFIG.STORAGE_TOKEN_KEY] || null;
    }
  },

  setToken: (token) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(API_CONFIG.STORAGE_TOKEN_KEY, token);
      }
      memoryStorage[API_CONFIG.STORAGE_TOKEN_KEY] = token;
    } catch {
      memoryStorage[API_CONFIG.STORAGE_TOKEN_KEY] = token;
    }
  },

  removeToken: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(API_CONFIG.STORAGE_TOKEN_KEY);
      }
      delete memoryStorage[API_CONFIG.STORAGE_TOKEN_KEY];
    } catch {
      delete memoryStorage[API_CONFIG.STORAGE_TOKEN_KEY];
    }
  },
};
