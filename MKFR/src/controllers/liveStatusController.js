const dataStore = require('../models/dataStore');
const { calculateFreshness } = require('../utils/helpers');

// Simple mock API key for hospital portal clients
const PORTAL_AUTH_KEY = "afyaroot_hospital_portal_token";

/**
 * Handle Live Hospital Status update payload from Hospital Portal app
 */
exports.updateStatus = async (req, res) => {
  try {
    const authHeader = req.headers['x-api-key'] || req.headers['authorization'];
    
    // Auth Validation (representing secure hospital portals)
    if (!authHeader || authHeader !== PORTAL_AUTH_KEY) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Invalid or missing 'x-api-key' for Hospital Portal."
      });
    }

    const { facilityId, queue_count, doctor_available, beds_available, emergency_status } = req.body;

    if (!facilityId) {
      return res.status(400).json({
        success: false,
        error: "Missing parameter: 'facilityId' is required."
      });
    }

    // Verify facility exists in KMHFR registry
    const facility = await dataStore.getFacilityById(facilityId);
    if (!facility) {
      return res.status(404).json({
        success: false,
        error: `Facility with ID ${facilityId} does not exist in the master registry.`
      });
    }

    // Prepare updates
    const updates = {};
    if (queue_count !== undefined) {
      updates.queue_count = parseInt(queue_count);
      if (isNaN(updates.queue_count) || updates.queue_count < 0) {
        return res.status(400).json({ success: false, error: "'queue_count' must be a non-negative integer." });
      }
    }
    if (doctor_available !== undefined) {
      updates.doctor_available = parseInt(doctor_available);
      if (isNaN(updates.doctor_available) || updates.doctor_available < 0) {
        return res.status(400).json({ success: false, error: "'doctor_available' must be a non-negative integer." });
      }
    }
    if (beds_available !== undefined) {
      updates.beds_available = parseInt(beds_available);
      if (isNaN(updates.beds_available) || updates.beds_available < 0) {
        return res.status(400).json({ success: false, error: "'beds_available' must be a non-negative integer." });
      }
    }
    if (emergency_status !== undefined) {
      if (!['normal', 'busy', 'critical'].includes(emergency_status)) {
        return res.status(400).json({ success: false, error: "'emergency_status' must be 'normal', 'busy', or 'critical'." });
      }
      updates.emergency_status = emergency_status;
    }

    // Save update to registry
    const updatedStatus = await dataStore.updateLiveStatus(facilityId, updates);
    const freshness = calculateFreshness(updatedStatus.updated_at);

    return res.status(200).json({
      success: true,
      message: "Hospital live status successfully updated.",
      data: {
        facility_id: facilityId,
        facility_name: facility.name,
        ...updatedStatus,
        freshness_trust: freshness.trustLevel,
        hours_since_update: freshness.hoursElapsed
      }
    });

  } catch (error) {
    console.error("Error in status update controller:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error in status layer."
    });
  }
};

/**
 * Get live status of a single facility with calculated freshness score
 */
exports.getStatusById = async (req, res) => {
  try {
    const { id } = req.params;
    const facility = await dataStore.getFacilityById(id);

    if (!facility) {
      return res.status(404).json({
        success: false,
        error: `Facility with ID ${id} not found in the KMHFR registry.`
      });
    }

    const liveStatus = await dataStore.getLiveStatusById(id);

    if (!liveStatus) {
      return res.status(200).json({
        success: true,
        facility_id: id,
        facility_name: facility.name,
        live_status: null,
        message: "No status update reported. Relying on AI estimations."
      });
    }

    const freshness = calculateFreshness(liveStatus.updated_at);

    return res.status(200).json({
      success: true,
      facility_id: id,
      facility_name: facility.name,
      live_status: {
        ...liveStatus,
        freshness_trust: freshness.trustLevel,
        hours_since_update: freshness.hoursElapsed
      }
    });

  } catch (error) {
    console.error("Error in getStatusById controller:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error retrieving status."
    });
  }
};
