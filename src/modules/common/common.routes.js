import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticateAdmin } from '../../middlewares/adminAuth.middleware.js';
import { getBannersSchema } from './common.validation.js';
import * as commonController from './common.controller.js';

const router = Router();

// --- App Version & Force Update Endpoints ---
router.get('/app-update', commonController.checkAppUpdate);
router.get('/config', commonController.getAppConfig);
router.put('/config', authenticateAdmin, commonController.updateAppConfig);

// --- Banners Endpoints ---
// Supports:
// 1. GET /banners?type=USER
// 2. GET /banners?type=RIDER
// 3. GET /banners?type=STRANGER
// 4. GET /banners (returns all, or ?group=true for grouped map)
router.get('/banners', validate(getBannersSchema), commonController.getBanners);
router.get('/banners/:id', commonController.getBannerById);

// Fallback base route: GET /
router.get('/', validate(getBannersSchema), commonController.getBanners);

export default router;
