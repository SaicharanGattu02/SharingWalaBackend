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
    name: v.model && v.model.trim().length > 0 ? `${v.make} ${v.model}`.trim() : v.make,
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

  const isDriver =
    (user.isDriverMode === true || user.is_driver_mode === 1) ||
    (user.activeRole && user.activeRole.toUpperCase() === 'HOST') ||
    (user.rolePreference && (user.rolePreference === 'offerRide' || user.rolePreference.toUpperCase() === 'HOST'));
  const activeRole = isDriver ? 'Host' : 'Guest';

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
    activeRole: activeRole,
    isDriverMode: isDriver,
    currentRole: activeRole,
    role: activeRole,
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
  const isPast = !isNaN(departureDate.getTime()) && departureDate.getTime() < now.getTime();
  const is24HoursPast = !isNaN(departureDate.getTime()) && (now.getTime() - departureDate.getTime() > 24 * 60 * 60 * 1000);
  const isToday = departureDate.toDateString() === now.toDateString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = tomorrow.toDateString() === departureDate.toDateString();

  const formattedDate = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : departureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formattedTime = departureDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const mode = vehicle?.vehicleType === 'BIKE' ? 'bikepool' : 'carpool';
  const price = ride.pricing ? Number(ride.pricing.costPerSeat ?? ride.pricing.baseFare ?? 45.0) : 45.0;

  // Check if ride has valid passenger bookings/requests
  const validBookings = (ride.bookings || []).filter(
    (b) => b.status === 'ACCEPTED' || b.status === 'COMPLETED' || b.status === 'PENDING'
  );
  const hasBookings = validBookings.length > 0;

  const rawStatus = (ride.status || 'PUBLISHED').toUpperCase();
  let status = 'available';

  if (rawStatus === 'CANCELLED') {
    status = 'cancelled';
  } else if (rawStatus === 'COMPLETED') {
    status = 'completed';
  } else if (rawStatus === 'IN_PROGRESS') {
    status = 'in_progress';
  } else if (isPast) {
    if (hasBookings) {
      // Departure passed with passengers -> Completed ride, not expired
      status = 'completed';
    } else if (is24HoursPast) {
      // 0 bookings and more than 24 hours passed since departure -> Expired
      status = 'expired';
    } else {
      // Within 24-hour cycle of offered trip -> Stays active/available
      status = 'available';
    }
  } else {
    status = rawStatus === 'PUBLISHED' ? 'available' : rawStatus.toLowerCase();
  }

  const isExpired = status === 'expired';

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
    status,
    isExpired,
    meetingPoint: ride.stops?.[0]?.name || `${ride.startLocationName} Main Gate`,
    isWomenOnly: ride.womenOnly,
    pricePerSeat: price,
    price: price,
    isFree: price === 0 || ride.pricing?.pricingType === 'FREE',
    pricingType: (price === 0 || ride.pricing?.pricingType === 'FREE') ? 'FREE' : 'COST_SHARING',
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
  const updatePayload = {};

  if (data.displayName !== undefined) updatePayload.displayName = data.displayName;
  if (data.avatarUrl !== undefined) updatePayload.avatarUrl = data.avatarUrl;
  if (data.gender !== undefined) updatePayload.gender = data.gender;
  if (data.homeArea !== undefined) updatePayload.homeArea = data.homeArea;
  if (data.workArea !== undefined) updatePayload.workArea = data.workArea;
  if (data.preferredMode !== undefined) updatePayload.preferredMode = data.preferredMode;
  if (data.rolePreference !== undefined) updatePayload.rolePreference = data.rolePreference;
  if (data.womenOnlyPreference !== undefined) updatePayload.womenOnlyPreference = data.womenOnlyPreference;
  if (data.activeRole !== undefined) {
    const isHost = data.activeRole.toUpperCase() === 'HOST';
    updatePayload.rolePreference = isHost ? 'offerRide' : 'findRide';
  }
  if (data.isDriverMode !== undefined) {
    const isHost = Boolean(data.isDriverMode);
    updatePayload.rolePreference = isHost ? 'offerRide' : 'findRide';
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updatePayload,
    include: {
      driverProfile: {
        include: { vehicles: true },
      },
      emergencyContacts: true,
      communityMemberships: true,
      bookingsAsPassenger: true,
    },
  });

  if (data.activeRole !== undefined || data.isDriverMode !== undefined) {
    const isDriver = data.isDriverMode !== undefined
      ? Boolean(data.isDriverMode)
      : data.activeRole.toUpperCase() === 'HOST';
    try {
      await prisma.$executeRawUnsafe(
        'UPDATE users SET active_role = ?, is_driver_mode = ? WHERE id = ?',
        isDriver ? 'HOST' : 'GUEST',
        isDriver ? 1 : 0,
        userId
      );
    } catch {}
  }

  return formatUserProfile(updatedUser);
};

/**
 * 2b. Switch Active Role (Host <-> Guest)
 */
