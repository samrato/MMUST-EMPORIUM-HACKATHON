// AFYAROOT API Client for backend communication (http://localhost:5000/api)

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export interface Facility {
  id: string;
  code: string | number;
  name: string;
  county: string;
  sub_county?: string;
  constituency?: string;
  ward?: string;
  keph_level: string;
  facility_type?: string;
  owner?: string;
  services: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  distance_km?: number;
  live_status?: {
    outpatient_queue_length: number;
    active_doctors: number;
    free_beds: number;
    emergency_status: 'normal' | 'busy' | 'critical';
    freshness_trust: 'HIGH' | 'MODERATE' | 'LOW';
    updated_at?: string;
    hours_since_update?: number;
  };
}

export interface ChuStats {
  success: boolean;
  total_chu: number;
  fully_functional: number;
  fully_functional_pct: number;
  semi_functional: number;
  semi_functional_pct: number;
  non_functional: number;
  non_functional_pct: number;
  location?: {
    county?: string;
    subCounty?: string;
    ward?: string;
  };
}

export interface CommunityHealthUnit {
  id: string;
  code: string;
  name: string;
  county: string;
  constituency: string;
  ward: string;
  status: 'Fully Functional' | 'Semi Functional' | 'Non-Functional' | string;
  households_covered: number;
  chv_count: number;
  linked_facility_name: string;
  linked_facility_code?: string;
}

export interface TriageResponse {
  success: boolean;
  data: {
    symptom_summary: string;
    risk: 'low' | 'moderate' | 'urgent' | 'critical' | string;
    urgency: string;
    required_services: string[];
    recommended_keph_level: string;
    is_emergency: boolean;
    language_detected?: string;
    advice?: string;
    disclaimer?: string;
  };
}

export interface RouteResult {
  facility: Facility;
  total_score: number;
  score_breakdown: {
    match_score: number; // 40%
    distance_score: number; // 30%
    queue_score: number; // 20%
    level_score: number; // 10%
  };
  distance_km: number;
  estimated_travel_minutes: number;
  recommendation_reason: string;
}

export interface RouteResponse {
  success: boolean;
  results: {
    top_recommendation: RouteResult;
    ranked_facilities: RouteResult[];
  };
  query: {
    coordinates: { lat: number; lng: number };
    required_services: string[];
    is_emergency: boolean;
  };
}

export interface BookingInput {
  patient_name: string;
  phone_number: string;
  facility_id: string;
  facility_name: string;
  service_requested: string;
  booking_date: string;
  booking_time?: string;
  symptoms_summary?: string;
}

export interface BookingResponse {
  success: boolean;
  booking_id?: string;
  message?: string;
  error?: string;
  data?: any;
}

// Fetch facilities list with optional filters and GPS coordinates
export async function fetchFacilities(params?: {
  lat?: number;
  lng?: number;
  search?: string;
  county?: string;
  minKephLevel?: string;
  service?: string;
}): Promise<Facility[]> {
  const query = new URLSearchParams();
  if (params?.lat !== undefined && params?.lng !== undefined) {
    query.append('lat', params.lat.toString());
    query.append('lng', params.lng.toString());
  }
  if (params?.search) query.append('search', params.search);
  if (params?.county && params.county !== 'All') query.append('county', params.county);
  if (params?.minKephLevel && params.minKephLevel !== 'All') query.append('minKephLevel', params.minKephLevel);
  if (params?.service && params.service !== 'All') query.append('service', params.service);

  const url = `${BASE_URL}/facilities?${query.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch facilities: ${res.statusText}`);
  }
  const data = await res.json();
  return data.data || [];
}

