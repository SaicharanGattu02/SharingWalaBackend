import { z } from 'zod';

export const createStrangerTripSchema = {
  body: z.object({
    origin: z.string().min(2),
    destination: z.string().min(2),
    date: z.string().min(1),
    time: z.string().min(1),
    mode: z.enum(['carpool', 'bikepool', 'other']).default('carpool'),
    vibe: z.enum(['weekendGetaway', 'intercityCommute', 'roadTrip', 'backpacking', 'cityExplore', 'eventConcert']).default('weekendGetaway'),
    totalSeats: z.number().int().min(1).max(10).default(4),
    pricePerPerson: z.number().min(0).default(0),
    notes: z.string().max(1000).optional(),
    interests: z.array(z.string()).default([]),
    isWomenOnly: z.boolean().default(false),
    imageUrl: z.string().url().optional(),
  }),
};

export const createStrangerMeetupSchema = {
  body: z.object({
    title: z.string().min(3).max(150),
    category: z.string().min(2).max(50), // e.g. 'Coffee & Cafes', 'Sports & Fitness'
    venueName: z.string().min(2),
    area: z.string().min(2),
    date: z.string().min(1),
    time: z.string().min(1),
    imageUrl: z.string().url().optional(),
    icebreakerPrompt: z.string().optional(),
    maxAttendees: z.number().int().min(2).max(50).default(6),
    audienceType: z.enum(['Everyone', 'Women Only', 'Men Only']).default('Everyone'),
    tags: z.array(z.string()).default([]),
    expenseType: z.string().default('Split bills at venue'),
  }),
};

export const createStrangerPlanSchema = {
  body: z.object({
    title: z.string().min(3).max(150),
    location: z.string().min(2),
    imageUrl: z.string().url().optional(),
    dateRange: z.string().min(2),
    audience: z.enum(['Everyone', 'Female only', 'Male only']).default('Everyone'),
    totalMembers: z.number().int().min(2).max(100).default(10),
    price: z.number().min(0).default(0),
    description: z.string().max(1000).optional(),
    tags: z.array(z.string()).default([]),
    isPrivate: z.boolean().default(false),
  }),
};

export const createStrangerReelSchema = {
  body: z.object({
    route: z.string().min(2),
    thumbnailUrl: z.string().url(),
    vibe: z.enum(['weekendGetaway', 'intercityCommute', 'roadTrip', 'backpacking', 'cityExplore', 'eventConcert']).default('weekendGetaway'),
    caption: z.string().max(500),
    audioTrack: z.string().default('Original Sound'),
    tripId: z.string().optional(),
  }),
};
