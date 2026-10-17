# SHARE2GO — Carpool & Bikepool Platform API

A clean, modern, scalable **Modular Monolith** backend for the **SHARE2GO** carpool and bikepool platform, built with **Express.js**, **Prisma ORM**, **MySQL**, and **Zod**.

---

## 🎯 Architecture Directives (Clean Architecture)

This project strictly follows the **Feature-Based Modular Monolith** pattern:

```
SHARE2GO/
├── prisma/
│   └── schema.prisma              # Single Source of Truth for DB models, enums & relations
├── src/
│   ├── app.js                     # Express app configuration & middleware pipeline
│   ├── server.js                  # Entry point with DB connection & graceful shutdown
│   ├── config/
│   │   ├── db.js                  # PrismaClient singleton connection
│   │   └── env.js                 # Validated environment configuration (1-day JWT)
│   ├── middlewares/
│   │   ├── auth.middleware.js     # JWT verification & verified driver guard
│   │   ├── error.middleware.js    # Global error handler (ApiError, Prisma, Zod)
│   │   └── validate.middleware.js # Zod request validation wrapper
│   ├── modules/
│   │   ├── auth/                  # Phone login, OTP, token authentication
│   │   ├── user/                  # Passenger/Guest: search rides, booking, profile
│   │   ├── rider/                 # Host/Driver: offer ride, vehicles, bookings management
│   │   ├── stranger/              # Stranger mode: trips, meetups, travel plans
│   │   ├── chat/                  # Real-time WebSocket & REST chat messaging
│   │   ├── communities/           # Corporate & campus commute circles
│   │   └── health/                # System metrics and database ping
│   ├── routes/
│   │   └── index.js               # Central API v1 router mounting all feature modules
│   ├── utils/
│   │   ├── apiError.js            # Standardized operational error class
│   │   ├── apiResponse.js         # Uniform JSON response envelope
│   │   └── asyncHandler.js        # Express async exception forwarder
│   └── database/
│       └── seed.js                # Type-safe Prisma seed script
├── .env                           # Local environment configuration
└── package.json                   # ESM module configuration & scripts
```

---

## 🚀 Quick Start Guide

### 1. Configure MySQL Database
Edit `.env` with your local MySQL credentials:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="mysql://root:your_password@localhost:3306/share2go_db"
JWT_SECRET="your_secret_key"
JWT_EXPIRES_IN="1d"
CORS_ORIGIN="*"
```

### 2. Push Schema to Database
Create all tables and relationships directly via Prisma:
```bash
npm run prisma:push
```

### 3. Seed Reference & Scenario Data
Populate roles, permissions, pricing rules, and test commuters (Sai & Ravi):
```bash
npm run prisma:seed
```

### 4. Start Development Server
```bash
npm run dev
```
Server starts on `http://localhost:5000`.  
Health endpoint: `http://localhost:5000/api/v1/health`

---

## 🛠️ How to Add or Modify Your Own Business Logic

Every feature in `src/modules/<feature_name>/` contains four self-contained layers:

1. **`*.validation.js` (Zod Schema):**
   ```javascript
   export const createItemSchema = {
     body: z.object({
       title: z.string().min(2),
     }),
   };
   ```

2. **`*.service.js` (Pure Database Logic via Prisma):**
   ```javascript
   import { prisma } from '../../config/db.js';
   import { ApiError } from '../../utils/apiError.js';

   export const createItem = async (userId, data) => {
     return await prisma.item.create({ data: { ...data, userId } });
   };
   ```

3. **`*.controller.js` (Request Orchestration wrapped in `asyncHandler`):**
   ```javascript
   import { asyncHandler } from '../../utils/asyncHandler.js';
   import { ApiResponse } from '../../utils/apiResponse.js';
   import * as itemService from './item.service.js';

   export const createItem = asyncHandler(async (req, res) => {
     const result = await itemService.createItem(req.user.id, req.body);
     res.status(201).json(new ApiResponse(201, result, 'Created'));
   });
   ```

4. **`*.routes.js` (Endpoint Definition with Validation):**
   ```javascript
   import { Router } from 'express';
   import { authenticate } from '../../middlewares/auth.middleware.js';
   import { validate } from '../../middlewares/validate.middleware.js';
   import { createItemSchema } from './item.validation.js';
   import * as itemController from './item.controller.js';

   const router = Router();
   router.post('/', authenticate, validate(createItemSchema), itemController.createItem);
   export default router;
   ```

---

## 🔑 Key Features Built In

- **Unified Identity:** Single `users` model. Drivers are an optional 1:0..1 extension; passengers are users who hold bookings.
- **1-Day JWT Validity:** No complex refresh token disruptions for mobile apps.
- **Atomic Concurrency Protection:** Booking seats uses atomic conditional updates to prevent overbooking race conditions under high load.
- **Vehicle Compliance:** Native support for both Cars and Bikes with insurance history.
- **Corridor Route Matching:** Rides are broken down into sequential stops (`ride_stops`) enabling route overlap discovery.
- **Zero Legacy SQL:** Prisma is the single source of truth for all models, migrations, and operations.