// Fetch facility detail by ID
export async function fetchFacilityById(id: string): Promise<Facility | null> {
  const res = await fetch(`${BASE_URL}/facilities/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.data || null;
}

// Fetch CHU Stats
export async function fetchChuStats(params?: {
  lat?: number;
  lng?: number;
  county?: string;
  ward?: string;
}): Promise<ChuStats> {
  const query = new URLSearchParams();
  if (params?.lat !== undefined && params?.lng !== undefined) {
    query.append('lat', params.lat.toString());
    query.append('lng', params.lng.toString());
  }
  if (params?.county && params.county !== 'All') query.append('county', params.county);
  if (params?.ward && params.ward !== 'All') query.append('ward', params.ward);

  const res = await fetch(`${BASE_URL}/facilities/chu/stats?${query.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch CHU stats');
  }
  const payload = await res.json();
  const chuObj = payload.community_health_units || payload;

  const total = chuObj.total_chus ?? chuObj.total_chu ?? 11678;
  const fully = chuObj.fully_functional ?? 8975;
  const semi = chuObj.semi_functional ?? 1930;
  const non = chuObj.non_functional ?? 240;

  const fullyPct = total > 0 ? parseFloat(((fully / total) * 100).toFixed(1)) : 0;
  const semiPct = total > 0 ? parseFloat(((semi / total) * 100).toFixed(1)) : 0;
  const nonPct = total > 0 ? parseFloat(((non / total) * 100).toFixed(1)) : 0;

  return {
    success: true,
    total_chu: total,
    fully_functional: fully,
    fully_functional_pct: fullyPct,
    semi_functional: semi,
    semi_functional_pct: semiPct,
    non_functional: non,
    non_functional_pct: nonPct,
    location: payload.location_filter || {},
  };
}

// Fetch CHU List
export async function fetchCommunityHealthUnits(params?: {
  county?: string;
  ward?: string;
  search?: string;
}): Promise<CommunityHealthUnit[]> {
  const query = new URLSearchParams();
  if (params?.county && params.county !== 'All') query.append('county', params.county);
  if (params?.ward && params.ward !== 'All') query.append('ward', params.ward);
  if (params?.search) query.append('search', params.search);

  const res = await fetch(`${BASE_URL}/facilities/chu?${query.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch CHUs');
  }
  const data = await res.json();
  return data.data || [];
}

// Run AI Clinical Triage
export async function runTriage(symptoms: string, county = 'Kakamega', language = 'en'): Promise<TriageResponse> {
  const res = await fetch(`${BASE_URL}/api/triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symptoms, county, language }),
  });
  if (!res.ok) {
    // Fallback to /api/triage/analyze
    const fallbackRes = await fetch(`${BASE_URL}/triage/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, county, language }),
    });
    return await fallbackRes.json();
  }
  return await res.json();
}

// Get Smart Hospital Routes
export async function getSmartRoute(symptom: string, lat: number, lng: number): Promise<RouteResponse> {
  const url = `${BASE_URL}/route?symptom=${encodeURIComponent(symptom)}&lat=${lat}&lng=${lng}`;
  const res = await fetch(url);
  if (!res.ok) {
    // Try POST if GET returned error
    const postRes = await fetch(`${BASE_URL}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userLat: lat, userLng: lng, symptom }),
    });
    return await postRes.json();
  }
  return await res.json();
}

// Submit Patient Booking
export async function submitBooking(bookingData: BookingInput): Promise<BookingResponse> {
  const payload = {
    ...bookingData,
    facilityId: bookingData.facility_id || (bookingData as any).facilityId,
    patientName: bookingData.patient_name || (bookingData as any).patientName,
    phoneNumber: bookingData.phone_number || (bookingData as any).phoneNumber,
    date: bookingData.booking_date || (bookingData as any).date,
    time: bookingData.booking_time || (bookingData as any).time || '09:00 AM',
    serviceNeeded: bookingData.service_requested || (bookingData as any).serviceNeeded || 'Outpatient Consultation',
  };

  const res = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data;
}

// Reverse Geocoding helper for Kenya Wards/Sub-counties
export async function reverseGeocode(lat: number, lng: number): Promise<{ ward: string; subCounty: string; county: string }> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const county = addr.county || addr.state || 'Kakamega';
      const subCounty = addr.suburb || addr.city_district || addr.town || addr.municipality || 'Lurambi';
      const ward = addr.village || addr.neighbourhood || addr.suburb || 'Shirere Ward';
      return { ward, subCounty, county };
    }
  } catch (err) {
    console.warn('Geocoding fallback activated', err);
  }
  return { ward: 'Shirere Ward', subCounty: 'Lurambi', county: 'Kakamega' };
}
