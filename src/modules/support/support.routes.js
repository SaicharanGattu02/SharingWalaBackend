import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { optionalAuthenticate } from '../../middlewares/auth.middleware.js';
import { contactSupportSchema } from './support.validation.js';
import * as supportController from './support.controller.js';

const router = Router();

// Retrieve support info, helplines, working hours & FAQs
router.get('/', supportController.getSupportInfo);
router.get('/info', supportController.getSupportInfo);

// Submit appeal / contact ticket (accessible even for inactive users)
router.post(
  '/contact',
  optionalAuthenticate,
  validate(contactSupportSchema),
  supportController.submitContactTicket
);
router.post(
  '/ticket',
  optionalAuthenticate,
  validate(contactSupportSchema),
  supportController.submitContactTicket
);

// List tickets (internal)
router.get('/tickets', supportController.listTickets);

export default router;

