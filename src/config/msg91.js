import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApiError } from '../utils/apiError.js';
import { env } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OTP_SESSIONS_FILE = path.join(__dirname, 'otp_sessions.json');

// Recognized test phone number for App Store / Google Play review & developer sandbox (only all 9s)
const TEST_PHONE_NUMBERS = new Set([
  '919999999999',
  '9999999999',
]);

const TEST_BYPASS_CODES = new Set(['123456', '1234', '0000', '111111']);

// Active OTP session storage mapping formattedMobile -> { reqId, timestamp }
// Backed by persistent file storage so sessions survive server reloads & multi-workers
const loadOtpSessions = () => {
  try {
    if (fs.existsSync(OTP_SESSIONS_FILE)) {
      const content = fs.readFileSync(OTP_SESSIONS_FILE, 'utf-8');
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        const map = new Map();
        const now = Date.now();
        for (const [k, v] of Object.entries(parsed)) {
          if (v && v.reqId && (now - (v.timestamp || 0) < 15 * 60 * 1000)) {
            map.set(k, v);
          }
        }
        return map;
      }
    }
  } catch (err) {
    console.warn('[MSG91] Failed to read otp_sessions.json:', err.message);
  }
  return new Map();
};

const persistOtpSessions = (map) => {
  try {
    const obj = {};
    for (const [k, v] of map.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(OTP_SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[MSG91] Failed to write otp_sessions.json:', err.message);
  }
};

const otpSessions = loadOtpSessions();

// Clear sessions older than 15 minutes
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [phone, session] of otpSessions.entries()) {
    if (now - session.timestamp > 15 * 60 * 1000) {
      otpSessions.delete(phone);
      changed = true;
    }
  }
  if (changed) {
    persistOtpSessions(otpSessions);
  }
}, 5 * 60 * 1000).unref();

export const formatPhoneForMsg91 = (phone) => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
};

export const normalizePhone = (phone) => {
  if (!phone) return '';
  const digits = formatPhoneForMsg91(phone);
  return `+${digits}`;
};

export const isTestNumber = (phone) => {
  const digits = String(phone).replace(/\D/g, '');
  const formatted = formatPhoneForMsg91(phone);
  return TEST_PHONE_NUMBERS.has(digits) || TEST_PHONE_NUMBERS.has(formatted);
};

/**
 * Send OTP via MSG91 OTP Widget API
 */
export const sendMsg91Otp = async ({ phone }) => {
  const formattedMobile = formatPhoneForMsg91(phone);
  const normalized = normalizePhone(phone);

  if (!formattedMobile || formattedMobile.length < 10) {
    throw new ApiError(400, 'Invalid phone number format');
  }

  // Developer / Reviewer test bypass
  if (isTestNumber(formattedMobile)) {
    console.log(`[MSG91] 🧪 Bypassing OTP send for test number: ${normalized}`);
    return {
      success: true,
      isBypass: true,
      phone: normalized,
      otp: '123456',
      expiresIn: 300,
      resendAvailableIn: 30,
      message: `OTP sent successfully to ${normalized} (Test Mode)`,
    };
  }

  const widgetId = env.msg91?.widgetId || process.env.MSG91_WIDGET_ID || '366b6a704454313533343732';
  const tokenAuth = env.msg91?.authToken || process.env.MSG91_AUTH_TOKEN || '588874T5lR9OAcwJ6af35dbeP1';

  console.log(`[MSG91 ${new Date().toISOString()}] 📤 Sending OTP to ${normalized} (identifier: ${formattedMobile}) using Widget ID: ${widgetId}`);

  try {
    const res = await fetch('https://api.msg91.com/api/v5/widget/sendOtp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        widgetId,
        tokenAuth,
        identifier: formattedMobile,
      }),
    });

    const data = await res.json().catch(() => ({}));
    console.log(`[MSG91 ${new Date().toISOString()}] 📥 MSG91 Send Response (HTTP ${res.status}):`, JSON.stringify(data));

    if (data.type === 'error' || data.hasError) {
      console.error('[MSG91] sendOtp error response:', data);
      throw new ApiError(400, data.message || 'Failed to send OTP via SMS', [], '', 'MSG91_SEND_ERROR');
    }

    // Capture reqId from data.message
    const reqId = String(data.message || '').trim();
    if (reqId) {
      otpSessions.set(formattedMobile, { reqId, timestamp: Date.now() });
      persistOtpSessions(otpSessions);
      console.log(`[MSG91] Stored session reqId for ${formattedMobile}: ${reqId}`);
    }

    return {
      success: true,
      requestId: reqId,
      phone: normalized,
      expiresIn: 300,
      resendAvailableIn: 30,
      message: `OTP sent successfully to ${normalized}`,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('[MSG91] Network / Exception in sendMsg91Otp:', error);
    throw new ApiError(500, `SMS service error: ${error.message}`);
  }
};

