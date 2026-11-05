# 🛡️ SHARE2GO — Admin Portal API Specification & Implementation Guide

> **Architecture Directive**: Modular Monolith (Clean Architecture)  
> **Base URL**: `http://localhost:5000/api/v1/admin`  
> **Authentication Header**: `Authorization: Bearer <ADMIN_ACCESS_TOKEN>`  
> **Response Standard**: Standardized `{ success: true, statusCode: 200, message: "...", data: {...} }`

---

## 📌 Executive Summary

The SHARE2GO Admin API suite provides complete administrative control, verification workflows, safety incident resolutions, fare guardrail configurations, promotional banner management, and fine-grained Role-Based Access Control (RBAC).

Every endpoint is constructed following clean architecture principles:
- **Routes (`admin.routes.js`)**: Semantic REST endpoints protected by `authenticateAdmin` and `requireAdminPermission(...)`.
- **Controllers (`admin.controller.js`)**: Request orchestration wrapped in `asyncHandler` with standard `ApiResponse`.
- **Services (`admin.service.js`)**: Business logic, Prisma ORM queries, real-time socket events, and audit logging with dev fallback support.
- **Validations (`admin.validation.js`)**: Strict Zod input validations for query, body, and route parameters.

---

## 🔑 Default Administrator Credentials

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@share2go.com` | `Admin@123` | Unrestricted full access to all endpoints and settings |

---

## 🏷️ Role-Based Access Control (RBAC) Permissions

| Permission | Description |
| :--- | :--- |
| `users.view` | View user profiles, commuter history, and activity |
| `users.update` | Edit user profile details and administrative notes |
| `users.block` | Suspend, block, or delete user accounts |
| `drivers.verify` | Review, approve, or reject driver licenses & documents |
| `vehicles.verify` | Review, approve, or reject vehicle registration & insurance |
| `rides.view` | Inspect platform rides, routes, waypoints, and passenger lists |
| `rides.cancel` | Emergency cancellation of active or scheduled rides |
| `reports.view` | View safety incident reports, complaints, and user flags |
| `reports.resolve`| Resolve safety tickets and apply penalties |
| `communities.manage` | Create, verify, and moderate corporate & campus communities |
| `pricing.manage` | Configure non-commercial fuel cost-sharing caps per km |
| `banners.manage` | Create, update, toggle, and delete promotional hero banners |
| `staff.manage` | Manage administrative sub-accounts, staff roles, and permissions |

---

## 📑 Complete API Directory (50 Endpoints)

```
/api/v1/admin
├── /auth
│   ├── POST /login
│   ├── POST /refresh
│   ├── GET  /me
│   ├── POST /logout
│   └── PUT  /change-password
├── /dashboard
│   ├── GET  /stats
│   ├── GET  /charts
│   └── GET  /recent-activity
├── /users
│   ├── GET    /
│   ├── GET    /:id
│   ├── PUT    /:id
│   ├── PATCH  /:id/status
│   └── DELETE /:id
├── /drivers
│   ├── GET    /
│   ├── GET    /:id
│   └── PATCH  /:id/verify
├── /driver-documents
│   └── PATCH  /:id/verify
├── /vehicles
│   ├── GET    /
│   ├── GET    /:id
│   └── PATCH  /:id/verify
├── /vehicle-insurances
│   └── PATCH  /:id/verify
├── /rides
│   ├── GET    /
│   ├── GET    /:id
│   └── POST   /:id/cancel
├── /trips
│   └── GET    /
├── /bookings
│   ├── GET    /
│   ├── GET    /:id
│   └── PATCH  /:id/status
├── /reports
│   ├── GET    /
│   ├── GET    /:id
│   └── PATCH  /:id/resolve
├── /communities
│   ├── GET    /
│   ├── GET    /:id
│   ├── POST   /
│   ├── PUT    /:id
│   └── DELETE /:id
├── /pricing-rules
│   ├── GET    /
│   ├── POST   /
│   ├── PUT    /:id
│   └── DELETE /:id
├── /banners
│   ├── GET    /
│   ├── GET    /:id
│   ├── POST   /
│   ├── PUT    /:id
│   └── DELETE /:id
├── /staff
│   ├── GET    /
│   ├── POST   /
│   └── PUT    /:id
├── /roles
│   └── GET    /
└── /audit-logs
    └── GET    /
