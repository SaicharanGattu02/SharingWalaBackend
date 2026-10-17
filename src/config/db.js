import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

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
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out (2s)')), 2000)
    );
    await Promise.race([prisma.$connect(), timeoutPromise]);
    isDbConnected = true;
    console.log('✅ Connected to MySQL Database successfully via Prisma');
  } catch (error) {
    isDbConnected = false;
    console.warn('⚠️ MySQL not reachable on localhost:3306. Operating in instant in-memory dev mode.');
  }
};

/**
 * Execute DB operation with a strict timeout (default 1.5s) to prevent API requests from hanging.
 */
export const withDbTimeout = async (dbOperation, fallbackValue = null, timeoutMs = 1500) => {
  // If database was offline, quickly probe if it has come online (500ms max)
  if (!isDbConnected && env.nodeEnv === 'development') {
    try {
      const probeTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Probe timeout')), 500)
      );
      await Promise.race([prisma.$queryRawUnsafe('SELECT 1'), probeTimeout]);
      isDbConnected = true;
      console.log('✅ MySQL reconnected successfully! Now saving all data to database.');
    } catch {
      return typeof fallbackValue === 'function' ? fallbackValue() : fallbackValue;
    }
  }

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Database operation timed out after ${timeoutMs}ms`)), timeoutMs)
  );

  try {
    const result = await Promise.race([dbOperation(), timeoutPromise]);
    isDbConnected = true;
    return result;
  } catch (err) {
    isDbConnected = false;
    console.warn('⚠️ [DB TIMEOUT/ERROR] Falling back to instant dev response:', err.message);
    if (fallbackValue !== null) {
      return typeof fallbackValue === 'function' ? fallbackValue() : fallbackValue;
    }
    throw err;
  }
};
