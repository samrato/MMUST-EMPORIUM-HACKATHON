import type { Language } from "./languageService";
import {
  runHealthcareDecisionEngine,
  type EngineUrgency,
  type HealthcareDecisionJson,
  type NearbyHospitalInput,
} from "./healthDecisionEngine";

import {
  buildEmergencyVoiceScript,
  buildFallbackEmergencyRoute,
  getEmergencyRouteInstructions,
} from "./directionsService";

import { getNearbyHospitals } from "./placesService";

// Vertex AI Configuration (Direct Frontend Call)
const API_KEY = import.meta.env.VITE_VERTEX_API_KEY || "";
const PROJECT_ID = import.meta.env.VITE_GOOGLE_CLOUD_PROJECT || "gen-lang-client-0852400804";
const LOCATION = import.meta.env.VITE_GOOGLE_CLOUD_LOCATION || "us-central1";
const MODEL_ID = "gemini-2.5-flash-lite"; // Restored original model ID

interface VoiceDirectionDestination {
  name: string;
  address: string;
  location: { lat: number; lng: number };
  distance?: number;
  type?: string;
  types?: string[];
}

export interface SymptomAnalysisResult {
  condition: string;
  confidence: number;
  urgency: EngineUrgency;
  description: string;
  recommendations: string[];
  suggestedFacilityType: "hospital" | "health_center" | "dispensary" | "clinic";
  matchedSymptoms: string[];
  possibleConditions: string[];
  recommendedFacility: {
    name: string;
    type: string;
    distance_km: number;
  };
  guidance: string[];
  explanation: string;
  structuredResult: HealthcareDecisionJson;
}

function toEngineLanguage(language?: unknown): "en" | "sw" {
  return language === "sw" ? "sw" : "en";
}

function getSymptomOutputLanguage(language?: Language) {
  switch (language) {
    case "sw":
      return { code: "sw", label: "Kiswahili" };
    case "lu":
      return { code: "lu", label: "Dholuo (Luo)" };
    case "kl":
      return { code: "kl", label: "Kalenjin" };
    case "lh":
      return { code: "lh", label: "Luhya" };
    default:
      return { code: "en", label: "English" };
  }
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function toUrgency(value: unknown): EngineUrgency {
  const v = String(value || "").toLowerCase().trim();
  if (v === "emergency" || v === "critical") return "emergency";
  if (v === "high" || v === "urgent") return "high";
  if (v === "medium" || v === "moderate" || v === "high/moderate") return "medium";
  if (v === "low" || v === "non-emergency" || v === "low/moderate" || v === "normal") return "low";
  return "low";
}

export async function getVoiceDirections(
  userLoc: { lat: number; lng: number },
  destination: VoiceDirectionDestination,
  lang: string
) {
  const language = toEngineLanguage(lang);
  try {
    const route = await getEmergencyRouteInstructions(userLoc, destination.location, language);
    return buildEmergencyVoiceScript(destination.name, route, language);
  } catch {
    const fallbackRoute = buildFallbackEmergencyRoute(userLoc, destination.location, destination.name, language);
    return buildEmergencyVoiceScript(destination.name, fallbackRoute, language);
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 1200): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Direct call to Google Gemini / Vertex AI REST API from Frontend
 */
async function callDirectAi(prompt: string): Promise<string> {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
        })
      }, 1200);

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch {
      // Gracefully continue
    }
  }

  if (API_KEY && PROJECT_ID) {
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:streamGenerateContent?key=${API_KEY}`;
    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
    };

    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, 1200);

      if (response.ok) {
        const data = await response.json();
        if (!Array.isArray(data)) {
          return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }
        return data
          .map((chunk: any) => chunk.candidates?.[0]?.content?.parts?.[0]?.text || "")
          .join("");
      }
    } catch {
      // Quiet fallback
    }
  }
  return "";
}

export async function analyzeSymptomsWithAI(
  symptoms: string,
  options?: { language?: Language; userLoc?: { lat: number; lng: number } }
): Promise<SymptomAnalysisResult> {
  const outputLanguage = getSymptomOutputLanguage(options?.language);
  const userCoords = options?.userLoc || { lat: 0.2882, lng: 34.7656 };
  
  let nearbyHospitals: NearbyHospitalInput[] = [];
  try {
    const realHospitals = await getNearbyHospitals(userCoords.lat, userCoords.lng, true);
    if (realHospitals && realHospitals.length > 0) {
      nearbyHospitals = realHospitals.map((h) => ({
        name: h.name,
        distance_km: h.distance || 0.6,
        type: h.types[0] || 'hospital',
        types: h.types,
      }));
    }
  } catch (e) {
    console.error("Failed to fetch real hospitals for AI analysis:", e);
  }

  // Baseline deterministic decision engine with KMHFR facilities (instantaneous <2ms)
  const engineResult = runHealthcareDecisionEngine({
    user_input: symptoms,
    nearby_hospitals: nearbyHospitals,
    preferred_language: options?.language === 'sw' ? 'sw' : 'en',
  });

  const isMatched = engineResult.matched_symptoms.length > 0;
  const primaryCondition = isMatched
    ? (engineResult.possible_conditions[0] || "General Medical Assessment")
    : "No close dataset match";
  const baseConfidence = isMatched ? 0.95 : 0.45;

  // Fast-path: Try calling central backend API /api/triage with a tight 300ms race budget
  try {
    const rawBackend = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) || '';
    let cleanApi = '';
    if (rawBackend.startsWith('http')) {
      cleanApi = rawBackend.endsWith('/api') ? rawBackend : `${rawBackend}/api`;
    } else if (typeof window !== 'undefined' && window.location?.origin) {
      cleanApi = `${window.location.origin}/api`;
    }

    if (cleanApi) {
      const res = await fetchWithTimeout(`${cleanApi}/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms,
          county: 'Kakamega',
          language: options?.language === 'sw' ? 'sw' : 'en',
        }),
      }, 350);

      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.data) {
          const d = payload.data;
          const urgency = toUrgency(d.urgency || d.risk || engineResult.urgency);
          const condition = isMatched
            ? primaryCondition
            : (d.symptom_summary && d.symptom_summary !== symptoms ? d.symptom_summary : primaryCondition);

          return {
            condition,
            confidence: baseConfidence,
            urgency,
            description: d.advice || d.disclaimer || engineResult.explanation,
            recommendations: d.required_services || engineResult.guidance,
            suggestedFacilityType: (d.recommended_keph_level ? 'hospital' : engineResult.recommended_facility.type) as any,
            matchedSymptoms: engineResult.matched_symptoms,
            possibleConditions: engineResult.possible_conditions,
            recommendedFacility: engineResult.recommended_facility,
            guidance: d.required_services ? [...new Set([...d.required_services, ...engineResult.guidance])] : engineResult.guidance,
            explanation: d.advice || engineResult.explanation,
            structuredResult: engineResult,
          };
        }
      }
    }
  } catch {
    // Immediate fallback to Decision Engine
  }

  // 2. Direct AI endpoint if available
  try {
    const prompt = `
      You are a medical symptom triage assistant for an educational health support application in Kenya.
      Analyze user-reported symptoms and return structured health guidance.
      User input: "${symptoms}"
      Response language: ${outputLanguage.label}

      Return ONLY valid JSON in this format:
      {
        "condition": "Likely condition name",
        "urgency": "low | medium | high | emergency",
        "description": "Brief description of why you chose this",
        "recommendations": ["step 1", "step 2"],
        "warnings": ["warning 1"]
      }
    `;
    const text = await callDirectAi(prompt);
    if (text) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiResult = JSON.parse(jsonMatch[0]);
        const urgency = toUrgency(aiResult.urgency || engineResult.urgency);
        return {
          condition: isMatched ? primaryCondition : (aiResult.condition || primaryCondition),
          confidence: baseConfidence,
          urgency,
          description: aiResult.description || engineResult.explanation,
          recommendations: toStringArray(aiResult.recommendations),
          suggestedFacilityType: engineResult.recommended_facility.type as any,
          matchedSymptoms: engineResult.matched_symptoms,
          possibleConditions: engineResult.possible_conditions,
          recommendedFacility: engineResult.recommended_facility,
          guidance: [...new Set([...engineResult.guidance, ...toStringArray(aiResult.recommendations)])],
          explanation: engineResult.explanation,
          structuredResult: engineResult,
        };
      }
    }
  } catch {
    // Quiet fallback to deterministic decision engine
  }

  // 3. Fallback to Decision Engine result - ALWAYS returns an immediate valid result!
  return {
    condition: primaryCondition,
    confidence: baseConfidence,
    urgency: engineResult.urgency,
    description: engineResult.explanation,
    recommendations: engineResult.guidance,
    suggestedFacilityType: engineResult.recommended_facility.type as any,
    matchedSymptoms: engineResult.matched_symptoms,
    possibleConditions: engineResult.possible_conditions,
    recommendedFacility: engineResult.recommended_facility,
    guidance: engineResult.guidance,
    explanation: engineResult.explanation,
    structuredResult: engineResult,
  };
}

