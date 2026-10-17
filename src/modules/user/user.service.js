import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/apiError.js';

const defaultMockRides = [
  {
    id: 'ride_101',
    driverId: 'drv_1',
    driverName: 'Ravi Kumar',
    driverAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    rating: 4.95,
    totalRides: 124,
    isVerified: true,
    routeMatchPercentage: 95,
    origin: 'Kondapur Main Road',
    destination: 'Cyber Towers, Hitech City',
    departureTime: '08:30 AM',
    date: 'Today',
    mode: 'carpool',
    rideType: 'recurring',
    availableSeats: 3,
    totalSeats: 4,
    vehicleName: 'Honda City',
    vehicleNumber: 'TS 07 FA 1024',
    vehicleColor: 'Silver',
    communityName: 'Hitech Techies Community',
    pickupFlexibility: 'Flexible within 500m',
    notes: 'Daily office commute. Clean car, pleasant music, split fuel cost community ride.',
    status: 'available',
    meetingPoint: 'Near Kondapur Signal Metro Pillar 42',
    isWomenOnly: false,
    pricePerSeat: 45.0,
  },
  {
    id: 'ride_102',
    driverId: 'drv_2',
    driverName: 'Kiran Reddy',
    driverAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    rating: 4.88,
    totalRides: 89,
    isVerified: true,
    routeMatchPercentage: 91,
    origin: 'Miyapur Junction',
    destination: 'Financial District, Gachibowli',
    departureTime: '08:45 AM',
    date: 'Today',
    mode: 'carpool',
    rideType: 'oneTime',
    availableSeats: 2,
    totalSeats: 3,
    vehicleName: 'Tata Nexon EV',
    vehicleNumber: 'TS 08 EX 8820',
    vehicleColor: 'Teal Blue',
    communityName: 'Financial District Commuters',
    pickupFlexibility: 'Exact location pickup',
    notes: 'Electric car commute. AC on, non-smoker car.',
    status: 'available',
    meetingPoint: 'Miyapur Bus Stop',
    isWomenOnly: false,
    pricePerSeat: 50.0,
  },
  {
    id: 'ride_103',
    driverId: 'drv_3',
    driverName: 'Arjun Mehta',
    driverAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    rating: 4.92,
    totalRides: 64,
    isVerified: true,
    routeMatchPercentage: 88,
    origin: 'Gachibowli Circle',
    destination: 'DLF Cyber City',
    departureTime: '09:00 AM',
    date: 'Today',
    mode: 'bikepool',
    rideType: 'recurring',
    availableSeats: 1,
    totalSeats: 1,
    vehicleName: 'Yamaha FZ-S',
    vehicleNumber: 'TS 09 FZ 3341',
    vehicleColor: 'Matte Black',
    communityName: 'Bikepool Express',
    pickupFlexibility: 'Flexible 2 mins stop',
    notes: 'Spare helmet available. Quick commute to beat office traffic.',
    status: 'available',
    meetingPoint: 'Gachibowli Flyover Start',
    isWomenOnly: false,
    pricePerSeat: 25.0,
  },
  {
    id: 'ride_104',
    driverId: 'drv_4',
    driverName: 'Priya Sharma',
    driverAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    rating: 4.98,
    totalRides: 156,
    isVerified: true,
    routeMatchPercentage: 94,
    origin: 'Kukatpally Housing Board',
    destination: 'Mindspace IT Park',
    departureTime: '08:20 AM',
    date: 'Today',
    mode: 'carpool',
    rideType: 'recurring',
    availableSeats: 2,
    totalSeats: 3,
    vehicleName: 'Hyundai i20',
    vehicleNumber: 'TS 09 ER 1102',
    vehicleColor: 'White',
    communityName: 'Women Commuters Club',
    pickupFlexibility: 'KPHB Metro Station',
    notes: 'Women-preferred carpool. Daily IT commute.',
    status: 'available',
    meetingPoint: 'KPHB Metro Pillar 18',
    isWomenOnly: true,
    pricePerSeat: 40.0,
  },
];

