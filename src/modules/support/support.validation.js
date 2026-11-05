import { z } from 'zod';

export const contactSupportSchema = {
  body: z.object({
    category: z.string().default('ACCOUNT_DEACTIVATED'),
    subject: z.string().min(3, 'Subject must be at least 3 characters'),
    message: z.string().min(5, 'Message description must be at least 5 characters'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    name: z.string().optional().or(z.literal('')),
    userId: z.string().optional().or(z.literal('')),
  }),
};