export async function getGeminiResponse(prompt: string, context: any = {}, patientId: string = "WEB-USER") {
  const rawBackend = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) || '';
  let url = '';
  if (rawBackend.startsWith('http')) {
    const cleanApi = rawBackend.endsWith('/api') ? rawBackend : `${rawBackend}/api`;
    url = `${cleanApi}/conversations/message`;
  } else if (typeof window !== 'undefined' && window.location?.origin) {
    url = `${window.location.origin}/api/conversations/message`;
  }

  if (url) {
    try {
      const lat = context.user_location?.lat || null;
      const lng = context.user_location?.lng || null;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: prompt,
          webUserId: patientId,
          channel: 'WEB',
          userLat: lat,
          userLng: lng,
        }),
      }, 1200);

      if (response.ok) {
        const payload = await response.json();
        if (payload.success && payload.data?.message?.message) {
          return payload.data.message.message;
        }
      }
    } catch {
      // Continue to client-side fallback
    }
  }

  // Client-side fallback to direct Gemini AI
  try {
    const text = await callDirectAi(`Context: Medical Assistant. Location Context: ${JSON.stringify(context)}. Question: ${prompt}`);
    if (text) return text;
  } catch {
    // Continue to deterministic engine
  }

  // Deterministic Kenyan Healthcare Engine fallback
  const lang = context?.language === 'sw' ? 'sw' : 'en';
  const engineRes = runHealthcareDecisionEngine({ user_input: prompt, preferred_language: lang });
  if (engineRes.matched_symptoms.length === 0) {
    return "No close dataset match was found for the symptoms entered. Please describe symptoms more clearly, including body part, duration, and severity.";
  }
  const humanGuidance = convertAnalysisToHumanGuidance(engineRes, lang);
  return `${humanGuidance.message}\n\n${humanGuidance.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
}
