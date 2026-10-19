# 📚 SHARE2GO Complete API Integration Cheatsheet

> **🎯 Network IP Base URL:** `http://172.20.10.2:5000/api/v1`  
> **Server Port:** `5000`  
> **Host IP:** `172.20.10.2`  
> **Real-Time WebSocket (Socket.io) URL:** `http://172.20.10.2:5000`  
> **Standard Headers:**  
> `Content-Type: application/json`  
> `Authorization: Bearer <your_jwt_token>` (for authenticated endpoints)

---

## 📋 Table of Contents
1. [🔐 1. Authentication Module](#-1-authentication-module)
2. [👤 2. User Module (Guest / Commuter / Passenger)](#-2-user-module-guest--commuter--passenger)
3. [🚗 3. Rider Module (Host / Driver / Vehicle Owner)](#-3-rider-module-host--driver--vehicle-owner)
4. [🌟 4. Stranger Mode Module (Trips, Meetups, Plans, Reels)](#-4-stranger-mode-module-trips-meetups-plans-reels)
5. [💬 5. Chat & Real-Time Messaging](#-5-chat--real-time-messaging)
6. [🏢 6. Communities & Commute Circles](#-6-communities--commute-circles)

---

## 🔐 1. Authentication Module

### 1.1 Verify OTP & Phone Login
* **Screen:** `otp_screen.dart` / `login_screen.dart`
* **Method & Path:** `POST /api/v1/auth/verify-otp` (or `POST /api/v1/auth/phone-login`)
* **Auth Required:** ❌ No
* **Request Payload (Body):**
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```
* **Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "OTP verified successfully. Logged in.",
  "data": {
    "tokenType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "expiryTime": "2026-10-18T01:10:00.000Z",
    "refreshTokenExpiresIn": 2592000,
    "refreshTokenExpiryTime": "2026-11-16T01:10:00.000Z",
    "role": "USER",
    "roles": [
      "USER"
    ],
    "isNewUser": false,
    "isProfileCompleted": true,
    "hasDriverProfile": false,
    "user": {
      "id": "cm21...",
      "username": "sai_commuter",
      "displayName": "Sai Krishna",
      "phone": "+919876543210",
      "email": "sai@techcorp.com",
      "gender": "MALE",
      "status": "ACTIVE",
      "role": "USER",
      "roles": ["USER"],
      "driverProfile": null
    }
  }
}
```

---

### 1.2 Refresh Access Token
* **Screen:** Background / Auth Interceptor
* **Method & Path:** `POST /api/v1/auth/refresh-token`
* **Auth Required:** ❌ No
* **Request Payload (Body):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
* **Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Access token refreshed successfully",
  "data": {
    "tokenType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "expiryTime": "2026-10-18T01:10:00.000Z",
    "role": "USER",
    "roles": ["USER"]
  }
}
```

---

### 1.3 User Registration
* **Screen:** `register_screen.dart` / Signup
* **Method & Path:** `POST /api/v1/auth/register`
* **Auth Required:** ❌ No
* **Request Payload (Body):**
```json
{
  "username": "ravi_teja",
  "displayName": "Ravi Teja",
  "phone": "+919123456789",
  "password": "Password@123",
  "gender": "MALE",
  "email": "ravi@gmail.com"
}
```
> `gender` options: `MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY`. `email` is optional.

* **Success Response (`201 Created`):**
```json
{
  "statusCode": 201,
  "data": {
    "user": {
      "id": "cm22...",
      "username": "ravi_teja",
      "displayName": "Ravi Teja",
      "phone": "+919123456789",
      "email": "ravi@gmail.com",
      "gender": "MALE",
      "status": "ACTIVE",
      "role": "USER",
      "roles": ["USER"],
      "createdAt": "2026-10-16T17:00:00.000Z"
    },
    "tokenType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "expiryTime": "2026-10-18T01:10:00.000Z",
    "role": "USER",
    "roles": ["USER"]
  },
  "message": "User account registered successfully",
  "success": true
}
```

---

### 1.4 User Login (Password)
* **Screen:** `login_screen.dart`
* **Method & Path:** `POST /api/v1/auth/login`
* **Auth Required:** ❌ No
* **Request Payload (Body):**
```json
{
  "identifier": "+919876543210",
  "password": "Secret@123"
}
```
> `identifier` can be the user's **phone number**, **username**, or **email**.

* **Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": "cm21...",
      "username": "sai_commuter",
      "displayName": "Sai Krishna",
      "phone": "+919876543210",
      "email": "sai@techcorp.com",
      "gender": "MALE",
      "status": "ACTIVE",
      "role": "USER",
      "roles": ["USER"]
    },
    "tokenType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "expiryTime": "2026-10-18T01:10:00.000Z",
    "role": "USER",
    "roles": ["USER"]
  },
  "message": "Logged in successfully",
  "success": true
}
```

---

### 1.3 Get Current User Profile (Auto-Login Check)
* **Screen:** App Launch / Splash
* **Method & Path:** `GET /api/v1/auth/me`
* **Auth Required:** ✅ Yes (`Bearer <token>`)
* **Request Payload:** None
* **Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "cm21...",
    "username": "sai_commuter",
    "displayName": "Sai Krishna",
    "phone": "+919876543210",
    "email": "sai@techcorp.com",
    "gender": "MALE"
  },
  "message": "Current user profile fetched",
  "success": true
}
```

---

## 👤 2. User Module (Guest / Commuter / Passenger)

### 2.1 Get Complete User Profile & Commute Preferences
* **Screen:** `profile_setup_screen.dart`, `profile_preferences_screen.dart`, Dashboard
* **Method & Path:** `GET /api/v1/user/profile`
* **Auth Required:** ✅ Yes
* **Request Payload:** None
* **Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "cm21...",
    "name": "Sai Krishna",
    "phone": "+919876543210",
    "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    "gender": "Male",
    "homeArea": "Kondapur, Hyderabad",
    "workArea": "Hitech City, Hyderabad",
    "preferredMode": "both",
    "rolePreference": "both",
    "identityVerified": true,
    "driverVerified": true,
    "rating": 4.95,
    "totalRidesCompleted": 48,
    "vehicles": [
      {
        "id": "v_01",
        "name": "Honda City ZX",
        "numberPlate": "TS08EM1234",
        "color": "Pearl White",
        "type": "Car",
        "capacity": 4
      }
    ],
    "trustedContacts": [
      {
        "id": "tc_1",
        "name": "Ananya Sharma",
        "phone": "+91 91234 56789",
        "relationship": "Sister"
      }
    ],
    "joinedCommunities": [],
    "womenOnlyPreference": false
  },
  "message": "User profile retrieved",
  "success": true
}
```

---

### 2.2 Update Profile & Preferences
* **Screen:** `step2_preferences_view.dart`, `personal_details_card.dart`
* **Method & Path:** `PUT /api/v1/user/profile`
* **Auth Required:** ✅ Yes
* **Request Payload (Body):**
```json
{
  "displayName": "Sai Krishna",
  "homeArea": "Kondapur Main Road",
  "workArea": "Cyber Towers, Hitech City",
  "preferredMode": "both",
  "rolePreference": "both",
  "womenOnlyPreference": false
}
```
* **Success Response (`200 OK`):** Returns updated User Profile object.

---

### 2.3 Trusted Contacts (Emergency Contacts)
* **Screen:** Trusted Contacts in Profile / Safety
* **Get Contacts:** `GET /api/v1/user/trusted-contacts`
* **Add Contact:** `POST /api/v1/user/trusted-contacts`
  * **Payload:**
  ```json
  {
    "name": "Vikram Verma",
    "phone": "+919988776655",
    "relationship": "Friend"
  }
  ```
* **Delete Contact:** `DELETE /api/v1/user/trusted-contacts/:id`

---

### 2.4 Search Available Rides (Carpool, Bikepool)
* **Screens:** `SearchRidesScreen`, `RouteSearchCard`, `SearchFilterBar`, `CyclingSearchBar`, `MyRideCard`
* **Method & Path:** `GET /api/v1/user/rides/search`
* **Auth Required:** ❌ Optional (Public)
* **Query Parameters:**
  * `origin`: (e.g. `Kondapur, Hyderabad` or `Siddipet`)
  * `destination`: (e.g. `Hitech City, Hyderabad`)
  * `mode`: `carpool` | `bikepool` | `all`
  * `womenOnly`: `true` | `false` (filter rides hosted by verified female commuters)
  * `verifiedOnly`: `true` | `false` (filter ID & driver verified hosts only)
  * `date`: `Today` | `Tomorrow` | date string
  * `search` / `q`: Keyword search string (matches location, vehicle, driver name, notes)
* **Example URLs:**
  * `http://192.168.0.100:5000/api/v1/user/rides/search?mode=carpool`
  * `http://192.168.0.100:5000/api/v1/user/rides/search?mode=bikepool`
  * `http://192.168.0.100:5000/api/v1/user/rides/search?womenOnly=true`
  * `http://192.168.0.100:5000/api/v1/user/rides/search?mode=carpool&womenOnly=true`
  * `http://192.168.0.100:5000/api/v1/user/rides/search?origin=Siddipet&mode=carpool&verifiedOnly=true`
* **Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "cmvf6ov920001va5ok288bje8",
      "driverId": "cmve65iik0003va6sxfbntaad",
      "driverName": "Sai Charan Gattu",
      "driverAvatar": "/data/user/0/com.sharing.wala/cache/fbebee3d-e3a8-48f4-b0cf-bcb199ee9ebe/1000043538.jpg_compressed.jpg",
      "rating": 5.0,
      "totalRides": 10,
      "isVerified": true,
      "routeMatchPercentage": 95,
      "origin": "Siddipet Medak Road, Maruthi Chowk, Ganesh Nagar, Siddipet, Telangana. Pin-502103 (India)",
      "destination": "Siddipet New Bus Stand",
      "departureTime": "08:30 AM",
      "date": "Today",
      "mode": "carpool",
      "rideType": "oneTime",
      "availableSeats": 2,
      "totalSeats": 3,
      "vehicleName": "Tata Seira",
      "vehicleNumber": "TS08D0912",
      "vehicleColor": "White",
      "communityName": null,
      "pickupFlexibility": "Flexible within 500m",
      "notes": "Daily commute. Looking to connect with co-travelers.",
      "status": "available",
      "meetingPoint": "Siddipet Medak Road, Maruthi Chowk, Ganesh Nagar, Siddipet, Telangana. Pin-502103 (India) Main Point",
      "isWomenOnly": false,
      "pricePerSeat": 25.0
    }
  ],
  "message": "Available rides found",
  "success": true
}
```

---

### 2.5 Get Ride Details & Route Timeline
* **Screens:** `RideDetailsScreen`, `DriverInfoHeader`, `RouteTimelineView`, `VehicleDetailsCard`
* **Method & Path:** `GET /api/v1/user/rides/:id`
* **Auth Required:** ❌ Optional (Public)
* **Example URL:** `http://192.168.0.100:5000/api/v1/user/rides/cmvf6ov920001va5ok288bje8`
* **Success Response (`200 OK`):** Returns the complete `Ride` model + `stopsTimeline`:
```json
{
  "statusCode": 200,
  "data": {
    "id": "cmvf6ov920001va5ok288bje8",
    "driverId": "cmve65iik0003va6sxfbntaad",
    "driverName": "Sai Charan Gattu",
    "driverAvatar": "/data/user/0/com.sharing.wala/cache/fbebee3d-e3a8-48f4-b0cf-bcb199ee9ebe/1000043538.jpg_compressed.jpg",
    "rating": 5.0,
    "totalRides": 10,
    "isVerified": true,
    "routeMatchPercentage": 95,
    "origin": "Siddipet Medak Road, Maruthi Chowk, Ganesh Nagar, Siddipet, Telangana. Pin-502103 (India)",
    "destination": "Siddipet New Bus Stand",
    "departureTime": "08:30 AM",
    "date": "Today",
    "mode": "carpool",
    "rideType": "oneTime",
    "availableSeats": 2,
    "totalSeats": 3,
    "vehicleName": "Tata Seira",
    "vehicleNumber": "TS08D0912",
    "vehicleColor": "White",
    "communityName": null,
    "pickupFlexibility": "Flexible within 500m",
    "notes": "Daily commute. Looking to connect with co-travelers.",
    "status": "available",
    "meetingPoint": "Siddipet Medak Road, Maruthi Chowk, Ganesh Nagar, Siddipet, Telangana. Pin-502103 (India) Main Point",
    "isWomenOnly": false,
    "pricePerSeat": 25.0,
    "price": 25.0,
    "isFree": false,
    "pricingType": "COST_SHARING",
    "requestStatus": "pending",
    "bookingStatus": "pending",
    "isRequestSent": true,
    "userBooking": {
      "bookingId": "cmvfk44lc0005vaycd6zigj04",
      "status": "pending",
      "seatsRequested": 1,
      "totalFare": 25.0,
      "notes": "Joining from Kondapur Signal with laptop bag.",
      "requestedAt": "2026-10-20T00:30:00.000Z"
    },
    "stopsTimeline": [
      {
        "id": "cmvf6ov960003va5obpyq8pf8",
        "name": "Siddipet Medak Road, Maruthi Chowk, Ganesh Nagar, Siddipet, Telangana. Pin-502103 (India) Main Point",
        "sequence": 1,
        "type": "START",
        "time": "08:30 am"
      },
      {
        "id": "cmvf6ov960004va5ol5e2t1f8",
        "name": "Siddipet New Bus Stand",
        "sequence": 2,
        "type": "END",
        "time": "09:15 am"
      }
    ]
  },
  "message": "Ride details retrieved",
  "success": true
}
```

