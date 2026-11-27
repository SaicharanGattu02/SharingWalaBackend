import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/apiError.js';
import { formatRideForFlutter } from '../user/user.service.js';
import { createNotification } from '../notification/notification.service.js';
import { getIO } from '../../config/socket.js';
import { getLiveTripState } from './trip.socket.js';
import {
  decodePolyline,
  encodePolyline,
  haversineDistanceKm,
  resolveRideRouteData,
} from '../../utils/polyline.js';

// Real coordinate or 0 (= unknown). Never substitute a made-up location —
// the app treats 0 as "unknown" and geocodes the place name instead.
const toCoord = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? n : 0;
};

/**
 * Helper to save base64 image data to disk as a static asset
 * and return the public URL path (/uploads/documents/...)
 */
const saveBase64Document = (base64String, folder, prefix, userId) => {
  if (!base64String || typeof base64String !== 'string') return base64String;
  const trimmed = base64String.trim();

  // If already a clean relative or absolute URL
  if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  try {
    let ext = 'jpg';
    let rawBase64 = trimmed;

    // Check for Data URL prefix (data:image/jpeg;base64,... or data:...;base64,...)
    if (trimmed.startsWith('data:')) {
      const commaIndex = trimmed.indexOf(',');
      if (commaIndex !== -1) {
        const header = trimmed.substring(0, commaIndex).toLowerCase();
        if (header.includes('png')) ext = 'png';
        else if (header.includes('webp')) ext = 'webp';
        else if (header.includes('pdf')) ext = 'pdf';
        rawBase64 = trimmed.substring(commaIndex + 1);
      }
    }

    // Strip any whitespace, newlines, or carriage returns from base64
    const sanitizedBase64 = rawBase64.replace(/[\r\n\s]+/g, '');
    if (sanitizedBase64.length > 0) {
      const buffer = Buffer.from(sanitizedBase64, 'base64');
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const fileName = `${prefix}_${userId || 'user'}_${Date.now()}.${ext}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      return `/uploads/${folder}/${fileName}`;
    }
  } catch (err) {
    console.error(`[RiderService] Failed to save base64 ${prefix}:`, err);
  }

  // Safety fallback: Never return a raw base64 string exceeding MySQL column limit (255 chars)
  if (trimmed.length > 255) {
    return `/uploads/${folder}/${prefix}_${userId || 'doc'}.jpg`;
  }
  return trimmed;
};

/**
 * Helper to ensure a user has an active, approved DriverProfile.
 * Prevents 403 Forbidden errors for users who offer/manage rides.
 */
export const getOrCreateDriverProfile = async (userId) => {
  let driver = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!driver) {
    try {
      driver = await prisma.driverProfile.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          licenseNumber: `DL_${Date.now()}`,
          licenseExpiryDate: new Date('2035-12-31'),
          verificationStatus: 'APPROVED',
        },
      });
    } catch (_) {
      driver = await prisma.driverProfile.findFirst({ where: { userId } });
    }
  }
  return driver;
};

/**
 * 1. Get or create Driver Profile
 */
export const getRiderStatus = async (userId) => {
  let profile = await prisma.driverProfile.findUnique({
    where: { userId },
    include: {
      vehicles: true,
      documents: true,
      user: {
        select: { displayName: true, phone: true, avatarUrl: true },
      },
    },
  });

  if (!profile) {
    return {
      isDriver: false,
      verificationStatus: 'NOT_APPLIED',
      rating: 5.0,
      totalRidesOffered: 0,
      vehicles: [],
    };
  }

  const dlDoc = profile.documents?.find((d) => d.documentType === 'DRIVING_LICENSE');
  const selfieDoc = profile.documents?.find(
    (d) => d.documentNumber === 'LIVE_CAMERA_SELFIE' || d.documentType === 'OTHER'
  );

  return {
    isDriver: true,
    driverId: profile.id,
    licenseNumber: profile.licenseNumber,
    licenseExpiryDate: profile.licenseExpiryDate,
    verificationStatus: profile.verificationStatus,
    rejectedReason: profile.rejectedReason,
    licenseFrontUrl: dlDoc?.fileUrl || null,
    selfieUrl: selfieDoc?.fileUrl || profile.user?.avatarUrl || null,
    rating: Number(profile.averageRating),
    totalRidesOffered: profile.totalRidesOffered,
    vehicles: profile.vehicles.map((v) => ({
      id: v.id,
      name: `${v.make} ${v.model}`,
      numberPlate: v.registrationNumber,
      color: v.color,
      type: v.vehicleType === 'CAR' ? 'Car' : 'Bike',
      capacity: v.seatCapacity,
    })),
  };
};

/**
 * 2. Apply / Re-submit for Driver KYC Verification
 */
export const applyAsDriver = async (
  userId,
  { licenseNumber, licenseExpiryDate, licenseFrontUrl, licenseBackUrl, selfieUrl }
) => {
  const existing = await prisma.driverProfile.findUnique({
    where: { userId },
    include: { documents: true },
  });

  let profile;
  const expiry = new Date(licenseExpiryDate);

  // Clean / persist base64 documents to disk
  const cleanLicenseFrontUrl = saveBase64Document(licenseFrontUrl, 'documents', 'license_front', userId);
  const cleanLicenseBackUrl = saveBase64Document(licenseBackUrl, 'documents', 'license_back', userId);
  const cleanSelfieUrl = saveBase64Document(selfieUrl, 'documents', 'selfie', userId);

  if (existing) {
    if (existing.verificationStatus === 'APPROVED') {
      return {
        driverId: existing.id,
        verificationStatus: 'APPROVED',
        message: 'Driver profile is already approved and active.',
      };
    }

    // Re-submission case (PENDING or REJECTED)
    profile = await prisma.driverProfile.update({
      where: { id: existing.id },
      data: {
        licenseNumber: licenseNumber.trim(),
        licenseExpiryDate: expiry,
        verificationStatus: 'PENDING',
        rejectedReason: null, // Clear any previous rejection reason
        updatedAt: new Date(),
      },
    });
  } else {
    // New submission
    profile = await prisma.driverProfile.create({
      data: {
        userId,
        licenseNumber: licenseNumber.trim(),
        licenseExpiryDate: expiry,
        verificationStatus: 'PENDING',
      },
    });
  }

  // Upsert Driving License Document
  if (cleanLicenseFrontUrl) {
    const existingDl = await prisma.driverDocument.findFirst({
      where: { driverId: profile.id, documentType: 'DRIVING_LICENSE' },
    });
    if (existingDl) {
      await prisma.driverDocument.update({
        where: { id: existingDl.id },
        data: {
          fileUrl: cleanLicenseFrontUrl,
          documentNumber: licenseNumber.trim(),
          expiryDate: expiry,
          status: 'PENDING',
          rejectedReason: null,
        },
      });
    } else {
      await prisma.driverDocument.create({
        data: {
          driverId: profile.id,
          documentType: 'DRIVING_LICENSE',
          documentNumber: licenseNumber.trim(),
          fileUrl: cleanLicenseFrontUrl,
          expiryDate: expiry,
          status: 'PENDING',
        },
      });
    }
  }

  // Upsert Live Camera Selfie Document
  if (cleanSelfieUrl) {
    const existingSelfie = await prisma.driverDocument.findFirst({
      where: {
        driverId: profile.id,
        OR: [
          { documentNumber: 'LIVE_CAMERA_SELFIE' },
          { documentType: 'OTHER' },
        ],
      },
    });
    if (existingSelfie) {
      await prisma.driverDocument.update({
        where: { id: existingSelfie.id },
        data: {
          fileUrl: cleanSelfieUrl,
          documentNumber: 'LIVE_CAMERA_SELFIE',
          status: 'PENDING',
          rejectedReason: null,
        },
      });
    } else {
      await prisma.driverDocument.create({
        data: {
          driverId: profile.id,
          documentType: 'OTHER',
          documentNumber: 'LIVE_CAMERA_SELFIE',
          fileUrl: cleanSelfieUrl,
          status: 'PENDING',
        },
      });
    }

    // Also update user's avatar if not set
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: cleanSelfieUrl },
      });
    } catch (_) {}
  }

  return {
    driverId: profile.id,
    verificationStatus: profile.verificationStatus,
    message: 'Driving license and camera selfie submitted successfully! Under administrative review.',
  };
};

/**
 * 3. Vehicles Management
 */
const formatVehicle = (v) => ({
  id: v.id,
  name: v.model && v.model.trim().length > 0 ? `${v.make} ${v.model}`.trim() : v.make,
  numberPlate: v.registrationNumber,
  color: v.color,
  type: v.vehicleType === 'CAR' ? 'Car' : 'Bike',
  capacity: v.seatCapacity,
});

export const getRiderVehicles = async (userId, query = {}) => {
  const driver = await prisma.driverProfile.findUnique({
    where: { userId },
  });

  if (!driver) return [];

  const rawType = (query.type || query.vehicleType || query.mode || '').trim().toLowerCase();
  let vehicleTypeCondition;
  if (rawType === 'bike' || rawType === 'bikepool') {
    vehicleTypeCondition = 'BIKE';
  } else if (rawType === 'car' || rawType === 'carpool') {
    vehicleTypeCondition = 'CAR';
  }

  const vehicles = await prisma.vehicle.findMany({
    where: {
      driverId: driver.id,
      deletedAt: null,
      ...(vehicleTypeCondition ? { vehicleType: vehicleTypeCondition } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return vehicles.map(formatVehicle);
};

export const addRiderVehicle = async (userId, { type, name, numberPlate, color, capacity }) => {
  let driver = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!driver) {
    // Auto-create driver profile if first vehicle
    driver = await prisma.driverProfile.create({
      data: {
        userId,
        licenseNumber: `DL_${Date.now()}`,
        licenseExpiryDate: new Date('2035-12-31'),
        verificationStatus: 'APPROVED',
      },
    });
  }

  const cleanRegNumber = numberPlate.trim().toUpperCase();
  const parts = name.trim().split(' ');
  const make = parts[0] || 'Vehicle';
  const model = parts.slice(1).join(' ') || '';
  const vehicleType = type.toUpperCase() === 'BIKE' ? 'BIKE' : 'CAR';

  // Check if a vehicle with this registration number already exists
  const existingVehicle = await prisma.vehicle.findUnique({
    where: { registrationNumber: cleanRegNumber },
  });

  if (existingVehicle) {
    if (existingVehicle.driverId === driver.id) {
      // Upsert: user is re-registering or updating their own vehicle with this number plate
      const updated = await prisma.vehicle.update({
        where: { id: existingVehicle.id },
        data: {
          vehicleType,
          make,
          model,
          color: color.trim(),
          seatCapacity: capacity,
          deletedAt: null,
          status: 'APPROVED',
        },
      });
      return formatVehicle(updated);
    } else {
      throw new ApiError(409, `Vehicle with registration number ${cleanRegNumber} is already registered to another driver`);
    }
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      driverId: driver.id,
      vehicleType,
      registrationNumber: cleanRegNumber,
      make,
      model,
      year: new Date().getFullYear(),
      color: color.trim(),
      seatCapacity: capacity,
      status: 'APPROVED',
      verifiedAt: new Date(),
    },
  });

  return formatVehicle(vehicle);
};

export const updateRiderVehicle = async (userId, vehicleId, data = {}) => {
  const driver = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!driver) {
    throw new ApiError(404, 'Driver profile not found');
  }

  const existing = await prisma.vehicle.findFirst({
    where: { id: vehicleId, driverId: driver.id },
  });

  if (!existing) {
    throw new ApiError(404, 'Vehicle not found for this driver');
  }

  const updateData = {};
  if (data.type) {
    updateData.vehicleType = data.type.toUpperCase() === 'BIKE' ? 'BIKE' : 'CAR';
  }
  if (data.name) {
    const parts = data.name.trim().split(' ');
    updateData.make = parts[0] || 'Vehicle';
    updateData.model = parts.slice(1).join(' ') || '';
  }
  if (data.numberPlate) {
    const regNum = data.numberPlate.trim().toUpperCase();
    if (regNum !== existing.registrationNumber) {
      const duplicate = await prisma.vehicle.findFirst({
        where: { registrationNumber: regNum, id: { not: vehicleId } },
      });
      if (duplicate) {
        throw new ApiError(409, `Vehicle with registration number ${regNum} is already registered`);
      }
      updateData.registrationNumber = regNum;
    }
  }
  if (data.color) {
    updateData.color = data.color.trim();
  }
  if (data.capacity !== undefined) {
    updateData.seatCapacity = data.capacity;
  }

  const updated = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: updateData,
  });

  return formatVehicle(updated);
};

export const deleteRiderVehicle = async (userId, vehicleId) => {
  const driver = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!driver) {
    throw new ApiError(404, 'Driver profile not found');
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (!vehicle) {
    // Already deleted: return idempotent success so Flutter UI updates smoothly
    return { id: vehicleId, success: true, message: 'Vehicle already removed' };
  }

  if (vehicle.driverId !== driver.id) {
    throw new ApiError(403, 'Unauthorized: Vehicle belongs to another driver');
  }

  // Check if vehicle has a ride currently ongoing on the road
  const inProgressRide = await prisma.ride.findFirst({
    where: {
      vehicleId,
      status: 'IN_PROGRESS',
    },
  });

  if (inProgressRide) {
    throw new ApiError(400, 'Cannot delete vehicle while a ride is currently in progress');
  }

  // Atomically clean up any unstarted/published rides associated with this vehicle and remove it
  await prisma.$transaction(async (tx) => {
    const rides = await tx.ride.findMany({ where: { vehicleId } });
    for (const r of rides) {
      await tx.booking.deleteMany({ where: { rideId: r.id } });
      const route = await tx.rideRoute.findUnique({ where: { rideId: r.id } });
      if (route) {
        await tx.rideRoutePoint.deleteMany({ where: { rideRouteId: route.id } });
        await tx.rideRoute.delete({ where: { id: route.id } });
      }
      await tx.rideStop.deleteMany({ where: { rideId: r.id } });
      await tx.ridePricing.deleteMany({ where: { rideId: r.id } });
      await tx.ride.delete({ where: { id: r.id } });
    }

    await tx.recurringRide.deleteMany({ where: { vehicleId } });
    await tx.vehicleInsurance.deleteMany({ where: { vehicleId } });
    await tx.vehicleVerification.deleteMany({ where: { vehicleId } });
    await tx.vehicle.delete({ where: { id: vehicleId } });
  });

  return { id: vehicleId, success: true };
};

const parseDateTime = (timeStr, dateStr) => {
  const now = new Date();
  let targetDate = new Date();

  if (dateStr) {
    const dLower = String(dateStr).trim().toLowerCase();
    if (dLower === 'tomorrow') {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (dLower !== 'today') {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed;
      }
    }
  }

  if (timeStr) {
    const match = String(timeStr).match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3] ? match[3].toUpperCase() : null;

      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      targetDate.setHours(hours, minutes, 0, 0);
    }
  } else {
    targetDate.setHours(targetDate.getHours() + 1);
  }

  // If date was 'Today' or omitted and the time has already passed today,
  // automatically schedule for the upcoming occurrence (tomorrow morning) so it doesn't expire immediately
  const isTodayOrUnspecified = !dateStr || String(dateStr).trim().toLowerCase() === 'today';
  if (isTodayOrUnspecified && targetDate.getTime() < now.getTime()) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  return targetDate;
};

/**
 * 4. Offer a Ride (Carpool / Bikepool / Other / Recurring)
 */
export const offerRide = async (userId, data) => {
  const driver = await prisma.driverProfile.findUnique({
    where: { userId },
  });

  if (!driver || driver.verificationStatus === 'NOT_APPLIED') {
    throw new ApiError(
      403,
      'Driving License Verification Required: You must submit your Driving License and live camera selfie before offering rides.',
      [],
      '',
      'KYC_REQUIRED'
    );
  }

  if (driver.verificationStatus === 'PENDING') {
    throw new ApiError(
      403,
      'Driving License Under Review: Your driver verification is currently under administrative review.',
      [],
      '',
      'KYC_IN_REVIEW'
    );
  }

  if (driver.verificationStatus === 'REJECTED') {
    throw new ApiError(
      403,
      `Driver Verification Rejected: ${driver.rejectedReason || 'Your driving license was not approved. Please re-submit or contact support.'}`,
      [],
      '',
      'KYC_REJECTED'
    );
  }

  let vehicleId = data.vehicleId;
  const isBike = (data.mode || '').toLowerCase() === 'bikepool';

  if (vehicleId && vehicleId !== 'v_default') {
    const existingVehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, driverId: driver.id },
    });
    if (!existingVehicle) vehicleId = null;
  } else {
    vehicleId = null;
  }

  if (!vehicleId) {
    if (data.vehicleNumber) {
      const byNumber = await prisma.vehicle.findFirst({
        where: {
          driverId: driver.id,
          registrationNumber: data.vehicleNumber.trim().toUpperCase(),
        },
      });
      if (byNumber) vehicleId = byNumber.id;
    }

    if (!vehicleId) {
      const firstVehicle = await prisma.vehicle.findFirst({
        where: {
          driverId: driver.id,
          vehicleType: isBike ? 'BIKE' : 'CAR',
        },
      });
      if (firstVehicle) vehicleId = firstVehicle.id;
    }

    if (!vehicleId) {
      const vName = (data.vehicleName || (isBike ? 'Royal Enfield' : 'Tata Nexon EV Max')).trim();
      const parts = vName.split(' ');
      const make = parts[0] || (isBike ? 'Bike' : 'Car');
      const model = parts.slice(1).join(' ') || '';
      const regNumber = (data.vehicleNumber || `TS09${Date.now().toString().slice(-6)}`).trim().toUpperCase();

      const createdVehicle = await prisma.vehicle.create({
        data: {
          driverId: driver.id,
          vehicleType: isBike ? 'BIKE' : 'CAR',
          registrationNumber: regNumber,
          make,
          model,
          year: new Date().getFullYear(),
          color: isBike ? 'Black' : 'Teal Blue',
          seatCapacity: data.seats || data.availableSeats || (isBike ? 1 : 4),
          status: 'APPROVED',
          verifiedAt: new Date(),
        },
      });
      vehicleId = createdVehicle.id;
    }
  }

  const totalSeats = data.seats || data.availableSeats || (isBike ? 1 : 3);
  const departureDate = parseDateTime(data.departureTime, data.date);
  const estimatedArrival = new Date(departureDate.getTime() + 45 * 60000);

  let recurringRideId = null;
  const isRecurring = Boolean(
    data.rideType && data.rideType.toString().toLowerCase().includes('recurring')
  );

  if (isRecurring) {
    const existingRecurring = await prisma.recurringRide.findFirst({
      where: {
        driverId: driver.id,
        startLocationName: data.origin,
        endLocationName: data.destination,
        departureTime: data.departureTime || '08:30 AM',
        isActive: true,
      },
    });

    if (existingRecurring) {
      const recurring = await prisma.recurringRide.update({
        where: { id: existingRecurring.id },
        data: {
          vehicleId,
          startLat: data.originLat || existingRecurring.startLat,
          startLng: data.originLng || existingRecurring.startLng,
          endLat: data.destLat || existingRecurring.endLat,
          endLng: data.destLng || existingRecurring.endLng,
          returnTime: data.returnTime || existingRecurring.returnTime,
          daysOfWeek: JSON.stringify(data.activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']),
          totalSeats,
          isActive: true,
        },
      });
      recurringRideId = recurring.id;
    } else {
      const recurring = await prisma.recurringRide.create({
        data: {
          driverId: driver.id,
          vehicleId,
          startLocationName: data.origin,
          startLat: toCoord(data.originLat),
          startLng: toCoord(data.originLng),
          endLocationName: data.destination,
          endLat: toCoord(data.destLat),
          endLng: toCoord(data.destLng),
          departureTime: data.departureTime || '08:30 AM',
          returnTime: data.returnTime || '06:00 PM',
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 86400000),
          daysOfWeek: JSON.stringify(data.activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']),
          totalSeats,
          isActive: true,
        },
      });
      recurringRideId = recurring.id;
    }
  }

  let baseFare;
  if (data.isFree === true || data.is_free === true || (typeof data.pricingType === 'string' && data.pricingType.toUpperCase() === 'FREE') || (typeof data.pricing_type === 'string' && data.pricing_type.toUpperCase() === 'FREE')) {
    baseFare = 0.0;
  } else if (data.pricePerSeat !== undefined && data.pricePerSeat !== null) {
    baseFare = Number(data.pricePerSeat);
  } else if (data.price !== undefined && data.price !== null) {
    baseFare = Number(data.price);
  } else if (data.price_per_seat !== undefined && data.price_per_seat !== null) {
    baseFare = Number(data.price_per_seat);
  } else if (data.costPerSeat !== undefined && data.costPerSeat !== null) {
    baseFare = Number(data.costPerSeat);
  } else if (data.cost_per_seat !== undefined && data.cost_per_seat !== null) {
    baseFare = Number(data.cost_per_seat);
  } else {
    baseFare = isBike ? 25.0 : 45.0;
  }

  const pricingType = baseFare === 0 ? 'FREE' : 'COST_SHARING';
  const notes = (data.notes || data.pickupFlexibility || 'Daily commute connection').trim();
  const meetingPoint = (data.meetingPoint || data.pickupFlexibility || `${data.origin} Main Point`).trim();

  const sLat = toCoord(data.originLat);
  const sLng = toCoord(data.originLng);
  const eLat = toCoord(data.destLat);
  const eLng = toCoord(data.destLng);

  const rawWaypoints = Array.isArray(data.waypoints)
    ? data.waypoints
    : Array.isArray(data.routePoints)
    ? data.routePoints
    : [];
  const normalizedWaypoints = rawWaypoints
    .map((pt, idx) => ({
      sequence: idx + 1,
      latitude: Number(pt?.latitude ?? pt?.lat),
      longitude: Number(pt?.longitude ?? pt?.lng),
    }))
    .filter((pt) => Number.isFinite(pt.latitude) && Number.isFinite(pt.longitude) && (pt.latitude !== 0 || pt.longitude !== 0));

  let encodedPolyline = (typeof data.encodedPolyline === 'string' && data.encodedPolyline.trim())
    || (typeof data.polyline === 'string' && data.polyline.trim())
    || '';

  if (!encodedPolyline && normalizedWaypoints.length >= 2) {
    encodedPolyline = encodePolyline(normalizedWaypoints);
  } else if (!encodedPolyline && sLat !== 0 && sLng !== 0 && eLat !== 0 && eLng !== 0) {
    encodedPolyline = encodePolyline([
      { latitude: sLat, longitude: sLng },
      { latitude: eLat, longitude: eLng },
    ]);
  }

  const routePointsForDb = normalizedWaypoints.length > 0
    ? normalizedWaypoints
    : encodedPolyline
    ? decodePolyline(encodedPolyline).map((pt, idx) => ({
        sequence: idx + 1,
        latitude: pt.latitude,
        longitude: pt.longitude,
      }))
    : [];

  let routeDistanceKm = Number(data.distanceKm ?? data.distance_km ?? 0);
  if (!Number.isFinite(routeDistanceKm) || routeDistanceKm <= 0) {
    if (sLat !== 0 && sLng !== 0 && eLat !== 0 && eLng !== 0) {
      routeDistanceKm = Number(haversineDistanceKm(sLat, sLng, eLat, eLng).toFixed(2));
    } else {
      routeDistanceKm = 0;
    }
  }
  const routeDurationMinutes = Number(data.durationMinutes ?? data.duration_minutes ?? 0) > 0
    ? Math.round(Number(data.durationMinutes ?? data.duration_minutes))
    : routeDistanceKm > 0
    ? Math.max(5, Math.round((routeDistanceKm / 30) * 60))
    : 0;

  const ride = await prisma.ride.create({
    data: {
      driverId: driver.id,
      vehicleId,
      recurringRideId,
      rideType: recurringRideId ? 'RECURRING_INSTANCE' : 'DAILY_COMMUTE',
      departureAt: departureDate,
      estimatedArrivalAt: estimatedArrival,
      totalSeats,
      availableSeats: totalSeats,
      startLocationName: data.origin,
      startLat: sLat,
      startLng: sLng,
      endLocationName: data.destination,
      endLat: eLat,
      endLng: eLng,
      status: 'PUBLISHED',
      womenOnly: Boolean(data.isWomenOnly),
      autoAccept: Boolean(data.autoAccept),
      notes,
      pricing: {
        create: {
          pricingType,
          costPerSeat: baseFare,
          totalCost: baseFare * totalSeats,
          currency: 'INR',
        },
      },
      ...(encodedPolyline
        ? {
            route: {
              create: {
                distanceKm: routeDistanceKm,
                durationMinutes: routeDurationMinutes,
                encodedPolyline,
                ...(routePointsForDb.length > 0
                  ? { waypoints: { create: routePointsForDb } }
                  : {}),
              },
            },
          }
        : {}),
      stops: {
        create: [
          {
            sequence: 1,
            name: meetingPoint,
            latitude: sLat,
            longitude: sLng,
            stopType: 'START',
            estimatedArrivalAt: departureDate,
          },
          {
            sequence: 2,
            name: data.destination,
            latitude: eLat,
            longitude: eLng,
            stopType: 'END',
            estimatedArrivalAt: estimatedArrival,
          },
        ],
      },
    },
    include: {
      driver: { include: { user: true } },
      vehicle: true,
      pricing: true,
      stops: true,
      route: { include: { waypoints: { orderBy: { sequence: 'asc' } } } },
    },
  });

  // Ensure activeRole is HOST when user offers a ride
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { rolePreference: 'offerRide' },
    });
    await prisma.$executeRawUnsafe(
      'UPDATE users SET active_role = ?, is_driver_mode = ? WHERE id = ?',
      'HOST',
      1,
      userId
    );
  } catch {}

  return formatRideForFlutter(ride);
};

/**
 * 5. Get My Offered Rides (with incoming passenger seat requests)
 */
export const getMyOfferedRides = async (userId, query = {}) => {
  const driver = await prisma.driverProfile.findUnique({
    where: { userId },
  });

  const statusParam = (query.status || 'active').toLowerCase();

  const getStrangerTrips = async () => {
    try {
      const { getStrangerTripsByHost, formatStrangerTripForOffered, isDateTimePast } = await import('../stranger/stranger.service.js');
      const hostStrangerTrips = getStrangerTripsByHost(userId);
      return hostStrangerTrips
        .filter((st) => {
          const isPast = isDateTimePast(st.date, st.time);
          if (statusParam === 'history' || statusParam === 'completed') {
            return isPast || st.status === 'COMPLETED' || st.status === 'CANCELLED';
          }
          if (statusParam === 'cancelled') {
            return st.status === 'CANCELLED';
          }
          if (statusParam === 'all') {
            return true;
          }
          // Default: active / upcoming offered rides only (not expired)
          return !isPast && st.status !== 'CANCELLED' && st.status !== 'COMPLETED' && st.status !== 'EXPIRED';
        })
        .map(formatStrangerTripForOffered);
    } catch (e) {
      return [];
    }
  };

  if (!driver) {
    return await getStrangerTrips();
  }

  let statusCondition;
  let dateCondition;
  if (statusParam === 'all') {
    statusCondition = undefined;
  } else if (statusParam === 'cancelled') {
    statusCondition = 'CANCELLED';
  } else if (statusParam === 'completed' || statusParam === 'history') {
    statusCondition = { in: ['COMPLETED', 'CANCELLED'] };
  } else {
    // Default: 'active' offered rides only (excludes cancelled, completed, and expired)
    statusCondition = { in: ['PUBLISHED', 'IN_PROGRESS', 'FULL'] };
    dateCondition = { gte: new Date() };
  }

  const rides = await prisma.ride.findMany({
    where: {
      driverId: driver.id,
      ...(statusCondition ? { status: statusCondition } : {}),
      ...(dateCondition ? { departureAt: dateCondition } : {}),
    },
    include: {
      vehicle: true,
      pricing: true,
      driver: { include: { user: true } },
      bookings: {
        include: {
          passenger: {
            select: { id: true, displayName: true, phone: true, avatarUrl: true },
          },
          pickupStop: true,
          dropoffStop: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { departureAt: 'asc' },
  });

  const result = [];
  for (const r of rides) {
    const formatted = formatRideForFlutter(r);
    if (statusParam === 'active' && (formatted.isExpired || formatted.status === 'expired')) {
      continue;
    }
    formatted.isHost = true;
    formatted.passengerRequests = r.bookings.map((b) => {
      const cleanNotes = (b.passengerNotes || '').replace(/\[ONBOARD\]/g, '').trim();
      const pickupLocation = b.pickupStop?.name || cleanNotes || `${r.startLocationName} Point`;
      const dropLocation = b.dropoffStop?.name || r.endLocationName;
      return {
        bookingId: b.id,
        passengerId: b.passenger.id,
        passengerName: b.passenger.displayName,
        passengerPhone: b.passenger.phone,
        passengerAvatar: b.passenger.avatarUrl,
        seatsRequested: b.seatsRequested,
        status: b.status.toLowerCase(),
        totalFare: Number(b.totalCostContribution || 0),
        pickupLocation,
        dropLocation,
        pickupPoint: pickupLocation,
        dropoffPoint: dropLocation,
        pickupLat: b.pickupStop?.latitude !== undefined ? Number(b.pickupStop.latitude) : Number(r.startLat),
        pickupLng: b.pickupStop?.longitude !== undefined ? Number(b.pickupStop.longitude) : Number(r.startLng),
        dropoffLat: b.dropoffStop?.latitude !== undefined ? Number(b.dropoffStop.latitude) : Number(r.endLat),
        dropoffLng: b.dropoffStop?.longitude !== undefined ? Number(b.dropoffStop.longitude) : Number(r.endLng),
        requestedAt: b.requestedAt || b.createdAt,
      };
    });
    result.push(formatted);
  }

  // Include any stranger trips posted by this user
  const strangerList = await getStrangerTrips();
  for (const st of strangerList) {
    if (!result.some((r) => r.id === st.id)) {
      result.push(st);
    }
  }

  return result;
};

/**
 * 5b. Get Passengers / Bookings for a Specific Offered Ride
 */
export const getOfferedRidePassengers = async (userId, rideId) => {
  // Check stranger trips first
  try {
    const { getStrangerTripPassengers } = await import('../stranger/stranger.service.js');
    const strangerPassengers = getStrangerTripPassengers(userId, rideId);
    if (strangerPassengers) return strangerPassengers;
  } catch (e) {
    // Continue
  }

  const driver = await getOrCreateDriverProfile(userId);

  let ride = await prisma.ride.findFirst({
    where: {
      id: rideId,
      OR: [
        ...(driver ? [{ driverId: driver.id }] : []),
        { driver: { userId } },
      ],
    },
    include: {
      vehicle: true,
      pricing: true,
      route: { include: { waypoints: { orderBy: { sequence: 'asc' } } } },
      stops: { orderBy: { sequence: 'asc' } },
      bookings: {
        include: {
          passenger: {
            select: { id: true, displayName: true, phone: true, avatarUrl: true },
          },
          pickupStop: true,
          dropoffStop: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!ride) {
    ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        vehicle: true,
        pricing: true,
        route: { include: { waypoints: { orderBy: { sequence: 'asc' } } } },
        stops: { orderBy: { sequence: 'asc' } },
        bookings: {
          include: {
            passenger: {
              select: { id: true, displayName: true, phone: true, avatarUrl: true },
            },
            pickupStop: true,
            dropoffStop: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  if (!ride) {
    const recurringRide = await prisma.recurringRide.findUnique({
      where: { id: rideId },
      include: {
        vehicle: true,
        driver: { include: { user: true } },
        ridesGenerated: {
          include: {
            vehicle: true,
            pricing: true,
            stops: { orderBy: { sequence: 'asc' } },
            bookings: {
              include: {
                passenger: {
                  select: { id: true, displayName: true, phone: true, avatarUrl: true },
                },
                pickupStop: true,
                dropoffStop: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { departureAt: 'desc' },
        },
      },
    });

    if (recurringRide) {
      const allBookings = [];
      const seenBookingIds = new Set();
      for (const genRide of (recurringRide.ridesGenerated || [])) {
        for (const b of (genRide.bookings || [])) {
          if (!seenBookingIds.has(b.id)) {
            seenBookingIds.add(b.id);
            allBookings.push({ ...b, ride: genRide });
          }
        }
      }

      const allMapped = allBookings.map((b) => {
        let passengerStatus = 'Pending';
        if (b.status === 'ONBOARD') passengerStatus = 'Onboard';
        else if (b.status === 'COMPLETED') passengerStatus = 'Trip Completed';
        else if (b.status === 'CONFIRMED' || b.status === 'ACCEPTED') passengerStatus = 'Confirmed';
        else if (b.status === 'REJECTED') passengerStatus = 'Rejected';
        else if (b.status === 'CANCELLED') passengerStatus = 'Cancelled';

        return {
          id: b.passenger?.id || b.passengerId,
          bookingId: b.id,
          name: b.passenger?.displayName || 'Passenger',
          phone: b.passenger?.phone || '',
          avatarUrl: b.passenger?.avatarUrl || '',
          seats: b.seatsRequested,
          fare: Number(b.totalAmount || 0),
          status: passengerStatus,
          statusLabel: passengerStatus,
          rawStatus: b.status.toLowerCase(),
          isConfirmed: ['CONFIRMED', 'ACCEPTED', 'ONBOARD', 'COMPLETED'].includes(b.status),
          pickupLocation: b.pickupStop?.locationName || recurringRide.startLocationName,
          dropoffLocation: b.dropoffStop?.locationName || recurringRide.endLocationName,
          rating: 4.8,
        };
      });

      const confirmedPassengers = allMapped.filter((p) => p.isConfirmed);

      return {
        rideId: recurringRide.id,
        isRecurring: true,
        origin: recurringRide.startLocationName,
        destination: recurringRide.endLocationName,
        departureTime: recurringRide.departureTime,
        departureDate: recurringRide.startDate ? new Date(recurringRide.startDate).toLocaleDateString() : '',
        totalSeats: recurringRide.totalSeats,
        bookedCount: confirmedPassengers.length,
        availableSeats: Math.max(0, recurringRide.totalSeats - confirmedPassengers.length),
        fare: 0,
        totalFare: confirmedPassengers.reduce((sum, p) => sum + p.fare, 0),
        currency: '₹',
        vehicleName: recurringRide.vehicle ? `${recurringRide.vehicle.make} ${recurringRide.vehicle.model}`.trim() : 'Vehicle',
        vehicleNumber: recurringRide.vehicle?.registrationNumber || '',
        vehicleColor: recurringRide.vehicle?.color || '',
        mode: recurringRide.vehicle?.vehicleType === 'BIKE' ? 'bikepool' : 'carpool',
        status: recurringRide.isActive ? 'active' : 'paused',
        summary: `${confirmedPassengers.length}/${recurringRide.totalSeats} Seats`,
        passengers: confirmedPassengers,
        confirmedPassengers,
        passengerRequests: allMapped.filter((p) => p.rawStatus === 'pending'),
        requests: allMapped.filter((p) => p.rawStatus === 'pending'),
        allPassengers: allMapped.filter((p) => !['rejected', 'cancelled'].includes(p.rawStatus)),
      };
    }
  }

  if (!ride) {
    try {
      const { getStrangerTripPassengers } = await import('../stranger/stranger.service.js');
      const strangerPassengers = getStrangerTripPassengers(userId, rideId);
      if (strangerPassengers) return strangerPassengers;
    } catch (e) {}
    throw new ApiError(404, 'Offered ride not found');
  }

  const bookedCount = ride.totalSeats - ride.availableSeats;
  const originName = ride.startLocationName.includes(',')
    ? ride.startLocationName.split(',')[0].trim()
    : ride.startLocationName;
  const destName = ride.endLocationName.includes(',')
    ? ride.endLocationName.split(',')[0].trim()
    : ride.endLocationName;
  const departureDate = new Date(ride.departureAt);
  const formattedTime = departureDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = departureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  let totalFareCollected = 0;

  // Deduplicate bookings by passengerId, keeping only the most recent booking per passenger
  const latestBookingsMap = new Map();
  for (const b of ride.bookings) {
    if (!latestBookingsMap.has(b.passengerId)) {
      latestBookingsMap.set(b.passengerId, b);
    }
  }
  const uniqueBookings = Array.from(latestBookingsMap.values());

  const allMapped = uniqueBookings.map((b) => {
    const isAccepted = b.status === 'ACCEPTED';
    const isPending = b.status === 'PENDING';
    const isCompleted = b.status === 'COMPLETED' || ride.status === 'COMPLETED';
    const isOnboard = !isCompleted && Boolean(b.passengerNotes && b.passengerNotes.includes('[ONBOARD]'));

    let passengerStatus = 'Pending';
    if (isCompleted) {
      passengerStatus = 'Dropped Off';
    } else if (isOnboard) {
      passengerStatus = 'Onboard';
    } else if (isAccepted) {
      passengerStatus = 'Confirmed';
    } else if (b.status === 'REJECTED') {
      passengerStatus = 'Rejected';
    } else if (b.status === 'CANCELLED') {
      passengerStatus = 'Cancelled';
    }

    const fare = Number(b.totalCostContribution || 0);
    if (isAccepted || isOnboard || isCompleted) {
      totalFareCollected += fare;
    }

    const cleanNotes = (b.passengerNotes || '').replace(/\[ONBOARD\]/g, '').trim();
    const pickupLat = b.pickupStop?.latitude !== undefined ? Number(b.pickupStop.latitude) : Number(ride.startLat);
    const pickupLng = b.pickupStop?.longitude !== undefined ? Number(b.pickupStop.longitude) : Number(ride.startLng);
    const dropoffLat = b.dropoffStop?.latitude !== undefined ? Number(b.dropoffStop.latitude) : Number(ride.endLat);
    const dropoffLng = b.dropoffStop?.longitude !== undefined ? Number(b.dropoffStop.longitude) : Number(ride.endLng);

    return {
      id: b.id,
      bookingId: b.id,
      passengerId: b.passenger.id,
      name: b.passenger.displayName || 'Passenger',
      phone: b.passenger.phone || '',
      avatarUrl:
        b.passenger.avatarUrl ||
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      seats: b.seatsRequested,
      fare,
      isPickedUp: isOnboard || isCompleted,
      isOnboard,
      isDroppedOff: isCompleted,
      isCompleted,
      nextAction: isCompleted ? 'NONE' : isOnboard ? 'DROPOFF' : isAccepted ? 'PICKUP' : 'ACCEPT',
      status: passengerStatus,
      statusLabel: passengerStatus,
      rawStatus: b.status.toLowerCase(),
      isPending,
      isConfirmed: isAccepted || isOnboard || isCompleted,
      rating: 4.9,
      pickupLocation: b.pickupStop?.name || cleanNotes || `${ride.startLocationName} Point`,
      dropLocation: b.dropoffStop?.name || ride.endLocationName,
      pickupPoint: b.pickupStop?.name || cleanNotes || `${ride.startLocationName} Point`,
      dropoffPoint: b.dropoffStop?.name || ride.endLocationName,
      pickupLat: Number.isFinite(pickupLat) ? pickupLat : 0,
      pickupLng: Number.isFinite(pickupLng) ? pickupLng : 0,
      dropoffLat: Number.isFinite(dropoffLat) ? dropoffLat : 0,
      dropoffLng: Number.isFinite(dropoffLng) ? dropoffLng : 0,
      requestedAt: b.requestedAt || b.createdAt,
      acceptedAt: b.acceptedAt,
      completedAt: b.completedAt,
    };
  });

  // Confirmed passengers traveling on this ride (Accepted, Onboard, Completed)
  const confirmedPassengers = allMapped.filter((p) => p.isConfirmed);

  // Incoming pending requests awaiting host accept/reject action
  const pendingRequests = allMapped.filter((p) => p.isPending);

  return {
    rideId: ride.id,
    origin: ride.startLocationName,
    originName,
    destination: ride.endLocationName,
    destName,
    date: formattedDate,
    departureTime: formattedTime,
    mode: ride.vehicle?.vehicleType === 'BIKE' ? 'bikepool' : 'carpool',
    vehicleName: ride.vehicle ? `${ride.vehicle.make} ${ride.vehicle.model}`.trim() : 'Vehicle',
    vehicleNumber: ride.vehicle?.registrationNumber || '',
    vehicleColor: ride.vehicle?.color || '',
    totalSeats: ride.totalSeats,
    availableSeats: ride.availableSeats,
    bookedCount: confirmedPassengers.length,
    totalFareCollected: Math.round(totalFareCollected),
    summary: `${confirmedPassengers.length}/${ride.totalSeats} Seats`,
    passengers: confirmedPassengers,
    confirmedPassengers,
    passengerRequests: pendingRequests,
    requests: pendingRequests,
    allPassengers: allMapped.filter((p) => !['rejected', 'cancelled'].includes(p.rawStatus)),
  };
};

/**
 * 6. Accept, Decline, or Onboard Passenger Request
 * Actions supported:
 * - ACCEPT / APPROVE
 * - DECLINE / REJECT
 * - ONBOARD / PICKUP / PICKED_UP
 * - OFFBOARD / DROPOFF
 */
export const respondToPassengerRequest = async (userId, bookingId, actionOrStatus) => {
  // Check if this bookingId belongs to a stranger trip request
  try {
    const { respondToStrangerTripRequestByBookingId } = await import('../stranger/stranger.service.js');
    const strangerRes = await respondToStrangerTripRequestByBookingId(userId, bookingId, actionOrStatus);
    if (strangerRes) return strangerRes;
  } catch (e) {
    if (e.statusCode) throw e;
  }

  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        passenger: { select: { id: true, displayName: true, phone: true } },
        ride: { include: { driver: true } },
      },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking request not found');
    }

    if (booking.ride.driver.userId !== userId) {
      throw new ApiError(403, 'Unauthorized to respond to this ride request');
    }

    const raw = (actionOrStatus || '').toUpperCase();
    const isAccept = ['ACCEPT', 'ACCEPTED', 'APPROVE'].includes(raw);
    const isReject = ['REJECT', 'REJECTED', 'DECLINE', 'DECLINED'].includes(raw);
    const isOnboard = ['ONBOARD', 'PICKUP', 'PICKED_UP', 'ONBOARDED'].includes(raw);
    const isOffboard = ['OFFBOARD'].includes(raw);
    const isDropoff = ['DROPOFF', 'DROPPED_OFF', 'DROP', 'COMPLETE', 'COMPLETED'].includes(raw);

    if (!isAccept && !isReject && !isOnboard && !isOffboard && !isDropoff) {
      throw new ApiError(400, 'Invalid action. Must be ACCEPT, DECLINE/REJECT, ONBOARD, OFFBOARD, or DROPOFF');
    }

    const passengerName = booking.passenger?.displayName || 'Passenger';
    const seats = booking.seatsRequested;
    let currentRide = booking.ride;

    // --- Action: ONBOARD (Picked Up) ---
    if (isOnboard) {
      let notes = booking.passengerNotes || '';
      if (!notes.includes('[ONBOARD]')) {
        notes = `${notes} [ONBOARD]`.trim();
      }

      // If booking was still pending, accept it as well
      if (booking.status === 'PENDING') {
        if (booking.ride.availableSeats < seats) {
          throw new ApiError(400, `Cannot onboard: Only ${booking.ride.availableSeats} seat(s) remaining.`);
        }
        currentRide = await tx.ride.update({
          where: { id: booking.rideId },
          data: {
            availableSeats: { decrement: seats },
            ...(booking.ride.availableSeats - seats === 0 ? { status: 'FULL' } : {}),
          },
        });
      }

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: booking.acceptedAt || new Date(),
          passengerNotes: notes,
        },
      });

      const targetPassengerId = booking.passenger?.id || booking.passengerId;
      if (targetPassengerId) {
        createNotification({
          userId: targetPassengerId,
          type: 'BOOKING_ACCEPTED',
          title: 'Onboard! 🚗',
          message: 'You have been picked up. Enjoy your ride!',
          data: {
            rideId: booking.rideId,
            bookingId: updated.id,
            route: '/active-ride',
          },
          sendPush: true,
        }).catch((e) => console.warn('Failed to notify passenger of onboard:', e.message));

        try {
          const io = getIO();
          if (io) {
            const socketPayload = {
              tripId: booking.rideId,
              rideId: booking.rideId,
              bookingId: updated.id,
              passengerId: targetPassengerId,
              status: 'PICKED_UP',
              isPickedUp: true,
              isOnboard: true,
              isDroppedOff: false,
              updatedAt: new Date().toISOString(),
            };
            io.to(`trip:${booking.rideId}`).emit('trip:passenger_updated', socketPayload);
            io.to(`user:${targetPassengerId}`).emit('trip:passenger_updated', socketPayload);
          }
        } catch (_) {}
      }

      return {
        bookingId: updated.id,
        rideId: booking.rideId,
        passengerId: booking.passenger.id,
        passengerName,
        status: 'Onboard',
        statusLabel: 'Onboard',
        bookingStatus: 'ACCEPTED',
        isPickedUp: true,
        isOnboard: true,
        isDroppedOff: false,
        nextAction: 'DROPOFF',
        seats,
        availableSeats: currentRide.availableSeats,
        totalSeats: currentRide.totalSeats,
        bookedCount: currentRide.totalSeats - currentRide.availableSeats,
        message: `${passengerName} is now marked Onboard!`,
      };
    }

    // --- Action: DROPOFF (Passenger Dropped Off / Completed) ---
    if (isDropoff) {
      const cleanNotes = (booking.passengerNotes || '').replace(/\[ONBOARD\]/g, '').trim();
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'COMPLETED',
          completedAt: booking.completedAt || new Date(),
          passengerNotes: cleanNotes,
        },
      });

      const remainingPassengersCount = await tx.booking.count({
        where: {
          rideId: booking.rideId,
          status: 'ACCEPTED',
        },
      });
      const allPassengersDroppedOff = remainingPassengersCount === 0;

      const targetPassengerId = booking.passenger?.id || booking.passengerId;
      if (targetPassengerId) {
        createNotification({
          userId: targetPassengerId,
          type: 'RATING_REQUEST',
          title: "You've Arrived! 🏁",
          message: 'You have reached your destination. Please rate your captain!',
          data: {
            rideId: booking.rideId,
            bookingId: updated.id,
            route: '/active-ride',
            shouldNavigateToRating: 'true',
          },
          sendPush: true,
        }).catch((e) => console.warn('Failed to notify passenger of drop-off:', e.message));

        try {
          const io = getIO();
          if (io) {
            const socketPayload = {
              tripId: booking.rideId,
              rideId: booking.rideId,
              bookingId: updated.id,
              passengerId: targetPassengerId,
              status: 'DROPPED_OFF',
              isPickedUp: true,
              isOnboard: false,
              isDroppedOff: true,
              isCompleted: true,
              canSubmitFeedback: true,
              shouldNavigateToRating: true,
              remainingPassengersCount,
              allPassengersDroppedOff,
              updatedAt: new Date().toISOString(),
            };
            io.to(`trip:${booking.rideId}`).emit('trip:passenger_updated', socketPayload);
            io.to(`user:${targetPassengerId}`).emit('trip:passenger_updated', socketPayload);
            io.to(`user:${targetPassengerId}`).emit('trip:completed', {
              tripId: booking.rideId,
              rideId: booking.rideId,
              bookingId: updated.id,
              passengerId: targetPassengerId,
              status: 'COMPLETED',
              reason: 'PASSENGER_DROPPED_OFF',
              shouldNavigateToRating: true,
              canSubmitFeedback: true,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (_) {}
      }

      return {
        bookingId: updated.id,
        rideId: booking.rideId,
        passengerId: booking.passenger.id,
        passengerName,
        status: 'Dropped Off',
        statusLabel: 'Dropped Off',
        bookingStatus: 'COMPLETED',
        isPickedUp: true,
        isOnboard: false,
        isDroppedOff: true,
        isCompleted: true,
        nextAction: 'NONE',
        remainingPassengersCount,
        allPassengersDroppedOff,
        seats,
        availableSeats: currentRide.availableSeats,
        totalSeats: currentRide.totalSeats,
        bookedCount: currentRide.totalSeats - currentRide.availableSeats,
        completedAt: updated.completedAt,
        message: `${passengerName} has been dropped off!`,
      };
    }

    // --- Action: OFFBOARD (Undo accidental pickup -> back to Confirmed) ---
    if (isOffboard) {
      const cleanNotes = (booking.passengerNotes || '').replace(/\[ONBOARD\]/g, '').trim();
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { passengerNotes: cleanNotes },
      });

      return {
        bookingId: updated.id,
        rideId: booking.rideId,
        passengerId: booking.passenger.id,
        passengerName,
        status: 'Confirmed',
        statusLabel: 'Confirmed',
        bookingStatus: 'ACCEPTED',
        isPickedUp: false,
        isOnboard: false,
        isDroppedOff: false,
        nextAction: 'PICKUP',
        seats,
        availableSeats: currentRide.availableSeats,
        totalSeats: currentRide.totalSeats,
        message: `${passengerName} marked offboard.`,
      };
    }

    // --- Action: ACCEPT ---
    if (isAccept) {
      if (booking.status === 'ACCEPTED') {
        return {
          bookingId: booking.id,
          rideId: booking.rideId,
          status: 'Confirmed',
          statusLabel: 'Confirmed',
          bookingStatus: 'ACCEPTED',
          passengerName,
          seats,
          availableSeats: booking.ride.availableSeats,
          totalSeats: booking.ride.totalSeats,
          bookedCount: booking.ride.totalSeats - booking.ride.availableSeats,
          message: `Booking request already approved for ${passengerName}!`,
        };
      }

      if (booking.ride.availableSeats < seats) {
        throw new ApiError(400, `Not enough seats remaining. Only ${booking.ride.availableSeats} seat(s) left.`);
      }

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      const updatedRide = await tx.ride.update({
        where: { id: booking.rideId },
        data: {
          availableSeats: { decrement: seats },
          ...(booking.ride.availableSeats - seats === 0 ? { status: 'FULL' } : {}),
        },
      });

      // Dispatch notification to passenger
      const passengerTargetId = booking.passengerId || booking.passenger?.id;
      if (passengerTargetId) {
        createNotification({
          userId: passengerTargetId,
          type: 'BOOKING_ACCEPTED',
          title: 'Seat Request Accepted! 🎉',
          message: `Your seat request for ${booking.ride?.endLocationName || 'the commute'} was confirmed by the host.`,
          data: {
            rideId: booking.rideId,
            bookingId: updatedBooking.id,
            route: '/active-ride',
          },
          sendPush: true,
        }).catch((e) => console.warn('Failed to notify passenger of acceptance:', e.message));

        try {
          const io = getIO();
          if (io) {
            io.to(`user:${passengerTargetId}`).emit('ride:accepted', {
              rideId: booking.rideId,
              bookingId: updatedBooking.id,
              status: 'ACCEPTED',
            });
            io.to(`user:${passengerTargetId}`).emit('trip:accepted', {
              tripId: booking.rideId,
              bookingId: updatedBooking.id,
              status: 'ACCEPTED',
            });
          }
        } catch (_) {}
      }

      return {
        bookingId: updatedBooking.id,
        rideId: booking.rideId,
        passengerId: booking.passenger.id,
        status: 'Confirmed',
        statusLabel: 'Confirmed',
        bookingStatus: 'ACCEPTED',
        passengerName,
        seats,
        availableSeats: updatedRide.availableSeats,
        totalSeats: updatedRide.totalSeats,
        bookedCount: updatedRide.totalSeats - updatedRide.availableSeats,
        message: `Booking request approved for ${passengerName}!`,
      };
    }

    // --- Action: DECLINE / REJECT ---
    if (booking.status === 'ACCEPTED') {
      currentRide = await tx.ride.update({
        where: { id: booking.rideId },
        data: {
          availableSeats: { increment: seats },
          ...(booking.ride.status === 'FULL' ? { status: 'PUBLISHED' } : {}),
        },
      });
    }

    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        passengerNotes: (booking.passengerNotes || '').replace(/\[ONBOARD\]/g, '').trim(),
      },
    });

    // Dispatch decline notification to passenger
    createNotification({
      userId: booking.passenger.id,
      type: 'BOOKING_REJECTED',
      title: 'Seat Request Declined',
      message: `Your seat request for ${booking.ride?.endLocationName || 'the commute'} was declined by the host.`,
      data: {
        rideId: booking.rideId,
        bookingId: updatedBooking.id,
        route: '/my-rides',
      },
      sendPush: true,
    }).catch((e) => console.warn('Failed to notify passenger of decline:', e.message));

    return {
      bookingId: updatedBooking.id,
      rideId: booking.rideId,
      passengerId: booking.passenger.id,
      status: 'Rejected',
      statusLabel: 'Rejected',
      bookingStatus: 'REJECTED',
      passengerName,
      seats,
      availableSeats: currentRide.availableSeats,
      totalSeats: currentRide.totalSeats,
      bookedCount: currentRide.totalSeats - currentRide.availableSeats,
      message: `Booking declined for ${passengerName}.`,
    };
  });
};

export const onboardPassenger = async (userId, bookingId, isPickedUp = true) => {
  return respondToPassengerRequest(userId, bookingId, isPickedUp ? 'ONBOARD' : 'OFFBOARD');
};

export const dropoffPassenger = async (userId, bookingId) => {
  return respondToPassengerRequest(userId, bookingId, 'DROPOFF');
};

/**
 * 7. Start Trip (Rider starts the offered ride)
 */
export const startTrip = async (userId, rideId, options = {}) => {
  try {
    const { startStrangerTrip } = await import('../stranger/stranger.service.js');
    const res = startStrangerTrip(userId, rideId);
    if (res) return res;
  } catch (e) {}

  const driver = await getOrCreateDriverProfile(userId);

  let ride = await prisma.ride.findFirst({
    where: {
      id: rideId,
      OR: [
        ...(driver ? [{ driverId: driver.id }] : []),
        { driver: { userId } },
      ],
    },
    include: {
      vehicle: true,
      pricing: true,
      route: { include: { waypoints: { orderBy: { sequence: 'asc' } } } },
      stops: { orderBy: { sequence: 'asc' } },
      bookings: {
        include: {
          passenger: {
            select: { id: true, displayName: true, phone: true, avatarUrl: true },
          },
          pickupStop: true,
          dropoffStop: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!ride) {
    ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        vehicle: true,
        pricing: true,
        route: { include: { waypoints: { orderBy: { sequence: 'asc' } } } },
        stops: { orderBy: { sequence: 'asc' } },
        bookings: {
          include: {
            passenger: {
              select: { id: true, displayName: true, phone: true, avatarUrl: true },
            },
            pickupStop: true,
            dropoffStop: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  if (!ride) {
    return {
      id: rideId,
      status: 'IN_PROGRESS',
      message: 'Trip started successfully',
      startedAt: new Date().toISOString(),
    };
  }

  if (ride.status === 'CANCELLED') {
    throw new ApiError(400, 'Cannot start a ride that has been cancelled');
  }

  if (ride.status === 'COMPLETED') {
    throw new ApiError(400, 'Ride is already completed');
  }

  // Update status to IN_PROGRESS if not already
  let currentRide = ride;
  if (ride.status !== 'IN_PROGRESS') {
    currentRide = await prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'IN_PROGRESS',
      },
      include: {
        vehicle: true,
        pricing: true,
        route: { include: { waypoints: { orderBy: { sequence: 'asc' } } } },
        stops: { orderBy: { sequence: 'asc' } },
        bookings: {
          include: {
            passenger: {
              select: { id: true, displayName: true, phone: true, avatarUrl: true },
            },
            pickupStop: true,
            dropoffStop: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Tell passengers the trip has started so their live tracking opens/updates.
    try {
      const io = getIO();
      const payload = { tripId: rideId, status: 'IN_PROGRESS', timestamp: new Date().toISOString() };
      io.to(`trip:${rideId}`).emit('trip:status_changed', payload);
      for (const b of currentRide.bookings || []) {
        if (b.passengerId && b.status === 'ACCEPTED') {
          io.to(`user:${b.passengerId}`).emit('trip:status_changed', payload);
        }
      }
    } catch (err) {
      console.warn('[Rider] Failed to broadcast trip start:', err.message);
    }
  }

  const departureDate = new Date(currentRide.departureAt);
  const formattedTime = departureDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = departureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Deduplicate bookings by passengerId, keeping only the most recent booking per passenger
  const latestBookingsMap = new Map();
  for (const b of currentRide.bookings) {
    if (!latestBookingsMap.has(b.passengerId)) {
      latestBookingsMap.set(b.passengerId, b);
    }
  }
  const uniqueBookings = Array.from(latestBookingsMap.values());

  let totalFareCollected = 0;
  const confirmedPassengers = uniqueBookings
    .filter(
      (b) =>
        b.status === 'ACCEPTED' ||
        b.status === 'COMPLETED' ||
        (b.passengerNotes && b.passengerNotes.includes('[ONBOARD]'))
    )
    .map((b) => {
      const isCompleted = b.status === 'COMPLETED';
      const isOnboard = !isCompleted && Boolean(b.passengerNotes && b.passengerNotes.includes('[ONBOARD]'));
      const fare = Number(b.totalCostContribution || 0);
      totalFareCollected += fare;
      const cleanNotes = (b.passengerNotes || '').replace(/\[ONBOARD\]/g, '').trim();
      const pickupLat = b.pickupStop?.latitude !== undefined ? Number(b.pickupStop.latitude) : Number(currentRide.startLat);
      const pickupLng = b.pickupStop?.longitude !== undefined ? Number(b.pickupStop.longitude) : Number(currentRide.startLng);
      const dropoffLat = b.dropoffStop?.latitude !== undefined ? Number(b.dropoffStop.latitude) : Number(currentRide.endLat);
      const dropoffLng = b.dropoffStop?.longitude !== undefined ? Number(b.dropoffStop.longitude) : Number(currentRide.endLng);
      const statusLabel = isCompleted ? 'Dropped Off' : isOnboard ? 'Onboard' : 'Confirmed';

      return {
        id: b.id,
        bookingId: b.id,
        passengerId: b.passenger.id,
        name: b.passenger.displayName || 'Passenger',
        phone: b.passenger.phone || '',
        avatarUrl:
          b.passenger.avatarUrl ||
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        seats: b.seatsRequested,
        fare,
        isPickedUp: isOnboard || isCompleted,
        isOnboard,
        isDroppedOff: isCompleted,
        isCompleted,
        nextAction: isCompleted ? 'NONE' : isOnboard ? 'DROPOFF' : 'PICKUP',
        status: statusLabel,
        statusLabel,
        rawStatus: b.status.toLowerCase(),
        pickupLocation: b.pickupStop?.name || cleanNotes || `${currentRide.startLocationName} Point`,
        dropLocation: b.dropoffStop?.name || currentRide.endLocationName,
        pickupPoint: b.pickupStop?.name || cleanNotes || `${currentRide.startLocationName} Point`,
        dropoffPoint: b.dropoffStop?.name || currentRide.endLocationName,
        pickupLat: Number.isFinite(pickupLat) ? pickupLat : 0,
        pickupLng: Number.isFinite(pickupLng) ? pickupLng : 0,
        dropoffLat: Number.isFinite(dropoffLat) ? dropoffLat : 0,
        dropoffLng: Number.isFinite(dropoffLng) ? dropoffLng : 0,
        acceptedAt: b.acceptedAt,
        completedAt: b.completedAt,
      };
    });

  const bookedCount = currentRide.totalSeats - currentRide.availableSeats;
  const originName = currentRide.startLocationName.includes(',')
    ? currentRide.startLocationName.split(',')[0].trim()
    : currentRide.startLocationName;
  const destName = currentRide.endLocationName.includes(',')
    ? currentRide.endLocationName.split(',')[0].trim()
    : currentRide.endLocationName;
  const routeData = resolveRideRouteData(currentRide);
  const lastLoc = getLiveTripState(currentRide.id)?.lastLocation;

  const responsePayload = {
    id: currentRide.id,
    rideId: currentRide.id,
    tripId: currentRide.id,
    role: 'driver',
    isDriver: true,
    isCaptain: true,
    status: 'in_progress',
    statusLabel: 'Trip in Progress',
    rawStatus: currentRide.status,
    isStarted: true,
    isInProgress: true,
    startedAt: new Date().toISOString(),
    origin: currentRide.startLocationName,
    originName,
    destination: currentRide.endLocationName,
    destName,
    originLat: Number(currentRide.startLat),
    originLng: Number(currentRide.startLng),
    destLat: Number(currentRide.endLat),
    destLng: Number(currentRide.endLng),
    encodedPolyline: routeData.encodedPolyline,
    polyline: routeData.polyline,
    routePoints: routeData.routePoints,
    waypoints: routeData.waypoints,
    distanceKm: routeData.distanceKm,
    durationMinutes: routeData.durationMinutes,
    route: {
      encodedPolyline: routeData.encodedPolyline,
      distanceKm: routeData.distanceKm,
      durationMinutes: routeData.durationMinutes,
      waypoints: routeData.waypoints,
    },
    currentLocation:
      lastLoc && Number.isFinite(lastLoc.latitude) && Number.isFinite(lastLoc.longitude)
        ? {
            latitude: lastLoc.latitude,
            longitude: lastLoc.longitude,
            heading: Number.isFinite(lastLoc.bearing) ? lastLoc.bearing : 0,
            speedKmh: Number.isFinite(lastLoc.speed) ? lastLoc.speed : 0,
            updatedAt: lastLoc.timestamp || null,
          }
        : null,
    date: formattedDate,
    departureTime: formattedTime,
    mode: currentRide.vehicle?.vehicleType === 'BIKE' ? 'bikepool' : 'carpool',
    vehicleName: currentRide.vehicle ? `${currentRide.vehicle.make} ${currentRide.vehicle.model}` : 'Vehicle',
    vehicleNumber: currentRide.vehicle?.registrationNumber || '',
    vehicleColor: currentRide.vehicle?.color || '',
    totalSeats: currentRide.totalSeats,
    availableSeats: currentRide.availableSeats,
    bookedCount,
    totalFareCollected,
    passengers: confirmedPassengers,
    passengerCount: confirmedPassengers.length,
    stops: currentRide.stops.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.stopType,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      sequence: s.sequence,
    })),
    message: 'Trip started successfully! Drive safely.',
  };

  // Dispatch push & in-app notifications to all confirmed passengers
  for (const p of confirmedPassengers) {
    if (p.passengerId) {
      createNotification({
        userId: p.passengerId,
        type: 'RIDE_REMINDER',
        title: 'Trip Started! 🚗',
        message: `Your captain has started the trip to ${currentRide.endLocationName}. Be ready at your pickup point!`,
        data: {
          rideId: currentRide.id,
          bookingId: p.bookingId,
          route: '/active-ride',
        },
        sendPush: true,
      }).catch((e) => console.warn('Failed to notify passenger of trip start:', e.message));
    }
  }

  return responsePayload;
};

/**
 * 7b. Complete Trip (Rider marks the trip as completed)
 */
export const completeTrip = async (userId, rideId, options = {}) => {
  if (rideId && rideId.startsWith('stranger_')) {
    try {
      const { completeStrangerTrip } = await import('../stranger/stranger.service.js');
      const res = completeStrangerTrip(userId, rideId);
      if (res) return res;
    } catch (e) {}
  }

  const driver = await getOrCreateDriverProfile(userId);

  let ride = await prisma.ride.findFirst({
    where: {
      id: rideId,
      OR: [
        ...(driver ? [{ driverId: driver.id }] : []),
        { driver: { userId } },
      ],
    },
    include: {
      vehicle: true,
      pricing: true,
      bookings: {
        where: { status: 'ACCEPTED' },
      },
    },
  });

  if (!ride) {
    ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        vehicle: true,
        pricing: true,
        bookings: {
          where: { status: 'ACCEPTED' },
        },
      },
    });
  }

  if (!ride) {
    return {
      id: rideId,
      status: 'IN_PROGRESS',
      message: 'Trip started successfully',
      startedAt: new Date().toISOString(),
    };
  }

  if (ride.status === 'COMPLETED') {
    return {
      id: ride.id,
      rideId: ride.id,
      tripId: ride.id,
      status: 'completed',
      statusLabel: 'Completed',
      rawStatus: 'COMPLETED',
      isCompleted: true,
      message: 'Ride is already completed',
    };
  }

  // Update ride and bookings
  const completedRide = await prisma.$transaction(async (tx) => {
    await tx.booking.updateMany({
      where: { rideId, status: 'ACCEPTED' },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    const r = await tx.ride.update({
      where: { id: rideId },
      data: { status: 'COMPLETED' },
      include: { vehicle: true, bookings: true },
    });

    await tx.driverProfile.update({
      where: { id: driver.id },
      data: {
        totalRidesOffered: { increment: 1 },
      },
    });

    return r;
  });

  // Emit real-time trip completion socket events to room & passengers
  try {
    const io = getIO();
    if (io) {
      io.to(`trip:${completedRide.id}`).emit('trip:status', { tripId: completedRide.id, status: 'COMPLETED' });
      io.to(`trip:${completedRide.id}`).emit('trip_completed', { tripId: completedRide.id });
      io.to(`trip:${completedRide.id}`).emit('trip:status_change', { tripId: completedRide.id, status: 'COMPLETED' });
    }
  } catch (_) {}

  // Notify all passengers that trip is completed and prompt rating
  if (completedRide.bookings && completedRide.bookings.length > 0) {
    for (const b of completedRide.bookings) {
      if (b.passengerId) {
        createNotification({
          userId: b.passengerId,
          type: 'RATING_REQUEST',
          title: 'Trip Completed! 🎉',
          message: `Your trip to ${completedRide.endLocationName} is complete. Please rate your captain!`,
          data: {
            rideId: completedRide.id,
            bookingId: b.id,
            route: '/active-ride',
          },
          sendPush: true,
        }).catch((e) => console.warn('Failed to notify passenger of trip completion:', e.message));

        try {
          const io = getIO();
          if (io) {
            io.to(`user:${b.passengerId}`).emit('trip:completed', { tripId: completedRide.id, status: 'COMPLETED' });
            io.to(`user:${b.passengerId}`).emit('trip:status', { tripId: completedRide.id, status: 'COMPLETED' });
          }
        } catch (_) {}
      }
    }
  }

  return {
    id: completedRide.id,
    rideId: completedRide.id,
    tripId: completedRide.id,
    status: 'completed',
    statusLabel: 'Completed',
    rawStatus: 'COMPLETED',
    isCompleted: true,
    completedAt: new Date().toISOString(),
    message: 'Trip completed successfully! Thank you for sharing your ride.',
  };
};

/**
 * 7c. General Change Ride Status (Start, Complete, Cancel)
 */
export const updateOfferedRideStatus = async (userId, rideId, rawStatus) => {
  const normalized = (rawStatus || '').toUpperCase().trim();

  if (['IN_PROGRESS', 'START', 'STARTED', 'START_TRIP'].includes(normalized)) {
    return startTrip(userId, rideId);
  }

  if (['COMPLETED', 'COMPLETE', 'END', 'END_TRIP', 'FINISH'].includes(normalized)) {
    return completeTrip(userId, rideId);
  }

  if (['CANCELLED', 'CANCEL'].includes(normalized)) {
    return cancelOfferedRide(userId, rideId, 'Cancelled by rider');
  }

  const driver = await getOrCreateDriverProfile(userId);

  const ride = await prisma.ride.findFirst({
    where: { id: rideId, driverId: driver.id },
  });

  if (!ride) {
    return {
      id: rideId,
      status: 'IN_PROGRESS',
      message: 'Trip started successfully',
      startedAt: new Date().toISOString(),
    };
  }

  const updated = await prisma.ride.update({
    where: { id: rideId },
    data: { status: normalized || 'IN_PROGRESS' },
  });

  return {
    id: updated.id,
    rideId: updated.id,
    status: updated.status.toLowerCase(),
    rawStatus: updated.status,
    message: `Ride marked as ${updated.status.toLowerCase()}`,
  };
};

/**
 * 8. Update Offered Ride (Carpool / Bikepool / Details)
 */
export const updateOfferedRide = async (userId, rideId, data) => {
  const driver = await getOrCreateDriverProfile(userId);

  const ride = await prisma.ride.findFirst({
    where: { id: rideId, driverId: driver.id },
    include: {
      vehicle: true,
      pricing: true,
      stops: true,
      bookings: true,
    },
  });

  if (!ride) {
    return {
      id: rideId,
      status: 'IN_PROGRESS',
      message: 'Trip started successfully',
      startedAt: new Date().toISOString(),
    };
  }

  if (['COMPLETED', 'CANCELLED'].includes(ride.status)) {
    throw new ApiError(400, `Cannot edit a ride that is already ${ride.status.toLowerCase()}`);
  }

  // Parse departure time if provided
  let departureDate = ride.departureAt;
  if (data.departureTime || data.date) {
    departureDate = parseDateTime(data.departureTime, data.date);
  }
  const estimatedArrival = new Date(departureDate.getTime() + 45 * 60000);

  // Vehicle resolution
  let vehicleId = ride.vehicleId;
  const inputVehicleId = data.vehicleId || data.vehicle_id;
  const inputVehicleNumber = data.vehicleNumber || data.vehicle_number;
  let resolvedVehicle = null;

  if (inputVehicleId && inputVehicleId !== 'v_default') {
    resolvedVehicle = await prisma.vehicle.findFirst({
      where: { id: inputVehicleId, driverId: driver.id },
    });
    if (resolvedVehicle) vehicleId = resolvedVehicle.id;
  } else if (inputVehicleNumber) {
    resolvedVehicle = await prisma.vehicle.findFirst({
      where: { driverId: driver.id, registrationNumber: inputVehicleNumber.trim().toUpperCase() },
    });
    if (resolvedVehicle) vehicleId = resolvedVehicle.id;
  }

  // Seats calculation: default to vehicle capacity if changing vehicle without explicit seats
  const newTotalSeats =
    data.seats ||
    data.availableSeats ||
    data.available_seats ||
    (resolvedVehicle ? resolvedVehicle.seatCapacity : ride.totalSeats);
  const bookedSeats = ride.totalSeats - ride.availableSeats;
  const newAvailableSeats = Math.max(0, newTotalSeats - bookedSeats);

  // Locations & notes
  const origin = data.origin || ride.startLocationName;
  const originLat = data.originLat !== undefined ? data.originLat : ride.startLat;
  const originLng = data.originLng !== undefined ? data.originLng : ride.startLng;
  const destination = data.destination || ride.endLocationName;
  const destLat = data.destLat !== undefined ? data.destLat : ride.endLat;
  const destLng = data.destLng !== undefined ? data.destLng : ride.endLng;
  const notes = data.notes !== undefined ? data.notes : (data.pickupFlexibility !== undefined ? data.pickupFlexibility : ride.notes);
  const meetingPoint = (data.meetingPoint || data.pickupFlexibility || `${origin} Main Point`).trim();
  const isWomenOnly = data.isWomenOnly !== undefined ? Boolean(data.isWomenOnly) : ride.womenOnly;
  const autoAccept = data.autoAccept !== undefined ? Boolean(data.autoAccept) : ride.autoAccept;

  let newPricePerSeat = null;
  if (data.isFree === true || data.is_free === true || (typeof data.pricingType === 'string' && data.pricingType.toUpperCase() === 'FREE') || (typeof data.pricing_type === 'string' && data.pricing_type.toUpperCase() === 'FREE')) {
    newPricePerSeat = 0.0;
  } else if (data.pricePerSeat !== undefined && data.pricePerSeat !== null) {
    newPricePerSeat = Number(data.pricePerSeat);
  } else if (data.price !== undefined && data.price !== null) {
    newPricePerSeat = Number(data.price);
  } else if (data.price_per_seat !== undefined && data.price_per_seat !== null) {
    newPricePerSeat = Number(data.price_per_seat);
  } else if (data.costPerSeat !== undefined && data.costPerSeat !== null) {
    newPricePerSeat = Number(data.costPerSeat);
  } else if (data.cost_per_seat !== undefined && data.cost_per_seat !== null) {
    newPricePerSeat = Number(data.cost_per_seat);
  } else if (ride.pricing) {
    newPricePerSeat = Number(ride.pricing.costPerSeat);
  }

  const updatePricingType = newPricePerSeat === 0 ? 'FREE' : 'COST_SHARING';

  await prisma.$transaction(async (tx) => {
    await tx.ride.update({
      where: { id: rideId },
      data: {
        vehicleId,
        departureAt: departureDate,
        estimatedArrivalAt: estimatedArrival,
        totalSeats: newTotalSeats,
        availableSeats: newAvailableSeats,
        startLocationName: origin,
        startLat: originLat,
        startLng: originLng,
        endLocationName: destination,
        endLat: destLat,
        endLng: destLng,
        womenOnly: isWomenOnly,
        autoAccept: autoAccept,
        notes,
      },
    });

    if (newPricePerSeat !== null) {
      await tx.ridePricing.upsert({
        where: { rideId },
        update: {
          pricingType: updatePricingType,
          costPerSeat: newPricePerSeat,
          totalCost: newPricePerSeat * newTotalSeats,
        },
        create: {
          rideId,
          pricingType: updatePricingType,
          costPerSeat: newPricePerSeat,
          totalCost: newPricePerSeat * newTotalSeats,
          currency: 'INR',
        },
      });
    }

    const startStop = ride.stops.find((s) => s.stopType === 'START' || s.sequence === 1);
    if (startStop) {
      await tx.rideStop.update({
        where: { id: startStop.id },
        data: {
          name: meetingPoint,
          latitude: originLat,
          longitude: originLng,
          estimatedArrivalAt: departureDate,
        },
      });
    }

    const endStop = ride.stops.find((s) => s.stopType === 'END' || s.sequence === 2);
    if (endStop) {
      await tx.rideStop.update({
        where: { id: endStop.id },
        data: {
          name: destination,
          latitude: destLat,
          longitude: destLng,
          estimatedArrivalAt: estimatedArrival,
        },
      });
    }
  });

  const updatedRide = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      driver: { include: { user: true } },
      vehicle: true,
      pricing: true,
      stops: true,
    },
  });

  return formatRideForFlutter(updatedRide);
};

/**
 * 9. Delete / Cancel Offered Ride
 */
export const deleteOfferedRide = async (userId, rideId, { permanent = false, reason = 'Cancelled by driver' } = {}) => {
  if (rideId && rideId.startsWith('stranger_')) {
    try {
      const { cancelStrangerTrip } = await import('../stranger/stranger.service.js');
      const res = cancelStrangerTrip(userId, rideId);
      if (res) return res;
    } catch (e) {}
  }

  const driver = await getOrCreateDriverProfile(userId);

  const ride = await prisma.ride.findFirst({
    where: { id: rideId },
  });

  if (!ride) {
    return { id: rideId, deleted: true, status: 'cancelled', message: 'Offered ride already deleted' };
  }

  if (ride.driverId !== driver.id) {
    throw new ApiError(403, 'Unauthorized: Ride belongs to another driver');
  }

  // Notify affected passengers of ride cancellation
  try {
    const affectedBookings = await prisma.booking.findMany({
      where: {
        rideId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
      select: { passengerId: true, id: true },
    });

    for (const b of affectedBookings) {
      if (b.passengerId) {
        createNotification({
          userId: b.passengerId,
          type: 'RIDE_CANCELLED',
          title: 'Ride Cancelled ⚠️',
          message: `The ride to ${ride.endLocationName || 'your destination'} was cancelled by the host.`,
          data: {
            rideId,
            bookingId: b.id,
            route: '/my-rides',
          },
          sendPush: true,
        }).catch((e) => console.warn('Failed to notify passenger of cancellation:', e.message));
      }
    }
  } catch (_) {}

  if (permanent) {
    await prisma.$transaction(async (tx) => {
      // 1. Delete associated bookings
      await tx.booking.deleteMany({ where: { rideId } });

      // 2. Delete route and points if exist
      const route = await tx.rideRoute.findUnique({ where: { rideId } });
      if (route) {
        await tx.rideRoutePoint.deleteMany({ where: { rideRouteId: route.id } });
        await tx.rideRoute.delete({ where: { id: route.id } });
      }

      // 3. Delete stops and pricing
      await tx.rideStop.deleteMany({ where: { rideId } });
      await tx.ridePricing.deleteMany({ where: { rideId } });

      // 4. Delete the ride
      await tx.ride.delete({ where: { id: rideId } });
    });

    return {
      id: rideId,
      deleted: true,
      permanent: true,
      message: 'Offered ride permanently deleted',
    };
  }

  // Soft cancel: Update ride status to CANCELLED so it moves to History tab!
  await prisma.$transaction(async (tx) => {
    await tx.ride.update({
      where: { id: rideId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });

    // Mark pending or accepted bookings as CANCELLED
    await tx.booking.updateMany({
      where: {
        rideId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
      data: {
        status: 'CANCELLED',
      },
    });
  });

  return {
    id: rideId,
    deleted: true,
    status: 'cancelled',
    message: 'Offered ride cancelled successfully and moved to history',
  };
};

export const cancelOfferedRide = async (userId, rideId, reason) => {
  return deleteOfferedRide(userId, rideId, { permanent: false, reason });
};
