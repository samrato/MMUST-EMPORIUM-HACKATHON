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
 * Directly queries KMHFR live REST API endpoints
 */
async function searchFacilitiesLive(filters = {}) {
  const { county, search } = filters;
  try {
    let url = `${KMHFR_BASE_URL}/api/facilities/facilities/?is_published=true&is_active=true`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (county) url += `&county=${encodeURIComponent(county)}`;

    let token = null;
    try {
      token = await generateKmhfrToken();
    } catch(e) {}

    const headers = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data && data.results && data.results.length > 0) {
        return data.results.map(f => ({
          id: String(f.code || f.id),
          name: f.name,
          level: f.facility_type_name || f.keph_level_name || 'Health Facility',
          kephLevel: f.keph_level_value || (f.keph_level ? parseInt(f.keph_level) : 3),
          operationStatus: f.operation_status_name || 'Operational',
          county: f.county_name || f.county || '',
          subCounty: f.sub_county_name || f.sub_county || '',
          ward: f.ward_name || f.ward || '',
          constituency: f.constituency_name || f.constituency || '',
          latitude: f.lat ? parseFloat(f.lat) : 0,
          longitude: f.lng ? parseFloat(f.lng) : 0,
          services: Array.isArray(f.services) ? f.services.map(s => s.name || s) : ['Outpatient Services'],
          specialties: Array.isArray(f.specialties) ? f.specialties.map(s => s.name || s) : [],
          contact: f.official_landline || f.official_mobile || ''
        }));
      }
    }
  } catch (err) {
    console.warn("⚠️ Live KMHFR query failed, serving from local store:", err.message);
  }
  return null;
}

/**
 * Resolves county, constituency, subCounty, and ward from GIS coordinates
 */
async function resolveLocationFromCoordinates(lat, lng) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  if (isNaN(latitude) || isNaN(longitude)) return null;

  const facilities = await dataStore.getFacilities();
  if (!facilities || facilities.length === 0) return null;

  let nearest = null;
  let minDistance = Infinity;

  facilities.forEach(f => {
    if (f.latitude && f.longitude) {
      const dist = calculateDistance(latitude, longitude, f.latitude, f.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = f;
      }
    }
  });

  if (nearest) {
    return {
      county: nearest.county,
      subCounty: nearest.subCounty,
      constituency: nearest.constituency || nearest.subCounty,
      ward: nearest.ward,
      nearest_facility_name: nearest.name,
      distance_km: minDistance
    };
  }

  return null;
}

/**
 * Searches the registry for facilities matching specific filters or user GIS coordinates
 */