> **`requestStatus` / `bookingStatus` Logic in Flutter:**
> - `"none"` → User has not requested. Show default **"Request Seat"** action button.
> - `"pending"` → Request sent, waiting for driver confirmation. Show **"Request Pending"** (Amber badge).
> - `"accepted"` → Driver confirmed/accepted the seat! Show **"Booking Confirmed"** (Green badge).
> - `"rejected"` → Driver declined/rejected the request. Show **"Request Declined"** (Red badge).
> - `"cancelled"` → Booking was cancelled.

---

### 2.6 Request a Seat on a Ride (Commuter Booking)
* **Screens:** `RideDetailsScreen`, `RequestSeatBottomSheet`
* **Method & Path:** `POST /api/v1/user/rides/:id/request-seat`
* **Auth Required:** ✅ Yes (`Authorization: Bearer <TOKEN>`)
* **Request Payload (Body):**
```json
{
  "seats": 1,
  "pickupPoint": "Kondapur Signal",
  "dropoffPoint": "Cyber Towers Gate 1",
  "notes": "Joining from Kondapur Signal with light laptop bag."
}
```
* **Success Response (`201 Created`):**
```json
{
  "statusCode": 201,
  "data": {
    "bookingId": "cmvf...",
    "rideId": "cmvf6ov920001va5ok288bje8",
    "status": "PENDING",
    "seatsRequested": 1,
    "totalFare": 25.0,
    "message": "Seat request sent to Sai Charan Gattu! Waiting for host confirmation."
  },
  "message": "Seat request sent to Sai Charan Gattu! Waiting for host confirmation.",
  "success": true
}
```

