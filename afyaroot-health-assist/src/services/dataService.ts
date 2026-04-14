import { supabase } from "@/lib/supabase";
import type { HealthcareDecisionJson } from "@/services/healthDecisionEngine";
import { buildFallbackEmergencyRoute, type Coordinates } from "@/services/directionsService";
import { facilities, getRecommendedFacility } from "@/services/facilityData";

export interface AppointmentRecord {
  id: string;
  patient_id: string;
  full_name: string;
  phone: string;
  age: number;
  gender: string | null;
  location: string | null;
  symptoms: string | null;
  medical_history: string | null;
  emergency_contact: string | null;
  appointment_date: string;
  appointment_time: string;
  urgency: "emergency" | "high" | "normal";
  facility_name: string | null;
  facility_id: string | null;
}

export type InteractionMessageType =
  | "chat"
  | "symptom_analysis"
  | "navigation"
  | "emergency_alert"
  | "facility_lookup"
  | "booking_request"
  | "appointment_lookup"
  | "decision_engine";

export interface CreateAppointmentInput {
  patientId: string;
  fullName: string;
  phone: string;
  age: number;
  gender?: string;
  location?: string;
  symptoms?: string;
  medicalHistory?: string;
  emergencyContact?: string;
  appointmentDate: string;
  appointmentTime: string;
  urgency?: "emergency" | "high" | "normal";
  facilityName?: string;
  facilityId?: string;
}

export interface AIInteractionInput {
  patientId?: string;
  messageType: InteractionMessageType;
  language: string;
  inputText: string;
  responseText: string;
  durationMs: number;
}

export interface AnonymousUserActivitySummary {
  patientId: string;
  requestCount: number;
  emergencyCount: number;
  bookingCount: number;
  lastActivityAt: string;
}

export interface AnonymousRequestLog {
  patientId: string;
  messageType: string;
  inputText: string;
  responseText: string;
  durationMs: number;
  createdAt: string;
}

export type EmergencyAlertSource = "emergency_alert" | "emergency_booking";

export interface EmergencyAdminAlert {
  id: string;
  patientId: string;
  source: EmergencyAlertSource;
  sourceLabel: string;
  triggeredAt: string;
  locationLabel: string;
  coordinates: Coordinates | null;
  destinationName: string | null;
  routeSummary: string | null;
  aiGuidance: string[];
}

export interface StoredDecisionCase {
  id: string;
  patientId: string;
  language: string;
  inputText: string;
  result: HealthcareDecisionJson;
  createdAt: string;
}

interface InteractionSummaryRow {
  patient_id: string | null;
  message_type: string;
  created_at: string;
  input_text?: string;
  response_text?: string;
  duration_ms?: number;
}

interface AppointmentSummaryRow {
  patient_id: string | null;
  urgency: string | null;
  created_at: string | null;
}

interface EmergencyInteractionRow {
  id?: string;
  patient_id: string | null;
  input_text?: string | null;
  response_text?: string | null;
  created_at: string;
}

interface EmergencyAppointmentRow {
  id?: string;
  patient_id: string | null;
  urgency?: string | null;
  location?: string | null;
  facility_name?: string | null;
  created_at: string | null;
}

interface AppointmentContextRow {
  patient_id: string | null;
  location?: string | null;
  facility_name?: string | null;
  created_at: string | null;
}

interface NavigationContextRow {
  patient_id: string | null;
  input_text?: string | null;
  response_text?: string | null;
  created_at: string;
}

const AI_LOGGING_ENABLED = import.meta.env.VITE_ENABLE_AI_LOGGING !== "false";
const LOCAL_DECISION_CASES_KEY = "afyaroot-decision-cases";
const UNKNOWN_LOCATION_LABEL = "Location not yet shared.";
const EMERGENCY_ROUTE_PREFIX = "Emergency route request to ";
const DEFAULT_EMERGENCY_DESTINATION = getRecommendedFacility("emergency").name;

export function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function normalizePatientId(patientId: string) {
  return normalizeText(patientId).toUpperCase();
}

export function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").trim();
}

