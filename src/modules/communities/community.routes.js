import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createCommunitySchema, joinCommunitySchema } from './community.validation.js';
import * as communityController from './community.controller.js';

const router = Router();

router.get('/', optionalAuthenticate, communityController.listCommunities);
router.get('/my-communities', authenticate, communityController.getMyCommunities);
router.post('/', authenticate, validate(createCommunitySchema), communityController.createCommunity);
router.post('/join', authenticate, validate(joinCommunitySchema), communityController.joinCommunity);
router.post('/leave', authenticate, validate(joinCommunitySchema), communityController.leaveCommunity);

export default router;
