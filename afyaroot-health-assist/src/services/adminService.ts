import { supabase } from '@/lib/supabase';

export interface FacilityProfile {
  id: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  operating_hours: string;
  phone: string;
  email: string;
  services: string[];
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  totalBookingsToday: number;
  emergencyBookingsToday: number;
  totalAppointments: number;
  averageWaitTime: number;
  facilityCapacityUsage: number;
}

export interface AdminEmergencyAlert {
  id: string;
  patientId: string;
  facilityId: string;
  symptoms: string;
  urgency: string;
  location: string;
  status: 'pending' | 'assigned' | 'resolved';
  assignedAmbulance?: string;
  createdAt: string;
  resolvedAt?: string;
}

interface AppointmentRecord {
  appointment_time?: string | null;
}

function normalizeFacilityName(value: string | null | undefined) {
  return (value ?? "").trim();
}

function buildFacilityMatchFilter(facilityId: string, facilityName?: string | null) {
  const normalizedName = normalizeFacilityName(facilityName);
  if (!normalizedName) return `facility_id.eq.${facilityId}`;
  // Match either the internal facility id (admin login id) OR the stored facility name.
  return `facility_id.eq.${facilityId},facility_name.ilike.%${normalizedName}%`;
}

// Get facility stats for admin dashboard
export async function getFacilityStats(facilityId: string, facilityName?: string | null): Promise<AdminStats> {
  const today = new Date().toISOString().split('T')[0];
  const facilityFilter = buildFacilityMatchFilter(facilityId, facilityName);

  const [bookingsResult, emergencyResult, allAppointments] = await Promise.all([
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .or(facilityFilter)
      .eq('appointment_date', today),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .or(facilityFilter)
      .eq('appointment_date', today)
      .eq('urgency', 'emergency'),
    supabase
      .from('appointments')
      .select('*')
      .or(facilityFilter)
      .eq('appointment_date', today),
  ]);

  const totalBookingsToday = bookingsResult.count || 0;
  const emergencyBookingsToday = emergencyResult.count || 0;

  // Calculate average wait time (rough estimate)
  let averageWaitTime = 0;
  if (allAppointments.data && allAppointments.data.length > 0) {
    const waitTimes = (allAppointments.data as AppointmentRecord[]).map((apt) => {
      const [hours, minutes] = (apt.appointment_time || '00:00').split(':').map(Number);
      return hours * 60 + minutes;
    });
    averageWaitTime = Math.round(
      waitTimes.reduce((a: number, b: number) => a + b, 0) / waitTimes.length
    );
  }

  return {
    totalBookingsToday,
    emergencyBookingsToday,
    totalAppointments: totalBookingsToday,
    averageWaitTime,
    facilityCapacityUsage: Math.min(100, Math.round((totalBookingsToday / 50) * 100)), // Assume 50 capacity
  };
}

// Get all bookings for a facility
export async function getFacilityBookings(
  facilityId: string,
  facilityName?: string | null,
  limit = 100
) {
  const facilityFilter = buildFacilityMatchFilter(facilityId, facilityName);
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .or(facilityFilter)
    .order('appointment_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getRecentBookings(limit = 100) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.max(1, limit));

  if (error) throw error;
  return data || [];
}

// Get emergency alerts for admin
export async function getEmergencyAlerts(
  facilityId: string,
  limit = 50
): Promise<AdminEmergencyAlert[]> {
  const { data, error } = await supabase
    .from('ai_interactions')
    .select('*')
    .eq('message_type', 'emergency_alert')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((item: { id: string; patient_id: string; input_text: string; created_at: string }) => ({
    id: item.id,
    patientId: item.patient_id,
    facilityId,
    symptoms: item.input_text,
    urgency: 'emergency',
    location: 'Location pending',
    status: 'pending',
    createdAt: item.created_at,
  }));
}

// Get facility profile
export async function getFacilityProfile(facilityId: string): Promise<FacilityProfile | null> {
  const { data, error } = await supabase
    .from('facilities')
    .select('*')
    .eq('id', facilityId)
    .single();

  if (error) {
    // Table might not exist, return mock data
    return {
      id: facilityId,
      name: 'Health Center',
      location: 'Rural Area',
      latitude: null,
      longitude: null,
      capacity: 50,
      operating_hours: '08:00-17:00',
      phone: '+254...',
      email: 'health@center.org',
      services: ['emergency', 'maternity', 'general'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return data;
}

// Update facility profile
export async function updateFacilityProfile(
  facilityId: string,
  updates: Partial<FacilityProfile>
) {
  const { error } = await supabase
    .from('facilities')
    .update(updates)
    .eq('id', facilityId);

  if (error) throw error;
}

// Log admin action
export async function logAdminAction(
  facilityId: string,
  action: string,
  resourceType: string,
  details: Record<string, unknown>
) {
  const { error } = await supabase
    .from('admin_activity_log')
    .insert({
      facility_id: facilityId,
      action,
      resource_type: resourceType,
      details,
      created_at: new Date().toISOString(),
    });

  if (error) console.error('Failed to log admin action:', error);
}
