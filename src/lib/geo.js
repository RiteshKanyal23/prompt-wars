const EARTH_RADIUS_METERS = 6371000;
const DEG_TO_RAD = Math.PI / 180;

/** Great-circle distance between two { latitude, longitude } points, in metres. */
export function distanceMeters(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;

  const lat1 = Number(a.latitude) * DEG_TO_RAD;
  const lat2 = Number(b.latitude) * DEG_TO_RAD;
  const deltaLat = (Number(b.latitude) - Number(a.latitude)) * DEG_TO_RAD;
  const deltaLng = (Number(b.longitude) - Number(a.longitude)) * DEG_TO_RAD;

  const h =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Stable grid cell key for a coordinate, used by clustering. */
export function gridKey(latitude, longitude, cellSize = 0.003) {
  const lat = Math.floor(Number(latitude) / cellSize);
  const lng = Math.floor(Number(longitude) / cellSize);
  return `${lat}:${lng}`;
}

/** Mean centre of a list of points. */
export function centroid(points) {
  if (!points || points.length === 0) return null;

  const total = points.reduce(
    (accumulator, point) => ({
      latitude: accumulator.latitude + Number(point.latitude),
      longitude: accumulator.longitude + Number(point.longitude),
    }),
    { latitude: 0, longitude: 0 },
  );

  return {
    latitude: total.latitude / points.length,
    longitude: total.longitude / points.length,
  };
}

/** Maximum distance from the centroid to any member, in metres. */
export function radiusMeters(points, center = centroid(points)) {
  if (!center || !points || points.length === 0) return 0;
  return points.reduce((max, point) => Math.max(max, distanceMeters(center, point)), 0);
}

/** Human-readable distance: 48 m, 1.2 km. */
export function formatMeters(meters) {
  const value = Number(meters);
  if (!Number.isFinite(value)) return '—';
  if (value < 1000) return `${Math.round(value)} m`;
  return `${(value / 1000).toFixed(1)} km`;
}

/** True when a coordinate pair is usable. Empty strings are not 0,0. */
export function isValidCoordinate(latitude, longitude) {
  const lat = toCoordinate(latitude);
  const lng = toCoordinate(longitude);
  return (
    lat !== null &&
    lng !== null &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function toCoordinate(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return Number.isFinite(Number(value)) ? Number(value) : null;
}
