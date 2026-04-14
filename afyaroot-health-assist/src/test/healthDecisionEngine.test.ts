import { describe, expect, it } from "vitest";
import {
  detectInputLanguage,
  extractVoiceMedicalData,
  generateSimulatedPatientCases,
  routePatientToFacility,
  runHealthcareDecisionEngine,
  symptomDataset,
} from "@/services/healthDecisionEngine";

describe("healthDecisionEngine", () => {
  const nearby = [
    { name: "Clinic A", distance_km: 1.2, type: "clinic" },
    { name: "Health Center B", distance_km: 3.1, type: "health_center" },
    { name: "County Hospital C", distance_km: 5.0, type: "hospital" },
  ];

  it("matches english symptoms and returns deterministic emergency routing", () => {
    const result = runHealthcareDecisionEngine({
      user_input: "I have chest pain and cannot breathe well.",
      symptom_dataset: symptomDataset,
      nearby_hospitals: nearby,
      preferred_language: "en",
    });

    expect(result.urgency).toBe("emergency");
    expect(result.matched_symptoms.length).toBeGreaterThan(0);
    expect(result.recommended_facility.name).toBe("County Hospital C");
    expect(result.guidance.length).toBeLessThanOrEqual(5);
  });

  it("matches spaced headache wording from user input", () => {
    const result = runHealthcareDecisionEngine({
      user_input: "I have a head ache since morning",
      symptom_dataset: symptomDataset,
      nearby_hospitals: nearby,
      preferred_language: "en",
    });

    expect(result.matched_symptoms).toContain("Headache");
    expect(result.possible_conditions).toContain("Common Headache");
    expect(result.urgency).toBe("low");
  });

  it("detects swahili and returns swahili guidance", () => {
    const result = runHealthcareDecisionEngine({
      user_input: "Nina maumivu ya kifua na kupumua kwa shida",
      symptom_dataset: symptomDataset,
      nearby_hospitals: nearby,
    });

    expect(result.language).toBe("sw");
    expect(result.explanation).toContain("dataset");
    expect(result.guidance[0]).toContain("Tuliza");
  });

  it("returns safe fallback guidance when there is no dataset match", () => {
    const result = runHealthcareDecisionEngine({
      user_input: "xyz qwerty unknown symptom phrase",
      symptom_dataset: symptomDataset,
      nearby_hospitals: nearby,
      preferred_language: "en",
    });

    expect(result.matched_symptoms).toHaveLength(0);
    expect(result.possible_conditions).toHaveLength(0);
    expect(result.guidance.length).toBeGreaterThan(0);
    expect(result.guidance[0]).toContain("No close dataset match");
    expect(result.explanation).toContain("No close dataset match");
  });

  it("routes low urgency to nearest clinic", () => {
    const routing = routePatientToFacility("low", nearby);
    expect(routing.selected.name).toBe("Clinic A");
  });

  it("extracts structured voice data", () => {
    const extracted = extractVoiceMedicalData("Nina homa na kikohozi kwa siku 3");
    expect(extracted.language).toBe("sw");
    expect(extracted.duration).toContain("3");
    expect(extracted.symptoms.length).toBeGreaterThan(0);
  });

  it("simulates exactly 50 cases", () => {
    const simulated = generateSimulatedPatientCases(50);
    expect(simulated).toHaveLength(50);
  });

  it("detects english language marker quickly", () => {
    expect(detectInputLanguage("I have severe headache")).toBe("en");
  });
});
