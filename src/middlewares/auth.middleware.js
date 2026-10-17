import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/db.js';
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

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      uuid: true,
      username: true,
      displayName: true,
      phone: true,
      email: true,
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

  if (!user) {
    throw new ApiError(401, 'Invalid token: User no longer exists');
  }

  if (user.status !== 'ACTIVE') {
    throw new ApiError(403, `Account access restricted: Status is ${user.status}`);
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