---

### 2.7 My Rides (Active, Upcoming, Completed)
* **Screen:** `my_rides_screen.dart`, `my_ride_card.dart`
* **Method & Path:** `GET /api/v1/user/my-rides`
* **Auth Required:** ✅ Yes
* **Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "active": [],
    "upcoming": [
      {
        "id": "ride_101",
        "bookingId": "bk_9823...",
        "driverName": "Ravi Kumar",
        "origin": "Kondapur Main Road",
        "destination": "Cyber Towers, Hitech City",
        "departureTime": "08:30 AM",
        "date": "Today",
        "availableSeats": 2,
        "seatsBooked": 1,
        "bookingStatus": "pending"
      }
    ],
    "completed": []
  },
  "message": "My rides list retrieved",
  "success": true
}
```

---

### 2.8 Active Ride Live Tracking
* **Screen:** `active_ride_details_sheet.dart`
* **Method & Path:** `GET /api/v1/user/rides/:id/active`
* **Auth Required:** ✅ Yes
* **Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "rideId": "ride_101",
    "driverName": "Ravi Kumar",
    "driverPhone": "+919876543210",
    "driverAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    "vehicleName": "Honda City",
    "vehicleNumber": "TS 07 FA 1024",
    "vehicleColor": "Silver",
    "status": "in_progress",
    "currentLocation": {
      "latitude": 17.453293,
      "longitude": 78.396487,
      "heading": 45.0,
      "speedKmh": 35
    },
    "otp": "4821",
    "meetingPoint": "Near Kondapur Signal Metro Pillar 42",
    "emergencyContacts": [
      {
        "name": "Ananya Sharma",
        "phone": "+919123456789",
        "relationship": "Sister"
      }
    ]
  },
  "message": "Active ride live tracking info",
  "success": true
}
```

