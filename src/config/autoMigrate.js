import { exec } from 'child_process';
import { promisify } from 'util';
import { isDbConnected, prisma } from './db.js';
import { env } from './env.js';

const execAsync = promisify(exec);

/**
 * Automatically synchronizes MySQL database tables with prisma/schema.prisma on startup
 * in non-production environments (or when RUN_AUTO_MIGRATE=true is explicitly set).
 */
export const autoMigrateDatabase = async () => {
  if (!isDbConnected) {
    return;
  }

  if (env.isProduction && process.env.RUN_AUTO_MIGRATE !== 'true') {
    console.log('ℹ️ [Auto-Migrate] Skipped in production (set RUN_AUTO_MIGRATE=true to enable)');
    return;
  }

  // Allow disabling auto-migration via env if explicitly required (e.g. SKIP_AUTO_MIGRATE=true)
  if (process.env.SKIP_AUTO_MIGRATE === 'true') {
    console.log('ℹ️ [Auto-Migrate] Skipped via SKIP_AUTO_MIGRATE=true');
    return;
  }

  // Ensure file_url column can hold LONGTEXT if table already exists
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE `driver_documents` MODIFY `file_url` LONGTEXT');
  } catch (_) {}

  try {
    console.log('🔄 [Auto-Migrate] Auto-syncing MySQL schema with prisma/schema.prisma...');
    await execAsync('npx prisma db push --skip-generate', {
      timeout: 45000,
      env: process.env,
    });
    console.log('✅ [Auto-Migrate] MySQL database schema is up-to-date and ready!');
  } catch (error) {
    const firstLine = error.message ? error.message.split('\n')[0] : String(error);
    console.warn(`⚠️ [Auto-Migrate] Notice: ${firstLine}`);
  }
};
