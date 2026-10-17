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

### 2.4 Search Available Rides (Carpool, Bikepool, Other)
* **Screen:** `search_rides_screen.dart`, `ride_result_item_card.dart`
* **Method & Path:** `GET /api/v1/user/rides/search`
* **Auth Required:** ❌ Optional (Publicly accessible)
* **Query Parameters:**
  * `origin`: (e.g. `Kondapur`)
  * `destination`: (e.g. `Hitech City`)
  * `mode`: `carpool`, `bikepool`, `other`, or `all`
  * `womenOnly`: `true` or `false`
* **Example URL:** `http://localhost:5000/api/v1/user/rides/search?mode=all`
* **Success Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "ride_101",
      "driverId": "drv_1",
      "driverName": "Ravi Kumar",
      "driverAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      "rating": 4.95,
      "totalRides": 124,
      "isVerified": true,
      "routeMatchPercentage": 95,
      "origin": "Kondapur Main Road",
      "destination": "Cyber Towers, Hitech City",
      "departureTime": "08:30 AM",
      "date": "Today",
      "mode": "carpool",
      "rideType": "recurring",
      "availableSeats": 3,
      "totalSeats": 4,
      "vehicleName": "Honda City",
      "vehicleNumber": "TS 07 FA 1024",
      "vehicleColor": "Silver",
      "communityName": "Hitech Techies Community",
      "pickupFlexibility": "Flexible within 500m",
      "notes": "Daily office commute. Clean car, pleasant music, split fuel cost community ride.",
      "status": "available",
      "meetingPoint": "Near Kondapur Signal Metro Pillar 42",
      "isWomenOnly": false,
      "pricePerSeat": 45.0
    }
  ],
  "message": "Available rides found",
  "success": true
}
```

---

### 2.5 Get Ride Details
* **Screen:** `ride_details_screen.dart`
* **Method & Path:** `GET /api/v1/user/rides/:id`
* **Auth Required:** ❌ Optional
* **Success Response (`200 OK`):** Returns the full Ride object plus `stopsTimeline`:
```json
{
  "statusCode": 200,
  "data": {
    "id": "ride_101",
    "driverName": "Ravi Kumar",
    "origin": "Kondapur Main Road",
    "destination": "Cyber Towers, Hitech City",
    "availableSeats": 3,
    "pricePerSeat": 45.0,
    "stopsTimeline": [
      {
        "id": "stop_1",
        "name": "Kondapur Main Road",
        "sequence": 1,
        "type": "START",
        "time": "08:30 AM"
      },
      {
        "id": "stop_2",
        "name": "Cyber Towers, Hitech City",
        "sequence": 2,
        "type": "END",
        "time": "09:15 AM"
      }
    ]
  },
  "message": "Ride details retrieved",
  "success": true
}
```

---

### 2.6 Request a Seat on a Ride
* **Screen:** `request_seat_bottom_sheet.dart`
* **Method & Path:** `POST /api/v1/user/rides/:id/request-seat`
* **Auth Required:** ✅ Yes
* **Request Payload (Body):**
```json
{
  "seats": 1,
  "pickupPoint": "Kondapur Signal",
  "dropoffPoint": "Cyber Towers Gate 2",
  "notes": "Daily commute. Carrying laptop bag."
}
```
* **Success Response (`201 Created`):**
```json
{
  "statusCode": 201,
  "data": {
    "bookingId": "bk_9823...",
    "rideId": "ride_101",
    "status": "requestSent",
    "seatsBooked": 1,
    "totalFare": 45.0,
    "message": "Seat request sent to rider."
  },
  "message": "Seat request sent to rider.",
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
  "pricePerSeat": 45.0,
  "meetingPoint": "Kondapur Signal Metro Pillar 42",
  "notes": "Daily IT office commute. AC car.",
  "isWomenOnly": false,
  "autoAccept": false
}
```
* **Success Response (`201 Created`):** Returns published `Ride` object.

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

### 3.6 Update Ride Status (Start, Complete, Cancel)
* **Screen:** Host In-Ride Screen
* **Method & Path:** `PATCH /api/v1/rider/rides/:rideId/status`
* **Auth Required:** ✅ Yes
* **Request Payload (Body):**
```json
{
  "status": "IN_PROGRESS"
}
```
> `status` options: `"IN_PROGRESS"`, `"COMPLETED"`, `"CANCELLED"`.

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
