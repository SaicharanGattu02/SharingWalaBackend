# 🔐 Module 1: Authentication & Profile Setup Guide

> **🎯 Base URL:** `http://172.20.10.2:5000/api/v1`  
> **Server Port:** `5000`  
> **Host IP:** `172.20.10.2`  
> **Content-Type:** `application/json`

---

## 📋 Overview of This Module

This module covers the complete onboarding journey for your Flutter app:

```text
1. Login Screen (Enter 10-digit Phone)
       │
       ▼
2. OTP Screen (Verify 6-digit Code) ──► Calls: POST /api/v1/auth/phone-login
       │                                       └─► Returns: { user, token, isProfileCompleted }
       ▼
3. Profile Setup Screen (Name & Gender)
       │
       ▼
4. Preferences Screen (Role, Modes & Area) ──► Calls: PUT /api/v1/user/profile
       │                                               └─► Returns: Full UserProfile
       ▼
5. Home Screen (/home)
```

---

## 📱 STEP 1: Phone Login & OTP Verification

### 🎯 Screens:
* `lib/presentation/authentication/login_screen.dart`
* `lib/presentation/authentication/otp_screen.dart`

### 1.1 Endpoints
* **Send OTP:**
  * **Method:** `POST`
  * **URL:** `http://172.20.10.2:5000/api/v1/auth/send-otp`
  * **Auth Required:** ❌ No
* **Verify OTP & Login:**
  * **Method:** `POST`
  * **URL:** `http://172.20.10.2:5000/api/v1/auth/verify-otp`
  * **Auth Required:** ❌ No
* **Refresh Expired Token:**
  * **Method:** `POST`
  * **URL:** `http://172.20.10.2:5000/api/v1/auth/refresh-token`
  * **Auth Required:** ❌ No

### 1.2 Request Payload (`POST /api/v1/auth/verify-otp`)
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```
> **Note:** Accepts 10-digit mobile number (e.g. `9876543210`) or with country code (`+919876543210`). In development mode, any 4-to-6 digit OTP (e.g. `123456`) is accepted.

### 1.3 Success Response (`200 OK`)
```json
{
  "statusCode": 200,
  "success": true,
  "message": "OTP verified successfully. Logged in.",
  "data": {
    "tokenType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXYybGl1ZG4wMDB3dmFqNGdnbnM4ZjN6Iiwicm9sZSI6IlVTRVIiLCJyb2xlcyI6WyJVU0VSIl0sImlhdCI6MTc2MDY0MjgyMCwiZXhwIjoxNzYwNzI5MjIwfQ...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXYybGl1ZG4wMDB3dmFqNGdnbnM4ZjN6IiwidG9rZW5UeXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MDY0MjgyMCwiZXhwIjoxNzYzMjM0ODIwfQ...",
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
      "id": "cmv2liudn000wvaj4ggns8f3z",
      "uuid": "107e7fa5-cfdf-405f-b1bb-cc5038912f6d",
      "username": "sai_commuter",
      "displayName": "Sai Krishna",
      "phone": "+919876543210",
      "email": "sai@techcorp.com",
      "gender": "MALE",
      "status": "ACTIVE",
      "role": "USER",
      "roles": [
        "USER"
      ],
      "driverProfile": null
    }
  }
}
```

### 1.4 Flutter Integration Code (`otp_screen.dart`)
In `lib/presentation/authentication/otp_screen.dart`:

```dart
void _onVerifyPressed() async {
  final otp = _pinController.text.trim();
  if (otp.length < 4) {
    _errorNotifier.value = "Please enter valid OTP code";
    return;
  }

  _errorNotifier.value = null;
  _isLoadingNotifier.value = true;

  try {
    // 1. Call Backend API
    final response = await ApiService.verifyOtp(
      widget.phoneNumber,
      otp,
    );

    // 2. Tokens & Role are automatically stored in SharedPreferences via ApiService.saveAuthSession:
    //    - accessToken
    //    - refreshToken
    //    - role ('USER' or 'RIDER')
    //    - expiryTime
    final bool isProfileCompleted = response['isProfileCompleted'] ?? false;
    final String role = response['role'] ?? 'USER';

    if (!mounted) return;
    _isLoadingNotifier.value = false;

    // 3. Navigation based on profile completion and role
    if (isProfileCompleted) {
      context.go('/home');
    } else {
      context.go('/profile-setup');
    }
  } catch (e) {
    if (!mounted) return;
    _isLoadingNotifier.value = false;
    _errorNotifier.value = e.toString().replaceAll('Exception: ', '');
  }
}
```

---

## 📱 STEP 2: Profile Setup (Basic Details)

### 🎯 Screen:
* `lib/presentation/profile_setup/profile_setup_screen.dart`
* `lib/presentation/profile_setup/widgets/step1_basic_details_view.dart`

### 2.1 Action
Saves temporary state (Name, Gender, Host vs Guest) and passes to the next preferences step:

```dart
void _onNext() async {
  final name = _nameController.text.trim();
  if (name.isEmpty) {
    CustomSnackBar.show(context, 'Please enter your name');
    return;
  }

  // Save temporary values to storage for next step
  await SecureStorageService.instance.setString('temp_name', name);
  await SecureStorageService.instance.setString('temp_gender', _genderNotifier.value);
  await SecureStorageService.instance.setString(
    'user_role',
    _roleNotifier.value == UserRolePreference.offerRide ? 'Host' : 'Guest',
  );

  context.push('/profile-preferences', extra: _roleNotifier.value);
}
```

---

## 📱 STEP 3: Profile Preferences & Completion

### 🎯 Screen:
* `lib/presentation/profile_setup/profile_preferences_screen.dart`
* `lib/presentation/profile_setup/widgets/step2_preferences_view.dart`

### 3.1 Endpoint
* **Method:** `PUT`
* **URL:** `http://172.20.10.2:5000/api/v1/user/profile`
* **Auth Required:** ✅ Yes (`Authorization: Bearer <token>`)

