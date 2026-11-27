/**
 * Polyline encoding/decoding (Google Encoded Polyline Algorithm Format)
 * and geographic distance helpers for ride routes & active trip tracking.
 */

/**
 * Encode an array of { latitude, longitude } points into a Google encoded polyline string.
 * @param {Array<{latitude: number, longitude: number}>} points
 * @returns {string}
 */
export const encodePolyline = (points = []) => {
  if (!Array.isArray(points) || points.length === 0) return '';

  let prevLat = 0;
  let prevLng = 0;
  let result = '';

  const encodeValue = (value) => {
    let v = value < 0 ? ~(value << 1) : value << 1;
    let encoded = '';
    while (v >= 0x20) {
      encoded += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    encoded += String.fromCharCode(v + 63);
    return encoded;
  };

  for (const pt of points) {
    const lat = Number(pt?.latitude ?? pt?.lat);
    const lng = Number(pt?.longitude ?? pt?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const latE5 = Math.round(lat * 1e5);
    const lngE5 = Math.round(lng * 1e5);

    result += encodeValue(latE5 - prevLat);
    result += encodeValue(lngE5 - prevLng);

    prevLat = latE5;
    prevLng = lngE5;
  }

  return result;
};

/**
 * Decode a Google encoded polyline string into an array of { latitude, longitude } points.
 * @param {string} encoded
 * @returns {Array<{latitude: number, longitude: number}>}
 */
export const decodePolyline = (encoded = '') => {
  if (!encoded || typeof encoded !== 'string') return [];

  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let b;
    do {
      if (index >= encoded.length) return points;
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      if (index >= encoded.length) return points;
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
};

/**
 * Calculate Haversine distance in kilometers between two coordinates.
 */
export const haversineDistanceKm = (lat1, lng1, lat2, lng2) => {
  const aLat = Number(lat1);
  const aLng = Number(lng1);
  const bLat = Number(lat2);
  const bLng = Number(lng2);
  if (![aLat, aLng, bLat, bLng].every(Number.isFinite)) return 0;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Build route polyline & points for a ride, falling back to [origin, ...stops, destination]
 * when no stored RideRoute encodedPolyline is present.
 */
export const resolveRideRouteData = (ride) => {
  const storedPolyline = ride?.route?.encodedPolyline || '';
  const storedWaypoints = Array.isArray(ride?.route?.waypoints)
    ? ride.route.waypoints.map((w) => ({
        latitude: Number(w.latitude),
        longitude: Number(w.longitude),
      }))
    : [];

  let routePoints = storedWaypoints.length > 0
    ? storedWaypoints
    : storedPolyline
    ? decodePolyline(storedPolyline)
    : [];

  if (routePoints.length === 0) {
    const fallbackPoints = [];
    const sLat = Number(ride?.startLat);
    const sLng = Number(ride?.startLng);
    const eLat = Number(ride?.endLat);
    const eLng = Number(ride?.endLng);

    if (Number.isFinite(sLat) && Number.isFinite(sLng) && (sLat !== 0 || sLng !== 0)) {
      fallbackPoints.push({ latitude: sLat, longitude: sLng });
    }

    if (Array.isArray(ride?.stops)) {
      for (const stop of ride.stops) {
        const lat = Number(stop.latitude);
        const lng = Number(stop.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) continue;
        const prev = fallbackPoints[fallbackPoints.length - 1];
        if (!prev || prev.latitude !== lat || prev.longitude !== lng) {
          fallbackPoints.push({ latitude: lat, longitude: lng });
        }
      }
    }

    if (Number.isFinite(eLat) && Number.isFinite(eLng) && (eLat !== 0 || eLng !== 0)) {
      const prev = fallbackPoints[fallbackPoints.length - 1];
      if (!prev || prev.latitude !== eLat || prev.longitude !== eLng) {
        fallbackPoints.push({ latitude: eLat, longitude: eLng });
      }
    }

    routePoints = fallbackPoints;
  }

  const encodedPolyline =
    storedPolyline || (routePoints.length >= 3 ? encodePolyline(routePoints) : '');

  let distanceKm = ride?.route?.distanceKm !== undefined ? Number(ride.route.distanceKm) : 0;
  if (!distanceKm && routePoints.length >= 2) {
    for (let i = 1; i < routePoints.length; i++) {
      distanceKm += haversineDistanceKm(
        routePoints[i - 1].latitude,
        routePoints[i - 1].longitude,
        routePoints[i].latitude,
        routePoints[i].longitude
      );
    }
    distanceKm = Number(distanceKm.toFixed(2));
  }

  const durationMinutes =
    ride?.route?.durationMinutes !== undefined
      ? Number(ride.route.durationMinutes)
      : distanceKm > 0
      ? Math.max(5, Math.round((distanceKm / 30) * 60))
      : 0;

  return {
    encodedPolyline,
    polyline: encodedPolyline,
    routePoints,
    waypoints: routePoints,
    distanceKm,
    durationMinutes,
  };
};

const geocodeCache = new Map();

/**
 * Lightweight, cached geocoder (OpenStreetMap Nominatim) with a short timeout.
 * Used only when a ride or stop was created with 0,0 coordinates.
 */
export const geocodePlaceName = async (placeName, { countryHint = 'India' } = {}) => {
  const raw = String(placeName || '').trim();
  if (!raw || raw.length < 2) return null;

  const cacheKey = raw.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  const queries = raw.toLowerCase().includes(countryHint.toLowerCase())
    ? [raw]
    : [raw, `${raw}, ${countryHint}`];

  for (const q of queries) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Share2Go-Backend/1.0' },
      });
      clearTimeout(timer);

      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = Number(data[0].lat);
        const lng = Number(data[0].lon);
        if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
          const coords = { latitude: lat, longitude: lng };
          geocodeCache.set(cacheKey, coords);
          return coords;
        }
      }
    } catch (_) {
      // Ignore network/timeout errors and fall through
    }
  }

  geocodeCache.set(cacheKey, null);
  return null;
};
