import { z } from 'zod';

export const triggerSosSchema = {
  body: z.object({
    rideId: z.string().optional().or(z.literal('')),
    latitude: z.number().optional().default(17.448293),
    longitude: z.number().optional().default(78.391487),
    address: z.string().min(2, 'Current address or landmark is required'),
    emergencyType: z.enum(['SAFETY_THREAT', 'MEDICAL', 'ACCIDENT', 'VEHICLE_BREAKDOWN', 'GENERAL']).default('SAFETY_THREAT'),
    notes: z.string().optional().or(z.literal('')),
  }),
};

export const updateSosStatusSchema = {
  body: z.object({
    status: z.enum(['ACTIVE', 'INVESTIGATING', 'POLICE_NOTIFIED', 'RESOLVED']),
    adminNotes: z.string().min(3, 'Admin resolution notes are required'),
  }),
};

