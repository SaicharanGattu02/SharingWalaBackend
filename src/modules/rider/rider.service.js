import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/apiError.js';
import { formatRideForFlutter } from '../user/user.service.js';

/**
 * 1. Get or create Driver Profile
 */
export const getRiderStatus = async (userId) => {
  let profile = await prisma.driverProfile.findUnique({
    where: { userId },
    include: {
      vehicles: true,
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

  return {
    isDriver: true,
    driverId: profile.id,
    verificationStatus: profile.verificationStatus,
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
 * 2. Apply for Driver
 */
export const applyAsDriver = async (userId, { licenseNumber, licenseExpiryDate }) => {
  const existing = await prisma.driverProfile.findUnique({ where: { userId } });
  if (existing) {
    throw new ApiError(409, 'Driver profile already exists for this account');
  }

  const profile = await prisma.driverProfile.create({
    data: {
      userId,
      licenseNumber: licenseNumber.trim(),
      licenseExpiryDate: new Date(licenseExpiryDate),
      verificationStatus: 'APPROVED', // auto-approve in development mode for instant friction-free testing
      verifiedAt: new Date(),
    },
  });

  return {
    driverId: profile.id,
    verificationStatus: profile.verificationStatus,
    message: 'Driver profile activated successfully!',
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

export const getRiderVehicles = async (userId) => {
  const driver = await prisma.driverProfile.findUnique({
    where: { userId },
    include: { vehicles: true },
  });

  if (!driver) return [];

  return driver.vehicles.map(formatVehicle);
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

  const parts = name.trim().split(' ');
  const make = parts[0] || 'Vehicle';
  const model = parts.slice(1).join(' ') || '';

  const vehicle = await prisma.vehicle.create({
    data: {
      driverId: driver.id,
      vehicleType: type.toUpperCase() === 'BIKE' ? 'BIKE' : 'CAR',
      registrationNumber: numberPlate.trim().toUpperCase(),
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
    updateData.registrationNumber = data.numberPlate.trim().toUpperCase();
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
  const date = new Date();
  if (dateStr && dateStr.toLowerCase() === 'tomorrow') {
    date.setDate(date.getDate() + 1);
  } else if (dateStr && dateStr !== 'Today' && !isNaN(Date.parse(dateStr))) {
    const parsed = new Date(dateStr);
    date.setFullYear(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  if (timeStr) {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3] ? match[3].toUpperCase() : null;

      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      date.setHours(hours, minutes, 0, 0);
    }
  } else {
    date.setHours(date.getHours() + 1);
  }

  return date;
};

/**
 * 4. Offer a Ride (Carpool / Bikepool / Other / Recurring)
 */
export const offerRide = async (userId, data) => {
  let driver = await prisma.driverProfile.findUnique({
    where: { userId },
  });

  if (!driver) {
    driver = await prisma.driverProfile.create({
      data: {
        userId,
        licenseNumber: `DL_${Date.now()}`,
        licenseExpiryDate: new Date('2035-12-31'),
        verificationStatus: 'APPROVED',
      },
    });
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
    const recurring = await prisma.recurringRide.create({
      data: {
        driverId: driver.id,
        vehicleId,
        startLocationName: data.origin,
        startLat: data.originLat || 17.448293,
        startLng: data.originLng || 78.391487,
        endLocationName: data.destination,
        endLat: data.destLat || 17.437462,
        endLng: data.destLng || 78.365448,
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

  const baseFare = data.pricePerSeat !== undefined
    ? Number(data.pricePerSeat)
    : (isBike ? 25.0 : 45.0);
  const notes = (data.notes || data.pickupFlexibility || 'Daily commute connection').trim();
  const meetingPoint = (data.meetingPoint || data.pickupFlexibility || `${data.origin} Main Point`).trim();

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
      startLat: data.originLat || 17.448293,
      startLng: data.originLng || 78.391487,
      endLocationName: data.destination,
      endLat: data.destLat || 17.437462,
      endLng: data.destLng || 78.365448,
      status: 'PUBLISHED',
      womenOnly: Boolean(data.isWomenOnly),
      autoAccept: Boolean(data.autoAccept),
      notes,
      pricing: {
        create: {
          pricingType: 'COST_SHARING',
          costPerSeat: baseFare,
          totalCost: baseFare * totalSeats,
          currency: 'INR',
        },
      },
      stops: {
        create: [
          {
            sequence: 1,
            name: meetingPoint,
            latitude: data.originLat || 17.448293,
            longitude: data.originLng || 78.391487,
            stopType: 'START',
            estimatedArrivalAt: departureDate,
          },
          {
            sequence: 2,
            name: data.destination,
            latitude: data.destLat || 17.437462,
            longitude: data.destLng || 78.365448,
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
export const getMyOfferedRides = async (userId) => {
  const driver = await prisma.driverProfile.findUnique({
    where: { userId },
  });

  if (!driver) return [];

  const rides = await prisma.ride.findMany({
    where: { driverId: driver.id },
    include: {
      vehicle: true,
      pricing: true,
      driver: { include: { user: true } },
      bookings: {
        include: {
          passenger: {
            select: { id: true, displayName: true, phone: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return rides.map((r) => {
    const formatted = formatRideForFlutter(r);
    formatted.passengerRequests = r.bookings.map((b) => ({
      bookingId: b.id,
      passengerId: b.passenger.id,
      passengerName: b.passenger.displayName,
      passengerPhone: b.passenger.phone,
      passengerAvatar: b.passenger.avatarUrl,
      seatsRequested: b.seatsBooked,
      status: b.status.toLowerCase(),
      totalFare: Number(b.totalFare),
      requestedAt: b.createdAt,
    }));
    return formatted;
  });
};

/**
 * 6. Accept or Decline Passenger Request
 */
export const respondToPassengerRequest = async (userId, bookingId, action) => {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        ride: { include: { driver: true } },
      },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking request not found');
    }

    if (booking.ride.driver.userId !== userId) {
      throw new ApiError(403, 'Unauthorized to respond to this ride request');
    }

    const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';

    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
    });

    if (action === 'ACCEPT') {
      await tx.ride.update({
        where: { id: booking.rideId },
        data: {
          availableSeats: { decrement: booking.seatsBooked },
        },
      });
    }

    return {
      bookingId: updatedBooking.id,
      status: newStatus.toLowerCase(),
      message: action === 'ACCEPT' ? 'Seat request accepted!' : 'Seat request declined.',
    };
  });
};

/**
 * 7. Change Ride Status (Start, Complete, Cancel)
 */
export const updateOfferedRideStatus = async (userId, rideId, status) => {
  const driver = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!driver) throw new ApiError(403, 'Unauthorized');

  const ride = await prisma.ride.findFirst({
    where: { id: rideId, driverId: driver.id },
  });

  if (!ride) throw new ApiError(404, 'Offered ride not found');

  const updated = await prisma.ride.update({
    where: { id: rideId },
    data: { status },
  });

  return {
    rideId: updated.id,
    status: updated.status.toLowerCase(),
    message: `Ride marked as ${updated.status.toLowerCase()}`,
  };
};

/**
 * 8. Update Offered Ride (Carpool / Bikepool / Details)
 */
export const updateOfferedRide = async (userId, rideId, data) => {
  const driver = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!driver) throw new ApiError(403, 'Unauthorized: No driver profile found');

  const ride = await prisma.ride.findFirst({
    where: { id: rideId, driverId: driver.id },
    include: {
      vehicle: true,
      pricing: true,
      stops: true,
      bookings: true,
    },
  });

  if (!ride) throw new ApiError(404, 'Offered ride not found');

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
  if (data.vehicleId && data.vehicleId !== 'v_default') {
    const v = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, driverId: driver.id },
    });
    if (v) vehicleId = v.id;
  } else if (data.vehicleNumber) {
    const v = await prisma.vehicle.findFirst({
      where: { driverId: driver.id, registrationNumber: data.vehicleNumber.trim().toUpperCase() },
    });
    if (v) vehicleId = v.id;
  }

  // Seats calculation
  const newTotalSeats = data.seats || data.availableSeats || ride.totalSeats;
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

  const newPricePerSeat = data.pricePerSeat !== undefined
    ? Number(data.pricePerSeat)
    : (ride.pricing ? Number(ride.pricing.costPerSeat) : null);

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
          costPerSeat: newPricePerSeat,
          totalCost: newPricePerSeat * newTotalSeats,
        },
        create: {
          rideId,
          pricingType: 'COST_SHARING',
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
export const deleteOfferedRide = async (userId, rideId) => {
  const driver = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!driver) throw new ApiError(403, 'Unauthorized: No driver profile found');

  const ride = await prisma.ride.findFirst({
    where: { id: rideId },
  });

  if (!ride) {
    return { id: rideId, deleted: true, message: 'Offered ride already deleted' };
  }

  if (ride.driverId !== driver.id) {
    throw new ApiError(403, 'Unauthorized: Ride belongs to another driver');
  }

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
    message: 'Offered ride deleted successfully',
  };
};