```

---

## 1. Administrative Authentication & Session

### 1.1 Staff Login
- **Endpoint**: `POST /api/v1/admin/auth/login`
- **Auth**: Public
- **Request Body**:
```json
{
  "email": "admin@share2go.com",
  "password": "Admin@123"
}
```
- **Response `(200 OK)`**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Admin logged in successfully",
  "data": {
    "tokenType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "expiresIn": 43200,
    "admin": {
      "id": "admin_super_01",
      "name": "Master Super Administrator",
      "email": "admin@share2go.com",
      "roles": ["SUPER_ADMIN"],
      "permissions": ["users.view", "users.update", "users.block", "..."],
      "lastLoginAt": "2026-11-01T12:00:00.000Z"
    }
  }
}
```

### 1.2 Refresh Access Token
- **Endpoint**: `POST /api/v1/admin/auth/refresh`
- **Auth**: Public
- **Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsIn..."
}
```

### 1.3 Get Current Admin Profile
- **Endpoint**: `GET /api/v1/admin/auth/me`
- **Auth**: Required (`Bearer <token>`)
- **Response `(200 OK)`**: Current admin identity, active roles, and granted permissions list.

### 1.4 Change Administrative Password
- **Endpoint**: `PUT /api/v1/admin/auth/change-password`
- **Auth**: Required
- **Request Body**:
```json
{
  "currentPassword": "Admin@123",
  "newPassword": "NewSecurePassword#2026"
}
```

### 1.5 Admin Logout
- **Endpoint**: `POST /api/v1/admin/auth/logout`
- **Auth**: Required

---

## 2. Dashboard Analytics & Operations

### 2.1 Platform KPI Statistics
- **Endpoint**: `GET /api/v1/admin/dashboard/stats`
- **Auth**: Required
- **Response `(200 OK)`**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Platform dashboard statistics retrieved",
  "data": {
    "users": {
      "total": 1248,
      "active": 1195,
      "suspended": 53
    },
    "drivers": {
      "total": 312,
      "pendingVerification": 14,
      "approved": 298
    },
    "vehicles": {
      "total": 345,
      "pendingVerification": 18
    },
    "rides": {
      "active": 87,
      "completed": 3420,
      "total": 3507
    },
    "bookings": {
      "total": 7890
    },
    "trustAndSafety": {
      "openReports": 3
    },
    "communities": {
      "total": 24
    }
  }
}
```

### 2.2 Volume & Growth Charts
- **Endpoint**: `GET /api/v1/admin/dashboard/charts`
- **Auth**: Required
- **Response `(200 OK)`**: Monthly ride trends, booking volume, vehicle mode distribution (Car vs Bike), and commuter user growth curves.

### 2.3 Live Operational Activity Feed
- **Endpoint**: `GET /api/v1/admin/dashboard/recent-activity`
- **Auth**: Required
- **Response `(200 OK)`**: 5 most recent administrative logs, pending driver applications, and open incident tickets.

---

## 3. User Management (Commuters & Drivers)

### 3.1 List Users
- **Endpoint**: `GET /api/v1/admin/users`
- **Permission**: `users.view`
- **Query Parameters**:
  - `page`: default `1`
  - `limit`: default `20` (max 100)
  - `search`: Filter by name, phone, email, or username
  - `status`: `ACTIVE` | `SUSPENDED` | `BLOCKED` | `DELETED`
  - `role`: `USER` | `RIDER` | `ALL`
  - `gender`: `MALE` | `FEMALE` | `OTHER`
  - `sortBy`: `createdAt` | `displayName` | `lastLoginAt`
  - `sortOrder`: `asc` | `desc`

### 3.2 View User Details
- **Endpoint**: `GET /api/v1/admin/users/:id`
- **Permission**: `users.view`
- **Response**: Comprehensive user dossier including driver profile, vehicle list, emergency SOS contacts, device logins, received safety reports, and ratings.

### 3.3 Modify User Profile
- **Endpoint**: `PUT /api/v1/admin/users/:id`
- **Permission**: `users.update`
- **Request Body**:
```json
{
  "displayName": "Sai Krishna V",
  "email": "sai.krishna@techcorp.com",
  "homeArea": "Miyapur Metro Station",
  "workArea": "Cyber Towers, Hitech City",
  "isDriverMode": true
}
```