/**
 * Format database user into Flutter UserProfile model
 */
const formatUserProfile = (user) => {
  const driverProfile = user.driverProfile;
  const vehicles = (driverProfile?.vehicles || []).map((v) => ({
    id: v.id,
    name: `${v.make} ${v.model}`,
    numberPlate: v.registrationNumber,
    color: v.color,
    type: v.vehicleType === 'CAR' ? 'Car' : 'Bike',
    capacity: v.seatCapacity,
  }));

  const trustedContacts = (user.emergencyContacts || []).map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    relationship: c.relationship,
  }));

  const joinedCommunities = (user.communityMemberships || []).map((m) => m.communityId);

  return {
    id: user.id,
    name: user.displayName,
    phone: user.phone,
    avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    gender: user.gender === 'MALE' ? 'Male' : user.gender === 'FEMALE' ? 'Female' : 'Other',
    homeArea: user.homeArea || 'Kondapur, Hyderabad',
    workArea: user.workArea || 'Hitech City, Hyderabad',
    preferredMode: user.preferredMode || 'both',
    rolePreference: user.rolePreference || 'both',
    identityVerified: user.phoneVerifiedAt !== null,
    driverVerified: driverProfile?.verificationStatus === 'APPROVED',
    rating: driverProfile ? Number(driverProfile.averageRating) : 5.0,
    totalRidesCompleted: driverProfile?.totalRidesOffered || user.bookingsAsPassenger?.length || 0,
    vehicles,
    trustedContacts,
    joinedCommunities,
    womenOnlyPreference: user.womenOnlyPreference || false,
  };
};

/**
 * Format database Ride into Flutter Ride model
 */
export const formatRideForFlutter = (ride) => {
  const driver = ride.driver;
  const user = driver?.user;
  const vehicle = ride.vehicle;

  const departureDate = new Date(ride.departureAt);
  const now = new Date();
  const isToday = departureDate.toDateString() === now.toDateString();
  const isTomorrow = new Date(now.setDate(now.getDate() + 1)).toDateString() === departureDate.toDateString();

  const formattedDate = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : departureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formattedTime = departureDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const mode = vehicle?.vehicleType === 'BIKE' ? 'bikepool' : 'carpool';
  const price = ride.pricing ? Number(ride.pricing.baseFare) : 45.0;

  return {
    id: ride.id,
    driverId: driver?.id || ride.driverId,
    driverName: user?.displayName || 'Driver',
    driverAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    rating: driver ? Number(driver.averageRating) : 4.9,
    totalRides: driver?.totalRidesOffered || 10,
    isVerified: driver?.verificationStatus === 'APPROVED',
    routeMatchPercentage: 95,
    origin: ride.startLocationName,
    destination: ride.endLocationName,
    departureTime: formattedTime,
    date: formattedDate,
    mode,
    rideType: ride.recurringRideId ? 'recurring' : 'oneTime',
    availableSeats: ride.availableSeats,
    totalSeats: ride.totalSeats,
    vehicleName: vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle',
    vehicleNumber: vehicle?.registrationNumber || 'TS 09 EQ 1234',
    vehicleColor: vehicle?.color || 'Silver',
    communityName: null,
    pickupFlexibility: 'Flexible within 500m',
    notes: ride.notes || 'Daily commute ride. Clean vehicle, split fuel cost community ride.',
    status: ride.status === 'PUBLISHED' ? 'available' : ride.status.toLowerCase(),
    meetingPoint: ride.stops?.[0]?.name || `${ride.startLocationName} Main Gate`,
    isWomenOnly: ride.womenOnly,
    pricePerSeat: price,
  };
};

/**
 * 1. Get Logged-in User Profile
 */
export const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      driverProfile: {
        include: {
          vehicles: true,
        },
      },
      emergencyContacts: true,
      communityMemberships: true,
      bookingsAsPassenger: {
        where: { status: 'COMPLETED' },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  return formatUserProfile(user);
};

