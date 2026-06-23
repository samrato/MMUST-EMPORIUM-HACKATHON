/**
 * Helper utilities for the AFYAROOT backend.
 */

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 * @param {number} lat1 - Latitude of origin
 * @param {number} lon1 - Longitude of origin
 * @param {number} lat2 - Latitude of destination
 * @param {number} lon2 - Longitude of destination
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return parseFloat(d.toFixed(2)); // Return with 2 decimal places
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calculates the freshness score and trust level of the live status.
 * Freshness Score:
 * - High Trust: updated < 1 hour ago
 * - Medium Trust: updated < 6 hours ago
 * - Low Trust: updated >= 6 hours ago
 * @param {string|Date} updatedAtISO - The timestamp of the last update
 * @returns {{ score: string, trustLevel: 'HIGH' | 'MEDIUM' | 'LOW', hoursElapsed: number }}
 */
function calculateFreshness(updatedAtISO) {
  if (!updatedAtISO) {
    return { score: 'LOW', trustLevel: 'LOW', hoursElapsed: 999 };
  }
  const updatedTime = new Date(updatedAtISO);
  const now = new Date();
  const diffMs = now - updatedTime;
  const hoursElapsed = diffMs / (1000 * 60 * 60);

  let trustLevel = 'LOW';
  if (hoursElapsed < 1) {
    trustLevel = 'HIGH';
  } else if (hoursElapsed < 6) {
    trustLevel = 'MEDIUM';
  }

  return {
    score: trustLevel,
    trustLevel,
    hoursElapsed: parseFloat(hoursElapsed.toFixed(2))
  };
}

module.exports = {
  calculateDistance,
  calculateFreshness
};
