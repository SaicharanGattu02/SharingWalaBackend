import { z } from 'zod';

export const createDirectChatSchema = {
  body: z.object({
    recipientUserId: z.string().min(1, 'Recipient user ID is required'),
  }),
};

export const getMessagesQuerySchema = {
  query: z.object({
    page: z.string().transform((v) => Math.max(1, parseInt(v, 10) || 1)).optional().default('1'),
    limit: z.string().transform((v) => Math.max(1, parseInt(v, 10) || 30)).optional().default('30'),
  }),
};

export const sendMessageSchema = {
  body: z.object({
    content: z.string().max(2000, 'Message cannot exceed 2000 characters').optional().default(''),
    messageType: z.enum(['TEXT', 'LOCATION_SHARE', 'IMAGE', 'SYSTEM_ALERT']).optional().default('TEXT'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    mediaUrl: z.string().url().optional().or(z.literal('')),
  }),
};
