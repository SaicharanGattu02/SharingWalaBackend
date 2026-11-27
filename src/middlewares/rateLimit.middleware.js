import { ApiError } from '../utils/apiError.js';

/**
 * Lightweight zero-dependency sliding-window rate limiter middleware.
 * Protects auth, OTP, and upload endpoints against brute-force & SMS bombing.
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 30,
  message = 'Too many requests, please try again later.',
  keyGenerator = null,
} = {}) => {
  const hits = new Map();

  // Periodically prune expired buckets to prevent memory growth
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits.entries()) {
      if (now >= entry.resetAt) {
        hits.delete(key);
      }
    }
  }, Math.min(windowMs, 5 * 60 * 1000)).unref();

  return (req, res, next) => {
    const now = Date.now();
    const key = keyGenerator ? keyGenerator(req) : (req.ip || req.socket?.remoteAddress || 'unknown');
    let entry = hits.get(key);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 1, resetAt: now + windowMs };
      hits.set(key, entry);
    } else {
      entry.count += 1;
    }

    const remaining = Math.max(0, max - entry.count);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return next(new ApiError(429, message, [], '', 'RATE_LIMIT_EXCEEDED'));
    }

    next();
  };
};
