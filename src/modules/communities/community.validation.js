import { z } from 'zod';

export const createCommunitySchema = {
  body: z.object({
    name: z.string().min(3, 'Community name must be at least 3 characters'),
    type: z.enum(['OFFICE', 'APARTMENT', 'COLLEGE', 'COMPANY', 'LOCAL_COMMUNITY']),
    description: z.string().optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
    domainRestriction: z.string().optional(), // e.g. '@google.com'
  }),
};

export const joinCommunitySchema = {
  body: z.object({
    communityId: z.string().min(1, 'Community ID is required'),
  }),
};
