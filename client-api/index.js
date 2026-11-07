/**
 * 🌟 SHARE2GO Unified API Service Layer
 * Clean Architecture Persona-Driven Client (Admin, App: User & Rider, Common)
 */

import httpClient from './httpClient.js';
import { API_CONFIG, tokenStorage } from './config.js';
import { getSocket, connectSocket, disconnectSocket } from './socketClient.js';

// 🛡️ 1. Platform Administration Module (Admin Web Dashboard)
import adminApi from './modules/admin.api.js';

// 📱 2. Mobile App Persona Modules (User & Rider Sides)
import userApi from './modules/user.api.js';
import riderApi from './modules/rider.api.js';
import strangerApi from './modules/stranger.api.js';

// 🛠️ 3. Centralized Reusable Common Modules
import authApi from './modules/auth.api.js';
import chatApi from './modules/chat.api.js';
import communitiesApi from './modules/communities.api.js';

// Named exports
export {
  httpClient,
  API_CONFIG,
  tokenStorage,
  getSocket,
  connectSocket,
  disconnectSocket,
  adminApi,
  userApi,
  riderApi,
  strangerApi,
  authApi,
  chatApi,
  communitiesApi,
};

// Default unified API client with persona grouping + backward compatibility
const api = {
  // 🛡️ 1. Platform Administration
  admin: adminApi,

  // 📱 2. Mobile App Platform
  app: {
    user: userApi,         // 👤 Passenger / Commuter
    rider: riderApi,       // 🚗 Driver / Vehicle Owner / Host
    stranger: strangerApi, // 🌟 Stranger Mode
  },

  // 🛠️ 3. Centralized Reusable Common Services
  common: {
    auth: authApi,
    chat: chatApi,
    communities: communitiesApi,
  },

  // 🎯 Direct Top-Level Access (100% Backward Compatible)
  user: userApi,
  rider: riderApi,
  stranger: strangerApi,
  auth: authApi,
  chat: chatApi,
  communities: communitiesApi,

  // Utilities
  http: httpClient,
  config: API_CONFIG,
  storage: tokenStorage,
};

export default api;
