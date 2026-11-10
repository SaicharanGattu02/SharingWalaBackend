import { ApiError } from '../utils/apiError.js';
import { env } from './env.js';

// Recognized test phone numbers for App Store / Google Play review & developer testing
const TEST_PHONE_NUMBERS = new Set([
  '919999999999',
  '919876543210',
  '918888888888',
  '917777777777',
  '911111111111',
  '910000000000',
  '9999999999',
  '9876543210',
  '8888888888',
  '7777777777',
]);

const TEST_BYPASS_CODES = new Set(['123456', '1234', '0000', '111111']);

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
 * Send OTP via MSG91 SendOTP API
 */
export const sendMsg91Otp = async ({ phone }) => {
  const formattedMobile = formatPhoneForMsg91(phone);
  const normalized = normalizePhone(phone);

  if (!formattedMobile || formattedMobile.length < 10) {
    throw new ApiError(400, 'Invalid phone number format');
  }

  // Developer / Reviewer test bypass
  if (isTestNumber(formattedMobile)) {
    console.log(`[MSG91] Bypassing OTP send for test number: ${normalized}`);
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

  const authKey = env.msg91?.authKey || process.env.MSG91_AUTH_KEY || '588874AkxiMDsCLyw6af34b3eP1';
  const templateId = env.msg91?.widgetId || process.env.MSG91_WIDGET_ID || '366b6a704454313533343732';
  const otpLength = env.msg91?.otpLength || 6;

  console.log(`[MSG91 ${new Date().toISOString()}] 📤 Sending OTP to ${normalized} (formatted: ${formattedMobile}) using Template/Widget ID: ${templateId}`);

  const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(templateId)}&mobile=${encodeURIComponent(formattedMobile)}&authkey=${encodeURIComponent(authKey)}&otp_length=${otpLength}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'authkey': authKey,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json().catch(() => ({}));
    console.log(`[MSG91 ${new Date().toISOString()}] 📥 MSG91 Send Response (HTTP ${res.status}):`, JSON.stringify(data));

    if (data.type === 'error') {
      console.error('[MSG91] sendOtp error response:', data);
      if (data.code === '418' || String(data.message || '').toLowerCase().includes('whitelisted')) {
        throw new ApiError(
          500,
          'SMS gateway configuration error: IP is not whitelisted in MSG91. Please disable API Security or add your server IP in MSG91 panel under Authkey.',
          [],
          '',
          'MSG91_IP_NOT_WHITELISTED'
        );
      }
      throw new ApiError(400, data.message || 'Failed to send OTP via SMS', [], '', 'MSG91_SEND_ERROR');
    }

    return {
      success: true,
      requestId: data.request_id || data.message,
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
 * Verify OTP via MSG91 SendOTP API
 */
export const verifyMsg91Otp = async ({ phone, otp }) => {
  const formattedMobile = formatPhoneForMsg91(phone);
  const trimmedOtp = String(otp || '').trim();

  if (!trimmedOtp) {
    throw new ApiError(400, 'OTP code is required');
  }

  // Developer / Reviewer test bypass
  if (isTestNumber(formattedMobile) && TEST_BYPASS_CODES.has(trimmedOtp)) {
    console.log(`[MSG91] Bypassing OTP verification for test number: ${formattedMobile}`);
    return { verified: true, isBypass: true };
  }

  const authKey = env.msg91?.authKey || process.env.MSG91_AUTH_KEY || '588874AkxiMDsCLyw6af34b3eP1';
  console.log(`[MSG91 ${new Date().toISOString()}] 🔍 Verifying OTP for ${formattedMobile}`);

  const url = `https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(trimmedOtp)}&mobile=${encodeURIComponent(formattedMobile)}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'authkey': authKey,
        'Accept': 'application/json',
      },
    });

    const data = await res.json().catch(() => ({}));
    console.log(`[MSG91 ${new Date().toISOString()}] 📥 MSG91 Verify Response (HTTP ${res.status}):`, JSON.stringify(data));

    if (data.type === 'success' || data.message === 'OTP verified success') {
      return { verified: true };
    }

    console.error('[MSG91] verifyOtp error response:', data);

    if (data.code === '418' || String(data.message || '').toLowerCase().includes('whitelisted')) {
      throw new ApiError(
        500,
        'SMS gateway configuration error: IP is not whitelisted in MSG91. Please disable API Security or add your server IP in MSG91 panel under Authkey.',
        [],
        '',
        'MSG91_IP_NOT_WHITELISTED'
      );
    }

    if (data.message === 'OTP not match' || data.message === 'OTP expired' || data.type === 'error') {
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
 * Resend OTP via MSG91 SendOTP API
 */
export const resendMsg91Otp = async ({ phone, retryChannel = 'text' }) => {
  const formattedMobile = formatPhoneForMsg91(phone);
  const normalized = normalizePhone(phone);

  if (isTestNumber(formattedMobile)) {
    return {
      success: true,
      isBypass: true,
      message: `OTP resent successfully to ${normalized} (Test Mode)`,
    };
  }

  const authKey = env.msg91?.authKey || process.env.MSG91_AUTH_KEY || '588874AkxiMDsCLyw6af34b3eP1';
  const url = `https://control.msg91.com/api/v5/otp/retry?authkey=${encodeURIComponent(authKey)}&mobile=${encodeURIComponent(formattedMobile)}&retrytype=${encodeURIComponent(retryChannel)}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'authkey': authKey,
        'Accept': 'application/json',
      },
    });

    const data = await res.json().catch(() => ({}));

    if (data.type === 'error') {
      if (data.code === '418' || String(data.message || '').toLowerCase().includes('whitelisted')) {
        throw new ApiError(
          500,
          'SMS gateway configuration error: IP is not whitelisted in MSG91. Please disable API Security or add your server IP in MSG91 panel under Authkey.',
          [],
          '',
          'MSG91_IP_NOT_WHITELISTED'
        );
      }
      throw new ApiError(400, data.message || 'Failed to resend OTP');
    }

    return {
      success: true,
      message: data.message || `OTP resent successfully to ${normalized}`,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Failed to resend OTP: ${error.message}`);
  }
};