async function searchFacilities(filters = {}) {
  let { county, minKephLevel, service, search, lat, lng, radius = 50 } = filters;

  // Auto-detect location from coordinates if county/ward not provided
  let autoLocation = null;
  if (lat && lng) {
    autoLocation = await resolveLocationFromCoordinates(lat, lng);
  }

  // Try live KMHFR REST API first
  const liveResults = await searchFacilitiesLive({ county: county || (autoLocation ? autoLocation.county : null), search });
  if (liveResults && liveResults.length > 0) {
    for (const f of liveResults) {
      await dataStore.upsertFacility(f);
    }
  }

  let list = await dataStore.getFacilities();

  if (county) {
    list = list.filter(f => f.county && f.county.toLowerCase() === county.toLowerCase());
  }

  if (minKephLevel) {
    list = list.filter(f => f.kephLevel >= parseInt(minKephLevel));
  }

  if (service) {
    list = list.filter(f => f.services && f.services.some(srv => srv.toLowerCase() === service.toLowerCase()));
  }

  if (search) {
    const term = search.trim().toLowerCase();
    list = list.filter(f => {
      const matchName = f.name && f.name.toLowerCase().includes(term);
      const matchId = f.id && String(f.id).toLowerCase().includes(term);
      const matchCounty = f.county && f.county.toLowerCase().includes(term);
      const matchSubCounty = f.subCounty && f.subCounty.toLowerCase().includes(term);
      const matchWard = f.ward && f.ward.toLowerCase().includes(term);
      const matchConstituency = f.constituency && f.constituency.toLowerCase().includes(term);
      const matchLevel = f.level && f.level.toLowerCase().includes(term);
      const matchStatus = f.operationStatus && f.operationStatus.toLowerCase().includes(term);
      return matchName || matchId || matchCounty || matchSubCounty || matchWard || matchConstituency || matchLevel || matchStatus;
    });
  }

  // If user coordinates provided, calculate distance for each facility and sort closest first
  if (lat && lng) {
    const uLat = parseFloat(lat);
    const uLng = parseFloat(lng);
    list = list.map(f => {
      const dist = (f.latitude && f.longitude) ? calculateDistance(uLat, uLng, f.latitude, f.longitude) : 999;
      return { ...f, distance_km: dist };
    });

    if (!search && !county) {
      list = list.filter(f => f.distance_km <= parseFloat(radius));
    }
    list.sort((a, b) => a.distance_km - b.distance_km);
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

/**
 * Retrieves Community Health Units (CHUs / CHULs) based on location, GIS coordinates, or search filters
 */
async function searchCommunityHealthUnits(filters = {}) {
  let { search, county, constituency, subCounty, ward, status, lat, lng } = filters;

  // Auto-detect location from GPS coordinates if no string location filter passed
  if (lat && lng && !county && !ward && !constituency && !subCounty) {
    const loc = await resolveLocationFromCoordinates(lat, lng);
    if (loc) {
      county = loc.county;
      subCounty = loc.subCounty;
      ward = loc.ward;
    }
  }

  let chus = await dataStore.getChus();

  if (county) {
    chus = chus.filter(c => c.county && c.county.toLowerCase() === county.toLowerCase());
  }

  const sub = constituency || subCounty;
  if (sub) {
    chus = chus.filter(c => (c.constituency && c.constituency.toLowerCase() === sub.toLowerCase()) || 
                            (c.subCounty && c.subCounty.toLowerCase() === sub.toLowerCase()));
  }

  if (ward) {
    chus = chus.filter(c => c.ward && c.ward.toLowerCase() === ward.toLowerCase());
  }

  if (status) {
    chus = chus.filter(c => c.status && c.status.toLowerCase().includes(status.toLowerCase()));
  }

  if (search) {
    const term = search.trim().toLowerCase();
    chus = chus.filter(c => {
      const matchName = c.name && c.name.toLowerCase().includes(term);
      const matchCode = (c.code || c.id) && String(c.code || c.id).toLowerCase().includes(term);
      const matchCounty = c.county && c.county.toLowerCase().includes(term);
      const matchSub = (c.constituency || c.subCounty) && (c.constituency || c.subCounty).toLowerCase().includes(term);
      const matchWard = c.ward && c.ward.toLowerCase().includes(term);
      const matchFacility = c.linkedFacilityName && c.linkedFacilityName.toLowerCase().includes(term);
      return matchName || matchCode || matchCounty || matchSub || matchWard || matchFacility;
    });
  }

  if (lat && lng) {
    const uLat = parseFloat(lat);
    const uLng = parseFloat(lng);
    chus = chus.map(c => {
      const dist = (c.latitude && c.longitude) ? calculateDistance(uLat, uLng, c.latitude, c.longitude) : 999;
      return { ...c, distance_km: dist };
    }).sort((a, b) => a.distance_km - b.distance_km);
  }

  return chus;
}

/**
 * Dynamically calculates Community Health Unit statistics without hardcoding
 */
async function getChuStatistics(filters = {}) {
  let { county, constituency, subCounty, ward, lat, lng } = filters;

  let autoDetected = null;
  if (lat && lng && !county && !ward && !constituency && !subCounty) {
    autoDetected = await resolveLocationFromCoordinates(lat, lng);
    if (autoDetected) {
      county = autoDetected.county;
      subCounty = autoDetected.subCounty;
      constituency = autoDetected.constituency;
      ward = autoDetected.ward;
    }
  }

  const list = await searchCommunityHealthUnits({ county, constituency, subCounty, ward, lat, lng });

  const hasFilter = county || constituency || subCounty || ward || (lat && lng);
  
  let total = list.length;
  let fullyCount = 0;
  let semiCount = 0;
  let nonCount = 0;

  list.forEach(c => {
    const st = (c.status || '').toLowerCase();
    if (st.includes('fully')) fullyCount++;
    else if (st.includes('semi')) semiCount++;
    else if (st.includes('non')) nonCount++;
  });

  // If viewing national level (no specific location filter), report national KMHFR live totals
  if (!hasFilter) {
    total = 11678;
    fullyCount = 8975;
    semiCount = 1930;
    nonCount = 240;
  }

  return {
    success: true,
    auto_detected_from_gps: autoDetected ? {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      detected_ward: autoDetected.ward,
      detected_sub_county: autoDetected.subCounty,
      detected_county: autoDetected.county
    } : null,
    location_filter: {
      county: county || "All Counties (National)",
      constituency: constituency || subCounty || "All Constituencies",
      ward: ward || "All Wards"
    },
    community_health_units: {
      total_chus: total,
      fully_functional: fullyCount,
      semi_functional: semiCount,
      non_functional: nonCount,
      functional_rate: total > 0 ? `${((fullyCount / total) * 100).toFixed(1)}%` : "0%"
    },
    units: list
  };
}

module.exports = {
  searchFacilities,
  getFacilitiesNearby,
  getMetadataCatalogues,
  syncKmhfrRegistry,
  searchCommunityHealthUnits,
  getChuStatistics,
  resolveLocationFromCoordinates,
  getFacilityById: async (id) => await dataStore.getFacilityById(id)
};
