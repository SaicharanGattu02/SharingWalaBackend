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

export const updateVehicleSchema = {
  body: z.object({
    type: z.enum(['Car', 'Bike']).optional(),
    name: z.string().min(2).max(100).optional(),
    numberPlate: z.string().min(4).max(20).optional(),
    color: z.string().min(2).max(50).optional(),
    capacity: z.number().int().min(1).max(8).optional(),
  }),
};

export const offerRideSchema = {
  body: z.object({
    vehicleId: z.string().optional(),
    vehicleName: z.string().optional(),
    vehicleNumber: z.string().optional(),
    mode: z.string().default('carpool'), // 'carpool' or 'bikepool'
    rideType: z.string().default('oneTime'), // 'oneTime' or 'recurring'
    activeDays: z.array(z.string()).optional(), // e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    origin: z.string().min(2),
    originLat: z.number().optional().default(17.448293),
    originLng: z.number().optional().default(78.391487),
    destination: z.string().min(2),
    destLat: z.number().optional().default(17.437462),
    destLng: z.number().optional().default(78.365448),
    departureTime: z.string().min(1), // e.g. "08:30 AM"
    returnTime: z.string().optional(), // e.g. "06:00 PM"
    date: z.string().optional(), // e.g. "Today" or ISO string
    seats: z.number().int().min(1).max(8).optional(),
    availableSeats: z.number().int().min(1).max(8).optional(),
    pricePerSeat: z.number().min(0).optional(),
    price: z.number().min(0).optional(),
    price_per_seat: z.number().min(0).optional(),
    costPerSeat: z.number().min(0).optional(),
    cost_per_seat: z.number().min(0).optional(),
    isFree: z.boolean().optional(),
    is_free: z.boolean().optional(),
    pricingType: z.string().optional(),
    pricing_type: z.string().optional(),
    pricingMode: z.string().optional(),
    pricing_mode: z.string().optional(),
    notes: z.string().max(500).optional(),
    pickupFlexibility: z.string().max(200).optional(),
    meetingPoint: z.string().max(200).optional(),
    isWomenOnly: z.boolean().default(false),
    autoAccept: z.boolean().default(false),
  }).passthrough(),
};

export const updateOfferRideSchema = {
  body: z.object({
    vehicleId: z.string().optional(),
    vehicle_id: z.string().optional(),
    vehicleName: z.string().optional(),
    vehicle_name: z.string().optional(),
    vehicleNumber: z.string().optional(),
    vehicle_number: z.string().optional(),
    mode: z.string().optional(),
    rideType: z.string().optional(),
    ride_type: z.string().optional(),
    activeDays: z.array(z.string()).optional(),
    active_days: z.array(z.string()).optional(),
    origin: z.string().min(2).optional(),
    originLat: z.number().optional(),
    originLng: z.number().optional(),
    destination: z.string().min(2).optional(),
    destLat: z.number().optional(),
    destLng: z.number().optional(),
    departureTime: z.string().optional(),
    departure_time: z.string().optional(),
    returnTime: z.string().optional(),
    return_time: z.string().optional(),
    date: z.string().optional(),
    seats: z.number().int().min(1).max(8).optional(),
    availableSeats: z.number().int().min(1).max(8).optional(),
    available_seats: z.number().int().min(1).max(8).optional(),
    pricePerSeat: z.number().min(0).optional(),
    price: z.number().min(0).optional(),
    price_per_seat: z.number().min(0).optional(),
    costPerSeat: z.number().min(0).optional(),
    cost_per_seat: z.number().min(0).optional(),
    isFree: z.boolean().optional(),
    is_free: z.boolean().optional(),
    pricingType: z.string().optional(),
    pricing_type: z.string().optional(),
    pricingMode: z.string().optional(),
    pricing_mode: z.string().optional(),
    notes: z.string().max(500).optional(),
    pickupFlexibility: z.string().max(200).optional(),
    pickup_flexibility: z.string().max(200).optional(),
    meetingPoint: z.string().max(200).optional(),
    meeting_point: z.string().max(200).optional(),
    isWomenOnly: z.boolean().optional(),
    is_women_only: z.boolean().optional(),
    autoAccept: z.boolean().optional(),
    auto_accept: z.boolean().optional(),
  }).passthrough(),
};

export const respondBookingSchema = {
  body: z
    .object({
      action: z
        .enum([
          'ACCEPT', 'DECLINE', 'REJECT', 'APPROVE', 'ONBOARD', 'PICKUP', 'PICKED_UP', 'OFFBOARD',
          'accept', 'decline', 'reject', 'approve', 'onboard', 'pickup', 'picked_up', 'offboard',
        ])
        .optional(),
      status: z
        .enum([
          'ACCEPTED', 'REJECTED', 'DECLINED', 'ONBOARD', 'PICKED_UP', 'COMPLETED',
          'accepted', 'rejected', 'declined', 'onboard', 'picked_up', 'completed',
        ])
        .optional(),
      isPickedUp: z.boolean().optional(),
    })
    .refine((data) => data.action !== undefined || data.status !== undefined || data.isPickedUp !== undefined, {
      message: 'Either action (ACCEPT/DECLINE/ONBOARD), status, or isPickedUp must be provided',
    }),
};

export const updateRideStatusSchema = {
  body: z
    .object({
      status: z.string().optional(),
      action: z.string().optional(),
    })
    .passthrough(),
};