---

## 🚗 3. Rider Module (Host / Driver / Vehicle Owner)

### 3.1 Get Rider Status & Vehicles
* **Screen:** `get_ready_to_share_rides_sheet.dart`
* **Method & Path:** `GET /api/v1/rider/status`
* **Auth Required:** ✅ Yes
* **Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "isDriver": true,
    "driverId": "drv_101",
    "verificationStatus": "APPROVED",
    "rating": 4.95,
    "totalRidesOffered": 14,
    "vehicles": [
      {
        "id": "v_01",
        "name": "Honda City ZX",
        "numberPlate": "TS08EM1234",
        "color": "Pearl White",
        "type": "Car",
        "capacity": 4
      }
    ]
  },
  "message": "Driver status retrieved",
  "success": true
}
```

---

### 3.2 Add a Vehicle (Car or Bike)
* **Screen:** Add Vehicle / `vehicle_selection_bottom_sheet.dart`
* **Method & Path:** `POST /api/v1/rider/vehicles`
* **Auth Required:** ✅ Yes
* **Request Payload (Body):**
```json
{
  "type": "Car",
  "name": "Hyundai Verna",
  "numberPlate": "TS 09 EQ 4821",
  "color": "Midnight Black",
  "capacity": 4
}
```
* **Success Response (`201 Created`):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "v_02",
    "name": "Hyundai Verna",
    "numberPlate": "TS 09 EQ 4821",
    "color": "Midnight Black",
    "type": "Car",
    "capacity": 4
  },
  "message": "Vehicle registered successfully",
  "success": true
}
```

