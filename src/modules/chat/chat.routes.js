import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createDirectChatSchema,
  getMessagesQuerySchema,
  sendMessageSchema,
} from './chat.validation.js';
import * as chatController from './chat.controller.js';

const router = Router();

router.use(authenticate); // All chat routes require valid JWT

router.get('/conversations', chatController.getMyConversations);
router.post('/direct', validate(createDirectChatSchema), chatController.getOrCreateDirectChat);
router.get('/conversations/:id/messages', validate(getMessagesQuerySchema), chatController.getMessages);
router.post('/conversations/:id/messages', validate(sendMessageSchema), chatController.sendMessage);
router.post('/conversations/:id/read', chatController.markAsRead);

export default router;
