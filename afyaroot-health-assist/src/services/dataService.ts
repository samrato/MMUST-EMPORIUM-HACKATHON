import { supabase } from "@/lib/supabase";
import type { HealthcareDecisionJson } from "@/services/healthDecisionEngine";

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

const AI_LOGGING_ENABLED = import.meta.env.VITE_ENABLE_AI_LOGGING !== "false";
const LOCAL_DECISION_CASES_KEY = "afyaroot-decision-cases";

export function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").trim();
}

export async function createAppointment(input: CreateAppointmentInput) {
  const { error } = await supabase.from("appointments").insert([
    {
      patient_id: normalizeText(input.patientId),
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
  const normalizedPatientId = normalizeText(patientId);
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
      patient_id: input.patientId ? normalizeText(input.patientId) : null,
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

export function buildAnonymousUserActivity(
  interactions: InteractionSummaryRow[],
  appointments: AppointmentSummaryRow[]
) {
  const userMap = new Map<string, AnonymousUserActivitySummary>();

  const ensureUser = (patientId: string) => {
    const normalized = normalizeText(patientId);
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
      patientId: normalizeText(row.patient_id || "UNKNOWN"),
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
