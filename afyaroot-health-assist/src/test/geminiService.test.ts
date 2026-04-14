import { describe, expect, it } from "vitest";
import { analyzeSymptomsWithAI, getGeminiResponse } from "@/services/geminiService";

describe("geminiService deterministic wrappers", () => {
  it("returns clear fallback chat guidance when symptoms are unmatched", async () => {
    const response = await getGeminiResponse("zzxv unknown symptom expression", { language: "en" });
    expect(response).toContain("No close dataset match");
    expect(response).toContain("Please describe symptoms more clearly");
  });

  it("returns fallback condition for unmatched symptom analysis", async () => {
    const result = await analyzeSymptomsWithAI("zzxv unknown symptom expression", { language: "en" });
    expect(result.condition).toBe("No close dataset match");
    expect(result.guidance.length).toBeGreaterThan(0);
    expect(result.confidence).toBe(0.45);
  });

  it("recognizes spaced headache wording as a valid dataset match", async () => {
    const result = await analyzeSymptomsWithAI("head ache", { language: "en" });
    expect(result.condition).toBe("Common Headache");
    expect(result.matchedSymptoms).toContain("Headache");
    expect(result.urgency).toBe("low");
  });
});