export async function createAppointment(input: CreateAppointmentInput) {
  const { error } = await supabase.from("appointments").insert([
    {
      patient_id: normalizePatientId(input.patientId),
      full_name: normalizeText(input.fullName),
      phone: normalizePhone(input.phone),
      age: input.age,
      gender: input.gender ? normalizeText(input.gender) : null,
      location: input.location ? normalizeText(input.location) : null,
      symptoms: input.symptoms ? normalizeText(input.symptoms) : null,
      medical_history: input.medicalHistory ? normalizeText(input.medicalHistory) : null,
      emergency_contact: input.emergencyContact ? normalizeText(input.emergencyContact) : null,
      appointment_date: input.appointmentDate,
      appointment_time: input.appointmentTime,
      urgency: input.urgency ?? "normal",
      facility_name: input.facilityName ? normalizeText(input.facilityName) : null,
      facility_id: input.facilityId ?? null,
    },
]);

  if (error) throw error;
}

export async function getAppointmentsByPatientId(patientId: string, limit = 100) {
  const normalizedPatientId = normalizePatientId(patientId);
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", normalizedPatientId)
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as AppointmentRecord[];
}

export async function logAiInteraction(input: AIInteractionInput) {
  if (!AI_LOGGING_ENABLED) return;

  const { error } = await supabase.from("ai_interactions").insert([
    {
      patient_id: input.patientId ? normalizePatientId(input.patientId) : null,
      message_type: input.messageType,
      language: input.language,
      input_text: normalizeText(input.inputText).slice(0, 6000),
      response_text: normalizeText(input.responseText).slice(0, 6000),
      duration_ms: input.durationMs,
      input_chars: input.inputText.length,
      response_chars: input.responseText.length,
    },
  ]);

  if (error) throw error;
}

function parseTimestamp(value: string | null | undefined) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeNullableText(value: string | null | undefined) {
  if (!value) return null;
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
}

export function parseCoordinatesFromText(value: string | null | undefined): Coordinates | null {
  if (!value) return null;
  const match = value.match(/(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (!match) return null;

  const lat = Number.parseFloat(match[1]);
  const lng = Number.parseFloat(match[2]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return {
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4)),
  };
}

function formatCoordinates(coordinates: Coordinates) {
  return `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
}

function normalizeFacilityName(value: string) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findFacilityByName(name: string | null) {
  if (!name) return null;
  const normalizedTarget = normalizeFacilityName(name);
  if (!normalizedTarget) return null;

  return (
    facilities.find((facility) => {
      const normalizedFacility = normalizeFacilityName(facility.name);
      return (
        normalizedFacility === normalizedTarget ||
        normalizedFacility.includes(normalizedTarget) ||
        normalizedTarget.includes(normalizedFacility)
      );
    }) ?? null
  );
}

function extractDestinationFromNavigation(inputText: string | null | undefined) {
  if (!inputText) return null;
  const index = inputText.toLowerCase().indexOf(EMERGENCY_ROUTE_PREFIX.toLowerCase());
  if (index < 0) return null;
  return normalizeNullableText(inputText.slice(index + EMERGENCY_ROUTE_PREFIX.length));
}

function resolveFallbackRouteSummary(coordinates: Coordinates | null, destinationName: string | null) {
  if (!coordinates || !destinationName) return null;
  const facility = findFacilityByName(destinationName);
  if (!facility) return null;

  const fallbackRoute = buildFallbackEmergencyRoute(coordinates, facility.location, facility.name, "en");
  return `${fallbackRoute.totalDistance}, ${fallbackRoute.totalDuration}, first step: ${
    fallbackRoute.steps[0]?.instruction || "Proceed on the clearest main road."
  }`;
}

function clipText(value: string, maxLength = 180) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function buildEmergencyGuidance(alert: {
  source: EmergencyAlertSource;
  locationLabel: string;
  coordinates: Coordinates | null;
  destinationName: string | null;
  routeSummary: string | null;
}) {
  const guidance: string[] = [];

  guidance.push(
    alert.source === "emergency_alert"
      ? "Start a priority callback now and keep the caller connected while dispatch decisions are made."
      : "Treat this emergency booking as a live escalation and assign a responder for immediate follow-up."
  );

  if (alert.coordinates) {
    guidance.push(
      `Dispatch teams using pin ${formatCoordinates(alert.coordinates)} and verify nearby landmarks with the patient.`
    );
  } else if (alert.locationLabel !== UNKNOWN_LOCATION_LABEL) {
    guidance.push(
      `Confirm the patient's exact position around "${alert.locationLabel}" and request a fresh GPS pin if movement starts.`
    );
  } else {
    guidance.push("Patient location is missing. Request nearest road, landmark, or village immediately.");
  }

  if (alert.destinationName && alert.routeSummary) {
    guidance.push(`Guide transfer toward ${alert.destinationName}. Route context: ${clipText(alert.routeSummary)}.`);
  } else if (alert.destinationName) {
    guidance.push(`Coordinate transport toward ${alert.destinationName} via the safest major route.`);
  } else if (alert.routeSummary) {
    guidance.push(`Use latest navigation context while guiding responders: ${clipText(alert.routeSummary)}.`);
  } else {
    guidance.push("No route context is available yet. Keep the patient on major roads and escalate via 999 if status worsens.");
  }

  guidance.push("Mark as reviewed only after contact is confirmed and an escalation owner is assigned.");
  return guidance;
}

