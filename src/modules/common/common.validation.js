import { z } from 'zod';

export const getBannersSchema = {
  query: z.object({
    type: z.enum(['USER', 'RIDER', 'STRANGER', 'ALL', 'user', 'rider', 'stranger', 'all']).optional(),
    category: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    group: z.enum(['true', 'false']).optional(),
  }),
};