/**
 * 2. Update User Profile & Preferences
 */
export const updateUserProfile = async (userId, data) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.displayName && { displayName: data.displayName }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.gender && { gender: data.gender }),
    },
    include: {
      driverProfile: {
        include: { vehicles: true },
      },
      emergencyContacts: true,
      communityMemberships: true,
    },
  });

  return formatUserProfile(updatedUser);
};

/**
 * 3. Emergency / Trusted Contacts
 */
export const getTrustedContacts = async (userId) => {
  const contacts = await prisma.emergencyContact.findMany({
    where: { userId },
  });
  return contacts.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    relationship: c.relationship,
  }));
};

export const addTrustedContact = async (userId, { name, phone, relationship }) => {
  const created = await prisma.emergencyContact.create({
    data: { userId, name, phone, relationship },
  });
  return {
    id: created.id,
    name: created.name,
    phone: created.phone,
    relationship: created.relationship,
  };
};

export const deleteTrustedContact = async (userId, contactId) => {
  await prisma.emergencyContact.deleteMany({
    where: { id: contactId, userId },
  });
  return { success: true };
};

/**
 * 4. Search Available Rides for Commuters
 */
export const searchUserRides = async (query = {}) => {
  const { origin, destination, mode, womenOnly } = query;

  const whereClause = {
    status: 'PUBLISHED',
    availableSeats: { gt: 0 },
    departureAt: { gte: new Date() },
  };

  if (womenOnly === 'true') {
    whereClause.womenOnly = true;
  }

  if (mode && mode !== 'all') {
    if (mode === 'bikepool') {
      whereClause.vehicle = { vehicleType: 'BIKE' };
    } else if (mode === 'carpool') {
      whereClause.vehicle = { vehicleType: 'CAR' };
    }
  }

  if (origin) {
    whereClause.startLocationName = { contains: origin.trim() };
  }
  if (destination) {
    whereClause.endLocationName = { contains: destination.trim() };
  }

  const rides = await prisma.ride.findMany({
    where: whereClause,
    include: {
      driver: {
        include: { user: true },
      },
      vehicle: true,
      pricing: true,
      stops: {
        orderBy: { sequence: 'asc' },
      },
    },
    orderBy: { departureAt: 'asc' },
    take: 30,
  });

  if (rides.length > 0) {
    return rides.map(formatRideForFlutter);
  }

  // Fallback initial commuter rides from Flutter MockDataService for instant UI preview
  return defaultMockRides.filter((r) => {
    if (womenOnly === 'true' && !r.isWomenOnly) return false;
    if (mode && mode !== 'all' && r.mode !== mode) return false;
    if (origin && !r.origin.toLowerCase().includes(origin.toLowerCase())) return false;
    if (destination && !r.destination.toLowerCase().includes(destination.toLowerCase())) return false;
    return true;
  });
};

/**
 * 5. Get Ride Details by ID
 */
export const getRideDetails = async (rideId) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      driver: {
        include: { user: true },
      },
      vehicle: true,
      pricing: true,
      stops: {
        orderBy: { sequence: 'asc' },
      },
      bookings: {
        include: {
          passenger: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      },
    },
  });

  if (!ride) {
    const mockRide = defaultMockRides.find((r) => r.id === rideId);
    if (mockRide) {
      return {
        ...mockRide,
        stopsTimeline: [
          { id: 'stop_1', name: mockRide.origin, sequence: 1, type: 'START', time: mockRide.departureTime },
          { id: 'stop_2', name: mockRide.destination, sequence: 2, type: 'END', time: '09:15 AM' },
        ],
      };
    }
    throw new ApiError(404, 'Ride not found');
  }

  const formatted = formatRideForFlutter(ride);
  formatted.stopsTimeline = ride.stops.map((s) => ({
    id: s.id,
    name: s.name,
    sequence: s.sequence,
    type: s.stopType,
    time: s.estimatedArrivalAt ? new Date(s.estimatedArrivalAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
  }));

  return formatted;
};