function buildLatestAppointmentContext(appointments: AppointmentContextRow[]) {
  const latestLocationByPatient = new Map<string, string>();
  const latestFacilityByPatient = new Map<string, string>();

  appointments.forEach((row) => {
    if (!row.patient_id) return;
    const patientId = normalizePatientId(row.patient_id);
    const location = normalizeNullableText(row.location);
    const facilityName = normalizeNullableText(row.facility_name);

    if (location && !latestLocationByPatient.has(patientId)) {
      latestLocationByPatient.set(patientId, location);
    }
    if (facilityName && !latestFacilityByPatient.has(patientId)) {
      latestFacilityByPatient.set(patientId, facilityName);
    }
  });

  return { latestLocationByPatient, latestFacilityByPatient };
}

function buildLatestNavigationContext(navigationRows: NavigationContextRow[]) {
  const latestNavigationByPatient = new Map<string, NavigationContextRow>();

  navigationRows.forEach((row) => {
    if (!row.patient_id) return;
    const patientId = normalizePatientId(row.patient_id);
    if (!latestNavigationByPatient.has(patientId)) {
      latestNavigationByPatient.set(patientId, row);
    }
  });

  return latestNavigationByPatient;
}

export function buildEmergencyAdminAlerts(
  emergencyInteractions: EmergencyInteractionRow[],
  emergencyAppointments: EmergencyAppointmentRow[],
  appointmentContext: AppointmentContextRow[],
  navigationContext: NavigationContextRow[]
) {
  const { latestLocationByPatient, latestFacilityByPatient } = buildLatestAppointmentContext(appointmentContext);
  const latestNavigationByPatient = buildLatestNavigationContext(navigationContext);

  const interactionAlerts = emergencyInteractions
    .map((row) => {
      if (!row.patient_id || !row.created_at) return null;
      const patientId = normalizePatientId(row.patient_id);
      const latestLocation = latestLocationByPatient.get(patientId) ?? null;
      const latestFacility = latestFacilityByPatient.get(patientId) ?? null;
      const navigation = latestNavigationByPatient.get(patientId);

      const coordinates =
        parseCoordinatesFromText(row.input_text) ??
        parseCoordinatesFromText(row.response_text) ??
        parseCoordinatesFromText(latestLocation) ??
        null;

      const locationLabel =
        (coordinates && formatCoordinates(coordinates)) ||
        latestLocation ||
        UNKNOWN_LOCATION_LABEL;

      const destinationName =
        extractDestinationFromNavigation(navigation?.input_text) ??
        latestFacility ??
        DEFAULT_EMERGENCY_DESTINATION;

      const routeSummary =
        normalizeNullableText(navigation?.response_text) ??
        resolveFallbackRouteSummary(coordinates, destinationName);

      const alert: EmergencyAdminAlert = {
        id: row.id ? `interaction-${row.id}` : `interaction-${patientId}-${row.created_at}`,
        patientId,
        source: "emergency_alert",
        sourceLabel: "Emergency button alert",
        triggeredAt: row.created_at,
        locationLabel,
        coordinates,
        destinationName,
        routeSummary,
        aiGuidance: [],
      };
      alert.aiGuidance = buildEmergencyGuidance(alert);
      return alert;
    })
    .filter((row): row is EmergencyAdminAlert => Boolean(row));

  const appointmentAlerts = emergencyAppointments
    .map((row) => {
      if (!row.patient_id || !row.created_at) return null;
      const patientId = normalizePatientId(row.patient_id);
      const latestLocation = latestLocationByPatient.get(patientId) ?? null;
      const latestFacility = latestFacilityByPatient.get(patientId) ?? null;
      const navigation = latestNavigationByPatient.get(patientId);
      const explicitLocation = normalizeNullableText(row.location);

      const coordinates =
        parseCoordinatesFromText(explicitLocation) ??
        parseCoordinatesFromText(latestLocation) ??
        null;

      const locationLabel =
        (coordinates && formatCoordinates(coordinates)) ||
        explicitLocation ||
        latestLocation ||
        UNKNOWN_LOCATION_LABEL;

      const destinationName =
        normalizeNullableText(row.facility_name) ??
        extractDestinationFromNavigation(navigation?.input_text) ??
        latestFacility ??
        DEFAULT_EMERGENCY_DESTINATION;

      const routeSummary =
        normalizeNullableText(navigation?.response_text) ??
        resolveFallbackRouteSummary(coordinates, destinationName);

      const alert: EmergencyAdminAlert = {
        id: row.id ? `appointment-${row.id}` : `appointment-${patientId}-${row.created_at}`,
        patientId,
        source: "emergency_booking",
        sourceLabel: "Emergency booking",
        triggeredAt: row.created_at,
        locationLabel,
        coordinates,
        destinationName,
        routeSummary,
        aiGuidance: [],
      };
      alert.aiGuidance = buildEmergencyGuidance(alert);
      return alert;
    })
    .filter((row): row is EmergencyAdminAlert => Boolean(row));

  const unique = new Map<string, EmergencyAdminAlert>();
  [...interactionAlerts, ...appointmentAlerts].forEach((alert) => {
    const key = `${alert.source}:${alert.patientId}:${alert.triggeredAt}`;
    if (!unique.has(key)) {
      unique.set(key, alert);
    }
  });

  return Array.from(unique.values()).sort(
    (a, b) => parseTimestamp(b.triggeredAt) - parseTimestamp(a.triggeredAt)
  );
}

