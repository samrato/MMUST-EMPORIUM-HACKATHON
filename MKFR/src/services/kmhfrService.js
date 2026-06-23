/**
 * KMHFR Service (Static Foundation Layer)
 * Manages access to the Master Health Facility Registry database.
 * Serves as the primary source of truth for facility location (GIS), levels (KEPH), and capabilities.
 */

const dataStore = require('../models/dataStore');
const { calculateDistance } = require('../utils/helpers');

/**
 * Searches the registry for facilities matching specific filters
 * @param {object} filters
 * @param {string} [filters.county] - Filter by county (e.g. Kakamega, Nairobi)
 * @param {number} [filters.minKephLevel] - Minimum KEPH level
 * @param {string} [filters.service] - Service required (e.g. "Maternity")
 * @returns {Promise<object[]>} Filtered facility list
 */
async function searchFacilities(filters = {}) {
  const { county, minKephLevel, service } = filters;
  let list = await dataStore.getFacilities();

  if (county) {
    list = list.filter(f => f.county.toLowerCase() === county.toLowerCase());
  }

  if (minKephLevel) {
    list = list.filter(f => f.kephLevel >= parseInt(minKephLevel));
  }

  if (service) {
    list = list.filter(f => f.services.some(srv => srv.toLowerCase() === service.toLowerCase()));
  }

  return list;
}

/**
 * Lists nearby facilities within a radius, sorted by distance
 */
async function getFacilitiesNearby(lat, lng, radiusKm = 20) {
  const list = await dataStore.getFacilities();
  
  return list
    .map(facility => {
      const distance = calculateDistance(lat, lng, facility.latitude, facility.longitude);
      return {
        ...facility,
        distance_km: distance
      };
    })
    .filter(facility => facility.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);
}

/**
 * Retrieves lists of all available facilities, specialties, and services in the registry
 */
async function getMetadataCatalogues() {
  const facilities = await dataStore.getFacilities();
  
  // Extract unique services from facilities
  const allServices = new Set();
  const allSpecialties = new Set();
  
  facilities.forEach(f => {
    f.services.forEach(s => allServices.add(s));
    f.specialties.forEach(sp => allSpecialties.add(sp));
  });

  return {
    keph_levels: [
      { level: 1, name: "Level 1: Community Health Unit" },
      { level: 2, name: "Level 2: Dispensary" },
      { level: 3, name: "Level 3: Health Centre" },
      { level: 4, name: "Level 4: Sub-County Hospital" },
      { level: 5, name: "Level 5: County Referral Hospital" },
      { level: 6, name: "Level 6: National Referral Hospital" }
    ],
    services: Array.from(allServices),
    specialties: Array.from(allSpecialties)
  };
}

module.exports = {
  searchFacilities,
  getFacilitiesNearby,
  getMetadataCatalogues,
  getFacilityById: async (id) => await dataStore.getFacilityById(id)
};