---

### 3.3 Offer a Ride (Host / Driver)
* **Screen:** `offer_ride_screen.dart`
* **Method & Path:** `POST /api/v1/rider/rides/offer`
* **Auth Required:** ✅ Yes
* **Request Payload (Body):**
```json
{
  "vehicleId": "v_01",
  "mode": "carpool",
  "rideType": "recurring",
  "activeDays": ["Mon", "Tue", "Wed", "Thu", "Fri"],
  "origin": "Kondapur Main Road",
  "destination": "Cyber Towers, Hitech City",
  "departureTime": "08:30 AM",
  "availableSeats": 3,
  "price": 45.0,
  "pricePerSeat": 45.0,
  "isFree": false,
  "pricingType": "COST_SHARING",
  "meetingPoint": "Kondapur Signal Metro Pillar 42",
  "notes": "Daily IT office commute. AC car.",
  "isWomenOnly": false,
  "autoAccept": false
}
```
> **Pricing Options:**
> - **Rider Gives Price / Custom Fare:** Send `price: 35` (or `pricePerSeat: 35`) → sets custom contribution per seat.
> - **Free Ride Option:** Send `isFree: true` or `price: 0` → sets `pricingType: "FREE"` and price displays as `"Free"` across all cards.
> - **Default / System Recommended:** If omitted, defaults to ₹45 (carpool) or ₹25 (bikepool).

* **Success Response (`201 Created`):** Returns published `Ride` object with `pricePerSeat`, `price`, `isFree`, and `pricingType`.

