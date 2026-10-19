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
          pricingType,
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
export const getMyOfferedRides = async (userId, query = {}) => {
  const driver = await prisma.driverProfile.findUnique({
    where: { userId },
  });

  if (!driver) return [];

  const statusParam = (query.status || 'active').toLowerCase();
  let statusCondition;
  if (statusParam === 'all') {
    statusCondition = undefined;
  } else if (statusParam === 'cancelled') {
    statusCondition = 'CANCELLED';
  } else if (statusParam === 'completed') {
    statusCondition = 'COMPLETED';
  } else {
    // Default: 'active' offered rides only (excludes cancelled and completed)
    statusCondition = { in: ['PUBLISHED', 'IN_PROGRESS', 'FULL'] };
  }

  const rides = await prisma.ride.findMany({
    where: {
      driverId: driver.id,
      ...(statusCondition ? { status: statusCondition } : {}),
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
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { departureAt: 'asc' },
  });

  return rides.map((r) => {
    const formatted = formatRideForFlutter(r);
    formatted.isHost = true;
    formatted.passengerRequests = r.bookings.map((b) => ({
      bookingId: b.id,
      passengerId: b.passenger.id,
      passengerName: b.passenger.displayName,
      passengerPhone: b.passenger.phone,
      passengerAvatar: b.passenger.avatarUrl,
      seatsRequested: b.seatsRequested,
      status: b.status.toLowerCase(),
      totalFare: Number(b.totalCostContribution || 0),
      requestedAt: b.requestedAt || b.createdAt,
    }));
    return formatted;
  });
};

/**
 * 5b. Get Passengers / Bookings for a Specific Offered Ride
 */
export const getOfferedRidePassengers = async (userId, rideId) => {
  const driver = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!driver) throw new ApiError(403, 'Unauthorized: Driver profile not found');

  const ride = await prisma.ride.findFirst({
    where: { id: rideId, driverId: driver.id },
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
  });

  if (!ride) throw new ApiError(404, 'Offered ride not found');

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
    const isOnboard = Boolean(b.passengerNotes && b.passengerNotes.includes('[ONBOARD]'));
    const isCompleted = b.status === 'COMPLETED' || ride.status === 'COMPLETED';

    let passengerStatus = 'Pending';
    if (isOnboard) {
      passengerStatus = 'Onboard';
    } else if (isCompleted) {
      passengerStatus = 'Trip Completed';
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
      isPickedUp: isOnboard,
      isOnboard,
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
      requestedAt: b.requestedAt || b.createdAt,
      acceptedAt: b.acceptedAt,
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
    const isOffboard = ['OFFBOARD', 'DROPOFF', 'DROPPED_OFF'].includes(raw);

    if (!isAccept && !isReject && !isOnboard && !isOffboard) {
      throw new ApiError(400, 'Invalid action. Must be ACCEPT, DECLINE/REJECT, ONBOARD, or OFFBOARD');
    }

    const passengerName = booking.passenger?.displayName || 'Passenger';
    const seats = booking.seatsRequested;
    let currentRide = booking.ride;

    // --- Action: ONBOARD ---
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
        seats,
        availableSeats: currentRide.availableSeats,
        totalSeats: currentRide.totalSeats,
        bookedCount: currentRide.totalSeats - currentRide.availableSeats,
        message: `${passengerName} is now marked Onboard!`,
      };
    }

    // --- Action: OFFBOARD ---
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

/**
 * 7. Start Trip (Rider starts the offered ride)
 */
export const startTrip = async (userId, rideId, options = {}) => {
  const driver = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!driver) throw new ApiError(403, 'Unauthorized: Driver profile not found');

  const ride = await prisma.ride.findFirst({
    where: { id: rideId, driverId: driver.id },
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
  });

  if (!ride) throw new ApiError(404, 'Offered ride not found');

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
      const isOnboard = Boolean(b.passengerNotes && b.passengerNotes.includes('[ONBOARD]'));
      const fare = Number(b.totalCostContribution || 0);
      totalFareCollected += fare;
      const cleanNotes = (b.passengerNotes || '').replace(/\[ONBOARD\]/g, '').trim();

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
        isPickedUp: isOnboard,
        isOnboard,
        status: isOnboard ? 'Onboard' : 'Confirmed',
        statusLabel: isOnboard ? 'Onboard' : 'Confirmed',
        rawStatus: b.status.toLowerCase(),
        pickupLocation: b.pickupStop?.name || cleanNotes || `${currentRide.startLocationName} Point`,
        dropLocation: b.dropoffStop?.name || currentRide.endLocationName,
        pickupPoint: b.pickupStop?.name || cleanNotes || `${currentRide.startLocationName} Point`,
        dropoffPoint: b.dropoffStop?.name || currentRide.endLocationName,
        acceptedAt: b.acceptedAt,
      };
    });

  const bookedCount = currentRide.totalSeats - currentRide.availableSeats;
  const originName = currentRide.startLocationName.includes(',')
    ? currentRide.startLocationName.split(',')[0].trim()
    : currentRide.startLocationName;
  const destName = currentRide.endLocationName.includes(',')
    ? currentRide.endLocationName.split(',')[0].trim()
    : currentRide.endLocationName;

  return {
    id: currentRide.id,
    rideId: currentRide.id,
    tripId: currentRide.id,
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
};

/**
 * 7b. Complete Trip (Rider marks the trip as completed)
 */
export const completeTrip = async (userId, rideId, options = {}) => {
  const driver = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!driver) throw new ApiError(403, 'Unauthorized: Driver profile not found');

  const ride = await prisma.ride.findFirst({
    where: { id: rideId, driverId: driver.id },
    include: {
      vehicle: true,
      pricing: true,
      bookings: {
        where: { status: 'ACCEPTED' },
      },
    },
  });

  if (!ride) throw new ApiError(404, 'Offered ride not found');

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

  const driver = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!driver) throw new ApiError(403, 'Unauthorized');

  const ride = await prisma.ride.findFirst({
    where: { id: rideId, driverId: driver.id },
  });

  if (!ride) throw new ApiError(404, 'Offered ride not found');

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
  const driver = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!driver) throw new ApiError(403, 'Unauthorized: No driver profile found');

  const ride = await prisma.ride.findFirst({
    where: { id: rideId },
  });

  if (!ride) {
    return { id: rideId, deleted: true, status: 'cancelled', message: 'Offered ride already deleted' };
  }

  if (ride.driverId !== driver.id) {
    throw new ApiError(403, 'Unauthorized: Ride belongs to another driver');
  }

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
