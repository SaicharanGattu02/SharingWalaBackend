import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './env.js';
import { prisma } from './db.js';

let ioInstance = null;

const isOriginAllowed = (origin) => {
  if (!origin || !env.isProduction || env.corsOrigin === '*') return true;
  const allowed = env.corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
  return allowed.includes(origin);
};

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST'],
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

      // Handle Admin Dashboard socket connections
      if (decoded.isAdmin || decoded.adminId) {
        const adminId = decoded.adminId || decoded.userId;
        const admin = await prisma.adminUser.findUnique({
          where: { id: adminId },
          select: { id: true, name: true, email: true, isActive: true },
        }).catch(() => null);

        if (env.isProduction && (!admin || !admin.isActive)) {
          return next(new Error('Admin account inactive or not found'));
        }

        socket.isAdmin = true;
        socket.admin = admin || { id: adminId, name: 'Admin', email: decoded.email, isActive: true };
        socket.user = {
          id: adminId,
          username: 'admin',
          displayName: socket.admin.name,
          avatarUrl: null,
          status: 'ACTIVE',
        };
        socket.join('admin');
        return next();
      }

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
        if (env.isProduction) {
          return next(new Error('Authentication service unavailable'));
        }
      }

      if (!user) {
        if (env.isProduction) {
          return next(new Error('Invalid token: User no longer exists'));
        }
        // Fallback for mock/dev users in non-production only
        user = {
          id: decoded.userId,
          username: decoded.username || `user_${String(decoded.userId).slice(-6)}`,
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
