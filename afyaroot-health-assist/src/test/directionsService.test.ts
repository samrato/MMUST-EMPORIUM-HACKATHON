import { describe, it, expect } from "vitest";
import {
  buildEmergencyVoiceScript,
  buildFallbackEmergencyRoute,
  stripHtmlInstruction,
} from "@/services/directionsService";

describe("directionsService", () => {
  it("strips html instructions into readable text", () => {
    const result = stripHtmlInstruction("Turn <b>right</b> onto <div>Main Road&nbsp;</div>");
    expect(result).toBe("Turn right onto Main Road");
  });

  it("builds a fallback emergency route when API directions are unavailable", () => {
    const route = buildFallbackEmergencyRoute(
      { lat: 0.309, lng: 35.285 },
      { lat: 0.329, lng: 35.305 },
      "County Hospital",
      "en"
    );

    expect(route.steps.length).toBeGreaterThan(0);
    expect(route.totalDistance).toContain("km");
    expect(route.endAddress).toBe("County Hospital");
  });

  it("limits voice script to six steps", () => {
    const route = {
      startAddress: "A",
      endAddress: "B",
      totalDistance: "6 km",
      totalDuration: "12 mins",
      steps: Array.from({ length: 8 }, (_, index) => ({
        instruction: `Instruction ${index + 1}`,
        distance: "",
        duration: "",
      })),
    };

    const script = buildEmergencyVoiceScript("County Hospital", route, "en");
    expect(script).toContain("Step 6. Instruction 6");
    expect(script).not.toContain("Step 7. Instruction 7");
  });
});