### 3.4 Change Account Status (Suspend / Block / Reactivate)
- **Endpoint**: `PATCH /api/v1/admin/users/:id/status`
- **Permission**: `users.block`
- **Request Body**:
```json
{
  "status": "SUSPENDED",
  "reason": "Multiple safety complaints regarding aggressive driving behavior"
}
```
*Note: Suspended and Blocked users receive an instant real-time socket termination event kicks them out of the mobile app.*

### 3.5 Delete User Account
- **Endpoint**: `DELETE /api/v1/admin/users/:id`
- **Permission**: `users.block`

---

## 4. Driver & Document Verification

### 4.1 List Driver Applications
- **Endpoint**: `GET /api/v1/admin/drivers`
- **Permission**: `drivers.verify`
- **Query Parameters**:
  - `page`: `1`
  - `limit`: `20`
  - `status`: `PENDING` | `APPROVED` | `REJECTED` | `SUSPENDED`
  - `search`: License number, driver name, or phone

### 4.2 Driver Profile & Documents Inspection
- **Endpoint**: `GET /api/v1/admin/drivers/:id`
- **Permission**: `drivers.verify`
- **Response**: Driver profile, driving license number, license expiry date, uploaded RC/insurance documents, and registered vehicles.

### 4.3 Approve / Reject Driver Application
- **Endpoint**: `PATCH /api/v1/admin/drivers/:id/verify`
- **Permission**: `drivers.verify`
- **Request Body**:
```json
{
  "status": "APPROVED"
}
```
*Or on rejection:*
```json
{
  "status": "REJECTED",
  "rejectionReason": "Uploaded driving license image is blurred and unreadable. Please re-upload a clear photo."
}
```

### 4.4 Verify Specific Driver Document
- **Endpoint**: `PATCH /api/v1/admin/driver-documents/:id/verify`
- **Permission**: `drivers.verify`
- **Request Body**: `{ "status": "APPROVED" }` or `{ "status": "REJECTED", "rejectionReason": "Expired license" }`

---

## 5. Vehicle & Insurance Verification

### 5.1 List Registered Vehicles
- **Endpoint**: `GET /api/v1/admin/vehicles`
- **Permission**: `vehicles.verify`
- **Query Parameters**:
  - `page`: `1`
  - `limit`: `20`
  - `status`: `PENDING` | `APPROVED` | `REJECTED`
  - `vehicleType`: `CAR` | `BIKE`
  - `search`: Number plate, make, or model

### 5.2 Vehicle Full Dossier
- **Endpoint**: `GET /api/v1/admin/vehicles/:id`
- **Permission**: `vehicles.verify`

### 5.3 Approve / Reject Vehicle Registration
- **Endpoint**: `PATCH /api/v1/admin/vehicles/:id/verify`
- **Permission**: `vehicles.verify`
- **Request Body**:
```json
{
  "status": "APPROVED"
}
```

### 5.4 Approve / Reject Vehicle Insurance
- **Endpoint**: `PATCH /api/v1/admin/vehicle-insurances/:id/verify`
- **Permission**: `vehicles.verify`
- **Request Body**:
```json
{
  "status": "APPROVED"
}
```

---

## 6. Rides, Social Trips & Bookings Moderation

### 6.1 List Platform Rides
- **Endpoint**: `GET /api/v1/admin/rides`
- **Permission**: `rides.view`
- **Query Parameters**:
  - `status`: `PUBLISHED` | `IN_PROGRESS` | `COMPLETED` | `CANCELLED`
  - `rideType`: `DAILY_COMMUTE` | `LONG_DISTANCE` | `ONE_TIME`
  - `search`: Location name or driver name
  - `fromDate`, `toDate`: ISO date strings

### 6.2 View Deep Ride Details
- **Endpoint**: `GET /api/v1/admin/rides/:id`
- **Permission**: `rides.view`
- **Response**: Full route coordinates, encoded polyline, pickup/dropoff intermediate stops, cost-sharing breakdown, confirmed bookings, and driver details.

### 6.3 Emergency Ride Cancellation by Admin
- **Endpoint**: `POST /api/v1/admin/rides/:id/cancel`
- **Permission**: `rides.cancel`
- **Request Body**:
```json
{
  "cancellationReason": "Severe weather alert and road closure on Outer Ring Road"
}
```
*Note: Automatically cancels all active passenger bookings and broadcasts socket alerts to driver and booked commuters.*

