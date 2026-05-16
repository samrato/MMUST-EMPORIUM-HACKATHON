import { supabase } from '@/lib/supabase';

export interface NearbyFacility {
  id: string;
  name: string;
  address: string;
  rating: number;
  user_ratings_total: number;
  location: { lat: number; lng: number };
  open_now: boolean;
  types: string[];
  distance?: number;
  phone?: string;
  source?: 'supabase' | 'registry' | 'google' | 'fallback';
  capacity?: number | null;
  operating_hours?: string | null;
  last_updated_at?: string | null;
  external_id?: string | null;
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const KMHFR_BASE_URL = import.meta.env.VITE_KMHFR_API_BASE_URL || import.meta.env.VITE_KMHFR_API_URL || 'https://api.kmhfr.health.go.ke';
const KMHFR_ACCESS_TOKEN = import.meta.env.VITE_KMHFR_ACCESS_TOKEN || '';

interface GooglePlaceResult {
  id?: string;
  place_id?: string;
  name?: string;
  vicinity?: string;
  address?: string;
  rating?: number;
  user_ratings_total?: number;
  geometry?: { location?: { lat: number; lng: number } };
  location?: { lat: number; lng: number };
  opening_hours?: { open_now?: boolean };
  types?: string[];
}

interface NearbySearchResponse {
  results?: GooglePlaceResult[];
}

interface FacilityRow {
  id?: string;
  facility_id?: string;
  name?: string;
  facility_name?: string;
  address?: string;
  location?: string;
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lng?: number | string;
  phone?: string;
  rating?: number | string;
  user_ratings_total?: number | string;
  open_now?: boolean;
  is_open?: boolean;
  types?: string[] | string;
  facility_type?: string[] | string;
  services?: string[] | string;
  operating_hours?: string;
  hours?: string;
  capacity?: number | string;
  updated_at?: string;
  last_updated_at?: string;
  status?: string;
  active?: boolean;
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = toNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeTypeList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseCoordinates(value: unknown): { lat: number; lng: number } | null {
  if (!value) return null;

  if (typeof value === 'object' && value !== null) {
    const candidate = value as { lat?: unknown; lng?: unknown; latitude?: unknown; longitude?: unknown };
    const lat = toNumber(candidate.lat ?? candidate.latitude, Number.NaN);
    const lng = toNumber(candidate.lng ?? candidate.longitude, Number.NaN);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  if (typeof value === 'string') {
    const match = value.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }
  }

  return null;
}

function extractCoordinates(row: FacilityRow) {
  const directLat = toNumber(row.latitude ?? row.lat, Number.NaN);
  const directLng = toNumber(row.longitude ?? row.lng, Number.NaN);
  if (Number.isFinite(directLat) && Number.isFinite(directLng)) {
    return { lat: directLat, lng: directLng };
  }

  return parseCoordinates(row.location);
}

function buildAddress(row: FacilityRow, coordinates: { lat: number; lng: number }) {
  return (
    row.address ||
    row.location ||
    `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`
  );
}

function buildFacilityId(row: FacilityRow) {
  return String(row.facility_id || row.id || crypto.randomUUID());
}

function mapFacilityRow(row: FacilityRow): NearbyFacility | null {
  const coordinates = extractCoordinates(row);
  if (!coordinates) return null;

  return {
    id: buildFacilityId(row),
    external_id: row.id ? String(row.id) : row.facility_id ? String(row.facility_id) : null,
    name: row.name || row.facility_name || 'Unknown Facility',
    address: buildAddress(row, coordinates),
    rating: toNumber(row.rating, 0),
    user_ratings_total: Math.max(0, Math.round(toNumber(row.user_ratings_total, 0))),
    location: coordinates,
    open_now: row.open_now ?? row.is_open ?? (row.status === 'active' || row.active === true),
    types: normalizeTypeList(row.types || row.facility_type || row.services),
    phone: row.phone || undefined,
    capacity: toOptionalNumber(row.capacity),
    operating_hours: row.operating_hours || row.hours || null,
    last_updated_at: row.last_updated_at || row.updated_at || null,
    source: 'supabase',
  };
}

function mergeFacilityLists(primary: NearbyFacility[], secondary: NearbyFacility[]) {
  const merged = new Map<string, NearbyFacility>();

  const upsert = (facility: NearbyFacility) => {
    const key = normalizeText(facility.name);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, facility);
      return;
    }

