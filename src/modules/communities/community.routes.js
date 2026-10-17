import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createCommunitySchema, joinCommunitySchema } from './community.validation.js';
import * as communityController from './community.controller.js';

const router = Router();

router.get('/', communityController.listCommunities);
router.get('/my-communities', authenticate, communityController.getMyCommunities);
router.post('/', authenticate, validate(createCommunitySchema), communityController.createCommunity);
router.post('/join', authenticate, validate(joinCommunitySchema), communityController.joinCommunity);

export default router;
