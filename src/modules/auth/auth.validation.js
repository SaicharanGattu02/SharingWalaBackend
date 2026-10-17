import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters long')
      .max(30, 'Username cannot exceed 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    displayName: z.string().min(2, 'Display name must be at least 2 characters long').max(100),
    phone: z.string().min(10, 'Valid phone number is required'),
    email: z.string().email('Invalid email address format').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional().default('PREFER_NOT_TO_SAY'),
  }),
};

export const loginSchema = {
  body: z.object({
    identifier: z.string().min(1, 'Phone, email, or username is required'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const phoneOtpLoginSchema = {
  body: z.object({
    phone: z.string().min(10, 'Valid 10-digit phone number is required'),
    otp: z.string().optional().default('123456'),
  }),
};

export const verifyOtpSchema = {
  body: z.object({
    phone: z.string().min(10, 'Valid 10-digit phone number is required'),
    otp: z.string().min(4, 'OTP must be at least 4 digits').max(6, 'OTP cannot exceed 6 digits'),
  }),
};

export const sendOtpSchema = {
  body: z.object({
    phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  }),
};

export const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};
