import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  phoneOtpLoginSchema,
  verifyOtpSchema,
  refreshTokenSchema,
} from './auth.validation.js';
import * as authController from './auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/send-otp', validate(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/phone-login', validate(phoneOtpLoginSchema), authController.phoneLogin);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.get('/me', authenticate, authController.getMe);

export default router;