---

### 3.4 My Offered Rides (View Passenger Seat Requests)
* **Screen:** Host Dashboard / Offered Rides tab
* **Method & Path:** `GET /api/v1/rider/my-offered-rides`
* **Auth Required:** ✅ Yes
* **Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "ride_991",
      "origin": "Kondapur Main Road",
      "destination": "Cyber Towers",
      "availableSeats": 2,
      "passengerRequests": [
        {
          "bookingId": "bk_771",
          "passengerId": "usr_55",
          "passengerName": "Pooja Roy",
          "passengerPhone": "+919811223344",
          "seatsRequested": 1,
          "status": "pending",
          "totalFare": 45.0
        }
      ]
    }
  ],
  "message": "Offered rides retrieved",
  "success": true
}
```

---

### 3.4b Get Passengers & Requests for a Specific Offered Ride
* **Screen:** `HostTripPassengersSheet`, `MyRideCard` ("View Trip & Passengers List")
* **Method & Path:** `GET /api/v1/rider/rides/:id/passengers`
* **Auth Required:** ✅ Yes (`Authorization: Bearer <TOKEN>`)
* **Example URL:** `http://192.168.0.100:5000/api/v1/rider/rides/cmvfo2d8z0001va1g037wxsdj/passengers`
* **Logic:**
  * `passengers`: Contains **ONLY Confirmed/Onboard** passengers traveling on the trip (`isConfirmed: true`). Empty right after submission until host accepts!
  * `passengerRequests`: Contains **Pending** requests awaiting host action (`status: "Pending"`).
  * No duplicate rows per passenger (deduplicated by `passengerId`).
  * Rejected requests do not show as passengers.
* **Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "rideId": "cmvfo2d8z0001va1g037wxsdj",
    "origin": "Ameerpet",
    "destination": "Ozrit",
    "totalSeats": 1,
    "availableSeats": 1,
    "bookedCount": 0,
    "totalFareCollected": 0,
    "summary": "0/1 Seats",
    "passengers": [],
    "confirmedPassengers": [],
    "passengerRequests": [
      {
        "id": "cmvfo7kvl0008va1gtiokao8q",
        "bookingId": "cmvfo7kvl0008va1gtiokao8q",
        "passengerId": "cmvct89cc0000va64lpsog7qm",
        "name": "Sai Charan Gattu",
        "phone": "+917674952516",
        "seats": 1,
        "fare": 48.0,
        "status": "Pending",
        "statusLabel": "Pending",
        "isPending": true,
        "isConfirmed": false
      }
    ]
  },
  "message": "Passenger bookings retrieved successfully",
  "success": true
}
```

---

### 3.5 Accept or Decline Passenger Request
* **Screen:** Host Accept/Reject action
* **Method & Path:** `PATCH /api/v1/rider/requests/:bookingId/respond`
* **Auth Required:** ✅ Yes
* **Request Payload (Body):**
```json
{
  "action": "ACCEPT"
}
```
> `action` can be `"ACCEPT"` or `"DECLINE"`.

* **Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "bookingId": "bk_771",
    "status": "accepted",
    "message": "Seat request accepted!"
  },
  "message": "Seat request accepted!",
  "success": true
}
```

---

### 3.6 Rider Start Trip API (Live Ride Start)
* **Screen:** `host_trip_passengers_sheet.dart`, `trip_active_screen.dart`, `my_rides_screen.dart`
* **Method & Path Options:**
  - `POST /api/v1/rider/rides/:rideId/start` *(Recommended direct call)*
  - `POST /api/v1/rider/rides/:rideId/start-trip`
  - `PATCH /api/v1/rider/rides/:rideId/start`
  - `PATCH /api/v1/rider/rides/:rideId/status` with `{"status": "IN_PROGRESS"}`