export const switchRole = async (userId, data = {}) => {
  let isDriver = false;
  if (data.isDriverMode !== undefined) {
    isDriver = Boolean(data.isDriverMode);
  } else if (data.role !== undefined) {
    isDriver = data.role.toUpperCase() === 'HOST';
  } else if (data.activeRole !== undefined) {
    isDriver = data.activeRole.toUpperCase() === 'HOST';
  }

  const roleName = isDriver ? 'HOST' : 'GUEST';
  const rolePref = isDriver ? 'offerRide' : 'findRide';

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      rolePreference: rolePref,
    },
    include: {
      driverProfile: {
        include: { vehicles: true },
      },
      emergencyContacts: true,
      communityMemberships: true,
      bookingsAsPassenger: true,
    },
  });

  try {
    await prisma.$executeRawUnsafe(
      'UPDATE users SET active_role = ?, is_driver_mode = ? WHERE id = ?',
      roleName,
      isDriver ? 1 : 0,
      userId
    );
  } catch {}

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
    data: {
      userId,
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim(),
    },
  });
  return {
    id: created.id,
    name: created.name,
    phone: created.phone,
    relationship: created.relationship,
  };
};

export const updateTrustedContact = async (userId, contactId, data = {}) => {
  const existing = await prisma.emergencyContact.findFirst({
    where: { id: contactId, userId },
  });

  if (!existing) {
    throw new ApiError(404, 'Trusted safety contact not found');
  }

  const updated = await prisma.emergencyContact.update({
    where: { id: contactId },
    data: {
      ...(data.name && { name: data.name.trim() }),
      ...(data.phone && { phone: data.phone.trim() }),
      ...(data.relationship && { relationship: data.relationship.trim() }),
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    phone: updated.phone,
    relationship: updated.relationship,
  };
};

export const deleteTrustedContact = async (userId, contactId) => {
  const existing = await prisma.emergencyContact.findFirst({
    where: { id: contactId, userId },
  });

  if (!existing) {
    return { id: contactId, success: true, message: 'Contact already removed' };
  }

  await prisma.emergencyContact.delete({
    where: { id: contactId },
  });

  return { id: contactId, success: true };
};

/**
 * Helper to enrich a formatted ride with the logged-in commuter's booking/request status
 * Status values: 'none' | 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
 */
export const enrichRideWithUserBooking = (formattedRide, rideBookings = [], currentUserId = null) => {
  let requestStatus = 'none';
  let userBooking = null;

  if (currentUserId && rideBookings && rideBookings.length > 0) {
    const myBooking = rideBookings.find((b) => b.passengerId === currentUserId);
    if (myBooking) {
      const statusLower = myBooking.status.toLowerCase();
      // Normalize 'declined' -> 'rejected', 'pending' -> 'pending', 'accepted' -> 'accepted'
      requestStatus = statusLower === 'declined' ? 'rejected' : statusLower;
      userBooking = {
        bookingId: myBooking.id,
        status: requestStatus,
        seatsRequested: myBooking.seatsRequested,
        totalFare: Number(myBooking.totalCostContribution || 0),
        notes: myBooking.passengerNotes || '',
        requestedAt: myBooking.requestedAt || myBooking.createdAt,
      };
    }
  }

  return {
    ...formattedRide,
    requestStatus,
    bookingStatus: requestStatus,
    isRequestSent: requestStatus !== 'none',
    userBooking,
  };
};

/**
 * 4. Search Available Rides for Commuters
 */
export const searchUserRides = async (query = {}, currentUserId = null) => {
  const { origin, destination, mode, womenOnly, verifiedOnly, search, q, date } = query;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const whereClause = {
    status: 'PUBLISHED',
    availableSeats: { gt: 0 },
    departureAt: { gte: new Date() },
  };

  if (date) {
    if (date.toLowerCase() === 'today') {
      const endOfToday = new Date(startOfToday);
      endOfToday.setHours(23, 59, 59, 999);
      whereClause.departureAt = { gte: new Date(), lte: endOfToday };
    } else if (date.toLowerCase() === 'tomorrow') {
      const startOfTomorrow = new Date(startOfToday);
      startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
      const endOfTomorrow = new Date(startOfTomorrow);
      endOfTomorrow.setHours(23, 59, 59, 999);
      whereClause.departureAt = { gte: startOfTomorrow, lte: endOfTomorrow };
    }
  }

  const isWomenOnly = womenOnly === 'true' || womenOnly === true;
  if (isWomenOnly) {
    whereClause.womenOnly = true;
  }

  const isVerifiedOnly = verifiedOnly === 'true' || verifiedOnly === true;
  if (isVerifiedOnly) {
    whereClause.driver = { verificationStatus: 'APPROVED' };
  }

  if (mode && mode !== 'all') {
    if (mode === 'bikepool') {
      whereClause.vehicle = { vehicleType: 'BIKE' };
    } else if (mode === 'carpool') {
      whereClause.vehicle = { vehicleType: 'CAR' };
    }
  }

  const cleanLoc = (str) => {
    if (!str || !str.trim()) return '';
    const parts = str.split(',').map((p) => p.trim()).filter(Boolean);
    return parts[0] || str.trim();
  };

  const andConditions = [];

  if (origin && origin.trim()) {
    const origClean = cleanLoc(origin);
    const origTokens = origin.split(/[,;\-\/]/).map((s) => s.trim()).filter((s) => s.length >= 3);
    const originMatchList = [
      { startLocationName: { contains: origin.trim() } },
      ...(origClean ? [{ startLocationName: { contains: origClean } }] : []),
      ...origTokens.slice(0, 3).map((t) => ({ startLocationName: { contains: t } })),
    ];
    andConditions.push({ OR: originMatchList });
  }

  if (destination && destination.trim()) {
    const destClean = cleanLoc(destination);
    const destTokens = destination.split(/[,;\-\/]/).map((s) => s.trim()).filter((s) => s.length >= 3);
    const destMatchList = [
      { endLocationName: { contains: destination.trim() } },
      ...(destClean ? [{ endLocationName: { contains: destClean } }] : []),
      ...destTokens.slice(0, 3).map((t) => ({ endLocationName: { contains: t } })),
    ];
    andConditions.push({ OR: destMatchList });
  }

  const keyword = (search || q || '').trim().toLowerCase();
  if (keyword) {
    andConditions.push({
      OR: [
        { startLocationName: { contains: keyword } },
        { endLocationName: { contains: keyword } },
        { notes: { contains: keyword } },
        { vehicle: { make: { contains: keyword } } },
        { vehicle: { model: { contains: keyword } } },
        { vehicle: { registrationNumber: { contains: keyword } } },
      ],
    });
  }

  if (andConditions.length > 0) {
    whereClause.AND = andConditions;
  }

  let rides = await prisma.ride.findMany({
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
      bookings: {
        select: {
          id: true,
          passengerId: true,
          status: true,
          seatsRequested: true,
          totalCostContribution: true,
          passengerNotes: true,
          requestedAt: true,
          createdAt: true,
        },
      },
    },
    orderBy: { departureAt: 'asc' },
    take: 30,
  });

  // If strict AND location matching returned no rides, perform relaxed search
  // so newly offered rides are visible to commuters even if search inputs contain slight variations
  if (rides.length === 0) {
    const relaxedWhere = {
      status: 'PUBLISHED',
      availableSeats: { gt: 0 },
    };
    if (isWomenOnly) relaxedWhere.womenOnly = true;
    if (isVerifiedOnly) relaxedWhere.driver = { verificationStatus: 'APPROVED' };
    if (mode && mode !== 'all') {
      relaxedWhere.vehicle = { vehicleType: mode === 'bikepool' ? 'BIKE' : 'CAR' };
    }

    // Try finding rides matching either origin OR destination
    const orLocationMatch = [];
    if (origin && origin.trim()) {
      const origClean = cleanLoc(origin);
      orLocationMatch.push({ startLocationName: { contains: origClean } });
    }
    if (destination && destination.trim()) {
      const destClean = cleanLoc(destination);
      orLocationMatch.push({ endLocationName: { contains: destClean } });
    }

    if (orLocationMatch.length > 0) {
      relaxedWhere.OR = orLocationMatch;
    }

    rides = await prisma.ride.findMany({
      where: relaxedWhere,
      include: {
        driver: { include: { user: true } },
        vehicle: true,
        pricing: true,
        stops: { orderBy: { sequence: 'asc' } },
        bookings: {
          select: {
            id: true,
            passengerId: true,
            status: true,
            seatsRequested: true,
            totalCostContribution: true,
            passengerNotes: true,
            requestedAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: { departureAt: 'asc' },
      take: 30,
    });
  }

  // If still no rides found in DB with relaxed location, fetch all active published rides
  if (rides.length === 0) {
    const broadWhere = {
      status: 'PUBLISHED',
      availableSeats: { gt: 0 },
    };
    if (isWomenOnly) broadWhere.womenOnly = true;
    if (isVerifiedOnly) broadWhere.driver = { verificationStatus: 'APPROVED' };
    if (mode && mode !== 'all') {
      broadWhere.vehicle = { vehicleType: mode === 'bikepool' ? 'BIKE' : 'CAR' };
    }

    rides = await prisma.ride.findMany({
      where: broadWhere,
      include: {
        driver: { include: { user: true } },
        vehicle: true,
        pricing: true,
        stops: { orderBy: { sequence: 'asc' } },
        bookings: {
          select: {
            id: true,
            passengerId: true,
            status: true,
            seatsRequested: true,
            totalCostContribution: true,
            passengerNotes: true,
            requestedAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: { departureAt: 'asc' },
      take: 30,
    });
  }

  if (rides.length > 0) {
    return rides.map((r) => enrichRideWithUserBooking(formatRideForFlutter(r), r.bookings, currentUserId));
  }

  // Final fallback initial commuter rides from Flutter MockDataService for instant preview
  return defaultMockRides
    .filter((r) => {
      if (isWomenOnly && !r.isWomenOnly) return false;
      if (isVerifiedOnly && !r.isVerified) return false;
      if (mode && mode !== 'all' && r.mode !== mode) return false;
      return true;
    })
    .map((r) => ({
      ...r,
      requestStatus: 'none',
      bookingStatus: 'none',
      isRequestSent: false,
      userBooking: null,
    }));
};

/**
 * 5. Get Ride Details by ID
 */
export const getRideDetails = async (rideId, currentUserId = null) => {
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
            select: { id: true, displayName: true, avatarUrl: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!ride) {
    // Check if it's a stranger trip
    try {
      const { getStrangerTripById, formatStrangerTripForOffered } = await import('../stranger/stranger.service.js');
      const st = await getStrangerTripById(rideId);
      if (st) {
        return {
          ...formatStrangerTripForOffered(st),
          requestStatus: 'none',
          bookingStatus: 'none',
          isRequestSent: false,
          userBooking: null,
          isFeedbackSubmitted: false,
          hasSubmittedFeedback: false,
          hasRated: false,
          canSubmitFeedback: false,
          userFeedback: null,
          stopsTimeline: [
            { id: 'stop_1', name: st.origin, sequence: 1, type: 'START', time: st.time },
            { id: 'stop_2', name: st.destination, sequence: 2, type: 'END', time: '11:30 AM' },
          ],
        };
      }
    } catch (e) {}

    const mockRide = defaultMockRides.find((r) => r.id === rideId);
    if (mockRide) {
      return {
        ...mockRide,
        requestStatus: 'none',
        bookingStatus: 'none',
        isRequestSent: false,
        userBooking: null,
        isFeedbackSubmitted: false,
        hasSubmittedFeedback: false,
        hasRated: false,
        canSubmitFeedback: mockRide.status === 'completed',
        userFeedback: null,
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

  const enriched = enrichRideWithUserBooking(formatted, ride.bookings, currentUserId);

  // Check if current user has already submitted feedback / rating for this ride
  let existingRating = null;
  if (currentUserId) {
    try {
      existingRating = await prisma.rating.findFirst({
        where: {
          rideId: ride.id,
          fromUserId: currentUserId,
        },
      });
    } catch (e) {}
  }

  let feedbackText = existingRating?.comment || '';
  let feedbackTags = [];
  if (existingRating && feedbackText) {
    try {
      if (feedbackText.startsWith('{') && feedbackText.endsWith('}')) {
        const parsed = JSON.parse(feedbackText);
        feedbackText = parsed.text || '';
        feedbackTags = Array.isArray(parsed.tags) ? parsed.tags : [];
      }
    } catch (e) {}
  }

  const isCompleted = ride.status === 'COMPLETED';
  const isFeedbackSubmitted = Boolean(existingRating);
  const canSubmitFeedback = isCompleted && !isFeedbackSubmitted;

  enriched.isFeedbackSubmitted = isFeedbackSubmitted;
  enriched.hasSubmittedFeedback = isFeedbackSubmitted;
  enriched.hasRated = isFeedbackSubmitted;
  enriched.canSubmitFeedback = canSubmitFeedback;
  enriched.userFeedback = existingRating
    ? {
        id: existingRating.id,
        ratingId: existingRating.id,
        rating: existingRating.rating,
        comment: feedbackText,
        feedback: feedbackText,
        tags: feedbackTags,
        submittedAt: existingRating.createdAt,
      }
    : null;

  return enriched;
};

/**
 * 6. Request a Seat on a Ride
 */
export const requestSeatOnRide = async (passengerUserId, rideId, { seats = 1, pickupPoint, dropoffPoint, notes } = {}) => {
  // 1. Check if mock commuter preview ride
  const mockRide = defaultMockRides.find((r) => r.id === rideId);
  if (mockRide) {
    const totalFare = Number(mockRide.pricePerSeat || 45.0) * seats;
    return {
      bookingId: `booking_mock_${Date.now()}`,
      rideId: mockRide.id,
      status: 'pending',
      seatsBooked: seats,
      totalFare,
      message: 'Seat request sent to rider.',
    };
  }

  // 2. Check if explicit stranger trip
  if (rideId && rideId.startsWith('stranger_')) {
    try {
      const { joinStrangerTrip } = await import('../stranger/stranger.service.js');
      return await joinStrangerTrip(passengerUserId, rideId, { seats, pickupPoint, dropoffPoint, notes });
    } catch (e) {
      if (e.statusCode) throw e;
    }
  }

  return await prisma.$transaction(async (tx) => {
    const ride = await tx.ride.findUnique({
      where: { id: rideId },
      include: { pricing: true, driver: true },
    });

    if (!ride) {
      // Fallback check stranger trip
      try {
        const { joinStrangerTrip } = await import('../stranger/stranger.service.js');
        return await joinStrangerTrip(passengerUserId, rideId, { seats, pickupPoint, dropoffPoint, notes });
      } catch (e) {
        // If not a stranger trip either, throw clear 'Ride not found'
      }
      throw new ApiError(404, 'Ride not found');
    }

    if (ride.driver && ride.driver.userId === passengerUserId) {
      return {
        bookingId: `host_${ride.id}`,
        rideId,
        status: 'accepted',
        isHost: true,
        seatsBooked: seats,
        totalFare: 0,
        message: 'You are the host of this ride',
      };
    }

    if (ride.availableSeats < seats) {
      throw new ApiError(400, `Not enough seats available. Only ${ride.availableSeats} remaining.`);
    }

    const stops = await tx.rideStop.findMany({
      where: { rideId },
      orderBy: { sequence: 'asc' },
    });
    const startStop = stops.find((s) => s.stopType === 'START' || s.sequence === 1) || stops[0];
    const endStop = stops.find((s) => s.stopType === 'END' || s.sequence === stops.length) || stops[stops.length - 1];

    const pricePerSeat = ride.pricing ? Number(ride.pricing.costPerSeat ?? 45.0) : 45.0;
    const totalFare = pricePerSeat * seats;

    // Check if passenger already has an active booking on this ride
    const existingActive = await tx.booking.findFirst({
      where: {
        rideId,
        passengerId: passengerUserId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
    });

    if (existingActive) {
      if (existingActive.status === 'ACCEPTED') {
        throw new ApiError(400, 'You already have a confirmed seat on this ride');
      }
      return {
        bookingId: existingActive.id,
        rideId,
        status: 'pending',
        seatsBooked: existingActive.seatsRequested,
        totalFare: Number(existingActive.totalCostContribution || 0),
        message: 'Your seat request is already pending with the host.',
      };
    }

    // Clean up any old rejected/cancelled bookings for this passenger on this ride to prevent duplicates
    await tx.booking.deleteMany({
      where: {
        rideId,
        passengerId: passengerUserId,
        status: { in: ['REJECTED', 'CANCELLED'] },
      },
    });

    // Create Booking
    const booking = await tx.booking.create({
      data: {
        rideId,
        passengerId: passengerUserId,
        pickupStopId: startStop.id,
        dropoffStopId: endStop.id,
        seatsRequested: seats,
        totalCostContribution: totalFare,
        passengerNotes: notes || pickupPoint || `${ride.startLocationName} Pickup`,
        status: ride.autoAccept ? 'ACCEPTED' : 'PENDING',
        acceptedAt: ride.autoAccept ? new Date() : null,
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
      status: booking.status === 'ACCEPTED' ? 'accepted' : 'pending',
      seatsBooked: seats,
      totalFare,
      message: ride.autoAccept ? 'Seat confirmed automatically!' : 'Seat request sent to rider.',
    };
  });
};

/**
 * 7. My Rides (Unified 3-tab support: History, Recurring, Offered, Requested)
 * Handles all tabs for MyRidesScreen:
 * - History: completed and cancelled trips
 * - Recurring: user's recurring daily routes
 * - Offered: active host rides
 * - Requested: active passenger bookings
 */
export const getUserMyRides = async (userId, query = {}) => {
  const driver = await prisma.driverProfile.findUnique({
    where: { userId },
  });

  const search = (query.search || query.q || '').trim().toLowerCase();
  const tabFilter = (query.type || query.tab || query.filter || '').trim().toLowerCase();

  // Role filtering support (via query: role=host/guest, activeRole=host/guest, isHost=true/false)
  const rawRole = (query.role || query.activeRole || query.userRole || query.mode || '').trim().toLowerCase();
  const filterHostOnly =
    rawRole === 'host' ||
    rawRole === 'driver' ||
    rawRole === 'rider' ||
    query.isHost === true ||
    query.isHost === 'true';
  const filterGuestOnly =
    rawRole === 'guest' ||
    rawRole === 'passenger' ||
    rawRole === 'user' ||
    query.isHost === false ||
    query.isHost === 'false';

  // ----------------------------------------------------
  // 1. History: Completed & Cancelled trips (Driver + Passenger)
  // ----------------------------------------------------
  const history = [];

  // 1a. Hosted rides that are COMPLETED, CANCELLED, or EXPIRED (Host perspective)
  if (driver && !filterGuestOnly) {
    const hostedHistory = await prisma.ride.findMany({
      where: {
        driverId: driver.id,
        OR: [
          { status: { in: ['COMPLETED', 'CANCELLED'] } },
          { departureAt: { lt: new Date() } },
        ],
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
      orderBy: { departureAt: 'desc' },
    });

    for (const r of hostedHistory) {
      const formatted = formatRideForFlutter(r);
      // If within 24 hours of departure and had 0 bookings, it still belongs in Offered, not History
      if (formatted.status === 'available') {
        continue;
      }
      formatted.isHost = true;
      formatted.cancellationReason = r.cancellationReason || (formatted.status === 'cancelled' ? 'Trip cancelled' : null);
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
      history.push(formatted);
    }
  }

  // 1b. Passenger bookings that are COMPLETED or CANCELLED or REJECTED (Guest perspective)
  if (!filterHostOnly) {
    const passengerHistoryBookings = await prisma.booking.findMany({
      where: {
        passengerId: userId,
        // Exclude bookings where the user was the host/driver of the ride
        ride: {
          driver: {
            userId: { not: userId },
          },
        },
        OR: [
          { status: { in: ['COMPLETED', 'CANCELLED', 'REJECTED'] } },
          { ride: { status: { in: ['COMPLETED', 'CANCELLED'] } } },
        ],
      },
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

    for (const b of passengerHistoryBookings) {
      if (!b.ride) continue;
      // Safety deduplication: if the user is the driver or ride already present in history, do not duplicate
      if (b.ride.driver?.userId === userId || history.some((h) => h.id === b.ride.id)) {
        continue;
      }
      const formatted = formatRideForFlutter(b.ride);
      formatted.bookingId = b.id;
      formatted.seatsBooked = b.seatsRequested;
      formatted.bookingStatus = b.status.toLowerCase();
      formatted.isHost = false;
      const isCancelled = b.status === 'CANCELLED' || b.status === 'REJECTED' || b.ride.status === 'CANCELLED';
      formatted.status = isCancelled ? 'cancelled' : 'completed';
      formatted.cancellationReason = b.ride.cancellationReason || (isCancelled ? 'Trip cancelled' : null);
      history.push(formatted);
    }
  }

  // Include past / cancelled / expired Stranger Trips in History
  try {
    const { getStrangerTripsByHost, formatStrangerTripForOffered, isDateTimePast } = await import('../stranger/stranger.service.js');
    const hostStrangerTrips = getStrangerTripsByHost(userId);
    for (const st of hostStrangerTrips) {
      if (isDateTimePast(st.date, st.time) || st.status === 'CANCELLED' || st.status === 'COMPLETED' || st.status === 'EXPIRED') {
        if (!history.some((h) => h.id === st.id)) {
          history.push(formatStrangerTripForOffered(st));
        }
      }
    }
  } catch (err) {}

  // Sort all history by departure date descending
  history.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  // ----------------------------------------------------
  // 2. Recurring: Active Recurring Routes
  // ----------------------------------------------------
  let recurring = [];
  if (driver) {
    const recurringRides = await prisma.recurringRide.findMany({
      where: {
        driverId: driver.id,
        isActive: true,
      },
      include: {
        vehicle: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    recurring = recurringRides.map((rec) => {
      let days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      try {
        if (rec.daysOfWeek) {
          days = typeof rec.daysOfWeek === 'string' ? JSON.parse(rec.daysOfWeek) : rec.daysOfWeek;
        }
      } catch {}

      return {
        id: rec.id,
        origin: rec.startLocationName,
        destination: rec.endLocationName,
        departureTime: rec.departureTime,
        returnTime: rec.returnTime || '',
        activeDays: days,
        daysOfWeek: days,
        totalSeats: rec.totalSeats,
        seats: rec.totalSeats,
        availableSeats: rec.totalSeats,
        mode: rec.vehicle?.vehicleType === 'BIKE' ? 'bikepool' : 'carpool',
        vehicleName: rec.vehicle ? `${rec.vehicle.make} ${rec.vehicle.model}`.trim() : 'Vehicle',
        vehicleNumber: rec.vehicle?.registrationNumber || '',
        vehicleColor: rec.vehicle?.color || '',
        isActive: rec.isActive,
        status: rec.isActive ? 'active' : 'paused',
        createdAt: rec.createdAt,
      };
    });
  }

  // ----------------------------------------------------
  // 3. Offered: Active Host Offered Rides (Upcoming only, not expired)
  // ----------------------------------------------------
  const offered = [];
  if (driver) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeOfferedRides = await prisma.ride.findMany({
      where: {
        driverId: driver.id,
        status: { in: ['PUBLISHED', 'IN_PROGRESS', 'FULL'] },
        departureAt: { gte: twentyFourHoursAgo },
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

    for (const r of activeOfferedRides) {
      const formatted = formatRideForFlutter(r);
      // Completed, cancelled, or expired rides belong in History, not Offered
      if (formatted.status === 'expired' || formatted.status === 'completed' || formatted.status === 'cancelled') {
        continue;
      }
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
      offered.push(formatted);
    }
  }

  // Include Stranger Trips posted by this host (Active / within 24h)
  try {
    const { getStrangerTripsByHost, formatStrangerTripForOffered } = await import('../stranger/stranger.service.js');
    const hostStrangerTrips = getStrangerTripsByHost(userId);
    for (const st of hostStrangerTrips) {
      const formatted = formatStrangerTripForOffered(st);
      if (formatted.status === 'expired' || formatted.status === 'cancelled' || formatted.status === 'completed') {
        continue;
      }
      if (!offered.some((o) => o.id === st.id)) {
        offered.push(formatted);
      }
    }
  } catch (err) {}

  // ----------------------------------------------------
  // 4. Requested: Active Passenger Bookings (Upcoming only)
  // ----------------------------------------------------
  const requested = [];
  const activeBookings = await prisma.booking.findMany({
    where: {
      passengerId: userId,
      status: { in: ['PENDING', 'ACCEPTED'] },
      ride: {
        status: { in: ['PUBLISHED', 'IN_PROGRESS', 'FULL'] },
        departureAt: { gte: new Date() },
        driver: {
          userId: { not: userId },
        },
      },
    },
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

  for (const b of activeBookings) {
    if (!b.ride || b.ride.driver?.userId === userId) continue;
    const formatted = formatRideForFlutter(b.ride);
    if (formatted.isExpired || formatted.status === 'expired') {
      continue;
    }
    formatted.bookingId = b.id;
    formatted.seatsBooked = b.seatsRequested;
    formatted.bookingStatus = b.status.toLowerCase();
    formatted.isHost = false;
    requested.push(formatted);
  }

  // Apply optional search filter
  const applySearch = (list) => {
    if (!search) return list;
    return list.filter((r) =>
      (r.origin && r.origin.toLowerCase().includes(search)) ||
      (r.destination && r.destination.toLowerCase().includes(search)) ||
      (r.driverName && r.driverName.toLowerCase().includes(search)) ||
      (r.vehicleName && r.vehicleName.toLowerCase().includes(search))
    );
  };

  const filteredHistory = applySearch(history);
  const filteredRecurring = applySearch(recurring);
  const filteredOffered = applySearch(offered);
  const filteredRequested = applySearch(requested);

  // Return tab-specific array if client explicitly requests tab
  if (tabFilter === 'history') return filteredHistory;
  if (tabFilter === 'recurring') return filteredRecurring;
  if (tabFilter === 'offered') return filteredOffered;
  if (tabFilter === 'requested') return filteredRequested;

  // Single unified response object supporting all Flutter state bindings
  return {
    history: filteredHistory,
    recurring: filteredRecurring,
    offered: filteredOffered,
    requested: filteredRequested,
    myHistoryRides: filteredHistory,
    recurringRoutes: filteredRecurring,
    myOfferedRides: filteredOffered,
    myRequestedRides: filteredRequested,
    // Backward compatibility aliases
    active: filteredOffered.length > 0 ? filteredOffered : filteredRequested,
    upcoming: filteredRequested,
    completed: filteredHistory.filter((h) => h.status === 'completed'),
  };
};

/**
 * 8. Active Ride Live Tracking Details
 */
export const getActiveRideTracking = async (userId, rideId) => {
  let targetRideId = rideId;

  // Auto-resolve if rideId is not passed or is 'active' / 'current'
  if (!targetRideId || targetRideId === 'active' || targetRideId === 'current') {
    // 1. Check passenger bookings in active/in_progress rides
    const activeBooking = await prisma.booking.findFirst({
      where: {
        passengerId: userId,
        status: { in: ['ACCEPTED', 'COMPLETED'] },
        ride: {
          status: { in: ['IN_PROGRESS', 'PUBLISHED'] },
        },
      },
      include: { ride: true },
      orderBy: { createdAt: 'desc' },
    });

    if (activeBooking) {
      targetRideId = activeBooking.rideId;
    } else {
      // 2. Check if driver of an active in_progress ride
      const driver = await prisma.driverProfile.findUnique({ where: { userId } });
      if (driver) {
        const activeDriverRide = await prisma.ride.findFirst({
          where: {
            driverId: driver.id,
            status: { in: ['IN_PROGRESS', 'PUBLISHED'] },
          },
          orderBy: { departureAt: 'desc' },
        });
        if (activeDriverRide) targetRideId = activeDriverRide.id;
      }
    }
  }

  if (!targetRideId) {
    return {
      hasActiveRide: false,
      rideId: null,
      status: 'none',
      message: 'No active running trip found at this time',
    };
  }

  const ride = await prisma.ride.findUnique({
    where: { id: targetRideId },
    include: {
      driver: { include: { user: true } },
      vehicle: true,
      pricing: true,
      stops: { orderBy: { sequence: 'asc' } },
      bookings: {
        where: { passengerId: userId },
        include: { pickupStop: true, dropoffStop: true },
      },
    },
  });

  if (!ride) {
    throw new ApiError(404, 'Active ride not found');
  }

  const userBooking = ride.bookings?.[0] || null;
  const departureDate = new Date(ride.departureAt);
  const formattedTime = departureDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = departureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const price = userBooking?.totalCostContribution
    ? Number(userBooking.totalCostContribution)
    : ride.pricing
    ? Number(ride.pricing.costPerSeat ?? 45.0)
    : 45.0;

  const result = {
    hasActiveRide: true,
    rideId: ride.id,
    id: ride.id,
    tripId: ride.id,
    status: ride.status.toLowerCase(),
    statusLabel: ride.status === 'IN_PROGRESS' ? 'Trip in Progress' : 'Upcoming Trip',
    rawStatus: ride.status,
    isStarted: ride.status === 'IN_PROGRESS',
    isInProgress: ride.status === 'IN_PROGRESS',
    origin: ride.startLocationName,
    originName: ride.startLocationName.includes(',') ? ride.startLocationName.split(',')[0].trim() : ride.startLocationName,
    destination: ride.endLocationName,
    destName: ride.endLocationName.includes(',') ? ride.endLocationName.split(',')[0].trim() : ride.endLocationName,
    date: formattedDate,
    departureTime: formattedTime,
    mode: ride.vehicle?.vehicleType === 'BIKE' ? 'bikepool' : 'carpool',
    driverId: ride.driver?.id,
    driverName: ride.driver?.user?.displayName || 'Driver',
    driverPhone: ride.driver?.user?.phone || '',
    driverAvatar:
      ride.driver?.user?.avatarUrl ||
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    driverRating: Number(ride.driver?.averageRating || 4.9),
    vehicleName: ride.vehicle ? `${ride.vehicle.make} ${ride.vehicle.model}` : 'Vehicle',
    vehicleNumber: ride.vehicle?.registrationNumber || '',
    vehicleColor: ride.vehicle?.color || '',
    totalSeats: ride.totalSeats,
    availableSeats: ride.availableSeats,
    currentLocation: {
      latitude: Number(ride.startLat) + 0.005,
      longitude: Number(ride.startLng) + 0.005,
      heading: 45.0,
      speedKmh: ride.status === 'IN_PROGRESS' ? 35 : 0,
    },
    pickupLocation: userBooking?.pickupStop?.name || ride.stops?.[0]?.name || ride.startLocationName,
    pickupPoint: userBooking?.pickupStop?.name || ride.stops?.[0]?.name || ride.startLocationName,
    dropLocation: userBooking?.dropoffStop?.name || ride.stops?.[ride.stops.length - 1]?.name || ride.endLocationName,
    dropoffPoint: userBooking?.dropoffStop?.name || ride.stops?.[ride.stops.length - 1]?.name || ride.endLocationName,
    bookingId: userBooking?.id,
    seatsBooked: userBooking?.seatsRequested || 1,
    fare: price,
    bookingStatus: userBooking?.status?.toLowerCase() || 'accepted',
    otp: '4821',
    meetingPoint: userBooking?.pickupStop?.name || ride.stops?.[0]?.name || ride.startLocationName,
    stops: ride.stops.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.stopType,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      sequence: s.sequence,
    })),
    emergencyContacts: await getTrustedContacts(userId),
  };

  // Check if current user has already submitted feedback / rating for this ride
  let existingRating = null;
  if (userId) {
    try {
      existingRating = await prisma.rating.findFirst({
        where: {
          rideId: ride.id,
          fromUserId: userId,
        },
      });
    } catch (e) {}
  }

  const isCompleted = ride.status === 'COMPLETED';
  const isFeedbackSubmitted = Boolean(existingRating);
  const canSubmitFeedback = isCompleted && !isFeedbackSubmitted;

  result.isFeedbackSubmitted = isFeedbackSubmitted;
  result.hasSubmittedFeedback = isFeedbackSubmitted;
  result.hasRated = isFeedbackSubmitted;
  result.canSubmitFeedback = canSubmitFeedback;
  result.userFeedback = existingRating
    ? {
        id: existingRating.id,
        ratingId: existingRating.id,
        rating: existingRating.rating,
        comment: existingRating.comment,
        feedback: existingRating.comment,
        submittedAt: existingRating.createdAt,
      }
    : null;

  return result;
};

/**
 * 9. Submit Trip Feedback & Rating (User / Passenger after trip completion)
 */
export const submitRideFeedback = async (userId, rideId, data) => {
  const ratingValue = Math.round(Number(data.rating));
  if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    throw new ApiError(400, 'Rating must be an integer between 1 and 5');
  }

  // 1. One-time feedback check: reject duplicate submissions for the same trip
  const existingRating = await prisma.rating.findFirst({
    where: {
      rideId,
      fromUserId: userId,
    },
  });

  if (existingRating) {
    throw new ApiError(400, 'Feedback has already been submitted for this ride');
  }

  const commentText = (data.comment || data.feedback || data.review || '').trim();
  const tags = Array.isArray(data.tags) ? data.tags : [];

  let targetToUserId = data.toUserId || null;
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      driver: { include: { user: true } },
      bookings: { include: { passenger: true } },
    },
  });

  if (!ride) {
    throw new ApiError(404, 'Ride not found');
  }

  // Resolve target recipient user ID to a valid user in the users table
  if (!targetToUserId) {
    if (ride.driver?.userId && ride.driver.userId !== userId) {
      // Passenger rating driver
      targetToUserId = ride.driver.userId;
    } else if (ride.bookings && ride.bookings.length > 0) {
      // Driver rating passenger
      const targetBooking = ride.bookings.find((b) => b.passengerId !== userId);
      targetToUserId = targetBooking ? targetBooking.passengerId : (ride.driver?.userId || userId);
    } else {
      targetToUserId = ride.driver?.userId || userId;
    }
  }

  // Fallback to avoid foreign key failure
  if (!targetToUserId) {
    targetToUserId = userId;
  }

  // Store tags with comment if tags are provided
  const commentPayload = tags.length > 0
    ? JSON.stringify({ text: commentText, tags })
    : commentText;

  // Save rating in database
  const savedRating = await prisma.rating.create({
    data: {
      rideId,
      fromUserId: userId,
      toUserId: targetToUserId,
      rating: ratingValue,
      comment: commentPayload,
    },
  });

  // Update recipient's driver average rating if recipient is a driver
  try {
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: targetToUserId },
    });

    if (driverProfile) {
      const allRatings = await prisma.rating.findMany({
        where: { toUserId: targetToUserId },
        select: { rating: true },
      });

      if (allRatings.length > 0) {
        const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
        await prisma.driverProfile.update({
          where: { id: driverProfile.id },
          data: { averageRating: Number(avg.toFixed(2)) },
        });
      }
    }
  } catch (err) {
    // Non-fatal if rating aggregation fails
  }

  return {
    id: savedRating.id,
    ratingId: savedRating.id,
    rideId,
    fromUserId: userId,
    toUserId: targetToUserId,
    rating: ratingValue,
    comment: commentText,
    feedback: commentText,
    tags,
    submittedAt: savedRating.createdAt.toISOString(),
    status: 'submitted',
    message: 'Thank you for your feedback! Your rating helps keep SHARE2GO trusted and safe.',
  };
};

/**
 * 9b. Get Ride Feedback & Rating
 */
export const getRideFeedback = async (userId, rideId) => {
  let existing = null;
  try {
    existing = await prisma.rating.findFirst({
      where: {
        rideId,
        fromUserId: userId,
      },
    });
  } catch (e) {}

  if (!existing) {
    return {
      hasRated: false,
      isFeedbackSubmitted: false,
      hasSubmittedFeedback: false,
      rideId,
      rating: null,
      feedback: null,
      tags: [],
    };
  }

  let feedbackText = existing.comment || '';
  let feedbackTags = [];
  try {
    if (feedbackText.startsWith('{') && feedbackText.endsWith('}')) {
      const parsed = JSON.parse(feedbackText);
      feedbackText = parsed.text || '';
      feedbackTags = Array.isArray(parsed.tags) ? parsed.tags : [];
    }
  } catch (e) {}

  return {
    hasRated: true,
    isFeedbackSubmitted: true,
    hasSubmittedFeedback: true,
    ratingId: existing.id,
    id: existing.id,
    rideId: existing.rideId,
    rating: existing.rating,
    comment: feedbackText,
    feedback: feedbackText,
    tags: feedbackTags,
    createdAt: existing.createdAt,
    submittedAt: existing.createdAt,
  };
};