export function buildAnonymousUserActivity(
  interactions: InteractionSummaryRow[],
  appointments: AppointmentSummaryRow[]
) {
  const userMap = new Map<string, AnonymousUserActivitySummary>();

  const ensureUser = (patientId: string) => {
    const normalized = normalizePatientId(patientId);
    const existing = userMap.get(normalized);
    if (existing) return existing;

    const created: AnonymousUserActivitySummary = {
      patientId: normalized,
      requestCount: 0,
      emergencyCount: 0,
      bookingCount: 0,
      lastActivityAt: new Date(0).toISOString(),
    };
    userMap.set(normalized, created);
    return created;
  };

  interactions.forEach((row) => {
    if (!row.patient_id) return;
    const user = ensureUser(row.patient_id);
    user.requestCount += 1;
    if (row.message_type === "emergency_alert") {
      user.emergencyCount += 1;
    }

    if (parseTimestamp(row.created_at) > parseTimestamp(user.lastActivityAt)) {
      user.lastActivityAt = row.created_at;
    }
  });

  appointments.forEach((row) => {
    if (!row.patient_id) return;
    const user = ensureUser(row.patient_id);
    user.bookingCount += 1;
    if (row.urgency === "emergency") {
      user.emergencyCount += 1;
    }

    if (parseTimestamp(row.created_at) > parseTimestamp(user.lastActivityAt)) {
      user.lastActivityAt = row.created_at ?? user.lastActivityAt;
    }
  });

  return Array.from(userMap.values()).sort(
    (a, b) => parseTimestamp(b.lastActivityAt) - parseTimestamp(a.lastActivityAt)
  );
}

export async function getAnonymousUserActivity(limit = 50) {
  const rowLimit = Math.max(limit, 200);
  const [{ data: interactions, error: interactionsError }, { data: appointments, error: appointmentsError }] =
    await Promise.all([
      supabase
        .from("ai_interactions")
        .select("patient_id,message_type,created_at")
        .order("created_at", { ascending: false })
        .limit(rowLimit),
      supabase
        .from("appointments")
        .select("patient_id,urgency,created_at")
        .order("created_at", { ascending: false })
        .limit(rowLimit),
    ]);

  if (interactionsError) {
    throw new Error(`Failed to load anonymous request logs: ${interactionsError.message}`);
  }
  if (appointmentsError) {
    throw new Error(`Failed to load anonymous appointment logs: ${appointmentsError.message}`);
  }

  return buildAnonymousUserActivity(
    (interactions ?? []) as InteractionSummaryRow[],
    (appointments ?? []) as AppointmentSummaryRow[]
  ).slice(0, limit);
}

