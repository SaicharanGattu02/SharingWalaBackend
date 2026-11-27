import { prisma } from '../../config/db.js';
import { getIO } from '../../config/socket.js';
import { createNotification } from '../notification/notification.service.js';

// In-memory active live trip telemetry cache
// tripId -> { lastLocation: { latitude, longitude, bearing, speed, accuracy, updatedAt }, isDeviated, currentStopIndex, status }
const liveTripsState = new Map();

// Prune stale live trip states older than 12 hours to prevent memory leaks
setInterval(() => {
  const cutoff = Date.now() - 12 * 60 * 60 * 1000;
  for (const [tripId, state] of liveTripsState.entries()) {
    const updatedMs = state?.updatedAt ? new Date(state.updatedAt).getTime() : 0;
    if (updatedMs && updatedMs < cutoff) {
      liveTripsState.delete(tripId);
    }
  }
}, 60 * 60 * 1000).unref();

/**
 * Returns in-memory live trip state if present
 */
export const getLiveTripState = (tripId) => {
  return liveTripsState.get(tripId) || null;
};

/**
 * Broadcast an arbitrary trip event to all listeners in room `trip:${tripId}`
 */
export const broadcastTripEvent = (tripId, eventName, data) => {
  try {
    const io = getIO();
    io.to(`trip:${tripId}`).emit(eventName, {
      tripId,
      ...data,
      emittedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(`[TripSocket] Failed to broadcast ${eventName} for trip ${tripId}:`, err.message);
  }
};

/**
 * Who this user is on a ride: 'driver', 'passenger', or null (not on it).
 * Cached per socket — location updates arrive every couple of seconds and must
 * not hit the database each time. A null result is not cached, so a booking
 * accepted after the first lookup still works.
 */
const resolveTripRole = async (socket, tripId) => {
  const userId = socket.user?.id;
  if (!userId || !tripId) return null;
  socket.data.tripRoles = socket.data.tripRoles || {};
  if (socket.data.tripRoles[tripId]) return socket.data.tripRoles[tripId];

  try {
    const ride = await prisma.ride.findUnique({
      where: { id: tripId },
      select: {
        driver: { select: { userId: true } },
        bookings: {
          where: { passengerId: userId, status: { in: ['ACCEPTED', 'COMPLETED'] } },
          select: { id: true },
          take: 1,
        },
      },
    });
    let role = null;
    if (ride?.driver?.userId === userId) role = 'driver';
    else if (ride?.bookings?.length) role = 'passenger';
    if (role) socket.data.tripRoles[tripId] = role;
    return role;
  } catch (err) {
    console.warn('[TripSocket] Role lookup failed:', err.message);
    return null;
  }
};

const isDriverOf = async (socket, tripId) => (await resolveTripRole(socket, tripId)) === 'driver';

const toFiniteNumber = (value, fallback = 0) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Registers real-time live trip tracking, vehicle movement, deviation, and stops handlers
 */
export const registerTripSocketHandlers = (io, socket) => {
  const userId = socket.user?.id;

  // 1. Join Live Trip Room (only the ride's driver and its booked passengers)
  socket.on('trip:join', async (data) => {
    try {
      const tripId = data?.tripId || data?.rideId;
      if (!tripId) return;

      const role = await resolveTripRole(socket, tripId);
      if (!role) {
        console.warn(`🚫 [TripSocket] User ${userId} is not on ride ${tripId} — join refused`);
        socket.emit('trip:join_denied', { tripId, reason: 'NOT_A_PARTICIPANT' });
        return;
      }

      const roomName = `trip:${tripId}`;
      socket.join(roomName);

      // Return current cached state to freshly joined participant
      const cached = liveTripsState.get(tripId);
      socket.emit('trip:joined', {
        tripId,
        joinedUserId: userId,
        role,
        liveState: cached || null,
        timestamp: new Date().toISOString(),
      });

      console.log(`📡 [TripSocket] User ${userId} joined room ${roomName}`);
    } catch (err) {
      console.warn('[TripSocket] Error joining trip room:', err.message);
    }
  });

  // 2. Leave Live Trip Room
  socket.on('trip:leave', (data) => {
    try {
      const tripId = data?.tripId || data?.rideId;
      if (!tripId) return;

      const roomName = `trip:${tripId}`;
      socket.leave(roomName);
      console.log(`🔌 [TripSocket] User ${userId} left room ${roomName}`);
    } catch (err) {
      console.warn('[TripSocket] Error leaving trip room:', err.message);
    }
  });

  // 3. Driver Emits Vehicle Movement / Real-time GPS Location
  const handleLocationUpdate = async (data) => {
    try {
      const tripId = data?.tripId || data?.rideId;
      if (!tripId) return;
      if (!(await isDriverOf(socket, tripId))) return; // only the driver moves the vehicle

      const latitude = toFiniteNumber(data.latitude ?? data.lat, NaN);
      const longitude = toFiniteNumber(data.longitude ?? data.lng, NaN);
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 ||
        Math.abs(longitude) > 180 ||
        (latitude === 0 && longitude === 0)
      ) {
        return;
      }

      const bearing = toFiniteNumber(data.bearing ?? data.heading, 0);
      const speed = Math.max(0, toFiniteNumber(data.speed ?? data.speedKmh, 0));
      const telemetry = {
        tripId,
        rideId: tripId,
        latitude,
        longitude,
        bearing,
        heading: bearing,
        speed,
        speedKmh: speed,
        accuracy: Math.max(0, toFiniteNumber(data.accuracy, 0)),
        // Server time: phones' clocks drift, passengers use this to detect stale fixes.
        timestamp: new Date().toISOString(),
        driverId: userId,
      };

      // Update in-memory state
      const current = liveTripsState.get(tripId) || {};
      liveTripsState.set(tripId, {
        ...current,
        lastLocation: telemetry,
        updatedAt: new Date().toISOString(),
      });

      // Broadcast immediately to all connected passengers and monitoring listeners
      io.to(`trip:${tripId}`).emit('trip:location_update', telemetry);
      io.to(`trip:${tripId}`).emit('trip:vehicle_moved', telemetry);
    } catch (err) {
      console.warn('[TripSocket] Error handling trip location update:', err.message);
    }
  };

  socket.on('trip:location_update', handleLocationUpdate);
  socket.on('ride:location_update', handleLocationUpdate);
  socket.on('driver:location_update', handleLocationUpdate);

  // 4. Route Deviation / Off-Route Detection Event
  socket.on('trip:deviation', async (data) => {
    try {
      const tripId = data?.tripId || data?.rideId;
      if (!tripId) return;
      if (!(await isDriverOf(socket, tripId))) return;

      const isDeviated = Boolean(data.isDeviated);
      const distance = parseFloat(data.distance || 0);

      const current = liveTripsState.get(tripId) || {};
      liveTripsState.set(tripId, {
        ...current,
        isDeviated,
        deviationDistance: distance,
        lastDeviationAt: new Date().toISOString(),
      });

      const payload = {
        tripId,
        isDeviated,
        distance,
        latitude: data.latitude,
        longitude: data.longitude,
        message: data.message || (isDeviated ? 'Vehicle has deviated from designated route' : 'Vehicle back on route'),
        timestamp: new Date().toISOString(),
      };

      // Broadcast alert to passengers
      io.to(`trip:${tripId}`).emit('trip:deviation_alert', payload);
      console.log(`⚠️ [TripSocket] Trip ${tripId} deviation alert: deviated=${isDeviated}, dist=${distance}m`);
    } catch (err) {
      console.warn('[TripSocket] Error handling trip deviation:', err.message);
    }
  });

  // 5. Stop Reached / Covered
  socket.on('trip:stop_reached', async (data) => {
    try {
      const tripId = data?.tripId || data?.rideId;
      const stopId = data?.stopId;
      const sequence = parseInt(data?.sequence, 10);
      if (!tripId) return;
      if (!(await isDriverOf(socket, tripId))) return;

      const current = liveTripsState.get(tripId) || {};
      liveTripsState.set(tripId, {
        ...current,
        currentStopIndex: sequence,
        lastReachedStopId: stopId,
      });

      const payload = {
        tripId,
        stopId,
        sequence,
        stopName: data?.stopName || '',
        reachedAt: new Date().toISOString(),
      };

      io.to(`trip:${tripId}`).emit('trip:stop_reached', payload);
      console.log(`🚏 [TripSocket] Trip ${tripId} reached stop sequence ${sequence}`);
    } catch (err) {
      console.warn('[TripSocket] Error handling stop reached:', err.message);
    }
  });

  // 6. Passenger Status Change (Picked Up / Dropped Off)
  socket.on('trip:passenger_status', async (data) => {
    try {
      const tripId = data?.tripId || data?.rideId;
      const bookingId = data?.bookingId;
      const rawStatus = String(data?.status || '').toUpperCase().trim();
      if (!tripId || !bookingId || !rawStatus) return;
      if (!(await isDriverOf(socket, tripId))) return;

      const isPickedUp = ['PICKED_UP', 'ONBOARD', 'PICKUP'].includes(rawStatus);
      const isDroppedOff = ['DROPPED_OFF', 'DROPOFF', 'DROP', 'COMPLETED', 'COMPLETE'].includes(rawStatus);
      const isNoShow = rawStatus === 'NO_SHOW';
      if (!isPickedUp && !isDroppedOff && !isNoShow) return;

      const normalizedStatus = isPickedUp ? 'PICKED_UP' : isDroppedOff ? 'DROPPED_OFF' : 'NO_SHOW';
      let targetPassengerId = data?.passengerId || null;

      // Update Booking status & [ONBOARD] note in database so REST and Socket stay in sync
      try {
        const booking = await prisma.booking.findFirst({
          where: { id: bookingId, rideId: tripId },
          select: { passengerId: true, passengerNotes: true, acceptedAt: true, completedAt: true },
        });
        if (!booking) return;
        targetPassengerId = booking.passengerId;

        const cleanNotes = (booking.passengerNotes || '').replace(/\[ONBOARD\]/g, '').trim();
        const updateData = {};

        if (isPickedUp) {
          updateData.status = 'ACCEPTED';
          updateData.acceptedAt = booking.acceptedAt || new Date();
          updateData.passengerNotes = `${cleanNotes} [ONBOARD]`.trim();
        } else if (isDroppedOff) {
          updateData.status = 'COMPLETED';
          updateData.completedAt = booking.completedAt || new Date();
          updateData.passengerNotes = cleanNotes;
        } else if (isNoShow) {
          updateData.status = 'NO_SHOW';
          updateData.passengerNotes = cleanNotes;
        }

        await prisma.booking.update({
          where: { id: bookingId },
          data: updateData,
        });

        // Send push & in-app notification to the passenger
        if (targetPassengerId) {
          if (isPickedUp) {
            createNotification({
              userId: targetPassengerId,
              type: 'BOOKING_ACCEPTED',
              title: 'Onboard! 🚗',
              message: 'You have been picked up. Enjoy your ride!',
              data: {
                rideId: tripId,
                bookingId,
                route: '/active-ride',
              },
              sendPush: true,
            }).catch((e) => console.warn('Failed to notify passenger of onboard:', e.message));
          } else if (isDroppedOff) {
            createNotification({
              userId: targetPassengerId,
              type: 'RATING_REQUEST',
              title: "You've Arrived! 🏁",
              message: 'You have reached your destination. Please rate your captain!',
              data: {
                rideId: tripId,
                bookingId,
                route: '/active-ride',
              },
              sendPush: true,
            }).catch((e) => console.warn('Failed to notify passenger of drop-off:', e.message));
          }
        }
      } catch (dbErr) {
        console.warn('[TripSocket] DB update error for booking passenger status:', dbErr.message);
      }

      const payload = {
        tripId,
        rideId: tripId,
        bookingId,
        passengerId: targetPassengerId,
        status: normalizedStatus,
        isPickedUp: isPickedUp || isDroppedOff,
        isOnboard: isPickedUp,
        isDroppedOff,
        updatedAt: new Date().toISOString(),
      };

      io.to(`trip:${tripId}`).emit('trip:passenger_updated', payload);
      if (targetPassengerId) {
        io.to(`user:${targetPassengerId}`).emit('trip:passenger_updated', payload);
      }
    } catch (err) {
      console.warn('[TripSocket] Error handling passenger status:', err.message);
    }
  });

  // 7. Overall Trip Status Change (Started, Completed, Cancelled)
  socket.on('trip:status_change', async (data) => {
    try {
      const tripId = data?.tripId || data?.rideId;
      const status = data?.status; // 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
      if (!tripId || !status) return;
      if (!['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) return;
      if (!(await isDriverOf(socket, tripId))) return;

      // Update Ride in DB
      try {
        await prisma.ride.update({
          where: { id: tripId },
          data: { status },
        });
      } catch (dbErr) {
        console.warn('[TripSocket] DB update error for ride status:', dbErr.message);
      }

      const payload = {
        tripId,
        status,
        timestamp: new Date().toISOString(),
      };

      io.to(`trip:${tripId}`).emit('trip:status_changed', payload);

      if (status === 'COMPLETED' || status === 'CANCELLED') {
        liveTripsState.delete(tripId);
      }
    } catch (err) {
      console.warn('[TripSocket] Error handling trip status change:', err.message);
    }
  });
};

