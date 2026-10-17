/**
 * SHARE2GO Frontend API Service Layer
 * Clean Architecture Persona-Driven Client (User, Rider, Stranger)
 */

import httpClient from './httpClient.js';
import { API_CONFIG, tokenStorage } from './config.js';
import { getSocket, connectSocket, disconnectSocket } from './socketClient.js';

// Persona Modules (Flutter Screen Driven)
import userApi from './modules/user.api.js';
import riderApi from './modules/rider.api.js';
import strangerApi from './modules/stranger.api.js';

// Common Modules
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
  userApi,
  riderApi,
  strangerApi,
  authApi,
  chatApi,
  communitiesApi,
};

// Default unified API client
const api = {
  user: userApi,         // 👤 Guest / Commuter / Passenger APIs
  rider: riderApi,       // 🚗 Host / Driver / Vehicle Owner APIs
  stranger: strangerApi, // 🌟 Stranger Mode: Trips, Meetups, Plans, Reels
  auth: authApi,         // 🔐 Authentication & Session
  chat: chatApi,         // 💬 Messaging & Real-Time Socket
  communities: communitiesApi, // 🏢 Communities & Circles
  http: httpClient,
  config: API_CONFIG,
  storage: tokenStorage,
};

export default api;
