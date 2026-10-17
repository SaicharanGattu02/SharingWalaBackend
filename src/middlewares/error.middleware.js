import { ApiError } from '../utils/apiError.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Zod Validation Errors
  if (err.name === 'ZodError') {
    const errorMessages = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    error = new ApiError(400, 'Validation failed', errorMessages);
  }

  // Handle Prisma Known Request Errors
  if (err.code && err.code.startsWith('P')) {
    switch (err.code) {
      case 'P2002': {
        const fields = err.meta?.target ? ` (${Array.isArray(err.meta.target) ? err.meta.target.join(', ') : err.meta.target})` : '';
        error = new ApiError(409, `Unique constraint violation: Duplicate value for field${fields}`);
        break;
      }
      case 'P2025':
        error = new ApiError(404, err.meta?.cause || 'Record not found');
        break;
      case 'P2003':
        error = new ApiError(400, 'Foreign key constraint failed');
        break;
      default:
        error = new ApiError(500, `Database error: ${err.message}`);
        break;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token');
  } else if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authentication token has expired');
  }

  // Fallback to standard ApiError if not already one
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.errors?.length > 0 && { errors: error.errors }),
    ...(env.nodeEnv === 'development' && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};
