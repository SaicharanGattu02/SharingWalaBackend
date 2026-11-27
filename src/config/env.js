import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const INSECURE_SECRET_PLACEHOLDERS = new Set([
  'fallback_secret_key_change_in_production',
  'share2go_jwt_secret_key_change_me_in_production',
  'fallback_refresh_secret_key',
]);

const resolveJwtSecret = (raw, label) => {
  const val = (raw || '').trim();
  if (isProduction) {
    if (!val || INSECURE_SECRET_PLACEHOLDERS.has(val) || val.length < 16) {
      throw new Error(
        `[SECURITY] ${label} must be set to a strong secret (>= 16 chars) in production!`
      );
    }
    return val;
  }
  return val || crypto.randomBytes(32).toString('hex');
};

const jwtSecret = resolveJwtSecret(process.env.JWT_SECRET, 'JWT_SECRET');
const jwtAccessSecret = process.env.JWT_ACCESS_SECRET?.trim() || jwtSecret;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET?.trim() || `${jwtSecret}_refresh`;

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  isProduction,
  databaseUrl: process.env.DATABASE_URL || '',
  jwt: {
    secret: jwtSecret,
    accessSecret: jwtAccessSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: jwtRefreshSecret,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  msg91: {
    authKey: (process.env.MSG91_AUTH_KEY || '').trim(),
    authToken: (process.env.MSG91_AUTH_TOKEN || '').trim(),
    widgetId: (process.env.MSG91_WIDGET_ID || process.env.MSG91_TEMPLATE_ID || '').trim(),
    otpLength: parseInt(process.env.MSG91_OTP_LENGTH || '6', 10),
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
