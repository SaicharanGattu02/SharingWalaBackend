import { io } from 'socket.io-client';
import { API_CONFIG, tokenStorage } from './config.js';

let socketInstance = null;

/**
 * Get or initialize real-time Socket.io client with JWT authentication
 */
export const getSocket = () => {
  if (!socketInstance) {
    const token = tokenStorage.getToken();

    socketInstance = io(API_CONFIG.SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
      auth: {
        token: token,
      },
    });

    socketInstance.on('connect', () => {
      console.log('⚡ [Socket.io] Connected successfully. Socket ID:', socketInstance.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('❌ [Socket.io] Connection error:', err.message);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 [Socket.io] Disconnected:', reason);
    });
  }

  return socketInstance;
};

/**
 * Connect to WebSocket (call after successful login)
 */
export const connectSocket = () => {
  const socket = getSocket();
  const token = tokenStorage.getToken();
  socket.auth = { token };
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

/**
 * Disconnect from WebSocket (call on logout)
 */
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
