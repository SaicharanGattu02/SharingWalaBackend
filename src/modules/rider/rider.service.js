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
export const getRiderVehicles = async (userId) => {
  const driver = await prisma.driverProfile.findUnique({
    where: { userId },
    include: { vehicles: true },
  });

  if (!driver) return [];

  return driver.vehicles.map((v) => ({
    id: v.id,
    name: `${v.make} ${v.model}`,
    numberPlate: v.registrationNumber,
    color: v.color,
    type: v.vehicleType === 'CAR' ? 'Car' : 'Bike',
    capacity: v.seatCapacity,
  }));
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
  const make = parts[0] || 'Generic';
  const model = parts.slice(1).join(' ') || 'Model';

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

  return {
    id: vehicle.id,
    name: `${vehicle.make} ${vehicle.model}`,
    numberPlate: vehicle.registrationNumber,
    color: vehicle.color,
    type: vehicle.vehicleType === 'CAR' ? 'Car' : 'Bike',
    capacity: vehicle.seatCapacity,
  };
};

/**
 * 4. Offer a Ride (Carpool / Bikepool / Other)
 */
export const offerRide = async (userId, data) => {
  const driver = await prisma.driverProfile.findUnique({
    where: { userId },
  });

  if (!driver) {
    throw new ApiError(403, 'Must be registered as a driver to offer a ride');
  }

  // Parse departure time into Date
  const departureDate = new Date();
  departureDate.setHours(departureDate.getHours() + 1); // default 1 hour from now

  const ride = await prisma.ride.create({
    data: {
      driverId: driver.id,
      vehicleId: data.vehicleId,
      departureAt: departureDate,
      estimatedArrivalAt: new Date(departureDate.getTime() + 45 * 60000), // +45 mins
      totalSeats: data.availableSeats,
      availableSeats: data.availableSeats,
      startLocationName: data.origin,
      startLat: data.originLat,
      startLng: data.originLng,
      endLocationName: data.destination,
      endLat: data.destLat,
      endLng: data.destLng,
      status: 'PUBLISHED',
      womenOnly: data.isWomenOnly,
      autoAccept: data.autoAccept,
      notes: data.notes || '',
      pricing: {
        create: {
          pricingType: 'COST_SHARING',
          baseFare: data.pricePerSeat,
          ratePerKm: 3.5,
          totalEstimatedFare: data.pricePerSeat,
        },
      },
      stops: {
        create: [
          {
            sequence: 1,
            name: data.meetingPoint || `${data.origin} Main Point`,
            latitude: data.originLat,
            longitude: data.originLng,
            stopType: 'START',
          },
          {
            sequence: 2,
            name: data.destination,
            latitude: data.destLat,
            longitude: data.destLng,
            stopType: 'END',
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
