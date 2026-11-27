import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { ApiError } from '../utils/apiError.js';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: env.nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
  });
};

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (env.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}

export let isDbConnected = false;

export const connectDB = async () => {
  let timerId;
  try {
    const timeoutPromise = new Promise((_, reject) => {
      timerId = setTimeout(() => reject(new Error('Connection timed out (8s)')), 8000);
    });
    await Promise.race([prisma.$connect(), timeoutPromise]);
    isDbConnected = true;
    console.log('✅ Connected to MySQL Database successfully via Prisma');
  } catch (error) {
    isDbConnected = false;
    console.warn(`⚠️ MySQL connection error: ${error.message}`);
    if (!env.isProduction) {
      console.warn('⚠️ MySQL not reachable. Operating in instant in-memory dev mode.');
    }
  } finally {
    if (timerId) clearTimeout(timerId);
  }
};

const isPrismaQueryError = (err) => {
  return Boolean(err?.code && typeof err.code === 'string' && err.code.startsWith('P'));
};

/**
 * Execute DB operation with a strict timeout (default 1.5s in dev, 8s in prod)
 * to prevent API requests from hanging.
 */
export const withDbTimeout = async (
  dbOperation,
  fallbackValue = null,
  timeoutMs = env.isProduction ? 8000 : 1500
) => {
  // In development, if database was offline, quickly probe if it has come online (500ms max)
  if (!isDbConnected && !env.isProduction) {
    let probeTimer;
    try {
      const probeTimeout = new Promise((_, reject) => {
        probeTimer = setTimeout(() => reject(new Error('Probe timeout')), 500);
      });
      await Promise.race([prisma.$queryRawUnsafe('SELECT 1'), probeTimeout]);
      isDbConnected = true;
      console.log('✅ MySQL reconnected successfully! Now saving all data to database.');
    } catch {
      if (fallbackValue !== null) {
        return typeof fallbackValue === 'function' ? fallbackValue() : fallbackValue;
      }
    } finally {
      if (probeTimer) clearTimeout(probeTimer);
    }
  }

  let timeoutTimer;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutTimer = setTimeout(
      () => reject(new Error(`Database operation timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  try {
    const result = await Promise.race([dbOperation(), timeoutPromise]);
    isDbConnected = true;
    return result;
  } catch (err) {
    if (err instanceof ApiError || isPrismaQueryError(err)) {
      throw err;
    }
    isDbConnected = false;
    console.warn('⚠️ [DB TIMEOUT/ERROR]:', err.message);
    // Never silently serve mock/fallback data in production
    if (!env.isProduction && fallbackValue !== null) {
      return typeof fallbackValue === 'function' ? fallbackValue() : fallbackValue;
    }
    throw err;
  } finally {
    if (timeoutTimer) clearTimeout(timeoutTimer);
  }
};
