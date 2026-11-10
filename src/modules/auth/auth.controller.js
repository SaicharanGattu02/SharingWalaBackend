import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as authService from './auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || req.body.deviceId;
  const deviceType = req.headers['x-device-type'] || req.headers['device-type'] || req.body.deviceType;
  const result = await authService.registerUser({ ...req.body, deviceId, deviceType });
  res.status(201).json(new ApiResponse(201, result, 'User account registered successfully'));
});

export const login = asyncHandler(async (req, res) => {
  const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || req.body.deviceId || req.body.device_id;
  const deviceType = req.headers['x-device-type'] || req.headers['device-type'] || req.body.deviceType || req.body.device_type;
  const fcmToken = req.body.fcm_token || req.body.fcmToken || req.body.push_token || req.body.device_token;
  const forceLogin = req.body.forceLogin === true || req.body.forceLogin === 'true';
  const result = await authService.loginUser({ ...req.body, deviceId, deviceType, fcmToken, forceLogin });
  res.status(200).json(new ApiResponse(200, result, 'Logged in successfully'));
});

export const sendOtp = asyncHandler(async (req, res) => {
  const result = await authService.sendPhoneOtp(req.body);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const resendOtp = asyncHandler(async (req, res) => {
  const result = await authService.resendPhoneOtp(req.body);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const phoneLogin = asyncHandler(async (req, res) => {
  const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || req.body.deviceId || req.body.device_id;
  const deviceType = req.headers['x-device-type'] || req.headers['device-type'] || req.body.deviceType || req.body.device_type;
  const fcmToken = req.body.fcm_token || req.body.fcmToken || req.body.push_token || req.body.device_token;
  const forceLogin = req.body.forceLogin === true || req.body.forceLogin === 'true';
  const result = await authService.loginOrRegisterWithPhone({ ...req.body, deviceId, deviceType, fcmToken, forceLogin });
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || req.body.deviceId || req.body.device_id;
  const deviceType = req.headers['x-device-type'] || req.headers['device-type'] || req.body.deviceType || req.body.device_type;
  const fcmToken = req.body.fcm_token || req.body.fcmToken || req.body.push_token || req.body.device_token;
  const forceLogin = req.body.forceLogin === true || req.body.forceLogin === 'true';
  const result = await authService.loginOrRegisterWithPhone({ ...req.body, deviceId, deviceType, fcmToken, forceLogin });
  res.status(200).json(new ApiResponse(200, result, 'OTP verified successfully. Logged in.'));
});

export const refreshToken = asyncHandler(async (req, res) => {
  const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || req.body.deviceId;
  const deviceType = req.headers['x-device-type'] || req.headers['device-type'] || req.body.deviceType;
  const fcmToken = req.body.fcm_token || req.body.fcmToken || req.body.push_token || req.body.device_token;
  const result = await authService.refreshAuthToken({ ...req.body, deviceId, deviceType, fcmToken });
  res.status(200).json({
    statusCode: 200,
    success: true,
    message: 'Access token refreshed successfully',
    data: result,
    accessToken: result.accessToken,
    token: result.accessToken,
    refreshToken: result.refreshToken,
    expiresIn: result.expiresIn,
    accessTokenExpiry: result.expiresIn,
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user, 'Current user profile fetched'));
});

export const getAccountStatus = asyncHandler(async (req, res) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query?.token) {
    token = req.query.token;
  }
  const result = await authService.getAccountStatus(token);
  res.status(200).json(new ApiResponse(200, result, 'Account status checked successfully'));
});

export const logout = asyncHandler(async (req, res) => {
  const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || req.body?.deviceId;
  const result = await authService.logoutUser(req.user?.id, deviceId);
  res.status(200).json(new ApiResponse(200, result, 'Logged out successfully'));
});
