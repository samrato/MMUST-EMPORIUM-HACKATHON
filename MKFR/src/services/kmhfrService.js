/**
 * KMHFR Service (Static Foundation Layer)
 * Manages access to the Master Health Facility Registry database.
 * Serves as the primary source of truth for facility location (GIS), levels (KEPH), and capabilities.
 * 
 * Supports OAuth token generation, Live registry synchronization, and local storage mappings.
 */

const dataStore = require('../models/dataStore');
const { calculateDistance } = require('../utils/helpers');

// Load API Configurations
const KMHFR_BASE_URL = process.env.KMHFR_API_BASE_URL || 'https://api.kmhfr.health.go.ke';

/**
 * Generates OAuth Bearer token by querying /o/token/ endpoint
 */
async function generateKmhfrToken() {
  const clientId = process.env.KMHFR_CLIENT_ID || '5O1KlpwBb96ANWe27ZQOpbWSF4DZDm4sOytwdzGv';
  const clientSecret = process.env.KMHFR_CLIENT_SECRET || 'PqV0dHbkjXAtJYhY9UOCgRVi5BzLhiDxGU91kbt5EoayQ5SYOoJBYRYAYlJl2RetUeDMpSvhe9DaQr0HKHan0B9ptVyoLvOqpekiOmEqUJ6HZKuIoma0pvqkkKDU9GPv';
  const username = process.env.KMHFR_USER_EMAIL;
  const password = process.env.KMHFR_USER_PASSWORD;

  if (!username || !password) {
    throw new Error("Missing KMHFR user credentials (KMHFR_USER_EMAIL / KMHFR_USER_PASSWORD) in env variables.");
  }

  console.log(`🔑 [KMHFR Sync] Authenticating with OAuth endpoint at ${KMHFR_BASE_URL}/o/token/`);
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${KMHFR_BASE_URL}/o/token/`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: username,
      password: password,
      scope: 'read'
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`KMHFR Token generation failed (${response.status}): ${errText}`);
  }

  const payload = await response.json();
  return payload.access_token;
}

/**
 * Downloads live facilities & contacts from KMHFR API and upserts them to the local offline database
 */
async function syncKmhfrRegistry() {
  try {
    const token = await generateKmhfrToken();
    console.log("🎫 [KMHFR Sync] OAuth Bearer token acquired. Syncing facility registries...");

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    };

    // 1. Fetch facilities list
    const facRes = await fetch(`${KMHFR_BASE_URL}/api/facilities/facilities/?page_size=10&is_published=true&is_active=true`, { headers });
    if (!facRes.ok) {
      throw new Error(`Failed to fetch facilities (${facRes.status})`);
    }
    const facPayload = await facRes.json();
    const facilitiesList = facPayload.results || [];

    // 2. Fetch contacts list (mapping actual contacts)
    const contactsRes = await fetch(`${KMHFR_BASE_URL}/api/facilities/contacts/?page_size=50`, { headers });
    let contactsList = [];
    if (contactsRes.ok) {
      const contactsPayload = await contactsRes.json();
      contactsList = contactsPayload.results || [];
    }

    console.log(`📦 [KMHFR Sync] Fetched ${facilitiesList.length} facilities and ${contactsList.length} contact records.`);

    let syncCount = 0;
    for (const f of facilitiesList) {
      // Find matching contact details for this facility code/id
      const matchingContact = contactsList.find(c => c.facility === f.id);
      const contactInfo = matchingContact ? `${matchingContact.contact_type}: ${matchingContact.actual_contact}` : 'No registry contact';

      // Upsert into local database
      await dataStore.upsertFacility({
        id: String(f.code || f.id),
        name: f.name,
        level: f.facility_type_name || 'Health Center',
        kephLevel: f.keph_level || 3,
        county: f.county_name || 'Kakamega',
        subCounty: f.sub_county_name || 'Kakamega Central',
        latitude: f.lat ? parseFloat(f.lat) : 0.0,
        longitude: f.lng ? parseFloat(f.lng) : 0.0,
        services: Array.isArray(f.services) ? f.services : ['Outpatient Services', 'General Triage'],
        specialties: Array.isArray(f.specialties) ? f.specialties : [],
        contact: contactInfo
      });
      syncCount++;
    }

    console.log(`✅ [KMHFR Sync] Successfully synced ${syncCount} facilities to the offline database store.`);
    return { success: true, synced: syncCount };

  } catch (error) {
    console.error("❌ [KMHFR Sync] Synchronization error:", error.message);
    throw error;
  }
}

/**
 * Searches the registry for facilities matching specific filters
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
  
  const allServices = new Set();
  const allSpecialties = new Set();
  
  facilities.forEach(f => {
    if (Array.isArray(f.services)) f.services.forEach(s => allServices.add(s));
    if (Array.isArray(f.specialties)) f.specialties.forEach(sp => allSpecialties.add(sp));
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
  syncKmhfrRegistry,
  getFacilityById: async (id) => await dataStore.getFacilityById(id)
};