* **Auth Required:** ✅ Yes (`Bearer <token>`)
* **Request Payload (Body):** Optional (empty body `{}` is valid)
* **Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "cmvfo2d8z0001va1g037wxsdj",
    "rideId": "cmvfo2d8z0001va1g037wxsdj",
    "tripId": "cmvfo2d8z0001va1g037wxsdj",
    "status": "in_progress",
    "statusLabel": "Trip in Progress",
    "rawStatus": "IN_PROGRESS",
    "isStarted": true,
    "isInProgress": true,
    "startedAt": "2026-10-19T20:12:56.492Z",
    "origin": "Ameerpet",
    "originName": "Ameerpet",
    "destination": "Ozrit",
    "destName": "Ozrit",
    "date": "Oct 20",
    "departureTime": "08:30 AM",
    "mode": "bikepool",
    "vehicleName": "Honda Activa 5g",
    "vehicleNumber": "TS36D2304",
    "vehicleColor": "White",
    "totalSeats": 1,
    "availableSeats": 0,
    "bookedCount": 1,
    "totalFareCollected": 48,
    "passengers": [
      {
        "id": "cmvfo7kvl0008va1gtiokao8q",
        "bookingId": "cmvfo7kvl0008va1gtiokao8q",
        "passengerId": "cmvct89cc0000va64lpsog7qm",
        "name": "Sai Charan Gattu",
        "phone": "+917674952516",
        "avatarUrl": "https://...",
        "seats": 1,
        "fare": 48,
        "isPickedUp": false,
        "isOnboard": false,
        "status": "Confirmed",
        "statusLabel": "Confirmed",
        "rawStatus": "accepted",
        "pickupLocation": "Flexible near metro pillar",
        "dropLocation": "Ozrit",
        "pickupPoint": "Flexible near metro pillar",
        "dropoffPoint": "Ozrit",
        "acceptedAt": "2026-10-19T20:00:53.219Z"
      }
    ],
    "passengerCount": 1,
    "stops": [
      {
        "id": "stop_01",
        "name": "Flexible near metro pillar",
        "type": "START",
        "latitude": 17.448293,
        "longitude": 78.391487,
        "sequence": 1
      },
      {
        "id": "stop_02",
        "name": "Ozrit",
        "type": "END",
        "latitude": 17.437462,
        "longitude": 78.365448,
        "sequence": 2
      }
    ],
    "message": "Trip started successfully! Drive safely."
  },
  "message": "Trip started successfully! Drive safely.",
  "success": true
}
```

---

### 3.6b Complete Trip API (Trip Finished)
* **Screen:** End Trip action / Destination Reached
* **Method & Path Options:**
  - `POST /api/v1/rider/rides/:rideId/complete`
  - `POST /api/v1/rider/rides/:rideId/complete-trip`
  - `PATCH /api/v1/rider/rides/:rideId/status` with `{"status": "COMPLETED"}`
* **Auth Required:** ✅ Yes
* **Success Response (`200 OK`):** Marks ride as `COMPLETED`, updates passenger bookings to `COMPLETED`, and increments driver's total rides count.

---

### 3.7 Update Offered Ride Details & Vehicle
* **Screen:** Edit Ride / `offer_ride_screen.dart`
* **Method & Path:** `PUT /api/v1/rider/rides/:id`
* **Auth Required:** ✅ Yes
* **Request Payload (Body):**
```json
{
  "vehicleId": "cmvfjk8fd0003va646pfvkdin",
  "seats": 3,
  "pricePerSeat": 25,
  "origin": "Siddipet Medak Road, Maruthi Chowk, Ganesh Nagar, Siddipet, Telangana. Pin-502103 (India)",
  "destination": "Siddipet New Bus Stand",
  "departureTime": "08:30 AM",
  "date": "Today",
  "meetingPoint": "Siddipet Medak Road, Maruthi Chowk, Ganesh Nagar Main Gate",
  "notes": "Daily commute. Looking to connect with co-travelers.",
  "isWomenOnly": false,
  "autoAccept": true
}
```
* **Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "cmvf6ov920001va5ok288bje8",
    "mode": "carpool",
    "vehicleName": "Tata Seira",
    "vehicleNumber": "TS08D0912",
    "vehicleColor": "White",
    "availableSeats": 3,
    "totalSeats": 3,
    "pricePerSeat": 25
  },
  "message": "Offered ride updated successfully",
  "success": true
}
```

