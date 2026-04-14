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
  const langLabel = options?.language === "sw" ? "Swahili" : "English";
  
  const prompt = `
    You are a medical triage assistant in Kenya.
    User Input: "${symptoms}"
    Language: ${langLabel}

    Analyze the symptoms and return ONLY a JSON object with:
    - condition (string)
    - urgency (string: "low", "medium", "high", "emergency")
    - description (string)
    - recommendations (string[])
    - warnings (string[])
  `;

  try {
    const text = await callVertexDirectly(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse JSON from AI");

    const aiResult = JSON.parse(jsonMatch[0]);

    return {
      condition: aiResult.condition || "Medical Assessment Required",
      confidence: 0.95,
      urgency: (aiResult.urgency as EngineUrgency) || "medium",
      description: aiResult.description || "Analysis complete.",
      recommendations: aiResult.recommendations || [],
      suggestedFacilityType: "hospital",
      matchedSymptoms: [aiResult.condition],
      possibleConditions: [aiResult.condition],
      recommendedFacility: {
        name: "Nearest Health Facility",
        type: "General",
        distance_km: 1.2
      },
      guidance: aiResult.recommendations || [],
      explanation: aiResult.description,
      structuredResult: {
        matched_symptoms: [aiResult.condition],
        possible_conditions: [aiResult.condition],
        urgency: aiResult.urgency,
        recommended_facility: { name: "Local Clinic", type: "clinic", distance_km: 1 },
        guidance: aiResult.recommendations,
        explanation: aiResult.description
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
