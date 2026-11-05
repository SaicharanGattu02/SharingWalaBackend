import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './env.js';
import { prisma } from './db.js';

let ioInstance = null;

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: env.corsOrigin,
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // JWT Connection Handshake Authentication Middleware
  ioInstance.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const token =
        socket.handshake.auth?.token ||
        (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

      if (!token) {
        return next(new Error('Authentication required: No token provided'));
      }

      const decoded = jwt.verify(token, env.jwt.secret);

      let user = null;
      try {
        user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            status: true,
          },
        });
      } catch (dbErr) {
        console.warn('⚠️ [Socket.io] DB lookup warning during handshake:', dbErr.message);
      }

      if (!user) {
        // Fallback for mock/dev users or in-memory mode
        user = {
          id: decoded.userId,
          username: decoded.username || `user_${decoded.userId.toString().slice(-6)}`,
          displayName: decoded.displayName || decoded.username || 'SharingWala User',
          avatarUrl: decoded.avatarUrl || null,
          status: 'ACTIVE',
        };
      }

      if (user.status && user.status !== 'ACTIVE') {
        return next(new Error(`Account access restricted: Status is ${user.status}`));
      }

      // Attach verified user to socket instance
      socket.user = user;
      next();
    } catch (err) {
      next(new Error(`Socket authentication failed: ${err.message}`));
    }
  });

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized yet');
  }
  return ioInstance;
};
