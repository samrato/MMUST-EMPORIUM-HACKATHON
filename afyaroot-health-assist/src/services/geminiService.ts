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
  const v = String(value).toLowerCase();
  if (v === "low" || v === "medium" || v === "high" || v === "emergency") {
    return v as EngineUrgency;
  }
  return "medium";
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

/**
 * Direct call to Vertex AI REST API from Frontend (Streaming)
 */
async function callVertexDirectly(prompt: string) {
  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:streamGenerateContent?key=${API_KEY}`;
  
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Vertex API Error:", errorText);
      throw new Error(`Vertex AI call failed: ${response.statusText}`);
    }

    const data = await response.json();
    // Vertex returns an array of objects for streamGenerateContent
    if (!Array.isArray(data)) {
        // Fallback for single object response
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
    
    return data
      .map((chunk: any) => chunk.candidates?.[0]?.content?.parts?.[0]?.text || "")
      .join("");
  } catch (error) {
    console.error("Vertex API Request Failed:", error);
    throw error;
  }
}

export async function analyzeSymptomsWithAI(
  symptoms: string,
  options?: { language?: Language; userLoc?: { lat: number; lng: number } }
): Promise<SymptomAnalysisResult> {
  const outputLanguage = getSymptomOutputLanguage(options?.language);
  
  let nearbyHospitals: NearbyHospitalInput[] = [];
  if (options?.userLoc) {
    try {
      const realHospitals = await getNearbyHospitals(options.userLoc.lat, options.userLoc.lng);
      nearbyHospitals = realHospitals.map(h => ({
        name: h.name,
        distance_km: h.distance || 0,
        type: h.types[0] || 'hospital',
        types: h.types
      }));
    } catch (e) {
      console.error("Failed to fetch real hospitals for AI analysis:", e);
    }
  }

  // Baseline deterministic decision engine
  const engineResult = runHealthcareDecisionEngine({
    user_input: symptoms,
    nearby_hospitals: nearbyHospitals,
    preferred_language: options?.language === 'sw' ? 'sw' : 'en'
  });

  // 1. Try calling central backend API /api/triage
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const res = await fetch(`${backendUrl}/api/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms,
        county: 'Kakamega',
        language: options?.language === 'sw' ? 'sw' : 'en'
      })
    });

    if (res.ok) {
      const payload = await res.json();
      if (payload.success && payload.data) {
        const d = payload.data;
        const urgency = toUrgency(d.urgency || d.risk || engineResult.urgency);
        return {
          condition: d.symptom_summary || engineResult.possible_conditions[0] || "Clinical Health Assessment",
          confidence: 0.96,
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
  } catch (err) {
    console.warn("Backend /api/triage call failed, proceeding to direct Vertex / Engine:", err);
  }

  // 2. Try direct Vertex call if available
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
    const text = await callVertexDirectly(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const aiResult = JSON.parse(jsonMatch[0]);
      return {
        condition: aiResult.condition || engineResult.possible_conditions[0] || "Assessment Required",
        confidence: 0.95,
        urgency: toUrgency(aiResult.urgency || engineResult.urgency),
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
  } catch (err) {
    console.warn("Vertex AI direct call failed, returning Decision Engine result:", err);
  }

  // 3. Fallback to Decision Engine result - ALWAYS returns a valid result!
  return {
    condition: engineResult.possible_conditions[0] || "Clinical Assessment",
    confidence: 0.92,
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
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const url = `${backendUrl}/api/conversations/message`;

  try {
    const lat = context.user_location?.lat || null;
    const lng = context.user_location?.lng || null;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: prompt,
        webUserId: patientId,
        channel: 'WEB',
        userLat: lat,
        userLng: lng
      })
    });

    if (!response.ok) {
      throw new Error(`Orchestrator server returned ${response.status}`);
    }

    const payload = await response.json();
    if (payload.success && payload.data?.message?.message) {
      return payload.data.message.message;
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Central Orchestrator Call Failed, falling back to direct client-side Vertex:", error);
    try {
      const text = await callVertexDirectly(`Context: Medical Assistant. Location Context: ${JSON.stringify(context)}. Question: ${prompt}`);
      return text || "I'm sorry, I couldn't process that request.";
    } catch {
      return "The medical AI is currently unavailable. Please check your connection.";
    }
  }
}
