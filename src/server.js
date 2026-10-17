import http from 'http';
import os from 'os';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB, prisma } from './config/db.js';
import { initSocket } from './config/socket.js';
import { registerChatSocketHandlers } from './modules/chat/chat.socket.js';

const getNetworkIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
};

const startServer = async () => {
  // Test Prisma database connection
  await connectDB();

  // Create HTTP server instance
  const httpServer = http.createServer(app);

  // Initialize Socket.io with JWT authentication
  const io = initSocket(httpServer);

  // Register real-time chat event handlers
  io.on('connection', (socket) => {
    registerChatSocketHandlers(io, socket);
  });

  const networkIp = getNetworkIp();

  httpServer.listen(env.port, '0.0.0.0', () => {
    console.log(`🚀 SHARE2GO API Server running in [${env.nodeEnv}] mode:`);
    console.log(`   ➜  Local:   http://localhost:${env.port}`);
    console.log(`   ➜  Network: http://${networkIp}:${env.port}`);
    console.log(`💬 Real-Time Chat (Socket.io) ready on port ${env.port}`);
    console.log(`📡 Health endpoint: http://${networkIp}:${env.port}/api/v1/health`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    httpServer.close(async () => {
      console.log('HTTP and WebSocket server closed.');
      await prisma.$disconnect();
      console.log('Database connection disconnected.');
      process.exit(0);
    });

    // Force exit after 10s if stuck
    setTimeout(() => {
      console.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
