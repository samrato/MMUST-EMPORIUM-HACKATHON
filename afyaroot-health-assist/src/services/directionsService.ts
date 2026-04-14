import type { Language } from "./languageService";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const DIRECTIONS_ENDPOINT = "https://maps.googleapis.com/maps/api/directions/json";
const CORS_PROXY_ENDPOINT = "https://cors-anywhere.herokuapp.com/";

export interface Coordinates {
  lat: number;
  lng: number;
}

interface DirectionsTextValue {
  text?: string;
}

interface DirectionsStepRaw {
  html_instructions?: string;
  distance?: DirectionsTextValue;
  duration?: DirectionsTextValue;
}

interface DirectionsLegRaw {
  distance?: DirectionsTextValue;
  duration?: DirectionsTextValue;
  start_address?: string;
  end_address?: string;
  steps?: DirectionsStepRaw[];
}

interface DirectionsRouteRaw {
  legs?: DirectionsLegRaw[];
}

interface DirectionsResponseRaw {
  status?: string;
  error_message?: string;
  routes?: DirectionsRouteRaw[];
}

export interface RouteInstructionStep {
  instruction: string;
  distance: string;
  duration: string;
}

export interface EmergencyRouteInstructions {
  startAddress: string;
  endAddress: string;
  totalDistance: string;
  totalDuration: string;
  steps: RouteInstructionStep[];
}

function normalizeDirectionsLanguage(lang: Language | string) {
  return lang === "sw" ? "sw" : "en";
}

export function stripHtmlInstruction(rawInstruction: string) {
  if (!rawInstruction) return "";

  if (typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawInstruction, "text/html");
    return doc.body.textContent?.replace(/\s+/g, " ").trim() || "";
  }

  return rawInstruction.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function ensureDirectionsResponse(response: DirectionsResponseRaw) {
  if (response.status !== "OK") {
    const apiStatus = response.status ? ` (${response.status})` : "";
    throw new Error(response.error_message || `Directions API request failed${apiStatus}.`);
  }

  const leg = response.routes?.[0]?.legs?.[0];
  if (!leg) {
    throw new Error("No route was returned for the selected emergency facility.");
  }

  const steps = (leg.steps || [])
    .map((step) => ({
      instruction: stripHtmlInstruction(step.html_instructions || ""),
      distance: step.distance?.text || "",
      duration: step.duration?.text || "",
    }))
    .filter((step) => step.instruction.length > 0);

  if (steps.length === 0) {
    throw new Error("Route data was returned, but no readable directions were provided.");
  }

  return {
    startAddress: leg.start_address || "Current location",
    endAddress: leg.end_address || "Destination",
    totalDistance: leg.distance?.text || "Distance unavailable",
    totalDuration: leg.duration?.text || "Duration unavailable",
    steps,
  } satisfies EmergencyRouteInstructions;
}

async function requestDirections(url: string): Promise<DirectionsResponseRaw> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Directions request failed with status ${response.status}.`);
  }
  return (await response.json()) as DirectionsResponseRaw;
}

async function requestDirectionsWithFallback(url: string) {
  try {
    return await requestDirections(url);
  } catch (directRequestError) {
    try {
      return await requestDirections(`${CORS_PROXY_ENDPOINT}${url}`);
    } catch {
      throw directRequestError instanceof Error
        ? directRequestError
        : new Error("Directions request failed.");
    }
  }
}

export async function getEmergencyRouteInstructions(
  origin: Coordinates,
  destination: Coordinates,
  lang: Language | string
) {
  if (!API_KEY) {
    throw new Error("Google Maps API key is missing. Set VITE_GOOGLE_MAPS_API_KEY.");
  }

  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode: "driving",
    alternatives: "false",
    units: "metric",
    region: "ke",
    language: normalizeDirectionsLanguage(lang),
    key: API_KEY,
  });

  const response = await requestDirectionsWithFallback(`${DIRECTIONS_ENDPOINT}?${params.toString()}`);
  return ensureDirectionsResponse(response);
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function estimateDistanceKm(origin: Coordinates, destination: Coordinates) {
  const R = 6371;
  const dLat = toRadians(destination.lat - origin.lat);
  const dLng = toRadians(destination.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(origin.lat)) * Math.cos(toRadians(destination.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function estimateCardinalDirection(origin: Coordinates, destination: Coordinates) {
  const y = Math.sin(toRadians(destination.lng - origin.lng)) * Math.cos(toRadians(destination.lat));
  const x =
    Math.cos(toRadians(origin.lat)) * Math.sin(toRadians(destination.lat)) -
    Math.sin(toRadians(origin.lat)) *
      Math.cos(toRadians(destination.lat)) *
      Math.cos(toRadians(destination.lng - origin.lng));
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  const normalized = (bearing + 360) % 360;
  const directions = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
  return directions[Math.round(normalized / 45) % 8];
}

export function buildFallbackEmergencyRoute(
  origin: Coordinates,
  destination: Coordinates,
  destinationName: string,
  lang: Language | string
): EmergencyRouteInstructions {
  const distanceKm = estimateDistanceKm(origin, destination);
  const roundedDistance = Math.max(0.1, Math.round(distanceKm * 10) / 10);
  const estimatedMinutes = Math.max(3, Math.round((distanceKm / 40) * 60));
  const cardinal = estimateCardinalDirection(origin, destination);

  if (lang === "sw") {
    return {
      startAddress: "Eneo la sasa",
      endAddress: destinationName,
      totalDistance: `${roundedDistance} km`,
      totalDuration: `Dakika ${estimatedMinutes}`,
      steps: [
        { instruction: `Elekea upande wa ${cardinal} ukifuata barabara kuu kuelekea ${destinationName}.`, distance: `${roundedDistance} km`, duration: `Dakika ${estimatedMinutes}` },
        { instruction: "Endelea kwenye njia kubwa na epuka kupoteza muda kwenye njia ndogo zisizo na uhakika.", distance: "", duration: "" },
        { instruction: "Ikiwa hali inazidi kuwa mbaya, piga 999 mara moja ukiwa bado safarini.", distance: "", duration: "" },
      ],
    };
  }

  return {
    startAddress: "Current location",
    endAddress: destinationName,
    totalDistance: `${roundedDistance} km`,
    totalDuration: `${estimatedMinutes} mins`,
    steps: [
      { instruction: `Head ${cardinal} on major roads toward ${destinationName}.`, distance: `${roundedDistance} km`, duration: `${estimatedMinutes} mins` },
      { instruction: "Stay on the clearest main route and avoid uncertain shortcuts.", distance: "", duration: "" },
      { instruction: "If the patient worsens on the way, call 999 immediately.", distance: "", duration: "" },
    ],
  };
}

export function buildEmergencyVoiceScript(
  destinationName: string,
  route: EmergencyRouteInstructions,
  lang: Language | string
) {
  const steps = route.steps
    .slice(0, 6)
    .map((step, index) => `Step ${index + 1}. ${step.instruction}`)
    .join(" ");

  if (lang === "sw") {
    return `Mwelekeo wa dharura kwenda ${destinationName}. Umbali wa takriban ${route.totalDistance}, muda wa takriban ${route.totalDuration}. ${steps}`;
  }

  return `Emergency guidance to ${destinationName}. Total distance ${route.totalDistance}, estimated time ${route.totalDuration}. ${steps}`;
}
