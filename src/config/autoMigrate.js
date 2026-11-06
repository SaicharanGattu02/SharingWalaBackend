import { exec } from 'child_process';
import { promisify } from 'util';
import { isDbConnected } from './db.js';

const execAsync = promisify(exec);

/**
 * Automatically synchronizes MySQL database tables with prisma/schema.prisma on startup.
 * Eliminates the need to manually share SQL files or dumps with DevOps.
 */
export const autoMigrateDatabase = async () => {
  if (!isDbConnected) {
    return;
  }

  // Allow disabling auto-migration via env if explicitly required (e.g. SKIP_AUTO_MIGRATE=true)
  if (process.env.SKIP_AUTO_MIGRATE === 'true') {
    console.log('ℹ️ [Auto-Migrate] Skipped via SKIP_AUTO_MIGRATE=true');
    return;
  }

  try {
    console.log('🔄 [Auto-Migrate] Auto-syncing MySQL schema with prisma/schema.prisma...');
    await execAsync('npx prisma db push --skip-generate --accept-data-loss', {
      timeout: 45000,
      env: process.env,
    });
    console.log('✅ [Auto-Migrate] MySQL database schema is up-to-date and ready!');
  } catch (error) {
    const firstLine = error.message ? error.message.split('\n')[0] : String(error);
    console.warn(`⚠️ [Auto-Migrate] Notice: ${firstLine}`);
  }
};

