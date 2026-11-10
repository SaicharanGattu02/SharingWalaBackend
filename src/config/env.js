import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET ? `${process.env.JWT_SECRET}_refresh` : 'fallback_refresh_secret_key'),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY || '588874AkxiMDsCLyw6af34b3eP1',
    widgetId: process.env.MSG91_WIDGET_ID || process.env.MSG91_TEMPLATE_ID || '366b6a704451313533343732',
    otpLength: parseInt(process.env.MSG91_OTP_LENGTH || '6', 10),
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