/**
 * 6. Request a Seat on a Ride
 */
export const requestSeatOnRide = async (passengerUserId, rideId, { seats = 1, pickupPoint, dropoffPoint, notes }) => {
  return await prisma.$transaction(async (tx) => {
    const ride = await tx.ride.findUnique({
      where: { id: rideId },
      include: { pricing: true, driver: true },
    });

    if (!ride) {
      throw new ApiError(404, 'Ride not found');
    }

    if (ride.availableSeats < seats) {
      throw new ApiError(400, `Not enough seats available. Only ${ride.availableSeats} remaining.`);
    }

    const pricePerSeat = ride.pricing ? Number(ride.pricing.baseFare) : 45.0;
    const totalFare = pricePerSeat * seats;

    // Create Booking
    const booking = await tx.booking.create({
      data: {
        rideId,
        passengerId: passengerUserId,
        seatsBooked: seats,
        totalFare,
        status: ride.autoAccept ? 'ACCEPTED' : 'PENDING',
        notes,
      },
    });

    // If auto-accepted, decrement available seats atomically
    if (ride.autoAccept) {
      await tx.ride.update({
        where: { id: rideId },
        data: {
          availableSeats: { decrement: seats },
          ...(ride.availableSeats - seats === 0 ? { status: 'FULL' } : {}),
        },
      });
    }

    return {
      bookingId: booking.id,
      rideId,
      status: booking.status === 'ACCEPTED' ? 'accepted' : 'requestSent',
      seatsBooked: seats,
      totalFare,
      message: ride.autoAccept ? 'Seat confirmed automatically!' : 'Seat request sent to rider.',
    };
  });
};

/**
 * 7. My Rides (Categorized: Active, Upcoming, Completed)
 */
export const getUserMyRides = async (userId) => {
  const bookings = await prisma.booking.findMany({
    where: { passengerId: userId },
    include: {
      ride: {
        include: {
          driver: { include: { user: true } },
          vehicle: true,
          pricing: true,
          stops: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const active = [];
  const upcoming = [];
  const completed = [];

  for (const b of bookings) {
    if (!b.ride) continue;
    const formatted = formatRideForFlutter(b.ride);
    formatted.bookingId = b.id;
    formatted.seatsBooked = b.seatsBooked;
    formatted.bookingStatus = b.status.toLowerCase();

    if (b.ride.status === 'IN_PROGRESS' || b.status === 'ACCEPTED' && new Date(b.ride.departureAt) <= new Date()) {
      active.push(formatted);
    } else if (b.ride.status === 'COMPLETED' || b.status === 'COMPLETED') {
      completed.push(formatted);
    } else if (b.status === 'PENDING' || b.status === 'ACCEPTED') {
      upcoming.push(formatted);
    }
  }

  return { active, upcoming, completed };
};

/**
 * 8. Active Ride Live Tracking Details
 */
export const getActiveRideTracking = async (userId, rideId) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      driver: { include: { user: true } },
      vehicle: true,
      pricing: true,
      stops: { orderBy: { sequence: 'asc' } },
      bookings: {
        where: { passengerId: userId },
      },
    },
  });

  if (!ride) {
    throw new ApiError(404, 'Active ride not found');
  }

  return {
    rideId: ride.id,
    driverName: ride.driver.user.displayName,
    driverPhone: ride.driver.user.phone,
    driverAvatar: ride.driver.user.avatarUrl,
    vehicleName: `${ride.vehicle.make} ${ride.vehicle.model}`,
    vehicleNumber: ride.vehicle.registrationNumber,
    vehicleColor: ride.vehicle.color,
    status: ride.status.toLowerCase(),
    currentLocation: {
      latitude: Number(ride.startLat) + 0.005,
      longitude: Number(ride.startLng) + 0.005,
      heading: 45.0,
      speedKmh: 35,
    },
    otp: '4821',
    meetingPoint: ride.stops?.[0]?.name || ride.startLocationName,
    emergencyContacts: await getTrustedContacts(userId),
  };
};