### 3.2 Request Payload
```json
{
  "displayName": "Sai Krishna",
  "gender": "MALE",
  "homeArea": "Kondapur Main Road",
  "workArea": "Cyber Towers, Hitech City",
  "preferredMode": "both",
  "rolePreference": "both",
  "womenOnlyPreference": false
}
```

### 3.3 Success Response (`200 OK`)
Returns the complete `UserProfile` matching your Flutter model:
```json
{
  "statusCode": 200,
  "data": {
    "id": "cmv2liudn000wvaj4ggns8f3z",
    "name": "Sai Krishna",
    "phone": "+919876543210",
    "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    "gender": "Male",
    "homeArea": "Kondapur Main Road",
    "workArea": "Cyber Towers, Hitech City",
    "preferredMode": "both",
    "rolePreference": "both",
    "identityVerified": true,
    "driverVerified": true,
    "rating": 4.95,
    "totalRidesCompleted": 48,
    "vehicles": [],
    "trustedContacts": [],
    "joinedCommunities": [],
    "womenOnlyPreference": false
  },
  "message": "Profile updated successfully",
  "success": true
}
```

### 3.4 Flutter Integration Code (`profile_preferences_screen.dart`)
Replace `_saveAndCompleteProfile()` in `lib/presentation/profile_setup/profile_preferences_screen.dart`:

```dart
Future<void> _saveAndCompleteProfile() async {
  if (!_isAgreedNotifier.value) {
    CustomSnackBar.show(context, 'Please agree to the Community Trust Pledge & Terms');
    return;
  }

  _isLoadingNotifier.value = true;

  try {
    final name = await SecureStorageService.instance.getString('temp_name') ?? 'Commuter';
    final gender = await SecureStorageService.instance.getString('temp_gender') ?? 'MALE';

    // 1. Submit Profile to Backend API
    await ApiService.updateUserProfile({
      'displayName': name,
      'gender': gender.toUpperCase(),
      'homeArea': 'Kondapur, Hyderabad',
      'workArea': 'Hitech City, Hyderabad',
      'rolePreference': _rolePreferenceNotifier.value == UserRolePreference.offerRide ? 'offerRide' : 'findRide',
      'preferredMode': _selectedModeNotifier.value.name,
      'womenOnlyPreference': false,
    });

    await SecureStorageService.instance.setBool('profile_setup_completed', true);

    if (!mounted) return;
    _isLoadingNotifier.value = false;

    // 2. Navigate to Home
    context.go('/home');
  } catch (e) {
    if (!mounted) return;
    _isLoadingNotifier.value = false;
    CustomSnackBar.show(context, e.toString().replaceAll('Exception: ', ''));
  }
}
```

---

## 📱 STEP 4: Session Restoration on App Launch

### 🎯 Screen:
* Splash Screen / `main.dart` initial routing

### 4.1 Endpoint
* **Method:** `GET`
* **URL:** `http://172.20.10.2:5000/api/v1/user/profile`
* **Auth Required:** ✅ Yes (`Authorization: Bearer <token>`)

### 4.2 Flutter Integration Code:
```dart
Future<void> checkSessionAndLaunch() async {
  final token = await ApiService.getToken();
  if (token != null && token.isNotEmpty) {
    try {
      // 1. Fetches live user profile
      final UserProfile user = await ApiService.getUserProfile();
      context.go('/home');
      return;
    } catch (_) {
      // Token expired or invalid
      await ApiService.removeToken();
    }
  }
  // Not logged in
  context.go('/login');
}
```

---

## 🧪 Quick Verification Tests (PowerShell / Terminal)

### Test 1: Phone Login
```bash
curl -X POST http://172.20.10.2:5000/api/v1/auth/phone-login \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"9876543210\", \"otp\":\"123456\"}"
```

### Test 2: Password Login
```bash
curl -X POST http://172.20.10.2:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"+919876543210\", \"password\":\"Secret@123\"}"
```

### Test 3: Password Signup (New User)
```bash
curl -X POST http://172.20.10.2:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"ravi_teja\", \"displayName\":\"Ravi Teja\", \"phone\":\"+919123456789\", \"password\":\"Password@123\"}"
```
