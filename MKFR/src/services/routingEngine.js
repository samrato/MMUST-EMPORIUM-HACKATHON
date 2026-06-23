const dataStore = require('../models/dataStore');
const { calculateDistance, calculateFreshness } = require('../utils/helpers');

/**
 * AI Status Fallback Estimation
 * Estimates queue count, doctor availability, and bed availability based on the facility level and time of day.
 * Triggered when live status is stale (>6 hours) or completely missing.
 */
function estimateLiveStatus(facility, currentTime = new Date()) {
  const hours = currentTime.getHours();
  const isBusinessHours = hours >= 8 && hours <= 17; // 8:00 AM - 5:59 PM
  const level = facility.kephLevel || 2;

  let queueEstimate = 0;
  let doctorEstimate = 0;
  let bedEstimate = 0;

  if (isBusinessHours) {
    if (level === 6) {
      queueEstimate = 50;
      doctorEstimate = 8;
      bedEstimate = 4;
    } else if (level === 5) {
      queueEstimate = 30;
      doctorEstimate = 4;
      bedEstimate = 10;
    } else if (level === 4) {
      queueEstimate = 20;
      doctorEstimate = 2;
      bedEstimate = 8;
    } else {
      queueEstimate = 12;
      doctorEstimate = 1;
      bedEstimate = 0;
    }
  } else {
    if (level === 6) {
      queueEstimate = 15;
      doctorEstimate = 3;
      bedEstimate = 6;
    } else if (level === 5) {
      queueEstimate = 8;
      doctorEstimate = 2;
      bedEstimate = 12;
    } else if (level === 4) {
      queueEstimate = 5;
      doctorEstimate = 1;
      bedEstimate = 9;
    } else {
      queueEstimate = 1;
      doctorEstimate = 0;
      bedEstimate = 0;
    }
  }

  return {
    queue_count: queueEstimate,
    doctor_available: doctorEstimate,
    beds_available: bedEstimate,
    emergency_status: queueEstimate > 35 ? "busy" : "normal",
    updated_at: new Date().toISOString(),
    is_estimated: true,
    estimation_reason: `Live status was missing or older than 6 hours. AI estimated values based on typical ${isBusinessHours ? 'Daytime Peak' : 'Nighttime Off-peak'} load for Level ${level} facilities.`
  };
}

/**
 * Main Scoring and Routing Engine (Asynchronous)
 * @param {object} params
 * @param {number} params.userLat - User current Latitude
 * @param {number} params.userLng - User current Longitude
 * @param {string[]} params.requiredServices - List of services needed (from AI triage)
 * @param {boolean} params.isEmergency - Whether emergency mode is active
 * @returns {Promise<object>} Ranked list of facilities with routing scores
 */
