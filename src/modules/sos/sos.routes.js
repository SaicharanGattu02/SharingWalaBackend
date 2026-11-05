import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authenticateAdmin } from '../../middlewares/adminAuth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { triggerSosSchema, updateSosStatusSchema } from './sos.validation.js';
import * as sosController from './sos.controller.js';

// ==========================================
// User Side SOS Router (/api/v1/user/sos)
// ==========================================
export const userSosRouter = Router();
userSosRouter.post('/', authenticate, validate(triggerSosSchema), sosController.triggerSos);

// ==========================================
// Admin Side SOS Router (/api/v1/admin/sos)
// ==========================================
export const adminSosRouter = Router();
adminSosRouter.use(authenticateAdmin);
adminSosRouter.get('/', sosController.getSosIncidents);
adminSosRouter.get('/:id', sosController.getSosIncidentById);
adminSosRouter.put('/:id/status', validate(updateSosStatusSchema), sosController.updateSosStatus);

export default {
  userSosRouter,
  adminSosRouter,
};

