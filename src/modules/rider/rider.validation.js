import { z } from 'zod';

export const applyDriverSchema = {
  body: z.object({
    licenseNumber: z.string().min(5).max(50),
    licenseExpiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid ISO date string',
    }),
  }),
};

export const addVehicleSchema = {
  body: z.object({
    type: z.enum(['Car', 'Bike']),
    name: z.string().min(2).max(100), // e.g. "Hyundai Verna"
    numberPlate: z.string().min(4).max(20), // e.g. "TS 09 EQ 4821"
    color: z.string().min(2).max(50),
    capacity: z.number().int().min(1).max(8),
  }),
};

export const offerRideSchema = {
  body: z.object({
    vehicleId: z.string().min(1),
    mode: z.enum(['carpool', 'bikepool', 'other']).default('carpool'),
    rideType: z.enum(['oneTime', 'recurring']).default('oneTime'),
    activeDays: z.array(z.string()).optional(), // e.g. ['Mon', 'Tue', 'Wed']
    origin: z.string().min(2),
    originLat: z.number().optional().default(17.448293),
    originLng: z.number().optional().default(78.391487),
    destination: z.string().min(2),
    destLat: z.number().optional().default(17.437462),
    destLng: z.number().optional().default(78.365448),
    departureTime: z.string().min(1), // e.g. "08:30 AM"
    availableSeats: z.number().int().min(1).max(8),
    pricePerSeat: z.number().min(0).default(45.0),
    notes: z.string().max(500).optional(),
    meetingPoint: z.string().max(200).optional(),
    isWomenOnly: z.boolean().default(false),
    autoAccept: z.boolean().default(false),
  }),
};

export const respondBookingSchema = {
  body: z.object({
    action: z.enum(['ACCEPT', 'DECLINE']),
  }),
};

export const updateRideStatusSchema = {
  body: z.object({
    status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  }),
};