    merged.set(key, {
      ...existing,
      ...facility,
      address: facility.address || existing.address,
      phone: facility.phone || existing.phone,
      rating: Math.max(existing.rating || 0, facility.rating || 0),
      user_ratings_total: Math.max(existing.user_ratings_total || 0, facility.user_ratings_total || 0),
      open_now: facility.open_now ?? existing.open_now,
      capacity: facility.capacity ?? existing.capacity ?? null,
      operating_hours: facility.operating_hours || existing.operating_hours || null,
      last_updated_at: facility.last_updated_at || existing.last_updated_at || null,
      external_id: facility.external_id || existing.external_id || null,
      source: existing.source === 'supabase' ? existing.source : facility.source,
      types: Array.from(new Set([...(existing.types || []), ...(facility.types || [])])),
    });
  };

  primary.forEach(upsert);
  secondary.forEach(upsert);

  return Array.from(merged.values());
}

async function getRegistryFacilities(lat: number, lng: number): Promise<NearbyFacility[]> {
  if (!KMHFR_BASE_URL) return [];

  try {
    const headers: HeadersInit = {};
    if (KMHFR_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${KMHFR_ACCESS_TOKEN}`;
    }

    const rows: FacilityRow[] = [];
    let nextUrl: string | null = new URL('/api/facilities/facilities/', KMHFR_BASE_URL).toString();
    let pagesFetched = 0;

    while (nextUrl && pagesFetched < 4 && rows.length < 400) {
      const pageUrl = new URL(nextUrl);
      pageUrl.searchParams.set('is_published', 'true');
      pageUrl.searchParams.set('is_classified', 'false');
      pageUrl.searchParams.set('is_active', 'true');
      pageUrl.searchParams.set('page_size', '100');

      const response = await fetch(pageUrl.toString(), { headers });
      if (!response.ok) break;

      const payload = await response.json();
      const pageRows: FacilityRow[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
          ? payload.results
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

      rows.push(...pageRows);
      nextUrl = typeof payload?.next === 'string' && payload.next ? payload.next : null;
      pagesFetched += 1;
    }

    return rows
      .map(mapFacilityRow)
      .filter((facility): facility is NearbyFacility => Boolean(facility))
      .map((facility) => ({
        ...facility,
        distance: parseFloat(calculateDistance(lat, lng, facility.location.lat, facility.location.lng).toFixed(1)),
        source: 'registry',
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  } catch {
    return [];
  }
}

async function getSupabaseFacilities(lat: number, lng: number): Promise<NearbyFacility[]> {
  try {
    const { data, error } = await supabase.from('facilities').select('*').limit(200);
    if (error || !data || data.length === 0) return [];

    return (data as FacilityRow[])
      .map(mapFacilityRow)
      .filter((facility): facility is NearbyFacility => Boolean(facility))
      .map((facility) => ({
        ...facility,
        distance: parseFloat(calculateDistance(lat, lng, facility.location.lat, facility.location.lng).toFixed(1)),
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  } catch {
    return [];
  }
}

async function getOSMFacilities(lat: number, lng: number): Promise<NearbyFacility[]> {
  const radius = 50000; // 50km
  // Query nodes, ways, and relations for hospitals
  const query = `[out:json];
    (
      node["amenity"="hospital"](around:${radius},${lat},${lng});
      way["amenity"="hospital"](around:${radius},${lat},${lng});
      relation["amenity"="hospital"](around:${radius},${lat},${lng});
    );
    out center;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('OSM error');

    const data = await response.json();
    const results = data.elements || [];

    if (results.length === 0) return [];

    return results.map((element: any) => {
      // For ways/relations, "center" is provided by "out center"
      const location = element.type === 'node' 
        ? { lat: element.lat, lng: element.lon }
        : { lat: element.center.lat, lng: element.center.lon };

      return {
        id: String(element.id),
        name: element.tags.name || 'Unknown Hospital',
        address: element.tags['addr:street'] ? `${element.tags['addr:street']}, ${element.tags['addr:city'] || ''}` : 'Address unavailable',
        rating: 4.0,
        user_ratings_total: 10,
        location,
        open_now: true,
        types: ['hospital', element.tags.amenity].filter(Boolean),
        source: 'registry',
      };
    });
  } catch (error) {
    console.error('OSM Fetch failed:', error);
    return [];
  }
}

export async function getNearbyHospitals(lat: number, lng: number): Promise<NearbyFacility[]> {
  const [supabaseFacilities, registryFacilities, googleFacilities, osmFacilities] = await Promise.all([
    getSupabaseFacilities(lat, lng),
    getRegistryFacilities(lat, lng),
    getGoogleFacilities(lat, lng),
    getOSMFacilities(lat, lng),
  ]);

  const merged = mergeFacilityLists(
    mergeFacilityLists(
      mergeFacilityLists(supabaseFacilities, registryFacilities),
      googleFacilities
    ),
    osmFacilities
  );

  if (merged.length > 0) {
    return merged
      .map((facility) => ({
        ...facility,
        distance: parseFloat(calculateDistance(lat, lng, facility.location.lat, facility.location.lng).toFixed(1)),
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 20);
  }

  return getFallbackFacilities(lat, lng).map(f => ({
    ...f,
    distance: parseFloat(calculateDistance(lat, lng, f.location.lat, f.location.lng).toFixed(1))
  })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
}

export async function getClosestFacility(lat: number, lng: number): Promise<NearbyFacility | null> {
  const hospitals = await getNearbyHospitals(lat, lng);
  return hospitals.length > 0 ? hospitals[0] : null;
}

async function getGoogleFacilities(lat: number, lng: number): Promise<NearbyFacility[]> {
  if (!API_KEY) return [];

  const radius = 50000;
  const type = 'hospital';
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${API_KEY}`;

  try {
    const response = await fetch(`https://cors-anywhere.herokuapp.com/${url}`);
    if (!response.ok) throw new Error('Proxy error');

    const data = (await response.json()) as NearbySearchResponse;
    const results = data.results || [];

    if (results.length === 0) return [];

    return results.map((place) => ({
      id: place.place_id || place.id || crypto.randomUUID(),
      name: place.name || 'Unknown Facility',
      address: place.vicinity || place.address || 'Address unavailable',
      rating: place.rating || 4.5,
      user_ratings_total: place.user_ratings_total || 50,
      location: place.geometry?.location || place.location || { lat, lng },
      open_now: place.opening_hours?.open_now ?? true,
      types: place.types || ['hospital'],
      source: 'google',
    }));
  } catch {
    return [];
  }
}

function getFallbackFacilities(lat: number, lng: number): NearbyFacility[] {
  return [
 {
  id: "m1",
  name: "MMUST Clinic",
  address: "Comrades Way, MMUST Campus, Kakamega",
  rating: 4.4,
  user_ratings_total: 80,
  location: { lat: lat + 0.0002, lng: lng + 0.0002 },
  open_now: true,
  types: ["clinic", "health"]
},
  {
    id: "m2",
    name: "Kakamega County General Hospital",
    address: "Hospital Road, Kakamega",
    rating: 4.1,
    user_ratings_total: 320,
    location: { lat: lat - 0.02, lng: lng - 0.005 },
    open_now: true,
    types: ["hospital", "general_hospital"]
  },
  {
    id: "m3",
    name: "New Kakamega Referral Hospital",
    address: "Hospital Road, Kakamega",
    rating: 4.0,
    user_ratings_total: 240,
    location: { lat: lat - 0.025, lng: lng + 0.002 },
    open_now: true,
    types: ["hospital", "referral_hospital"]
  },
  {
    id: "m4",
    name: "Jumuia Hospitals",
    address: "Kisumu-Kakamega Road, Kakamega",
    rating: 4.2,
    user_ratings_total: 170,
    location: { lat: lat + 0.01, lng: lng - 0.015 },
    open_now: true,
    types: ["hospital", "general_hospital"]
  },
  {
    id: "m5",
    name: "Nala Hospital",
    address: "Kakamega-Mumias Road, Kakamega",
    rating: 4.0,
    user_ratings_total: 130,
    location: { lat: lat + 0.008, lng: lng - 0.02 },
    open_now: true,
    types: ["hospital"]
  },
  {
    id: "m6",
    name: "Kakamega Central Nursing Home",
    address: "Kakamega Town, Kakamega",
    rating: 3.9,
    user_ratings_total: 90,
    location: { lat: lat + 0.012, lng: lng - 0.01 },
    open_now: true,
    types: ["clinic", "nursing_home"]
  },
  {
    id: "m7",
    name: "St Elizabeth Mukumu Hospital",
    address: "E237, Mukumu, Kakamega",
    rating: 4.3,
    user_ratings_total: 210,
    location: { lat: lat - 0.07, lng: lng + 0.01 },
    open_now: true,
    types: ["hospital", "general_hospital"]
  },
  {
    id: "m8",
    name: "Shikokho Health Clinic",
    address: "Shikokho, Kakamega County",
    rating: 3.8,
    user_ratings_total: 70,
  location: { lat: lat - 0.1, lng: lng - 0.04 },
  open_now: true,
  types: ["clinic", "health_center"],
  source: 'fallback'
  }
];
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