### 6.4 Explore Social Journeys & Biker Trips
- **Endpoint**: `GET /api/v1/admin/trips`
- **Permission**: `rides.view`
- **Query Parameters**: `type=ALL` | `BIKER_TRIP` | `SOCIAL_JOURNEY`

### 6.5 List Passenger Bookings
- **Endpoint**: `GET /api/v1/admin/bookings`
- **Permission**: `rides.view`
- **Query Parameters**: `status`, `rideId`, `passengerId`, `search`

### 6.6 Update Booking Status (Dispute Resolution)
- **Endpoint**: `PATCH /api/v1/admin/bookings/:id/status`
- **Permission**: `rides.cancel`
- **Request Body**:
```json
{
  "status": "CANCELLED",
  "adminNotes": "Refund authorized due to driver no-show verification"
}
```

---

## 7. Trust & Safety (Incident & Report Resolution)

### 7.1 List Incident Reports
- **Endpoint**: `GET /api/v1/admin/reports`
- **Permission**: `reports.view`
- **Query Parameters**:
  - `status`: `OPEN` | `UNDER_INVESTIGATION` | `RESOLVED` | `DISMISSED`
  - `reason`: `UNSAFE_DRIVING` | `HARASSMENT` | `FAKE_PROFILE` | `WRONG_VEHICLE` | `NO_SHOW` | `FRAUD` | `COMMERCIAL_FARE_DEMAND` | `OTHER`

### 7.2 Safety Ticket Detailed View
- **Endpoint**: `GET /api/v1/admin/reports/:id`
- **Permission**: `reports.view`

### 7.3 Resolve Safety Report & Apply Penalties
- **Endpoint**: `PATCH /api/v1/admin/reports/:id/resolve`
- **Permission**: `reports.resolve`
- **Request Body**:
```json
{
  "status": "RESOLVED",
  "adminNotes": "Confirmed driver charged commercial fare above app rate. Issued final warning and applied 7-day account suspension.",
  "penalizeUser": true,
  "penalizeAction": "SUSPEND"
}
```
*`penalizeAction` options: `NONE`, `SUSPEND` (temporary lock), `BLOCK` (permanent ban).*

---

## 8. Corporate & Campus Communities Management

### 8.1 List Communities
- **Endpoint**: `GET /api/v1/admin/communities`
- **Permission**: `communities.manage`
- **Query Parameters**: `type=OFFICE | APARTMENT | COLLEGE`, `isActive=true`, `search`

### 8.2 Create Official Community
- **Endpoint**: `POST /api/v1/admin/communities`
- **Permission**: `communities.manage`
- **Request Body**:
```json
{
  "name": "Microsoft India Development Center",
  "type": "OFFICE",
  "description": "Exclusive carpool and bikepool network for Microsoft employees in Gachibowli",
  "domainRestriction": "@microsoft.com",
  "isActive": true
}
```

### 8.3 Update Community
- **Endpoint**: `PUT /api/v1/admin/communities/:id`
- **Permission**: `communities.manage`

### 8.4 Delete / Archive Community
- **Endpoint**: `DELETE /api/v1/admin/communities/:id`
- **Permission**: `communities.manage`

---

## 9. Non-Commercial Pricing Rules (Fuel Sharing Guardrails)

### 9.1 List Pricing Rules
- **Endpoint**: `GET /api/v1/admin/pricing-rules`
- **Permission**: `pricing.manage`
- **Response**: Active per-km cost-sharing caps for `CAR` and `BIKE`.

### 9.2 Create Pricing Rule
- **Endpoint**: `POST /api/v1/admin/pricing-rules`
- **Permission**: `pricing.manage`
- **Request Body**:
```json
{
  "vehicleType": "CAR",
  "minimumDistanceKm": 2.0,
  "maximumDistanceKm": 1500.0,
  "ratePerKm": 3.5,
  "maxContributionPerKm": 5.0,
  "isActive": true
}
```

### 9.3 Update Pricing Rule
- **Endpoint**: `PUT /api/v1/admin/pricing-rules/:id`
- **Permission**: `pricing.manage`

### 9.4 Delete Pricing Rule
- **Endpoint**: `DELETE /api/v1/admin/pricing-rules/:id`
- **Permission**: `pricing.manage`

