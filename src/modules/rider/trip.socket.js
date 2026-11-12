import { prisma } from '../../config/db.js';
import { getIO } from '../../config/socket.js';

// In-memory active live trip telemetry cache
// tripId -> { lastLocation: { latitude, longitude, bearing, speed, accuracy, updatedAt }, isDeviated, currentStopIndex, status }
const liveTripsState = new Map();

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
 * Registers real-time live trip tracking, vehicle movement, deviation, and stops handlers
 */
export const registerTripSocketHandlers = (io, socket) => {
  const userId = socket.user?.id;

  // 1. Join Live Trip Room
  socket.on('trip:join', async (data) => {
    try {
      const tripId = data?.tripId || data?.rideId;
      if (!tripId) return;

      const roomName = `trip:${tripId}`;
      socket.join(roomName);

      // Return current cached state to freshly joined participant
      const cached = liveTripsState.get(tripId);
      socket.emit('trip:joined', {
        tripId,
        joinedUserId: userId,
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
  socket.on('trip:location_update', async (data) => {
    try {
      const tripId = data?.tripId || data?.rideId;
      if (!tripId) return;

      const telemetry = {
        tripId,
        latitude: parseFloat(data.latitude || data.lat),
        longitude: parseFloat(data.longitude || data.lng),
        bearing: parseFloat(data.bearing || data.heading || 0),
        speed: parseFloat(data.speed || 0),
        accuracy: parseFloat(data.accuracy || 0),
        timestamp: data.timestamp || new Date().toISOString(),
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
    } catch (err) {
      console.warn('[TripSocket] Error handling trip location update:', err.message);
    }
  });

  // 4. Route Deviation / Off-Route Detection Event
  socket.on('trip:deviation', async (data) => {
    try {
      const tripId = data?.tripId || data?.rideId;
      if (!tripId) return;

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
      const status = data?.status; // 'PICKED_UP' | 'DROPPED_OFF' | 'NO_SHOW'
      if (!tripId || !bookingId) return;

      // Update Booking status in database if valid enum
      try {
        let dbStatus = null;
        if (status === 'PICKED_UP') dbStatus = 'IN_PROGRESS';
        if (status === 'DROPPED_OFF') dbStatus = 'COMPLETED';
        if (status === 'NO_SHOW') dbStatus = 'CANCELLED';

        if (dbStatus) {
          await prisma.booking.update({
            where: { id: bookingId },
            data: { status: dbStatus },
          });
        }
      } catch (dbErr) {
        console.warn('[TripSocket] DB update error for booking passenger status:', dbErr.message);
      }

      const payload = {
        tripId,
        bookingId,
        passengerId: data?.passengerId,
        status,
        updatedAt: new Date().toISOString(),
      };

      io.to(`trip:${tripId}`).emit('trip:passenger_updated', payload);
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