/**
 * Verify OTP via MSG91 OTP Widget API
 */
export const verifyMsg91Otp = async ({ phone, otp, reqId: directReqId }) => {
  const formattedMobile = formatPhoneForMsg91(phone);
  const trimmedOtp = String(otp || '').trim();

  if (!trimmedOtp) {
    throw new ApiError(400, 'OTP code is required');
  }

  // Developer / Reviewer test bypass
  if (isTestNumber(formattedMobile) && TEST_BYPASS_CODES.has(trimmedOtp)) {
    console.log(`[MSG91] 🧪 Bypassing OTP verification for test number: ${formattedMobile}`);
    return { verified: true, isBypass: true };
  }

  const widgetId = env.msg91?.widgetId || process.env.MSG91_WIDGET_ID || '366b6a704454313533343732';
  const authKey = env.msg91?.authKey || process.env.MSG91_AUTH_KEY || '588874AkxiMDsCLyw6af34b3eP1';

  // Retrieve active session reqId (check both memory and disk file)
  const currentMap = loadOtpSessions();
  const session = otpSessions.get(formattedMobile) || currentMap.get(formattedMobile);
  const activeReqId = directReqId || session?.reqId;

  console.log(`[MSG91 ${new Date().toISOString()}] 🔍 Verifying OTP for ${formattedMobile} (reqId: ${activeReqId || 'none'})`);

  if (!activeReqId) {
    throw new ApiError(400, 'OTP session expired or not found. Please tap "Resend OTP" to get a new code.', [], '', 'INVALID_OTP');
  }

  try {
    const res = await fetch('https://api.msg91.com/api/v5/widget/verifyOtp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': authKey,
      },
      body: JSON.stringify({
        widgetId,
        reqId: activeReqId,
        otp: trimmedOtp,
      }),
    });

    const data = await res.json().catch(() => ({}));
    console.log(`[MSG91 ${new Date().toISOString()}] 📥 MSG91 Verify Response (HTTP ${res.status}):`, JSON.stringify(data));

    if (data.type === 'success' || String(data.message || '').toLowerCase().includes('success') || data.token) {
      // Verified successfully! Clean up session
      otpSessions.delete(formattedMobile);
      persistOtpSessions(otpSessions);
      return { verified: true, token: data.token };
    }

    console.error('[MSG91] verifyOtp error response:', data);

    if (data.message === 'invalid otp' || data.code === 705 || data.message === 'OTP not match' || data.message === 'OTP expired' || data.type === 'error') {
      throw new ApiError(400, data.message || 'Invalid or expired OTP. Please try again.', [], '', 'INVALID_OTP');
    }

    return { verified: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('[MSG91] Network / Exception in verifyMsg91Otp:', error);
    throw new ApiError(500, `OTP verification failed: ${error.message}`);
  }
};

/**
 * Resend OTP via MSG91 OTP Widget Retry API
 */
export const resendMsg91Otp = async ({ phone, retryChannel = 11 }) => {
  const formattedMobile = formatPhoneForMsg91(phone);
  const normalized = normalizePhone(phone);

  if (isTestNumber(formattedMobile)) {
    return {
      success: true,
      isBypass: true,
      message: `OTP resent successfully to ${normalized} (Test Mode)`,
    };
  }

  const widgetId = env.msg91?.widgetId || process.env.MSG91_WIDGET_ID || '366b6a704454313533343732';
  const authKey = env.msg91?.authKey || process.env.MSG91_AUTH_KEY || '588874AkxiMDsCLyw6af34b3eP1';

  const session = otpSessions.get(formattedMobile);
  if (!session?.reqId) {
    // If no existing session, call sendMsg91Otp directly
    return await sendMsg91Otp({ phone });
  }

  try {
    const res = await fetch('https://api.msg91.com/api/v5/widget/retryOtp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': authKey,
      },
      body: JSON.stringify({
        widgetId,
        reqId: session.reqId,
        retryChannel: Number(retryChannel) || 11,
      }),
    });

    const data = await res.json().catch(() => ({}));
    console.log(`[MSG91 ${new Date().toISOString()}] 📥 MSG91 Retry Response (HTTP ${res.status}):`, JSON.stringify(data));

    if (data.type === 'error' || data.hasError) {
      // If retry fails, fallback to fresh send
      return await sendMsg91Otp({ phone });
    }

    return {
      success: true,
      message: `OTP resent successfully to ${normalized}`,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Failed to resend OTP: ${error.message}`);
  }
};