async function routeAndScore(params) {
  const { userLat, userLng, requiredServices = [], isEmergency = false } = params;

  const facilities = await dataStore.getFacilities();
  const liveStatusMap = await dataStore.getLiveStatus();

  // 1.🚨 EMERGENCY ENGINE MODE: Override Scoring
  if (isEmergency) {
    return runEmergencyOverride({
      facilities,
      liveStatusMap,
      userLat,
      userLng
    });
  }

  // 2. STANDARD SCORING: Score = Service Match (40%) + Distance (30%) + Live Queue (20%) + Facility Level (10%)
  const scoredFacilities = facilities.map(facility => {
    const distance = calculateDistance(userLat, userLng, facility.latitude, facility.longitude);
    
    // Retrieve live status, or estimate it if stale/missing
    let rawStatus = liveStatusMap[facility.id];
    let status = { ...rawStatus };
    let freshnessInfo = { score: 'LOW', trustLevel: 'LOW', hoursElapsed: 999 };

    if (rawStatus) {
      freshnessInfo = calculateFreshness(rawStatus.updated_at);
    }

    // Fallback if low trust or missing
    const statusIsStale = freshnessInfo.trustLevel === 'LOW';
    const statusIsMissing = !rawStatus;
    let usingEstimation = false;

    if (statusIsStale || statusIsMissing) {
      status = estimateLiveStatus(facility);
      usingEstimation = true;
    }

    // --- Scoring Components ---

    // A. Service Match (40 Points Max)
    let serviceMatchScore = 0;
    if (requiredServices.length > 0) {
      const matchCount = requiredServices.filter(srv => facility.services.includes(srv)).length;
      serviceMatchScore = (matchCount / requiredServices.length) * 40;
    } else {
      serviceMatchScore = 40; // Default if no specific services are requested
    }

    // B. Distance Score (30 Points Max)
    let distanceScore = 0;
    if (distance < 2.0) {
      distanceScore = 30;
    } else if (distance < 5.0) {
      distanceScore = 25;
    } else if (distance < 10.0) {
      distanceScore = 20;
    } else if (distance < 20.0) {
      distanceScore = 12;
    } else if (distance < 50.0) {
      distanceScore = 5;
    } else {
      distanceScore = 0;
    }

    // C. Live Queue Score (20 Points Max)
    let queueScore = 0;
    const qCount = status.queue_count;
    if (qCount <= 5) {
      queueScore = 20;
    } else if (qCount <= 15) {
      queueScore = 15;
    } else if (qCount <= 30) {
      queueScore = 10;
    } else if (qCount <= 50) {
      queueScore = 5;
    } else {
      queueScore = 0;
    }

    // D. Facility Level Score (10 Points Max)
    let levelScore = 0;
    const level = facility.kephLevel || 2;
    if (level === 6) {
      levelScore = 10;
    } else if (level === 5) {
      levelScore = 8;
    } else if (level === 4) {
      levelScore = 6;
    } else if (level === 3) {
      levelScore = 4;
    } else {
      levelScore = 2;
    }

    // Total score calculation
    const totalScore = parseFloat((serviceMatchScore + distanceScore + queueScore + levelScore).toFixed(1));

    return {
      facility_id: facility.id,
      name: facility.name,
      level: facility.level,
      kephLevel: facility.kephLevel,
      distance_km: distance,
      contact: facility.contact,
      matched_services: requiredServices.filter(srv => facility.services.includes(srv)),
      total_services_count: facility.services.length,
      live_status: {
        queue_count: status.queue_count,
        doctor_available: status.doctor_available,
        beds_available: status.beds_available,
        emergency_status: status.emergency_status,
        updated_at: status.updated_at,
        using_estimation: usingEstimation,
        estimation_details: usingEstimation ? status.estimation_reason : null,
        freshness: {
          trust_level: freshnessInfo.trustLevel,
          hours_elapsed: freshnessInfo.hoursElapsed
        }
      },
      scores: {
        service_match: parseFloat(serviceMatchScore.toFixed(1)),
        distance: distanceScore,
        queue: queueScore,
        facility_level: levelScore,
        total: totalScore
      }
    };
  });

  return scoredFacilities.sort((a, b) => {
    if (b.scores.total === a.scores.total) {
      return a.distance_km - b.distance_km;
    }
    return b.scores.total - a.scores.total;
  });
}

function runEmergencyOverride({ facilities, liveStatusMap, userLat, userLng }) {
  const rankedEmergencyFacilities = facilities
    .filter(f => f.services.includes("Emergency Care") || f.kephLevel >= 4)
    .map(facility => {
      const distance = calculateDistance(userLat, userLng, facility.latitude, facility.longitude);
      const rawStatus = liveStatusMap[facility.id] || {};
      
      return {
        facility_id: facility.id,
        name: facility.name,
        level: facility.level,
        kephLevel: facility.kephLevel,
        distance_km: distance,
        contact: facility.contact,
        live_status: {
          queue_count: rawStatus.queue_count || 'Unknown',
          doctor_available: rawStatus.doctor_available || 'Unknown',
          beds_available: rawStatus.beds_available || 'Unknown',
          emergency_status: rawStatus.emergency_status || 'normal',
          updated_at: rawStatus.updated_at || null
        },
        emergency_instructions: "🚨 EMERGENCY ROUTE SELECTED: Proceed immediately. Contact the facility using the provided emergency line prior to arrival if possible."
      };
    })
    .sort((a, b) => a.distance_km - b.distance_km);

  return {
    emergency_override: true,
    message: "🚨 Critical emergency detected. Standard queue-scoring has been bypassed to prioritize the absolute nearest emergency-capable facility.",
    nearest_facility: rankedEmergencyFacilities[0] || null,
    all_emergency_options: rankedEmergencyFacilities
  };
}

module.exports = {
  routeAndScore,
  estimateLiveStatus
};
