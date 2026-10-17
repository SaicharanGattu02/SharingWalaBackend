import { Router } from 'express';
import { prisma } from '../../config/db.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    let dbStatus = 'disconnected';
    let dbLatency = null;

    try {
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = `${Date.now() - startTime}ms`;
      dbStatus = 'connected';
    } catch (err) {
      dbStatus = `error: ${err.message}`;
    }

    const healthInfo = {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        latency: dbLatency,
      },
      memory: {
        rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    };

    const statusCode = dbStatus === 'connected' ? 200 : 503;
    res.status(statusCode).json(new ApiResponse(statusCode, healthInfo, 'System health report'));
  })
);

export default router;
