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

// Call-ringing signal from foreground or killed-state background handler (resilient, no auth block)
router.post('/call-ringing', chatController.reportCallRinging);
router.post('/call-rejected', chatController.reportCallRejected);

router.use(authenticate); // All subsequent chat routes require valid JWT

router.post('/call/initiate', chatController.initiateCall);
router.get('/conversations', chatController.getMyConversations);
router.post('/direct', validate(createDirectChatSchema), chatController.getOrCreateDirectChat);
router.get('/conversations/:id/messages', validate(getMessagesQuerySchema), chatController.getMessages);
router.post('/conversations/:id/messages', validate(sendMessageSchema), chatController.sendMessage);
router.post('/conversations/:id/read', chatController.markAsRead);
router.get('/users/:userId/status', chatController.getUserOnlineStatus);
router.post('/conversations/:id/archive', chatController.archiveConversation);
router.post('/conversations/:id/clear', chatController.clearConversation);
router.delete('/conversations/:id', chatController.deleteConversation);
router.get('/blocked', chatController.getBlockedUsers);
router.post('/users/:userId/block', chatController.blockUser);
router.delete('/users/:userId/block', chatController.unblockUser);

export default router;
