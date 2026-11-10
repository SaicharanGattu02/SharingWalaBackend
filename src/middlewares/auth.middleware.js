import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma, withDbTimeout } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Authentication required: No token provided');
  }

  const decoded = jwt.verify(token, env.jwt.secret);

  const user = await withDbTimeout(
    async () => {
      return await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          uuid: true,
          username: true,
          displayName: true,
          phone: true,
          email: true,
          gender: true,
          status: true,
          driverProfile: {
            select: {
              id: true,
              verificationStatus: true,
              averageRating: true,
            },
          },
        },
      });
    },
    () => {
      return {
        id: decoded.userId,
        uuid: decoded.userId,
        username: 'user_' + String(decoded.userId).slice(-6),
        displayName: 'Commuter',
        phone: '+919999999999',
        email: 'user@share2go.app',
        gender: 'MALE',
        status: 'ACTIVE',
        driverProfile: null,
      };
    }
  );

  if (!user) {
    throw new ApiError(401, 'Invalid token: User no longer exists');
  }

  if (user.status !== 'ACTIVE') {
    throw new ApiError(
      403,
      `Account access restricted: Status is ${user.status}`,
      [],
      '',
      'ACCOUNT_INACTIVE'
    );
  }

  // Single Device Login Restriction Check
  const reqDeviceId = req.headers['x-device-id'] || req.headers['device-id'];
  if (reqDeviceId && typeof reqDeviceId === 'string' && reqDeviceId.trim().length > 0) {
    const cleanDeviceId = reqDeviceId.trim();
    const activeDevice = await withDbTimeout(
      async () => {
        // Query active hardware device session (exclude FCM push tokens!)
        return await prisma.userDevice.findFirst({
          where: {
            userId: user.id,
            appVersion: 'DEVICE_SESSION',
          },
          orderBy: { lastActiveAt: 'desc' },
        });
      },
      null
    );

    // Only reject if an actual hardware device session exists and is different from current device
    if (
      activeDevice &&
      activeDevice.deviceToken &&
      activeDevice.deviceToken !== cleanDeviceId &&
      activeDevice.deviceToken.length < 80 &&
      !activeDevice.deviceToken.includes(':')
    ) {
      throw new ApiError(
        401,
        'Session expired: You have logged in on another device',
        [],
        '',
        'DEVICE_MISMATCH'
      );
    }
  }

  const isDriverApproved = user.driverProfile?.verificationStatus === 'APPROVED';
  user.role = isDriverApproved ? 'RIDER' : 'USER';
  user.roles = user.driverProfile ? ['USER', 'RIDER'] : ['USER'];

  req.user = user;
  next();
});

export const requireVerifiedDriver = (req, res, next) => {
  if (!req.user?.driverProfile || req.user.driverProfile.verificationStatus !== 'APPROVED') {
    throw new ApiError(403, 'Access denied: An approved driver profile is required to perform this action');
  }
  next();
};

export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        displayName: true,
        phone: true,
        gender: true,
        status: true,
        driverProfile: {
          select: { id: true, verificationStatus: true },
        },
      },
    });
    if (user && user.status === 'ACTIVE') {
      const isDriverApproved = user.driverProfile?.verificationStatus === 'APPROVED';
      user.role = isDriverApproved ? 'RIDER' : 'USER';
      user.roles = user.driverProfile ? ['USER', 'RIDER'] : ['USER'];
      req.user = user;
    }
  } catch {}
  next();
});

