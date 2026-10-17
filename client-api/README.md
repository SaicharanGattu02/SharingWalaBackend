# 🚀 SHARE2GO Persona-Driven API Integration Guide

This directory contains a **clean, centralized, and reusable API service layer** divided into 3 distinct user modules matching your app screens:
1. **👤 User (Guest / Commuter / Passenger)**
2. **🚗 Rider (Host / Driver / Vehicle Owner)**
3. **🌟 Stranger Mode (Social Trips, Meetups, Plans, Reels)**

---

## 📁 Clean Architecture Folder Structure

```text
SHARE2GO/
├── src/modules/
│   ├── user/                  # 👤 Passenger endpoints (/api/v1/user)
│   ├── rider/                 # 🚗 Driver/Host endpoints (/api/v1/rider)
│   ├── stranger/              # 🌟 Stranger Mode endpoints (/api/v1/stranger)
│   ├── auth/                  # 🔐 Login, Register, Profile (/api/v1/auth)
│   ├── chat/                  # 💬 Messaging & Real-Time Chat (/api/v1/chat)
│   └── communities/           # 🏢 Commute circles (/api/v1/communities)
│
└── client-api/
    ├── flutter/
    │   └── api_service.dart   # 🎯 Ready-to-use Flutter Dart service (Drop into lib/services/)
    ├── modules/
    │   ├── user.api.js        # JavaScript User (Passenger) API client
    │   ├── rider.api.js       # JavaScript Rider (Driver) API client
    │   ├── stranger.api.js    # JavaScript Stranger Mode API client
    │   ├── auth.api.js        # Authentication client
    │   └── chat.api.js        # Real-time Chat client
    ├── config.js              # Base URLs & Storage helpers
    ├── httpClient.js          # Central Axios HTTP client
    ├── socketClient.js        # Socket.io real-time client
    └── index.js               # Central export barrel
```

---

## 📱 Flutter Mobile App Integration

Use the endpoint specs provided in [API_INTEGRATION_CHEATSHEET.md](file:///d:/node_projects/SHARE2GO/API_INTEGRATION_CHEATSHEET.md) and [OTP_INTEGRATION_GUIDE.md](file:///d:/node_projects/SHARE2GO/OTP_INTEGRATION_GUIDE.md).

### 1. Base URL for Flutter
In `lib/services/api_service.dart`:
* **Android Emulator:** `http://10.0.2.2:5000/api/v1`
* **Physical Device (via Wi-Fi):** `http://172.20.10.2:5000/api/v1`
* **iOS Simulator / Web:** `http://localhost:5000/api/v1`

---

### 2. Screen-by-Screen Flutter Usage

#### A. `search_rides_screen.dart` (Search Available Carpool & Bikepool Rides)
```dart
import '../services/api_service.dart';
import '../models/ride_model.dart';

// Fetch rides with live filters
List<Ride> availableRides = await ApiService.searchRides(
  origin: 'Kondapur',
  destination: 'Hitech City',
  mode: 'all', // 'carpool', 'bikepool', 'all'
  womenOnly: false,
);
```

#### B. `ride_details_screen.dart` & `request_seat_bottom_sheet.dart`
```dart
// 1. Get full ride details
Ride ride = await ApiService.getRideDetails(rideId);

// 2. Request seat
final result = await ApiService.requestSeat(
  ride.id,
  seats: 1,
  notes: 'Office commute. Boarding at Kondapur signal.',
);
print(result['message']);
```

#### C. `my_rides_screen.dart` & `my_ride_card.dart`
```dart
// Returns categorized rides matching your tabs!
final myRides = await ApiService.getMyRides();

List<Ride> activeRides = myRides['active']!;
List<Ride> upcomingRides = myRides['upcoming']!;
List<Ride> completedRides = myRides['completed']!;
```

#### D. `active_ride_details_sheet.dart` (Live Tracking & Safety)
```dart
final activeTracking = await ApiService.getActiveRideTracking(rideId);

print('Driver: ${activeTracking['driverName']}');
print('OTP: ${activeTracking['otp']}');
print('Meeting Point: ${activeTracking['meetingPoint']}');
print('Current Location: ${activeTracking['currentLocation']}');
```

#### E. `offer_ride_screen.dart` (Host / Rider Offering a Ride)
```dart
final offeredRide = await ApiService.offerRide({
  'vehicleId': 'v_01',
  'mode': 'carpool',
  'rideType': 'recurring',
  'activeDays': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  'origin': 'Kondapur, Hyderabad',
  'destination': 'Hitech City, Hyderabad',
  'departureTime': '08:30 AM',
  'availableSeats': 3,
  'pricePerSeat': 45.0,
  'isWomenOnly': false,
  'notes': 'Daily IT commute. Clean AC car.',
});
```

#### F. `stranger_mode_screen.dart` (Stranger Trips, Meetups, Plans, Reels)
```dart
// 1. Road Trips & Weekend Getaways
List<StrangerTrip> trips = await ApiService.getStrangerTrips(vibe: 'weekendGetaway');

// 2. Social Meetups (Coffee, Sports, Board Games)
List<StrangerMeetup> meetups = await ApiService.getStrangerMeetups(category: 'Coffee & Cafes');

// 3. RSVP to a Meetup
await ApiService.rsvpStrangerMeetup(meetup.id);

// 4. Trending & Upcoming Plans
List<StrangerPlan> plans = await ApiService.getStrangerPlans(filter: 'trending');

// 5. Short Video Reels
List<StrangerReel> reels = await ApiService.getStrangerReels();
```

---

## 💻 How to Integrate in JavaScript / Web / React

If building a web/admin interface or React Native app:

```javascript
import api, { userApi, riderApi, strangerApi, authApi } from './client-api';

// 1. Login
await authApi.login({ identifier: '+919876543210', password: 'Secret@123' });

// 2. User (Passenger) search
const rides = await userApi.searchRides({ origin: 'Kondapur', destination: 'Hitech City' });

// 3. Rider (Driver) offer ride
await riderApi.offerRide({
  vehicleId: 'v_01',
  origin: 'Kondapur',
  destination: 'Hitech City',
  departureTime: '08:30 AM',
  availableSeats: 3,
  pricePerSeat: 45,
});

// 4. Stranger Mode meetups
const meetups = await strangerApi.getMeetups({ category: 'Coffee & Cafes' });
```