export async function getEmergencyAlertsForAdmin(limit = 30) {
  const rowLimit = Math.max(limit, 120);
  const [
    { data: emergencyInteractions, error: emergencyInteractionsError },
    { data: emergencyAppointments, error: emergencyAppointmentsError },
    { data: appointmentContext, error: appointmentContextError },
    { data: navigationContext, error: navigationContextError },
  ] = await Promise.all([
    supabase
      .from("ai_interactions")
      .select("id,patient_id,input_text,response_text,created_at")
      .eq("message_type", "emergency_alert")
      .order("created_at", { ascending: false })
      .limit(rowLimit),
    supabase
      .from("appointments")
      .select("id,patient_id,urgency,location,facility_name,created_at")
      .eq("urgency", "emergency")
      .order("created_at", { ascending: false })
      .limit(rowLimit),
    supabase
      .from("appointments")
      .select("patient_id,location,facility_name,created_at")
      .order("created_at", { ascending: false })
      .limit(rowLimit * 3),
    supabase
      .from("ai_interactions")
      .select("patient_id,input_text,response_text,created_at")
      .eq("message_type", "navigation")
      .order("created_at", { ascending: false })
      .limit(rowLimit * 3),
  ]);

  if (emergencyInteractionsError) {
    throw new Error(`Failed to load emergency interaction alerts: ${emergencyInteractionsError.message}`);
  }
  if (emergencyAppointmentsError) {
    throw new Error(`Failed to load emergency appointment alerts: ${emergencyAppointmentsError.message}`);
  }
  if (appointmentContextError) {
    throw new Error(`Failed to load appointment context for emergency alerts: ${appointmentContextError.message}`);
  }
  if (navigationContextError) {
    throw new Error(`Failed to load navigation context for emergency alerts: ${navigationContextError.message}`);
  }

  return buildEmergencyAdminAlerts(
    (emergencyInteractions ?? []) as EmergencyInteractionRow[],
    (emergencyAppointments ?? []) as EmergencyAppointmentRow[],
    (appointmentContext ?? []) as AppointmentContextRow[],
    (navigationContext ?? []) as NavigationContextRow[]
  ).slice(0, Math.max(1, limit));
}

export async function getRecentAnonymousRequests(limit = 40) {
  const { data, error } = await supabase
    .from("ai_interactions")
    .select("patient_id,message_type,input_text,response_text,duration_ms,created_at")
    .order("created_at", { ascending: false })
    .limit(Math.max(1, limit));

  if (error) {
    throw new Error(`Failed to load recent request logs: ${error.message}`);
  }

  return ((data ?? []) as InteractionSummaryRow[])
    .filter((row) => Boolean(row.patient_id))
    .map((row) => ({
      patientId: normalizePatientId(row.patient_id || "UNKNOWN"),
      messageType: row.message_type,
      inputText: row.input_text || "",
      responseText: row.response_text || "",
      durationMs: row.duration_ms || 0,
      createdAt: row.created_at,
    })) satisfies AnonymousRequestLog[];
}

function ensureLocalStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("Local storage is unavailable in this environment.");
  }
  return window.localStorage;
}

export function getStoredDecisionCases(limit = 100) {
  const storage = ensureLocalStorage();
  const raw = storage.getItem(LOCAL_DECISION_CASES_KEY);
  if (!raw) return [] as StoredDecisionCase[];

  const parsed = JSON.parse(raw) as StoredDecisionCase[];
  return parsed.slice(0, Math.max(1, limit));
}

export function storeDecisionCaseLocally(caseData: Omit<StoredDecisionCase, "id" | "createdAt">, maxEntries = 200) {
  const storage = ensureLocalStorage();
  const current = getStoredDecisionCases(maxEntries);
  const payload: StoredDecisionCase = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...caseData,
  };

  const updated = [payload, ...current].slice(0, Math.max(1, maxEntries));
  storage.setItem(LOCAL_DECISION_CASES_KEY, JSON.stringify(updated));
  return payload;
}

export async function persistDecisionCase(caseData: Omit<StoredDecisionCase, "id" | "createdAt">) {
  const stored = storeDecisionCaseLocally(caseData);
  await logAiInteraction({
    patientId: caseData.patientId,
    messageType: "decision_engine",
    language: caseData.language,
    inputText: caseData.inputText,
    responseText: JSON.stringify(caseData.result),
    durationMs: 0,
  });
  return stored;
}
