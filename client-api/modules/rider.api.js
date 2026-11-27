import httpClient from '../httpClient.js';

/**
 * 🚗 RIDER (HOST / DRIVER / VEHICLE OWNER) API SERVICE
 * Connects to: /api/v1/rider
 */
export const riderApi = {
  /**
   * 1. Get Driver Status & Metrics
   */
  getStatus: async () => {
    return await httpClient.get('/rider/status');
  },

  /**
   * 2. Apply to become a Driver
   * @param {Object} data - { licenseNumber, licenseExpiryDate }
   */
  apply: async (data) => {
    return await httpClient.post('/rider/apply', data);
  },

  /**
   * 3. Driver's Registered Vehicles (Cars & Bikes)
   */
  getVehicles: async () => {
    return await httpClient.get('/rider/vehicles');
  },

  /**
   * Add new vehicle
   * @param {Object} vehicle - { type: 'Car'|'Bike', name, numberPlate, color, capacity }
   */
  addVehicle: async (vehicle) => {
    return await httpClient.post('/rider/vehicles', vehicle);
  },

  /**
   * 4. Offer a Ride
   * Corresponds to: offer_ride_screen.dart
   * @param {Object} rideData - { vehicleId, mode, rideType, origin, destination, departureTime, availableSeats, pricePerSeat, notes, isWomenOnly }
   */
  offerRide: async (rideData) => {
    return await httpClient.post('/rider/rides/offer', rideData);
  },

  /**
   * 5. My Offered Rides with Pending Passenger Requests
   */
  getMyOfferedRides: async () => {
    return await httpClient.get('/rider/my-offered-rides');
  },

  /**
   * 6. Accept or Decline a Passenger Seat Request
   * @param {string} bookingId
   * @param {'ACCEPT' | 'DECLINE'} action
   */
  respondToRequest: async (bookingId, action) => {
    return await httpClient.patch(`/rider/requests/${bookingId}/respond`, { action });
  },

  /**
   * 7. Change Offered Ride Status (Start, Complete, Cancel)
   * @param {string} rideId
   * @param {'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'} status
   */
  updateRideStatus: async (rideId, status) => {
    return await httpClient.patch(`/rider/rides/${rideId}/status`, { status });
  },

  /**
   * 8. Get Passengers & Requests for an Offered Ride
   * @param {string} rideId
   */
  getRidePassengers: async (rideId) => {
    return await httpClient.get(`/rider/rides/${rideId}/passengers`);
  },

  /**
   * 9. Start Active Trip (Captain)
   * @param {string} rideId
   */
  startTrip: async (rideId) => {
    return await httpClient.post(`/rider/rides/${rideId}/start`);
  },

  /**
   * 10. Complete Active Trip (Captain)
   * @param {string} rideId
   */
  completeTrip: async (rideId) => {
    return await httpClient.post(`/rider/rides/${rideId}/complete`);
  },

  /**
   * 11. Mark Passenger Picked Up / Onboard (or Offboard if isPickedUp = false)
   * @param {string} bookingId
   * @param {boolean} isPickedUp
   */
  onboardPassenger: async (bookingId, isPickedUp = true) => {
    return await httpClient.patch(`/rider/bookings/${bookingId}/onboard`, { isPickedUp });
  },

  /**
   * 12. Mark Picked-Up Passenger Dropped Off / Completed
   * @param {string} bookingId
   */
  dropoffPassenger: async (bookingId) => {
    return await httpClient.patch(`/rider/bookings/${bookingId}/dropoff`);
  },
};

export default riderApi;