---

## 10. Promotional Banners Management

### 10.1 List Banners
- **Endpoint**: `GET /api/v1/admin/banners`
- **Permission**: `banners.manage`
- **Query Parameters**: `targetRole=USER | RIDER | STRANGER | ALL`, `isActive=true`

### 10.2 Create Promotional Banner
- **Endpoint**: `POST /api/v1/admin/banners`
- **Permission**: `banners.manage`
- **Request Body**:
```json
{
  "title": "Zero Commission Monsoons",
  "subtitle": "Share rides, save big & stay dry",
  "description": "Offer seats this monsoon season with zero platform charges.",
  "imageUrl": "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80",
  "targetRole": "RIDER",
  "category": "SEASONAL",
  "badge": "Monsoon Offer",
  "ctaText": "Publish Now",
  "actionType": "NAVIGATE",
  "actionUrl": "/rider/publish-ride",
  "deepLink": "share2go://rider/publish",
  "gradientColors": ["#1E3A8A", "#3B82F6"],
  "priority": 1,
  "isActive": true
}
```

### 10.3 Update Banner
- **Endpoint**: `PUT /api/v1/admin/banners/:id`
- **Permission**: `banners.manage`

### 10.4 Delete Banner
- **Endpoint**: `DELETE /api/v1/admin/banners/:id`
- **Permission**: `banners.manage`

---

## 11. Staff Management & Audit Trail

### 11.1 List Staff Accounts
- **Endpoint**: `GET /api/v1/admin/staff`
- **Permission**: `staff.manage`

### 11.2 Register New Staff Member
- **Endpoint**: `POST /api/v1/admin/staff`
- **Permission**: `staff.manage`
- **Request Body**:
```json
{
  "name": "Kavitha Sharma",
  "email": "kavitha.support@share2go.com",
  "password": "StaffSecret#2026",
  "roleIds": ["role_verify", "role_support"]
}
```

### 11.3 Update Staff Account & Roles
- **Endpoint**: `PUT /api/v1/admin/staff/:id`
- **Permission**: `staff.manage`

### 11.4 List System Roles & Permissions
- **Endpoint**: `GET /api/v1/admin/roles`
- **Permission**: `staff.manage`

### 11.5 Inspect Administrative Activity Audit Logs
- **Endpoint**: `GET /api/v1/admin/audit-logs`
- **Query Parameters**: `page`, `limit`, `adminId`, `entityType`, `action`
- **Response**: Detailed audit logs capturing every administrative modification, IP address, timestamp, old values, and new values.

---

## 🧪 Testing with cURL

### Step 1: Admin Login
```bash
curl -X POST http://localhost:5000/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@share2go.com","password":"Admin@123"}'
```

### Step 2: Fetch Dashboard Metrics
```bash
curl -X GET http://localhost:5000/api/v1/admin/dashboard/stats \
  -H "Authorization: Bearer <COPIED_ACCESS_TOKEN>"
```

### Step 3: View Pending Driver Verifications
```bash
curl -X GET "http://localhost:5000/api/v1/admin/drivers?status=PENDING" \
  -H "Authorization: Bearer <COPIED_ACCESS_TOKEN>"
```

### Step 4: Approve Driver License
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/drivers/drv_01/verify \
  -H "Authorization: Bearer <COPIED_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED"}'
```

---

## 🚀 Architecture Summary & Pair-Programming Note

| Component | Path | Description |
| :--- | :--- | :--- |
| **Routes** | `src/modules/admin/admin.routes.js` | 50 cleanly organized REST endpoints with route-level security |
| **Controller** | `src/modules/admin/admin.controller.js` | Async handler orchestration with standard `ApiResponse` |
| **Service** | `src/modules/admin/admin.service.js` | Business logic, Prisma ORM, dev mock fallback, and audit logging |
| **Validation** | `src/modules/admin/admin.validation.js` | Zod validation schemas for all queries, params, and bodies |
| **Middleware** | `src/middlewares/adminAuth.middleware.js` | Admin JWT token parsing, role extraction & permission enforcement |
| **Central Route** | `src/routes/index.js` | Mounted at `/api/v1/admin` alongside persona routes |
| **Documentation** | `ADMIN_APIS_DOCUMENTATION.md` | Full specification, payload schemas, and testing instructions |