---

## 🌟 4. Stranger Mode Module (Trips, Meetups, Plans, Reels)

### 4.1 Stranger Trips (Road Trips & Getaways)
* **Screen:** `stranger_mode_screen.dart`, `stranger_trip_card.dart`
* **List Trips:** `GET /api/v1/stranger/trips`
  * Optional Filters: `?vibe=weekendGetaway&isWomenOnly=false`
* **Create Trip:** `POST /api/v1/stranger/trips`
  * **Payload:**
  ```json
  {
    "origin": "Hyderabad",
    "destination": "Goa (Panjim & Calangute)",
    "date": "Fri, 10 Oct 2026",
    "time": "06:00 AM",
    "mode": "carpool",
    "vibe": "weekendGetaway",
    "totalSeats": 4,
    "pricePerPerson": 1200.0,
    "notes": "Weekend road trip to Goa! Clean SUV with Spotify ready.",
    "interests": ["Road Trips", "Music", "Photography"],
    "isWomenOnly": false
  }
  ```
* **Join Trip:** `POST /api/v1/stranger/trips/:id/join`

---

### 4.2 Stranger Meetups (Coffee, Sports, Board Games)
* **Screen:** `stranger_meetups_section.dart`, `stranger_meetup_details_sheet.dart`
* **List Meetups:** `GET /api/v1/stranger/meetups`
  * Optional Filter: `?category=Coffee%20%26%20Cafes`
* **Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "meetup_01",
      "title": "Weekend Coffee & Tech Founders Pitch",
      "category": "Coffee & Cafes",
      "venueName": "Roastery Coffee House",
      "area": "Road 45, Jubilee Hills",
      "distanceKm": 1.2,
      "date": "This Saturday",
      "time": "05:00 PM - 07:00 PM",
      "hostName": "Arjun Menon",
      "hostAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      "imageUrl": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
      "matchPercentage": 96,
      "maxAttendees": 6,
      "attendeesCount": 4,
      "audienceType": "Everyone",
      "isRsvped": false,
      "tags": ["☕ Coffee", "💻 Tech", "🚀 Startups"],
      "expenseType": "Self-order & split bills at cafe"
    }
  ],
  "message": "Stranger meetups retrieved",
  "success": true
}
```

* **RSVP to a Meetup:**
  * **Method & Path:** `POST /api/v1/stranger/meetups/:id/rsvp`
  * **Auth Required:** ✅ Yes
  * **Response:** Toggles `isRsvped` and updates attendee count.

---

### 4.3 Stranger Plans (Trending & Upcoming)
* **Screen:** `stranger_plans_view_all_screen.dart`, `parallax_plan_card.dart`
* **List Plans:** `GET /api/v1/stranger/plans`
  * Filter Options: `?filter=trending` or `?filter=upcoming`
* **Join a Plan:** `POST /api/v1/stranger/plans/:id/join`

---

### 4.4 Stranger Reels
* **Screen:** `stranger_reels_screen.dart`
* **List Reels:** `GET /api/v1/stranger/reels`
* **Like / Unlike a Reel:** `POST /api/v1/stranger/reels/:id/like`

---

## 💬 5. Chat & Real-Time Messaging

### 5.1 Get My Conversations
* **Method & Path:** `GET /api/v1/chat/conversations`
* **Auth Required:** ✅ Yes

### 5.2 Get Messages for Conversation
* **Method & Path:** `GET /api/v1/chat/conversations/:id/messages`
* **Auth Required:** ✅ Yes

### 5.3 Send Message (HTTP)
* **Method & Path:** `POST /api/v1/chat/conversations/:id/messages`
* **Request Payload (Body):**
```json
{
  "text": "Hey! Reached the pickup point.",
  "type": "TEXT"
}
```

---

## 🏢 6. Communities & Commute Circles

### 6.1 List Communities
* **Method & Path:** `GET /api/v1/communities`

### 6.2 Join a Community
* **Method & Path:** `POST /api/v1/communities/join`
* **Request Payload (Body):**
```json
{
  "communityId": "comm_01"
}
```
