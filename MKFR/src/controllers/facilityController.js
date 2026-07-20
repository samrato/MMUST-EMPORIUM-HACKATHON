const kmhfrService = require('../services/kmhfrService');
const dataStore = require('../models/dataStore');
const { calculateFreshness } = require('../utils/helpers');

/**
 * Get all facilities or filter by query parameters (county, level, service)
 */
exports.getAllFacilities = async (req, res) => {
  try {
    const { county, minKephLevel, service, search, q, lat, lng, radius } = req.query;
    const searchQuery = search || q;
    const facilities = await kmhfrService.searchFacilities({ county, minKephLevel, service, search: searchQuery, lat, lng, radius });

    return res.status(200).json({
      success: true,
      count: facilities.length,
      data: facilities
    });
  } catch (error) {
    console.error("Error in facility controller (getAllFacilities):", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error retrieving facility list."
    });
  }
};

/**
 * Get detailed metadata indexes (available services, specialties, levels)
 */
exports.getMetadataCatalogues = async (req, res) => {
  try {
    const catalog = await kmhfrService.getMetadataCatalogues();
    return res.status(200).json({
      success: true,
      data: catalog
    });
  } catch (error) {
    console.error("Error retrieving metadata catalog:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error retrieving system metadata."
    });
  }
};

/**
 * Get facilities sorted by distance from user GIS coordinates
 */
exports.getNearbyFacilities = async (req, res) => {
  try {
    const { lat, lng, radius = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: "Missing required query parameters: 'lat' and 'lng' are mandatory."
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
      return res.status(400).json({
        success: false,
        error: "Coordinates (lat, lng) and radius must be valid floating-point numbers."
      });
    }

    const facilities = await kmhfrService.getFacilitiesNearby(latitude, longitude, radiusKm);

    return res.status(200).json({
      success: true,
      count: facilities.length,
      data: facilities
    });
  } catch (error) {
    console.error("Error in facility controller (getNearbyFacilities):", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error retrieving nearby facilities."
    });
  }
};

/**
 * Get single facility by id, merging KMHFR static data and Live Status Layer data
 */
exports.getFacilityById = async (req, res) => {
  try {
    const { id } = req.params;
    const facility = await kmhfrService.getFacilityById(id);

    if (!facility) {
      return res.status(404).json({
        success: false,
        error: `Facility with ID ${id} not found in the KMHFR registry.`
      });
    }

    // Merge static data with live status (if available)
    const liveStatus = await dataStore.getLiveStatusById(id);
    let statusResponse = null;

    if (liveStatus) {
      const freshness = calculateFreshness(liveStatus.updated_at);
      statusResponse = {
        ...liveStatus,
        freshness_trust: freshness.trustLevel,
        hours_since_update: freshness.hoursElapsed
      };
    } else {
      statusResponse = {
        message: "No live status reported yet by facility. System will rely on AI workload estimation during routing.",
        updated_at: null
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        ...facility,
        live_status: statusResponse
      }
    });
  } catch (error) {
    console.error("Error in facility controller (getFacilityById):", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error retrieving facility details."
    });
  }
};

/**
 * Sync facilities from KMHFR Live REST API
 */
exports.syncFacilities = async (req, res) => {
  try {
    const result = await kmhfrService.syncKmhfrRegistry();
    return res.status(200).json({
      success: true,
      message: "KMHFR Facility synchronization completed successfully.",
      data: result
    });
  } catch (error) {
    console.error("Error in facility controller (syncFacilities):", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to synchronize facility registry with KMHFR."
    });
  }
};

/**
 * Get Community Health Units (CHUs / CHULs) by search, location filters, or user GPS coordinates
 */
exports.getCommunityHealthUnits = async (req, res) => {
  try {
    const { search, q, county, constituency, subCounty, ward, status, lat, lng } = req.query;
    const searchQuery = search || q;
    const chus = await kmhfrService.searchCommunityHealthUnits({
      search: searchQuery,
      county,
      constituency,
      subCounty,
      ward,
      status,
      lat,
      lng
    });

    return res.status(200).json({
      success: true,
      count: chus.length,
      data: chus
    });
  } catch (error) {
    console.error("Error in facility controller (getCommunityHealthUnits):", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error retrieving Community Health Units."
    });
  }
};

/**
 * Get Community Health Unit functionality statistics (live calculations by county, constituency, ward, or user GPS coordinates)
 */
exports.getChuStats = async (req, res) => {
  try {
    const { county, constituency, subCounty, ward, lat, lng } = req.query;
    const stats = await kmhfrService.getChuStatistics({ county, constituency, subCounty, ward, lat, lng });
    return res.status(200).json(stats);
  } catch (error) {
    console.error("Error in facility controller (getChuStats):", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error computing Community Health Unit statistics."
    });
  }
};
