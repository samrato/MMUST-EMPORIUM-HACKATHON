import type { Language } from "./languageService";
import {
  type EngineUrgency,
  type HealthcareDecisionJson,
  type NearbyHospitalInput,
} from "./healthDecisionEngine";

import {
  buildEmergencyVoiceScript,
  buildFallbackEmergencyRoute,
  getEmergencyRouteInstructions,
} from "./directionsService";

// Vertex AI Configuration (Direct Frontend Call)
const API_KEY = import.meta.env.VITE_VERTEX_API_KEY || "";
const PROJECT_ID = import.meta.env.VITE_GOOGLE_CLOUD_PROJECT || "gen-lang-client-0852400804";
const LOCATION = import.meta.env.VITE_GOOGLE_CLOUD_LOCATION || "us-central1";
const MODEL_ID = "gemini-2.5-flash-lite";

interface VoiceDirectionDestination {
  name: string;
  address: string;
  location: { lat: number; lng: number };
  distance?: number;
  type?: string;
  types?: string[];
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
  if (value === "low" || value === "medium" || value === "high" || value === "emergency") {
    return value;
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

/**
 * Direct call to Vertex AI REST API from Frontend
 */
async function callVertexDirectly(prompt: string) {
  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:streamGenerateContent?key=${API_KEY}`;
  
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Vertex API Error:", errorData);
    throw new Error(`Vertex AI call failed: ${response.statusText}`);
  }

  const data = await response.json();
  // Aggregate text from streamed response chunks
  return data
    .map((chunk: any) => chunk.candidates?.[0]?.content?.parts?.[0]?.text || "")
    .join("");
}

export async function analyzeSymptomsWithAI(
  symptoms: string,
  options?: { language?: Language; nearbyHospitals?: NearbyHospitalInput[] }
): Promise<SymptomAnalysisResult | null> {
  const outputLanguage = getSymptomOutputLanguage(options?.language);
  
  const prompt = `
    You are a medical symptom triage assistant for an educational health support application.
    Your role is to analyze user-reported symptoms and return structured, safe, non-diagnostic health guidance.
    You do NOT diagnose diseases. You only provide possible conditions, urgency guidance, and safe next steps.

    Context:
    - Country context: Kenya
    - User symptom input: "${symptoms}"
    - Preferred response language: ${outputLanguage.label} (code: ${outputLanguage.code})

    Safety and response rules:
    - Never claim a confirmed diagnosis.
    - Keep language simple, clear, and patient-friendly.
    - Include emergency red-flag action when severity is high.
    - If symptoms are unclear or insufficient, state that clearly and ask for better symptom detail.
    - Keep urgency value in English enum only: "low" | "medium" | "high" | "emergency".
    - Write all other fields in ${outputLanguage.label}.
    - Return valid JSON only (no markdown, no code fence, no extra text).

    Return EXACTLY this JSON shape:
    {
      "condition": "string",
      "urgency": "low | medium | high | emergency",
      "description": "string",
      "recommendations": ["string", "string"],
      "warnings": ["string", "string"]
    }
  `;

  try {
    const text = await callVertexDirectly(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse JSON from AI");

    const aiResult = JSON.parse(jsonMatch[0]) as {
      condition?: unknown;
      urgency?: unknown;
      description?: unknown;
      recommendations?: unknown;
      warnings?: unknown;
    };
    const recommendations = toStringArray(aiResult.recommendations);
    const warnings = toStringArray(aiResult.warnings);
    const guidance = [...new Set([...recommendations, ...warnings])];
    const condition = typeof aiResult.condition === "string" && aiResult.condition.trim()
      ? aiResult.condition.trim()
      : outputLanguage.code === "en"
        ? "Medical Assessment Required"
        : "Tathmini ya daktari inahitajika";
    const description = typeof aiResult.description === "string" && aiResult.description.trim()
      ? aiResult.description.trim()
      : outputLanguage.code === "en"
        ? "Analysis complete."
        : "Uchambuzi umekamilika.";
    const urgency = toUrgency(aiResult.urgency);

    return {
      condition,
      confidence: 0.95,
      urgency,
      description,
      recommendations,
      suggestedFacilityType: "hospital",
      matchedSymptoms: [condition],
      possibleConditions: [condition],
      recommendedFacility: {
        name: "Nearest Health Facility",
        type: "General",
        distance_km: 1.2
      },
      guidance,
      explanation: description,
      structuredResult: {
        matched_symptoms: [condition],
        possible_conditions: [condition],
        urgency,
        recommended_facility: { name: "Local Clinic", type: "clinic", distance_km: 1 },
        guidance,
        explanation: description
      }
    };
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return null;
  }
}

export async function getGeminiResponse(prompt: string, context: any = {}) {
  try {
    const text = await callVertexDirectly(`Context: Medical Assistant. Language: ${context.language || 'en'}. Question: ${prompt}`);
    return text || "I'm sorry, I couldn't process that request.";
  } catch {
    return "The medical AI is currently unavailable. Please check your connection.";
  }
}
