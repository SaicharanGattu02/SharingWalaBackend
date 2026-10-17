import httpClient from '../httpClient.js';
import { getSocket } from '../socketClient.js';

/**
 * Real-Time Chat API & WebSocket Service
 */
export const chatApi = {
  // --- REST Endpoints ---

  /**
   * Get all active conversations for the user
   */
  getConversations: async () => {
    return await httpClient.get('/chat/conversations');
  },

  /**
   * Open or create a 1-on-1 direct conversation
   * @param {string} recipientId
   */
  getOrCreateDirectChat: async (recipientId) => {
    return await httpClient.post('/chat/direct', { recipientId });
  },

  /**
   * Get paginated messages for a conversation
   * @param {string} conversationId
   * @param {Object} query - { page, limit }
   */
  getMessages: async (conversationId, query = {}) => {
    return await httpClient.get(`/chat/conversations/${conversationId}/messages`, { params: query });
  },

  /**
   * Send a message via REST API
   * @param {string} conversationId
   * @param {string} text
   * @param {string} type - 'TEXT' | 'IMAGE' | 'LOCATION'
   */
  sendMessage: async (conversationId, text, type = 'TEXT') => {
    return await httpClient.post(`/chat/conversations/${conversationId}/messages`, {
      text,
      type,
    });
  },

  /**
   * Mark messages in a conversation as read
   * @param {string} conversationId
   */
  markAsRead: async (conversationId) => {
    return await httpClient.post(`/chat/conversations/${conversationId}/read`);
  },

  // --- Real-Time WebSocket Helpers (Socket.io) ---

  /**
   * Join a real-time chat room (conversation)
   * @param {string} conversationId
   */
  joinRoom: (conversationId) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('join_conversation', { conversationId });
    }
  },

  /**
   * Leave a real-time chat room
   * @param {string} conversationId
   */
  leaveRoom: (conversationId) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('leave_conversation', { conversationId });
    }
  },

  /**
   * Listen for incoming real-time messages
   * @param {Function} callback - (message) => void
   */
  onNewMessage: (callback) => {
    const socket = getSocket();
    if (socket) {
      socket.on('new_message', callback);
    }
  },

  /**
   * Remove listener for new messages
   * @param {Function} callback
   */
  offNewMessage: (callback) => {
    const socket = getSocket();
    if (socket) {
      socket.off('new_message', callback);
    }
  },
};

export default chatApi;
