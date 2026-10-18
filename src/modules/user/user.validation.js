import { z } from 'zod';

export const updateProfileSchema = {
  body: z.object({
    displayName: z.string().min(2).max(100).optional(),
    avatarUrl: z.string().max(1000).optional().nullable(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    homeArea: z.string().max(200).optional().nullable(),
    workArea: z.string().max(200).optional().nullable(),
    preferredMode: z.enum(['carpool', 'bikepool', 'both']).optional(),
    rolePreference: z.enum(['offerRide', 'findRide', 'both']).optional(),
    womenOnlyPreference: z.boolean().optional(),
    activeRole: z.string().optional(),
    isDriverMode: z.boolean().optional(),
  }),
};

export const switchRoleSchema = {
  body: z.object({
    role: z.enum(['HOST', 'GUEST', 'Host', 'Guest', 'host', 'guest']).optional(),
    activeRole: z.enum(['HOST', 'GUEST', 'Host', 'Guest', 'host', 'guest']).optional(),
    isDriverMode: z.boolean().optional(),
  }),
};

export const trustedContactSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    phone: z.string().min(7, 'Phone number must be at least 7 digits').max(25),
    relationship: z.string().min(2, 'Relationship must be at least 2 characters').max(50),
  }),
};

export const updateTrustedContactSchema = {
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().min(7).max(25).optional(),
    relationship: z.string().min(2).max(50).optional(),
  }),
};

export const searchRidesQuerySchema = z.object({
  origin: z.string().optional(),
  destination: z.string().optional(),
  date: z.string().optional(),
  mode: z.enum(['carpool', 'bikepool', 'other', 'all']).optional(),
  womenOnly: z.enum(['true', 'false']).optional(),
  seatsNeeded: z.coerce.number().int().min(1).default(1),
});

export const requestSeatSchema = {
  body: z.object({
    seats: z.number().int().min(1).default(1),
    pickupPoint: z.string().optional(),
    dropoffPoint: z.string().optional(),
    notes: z.string().max(500).optional(),
  }),
};
