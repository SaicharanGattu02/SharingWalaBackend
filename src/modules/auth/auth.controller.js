import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as authService from './auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(new ApiResponse(201, result, 'User account registered successfully'));
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  res.status(200).json(new ApiResponse(200, result, 'Logged in successfully'));
});

export const sendOtp = asyncHandler(async (req, res) => {
  const result = await authService.sendPhoneOtp(req.body);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const phoneLogin = asyncHandler(async (req, res) => {
  const result = await authService.loginOrRegisterWithPhone(req.body);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.loginOrRegisterWithPhone(req.body);
  res.status(200).json(new ApiResponse(200, result, 'OTP verified successfully. Logged in.'));
});

export const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshAuthToken(req.body);
  res.status(200).json(new ApiResponse(200, result, 'Access token refreshed successfully'));
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user, 'Current user profile fetched'));
});
