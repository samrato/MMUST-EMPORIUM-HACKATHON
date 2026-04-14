import { describe, expect, it } from "vitest";
import {
  buildAnonymousUserActivity,
  buildEmergencyAdminAlerts,
  normalizePatientId,
  parseCoordinatesFromText,
} from "@/services/dataService";
import { getRecommendedFacility } from "@/services/facilityData";

describe("normalizePatientId", () => {
  it("trims and uppercases anonymous patient ids for consistent lookup", () => {
    expect(normalizePatientId(" afr-abc123 ")).toBe("AFR-ABC123");
  });
});

describe("buildAnonymousUserActivity", () => {
  it("aggregates request and booking counts per anonymous user", () => {
    const result = buildAnonymousUserActivity(
      [
        { patient_id: "AFR-ONE", message_type: "chat", created_at: "2026-04-10T10:00:00.000Z" },
        { patient_id: "AFR-ONE", message_type: "emergency_alert", created_at: "2026-04-10T10:10:00.000Z" },
      ],
      [
        { patient_id: "AFR-ONE", urgency: "normal", created_at: "2026-04-10T11:00:00.000Z" },
      ]
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      patientId: "AFR-ONE",
      requestCount: 2,
      bookingCount: 1,
      emergencyCount: 1,
    });
  });

  it("counts emergency appointments into emergency signals", () => {
    const result = buildAnonymousUserActivity(
      [],
      [{ patient_id: "AFR-EMERGENCY", urgency: "emergency", created_at: "2026-04-12T08:00:00.000Z" }]
    );

    expect(result[0].emergencyCount).toBe(1);
  });

  it("sorts users by latest activity descending", () => {
    const result = buildAnonymousUserActivity(
      [
        { patient_id: "AFR-OLD", message_type: "chat", created_at: "2026-04-01T08:00:00.000Z" },
        { patient_id: "AFR-NEW", message_type: "chat", created_at: "2026-04-12T08:00:00.000Z" },
      ],
      []
    );

    expect(result[0].patientId).toBe("AFR-NEW");
    expect(result[1].patientId).toBe("AFR-OLD");
  });

  it("normalizes patient ids so different casing/spacing aggregates into one user", () => {
    const result = buildAnonymousUserActivity(
      [
        { patient_id: " afr-mix ", message_type: "chat", created_at: "2026-04-12T08:00:00.000Z" },
        { patient_id: "AFR-MIX", message_type: "chat", created_at: "2026-04-12T09:00:00.000Z" },
      ],
      [{ patient_id: "AFR-mix", urgency: "normal", created_at: "2026-04-12T10:00:00.000Z" }]
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ patientId: "AFR-MIX", requestCount: 2, bookingCount: 1 });
  });
});

describe("parseCoordinatesFromText", () => {
  it("extracts coordinates from mixed location text", () => {
    const result = parseCoordinatesFromText("Emergency call button pressed. Coordinates: 0.12345, 35.98765.");
    expect(result).toEqual({ lat: 0.1235, lng: 35.9877 });
  });

  it("returns null when coordinate values are invalid", () => {
    expect(parseCoordinatesFromText("Coordinates: 190.0000, 35.0000")).toBeNull();
  });
});

describe("buildEmergencyAdminAlerts", () => {
  it("builds emergency alert cards with location and route context for admin review", () => {
    const result = buildEmergencyAdminAlerts(
      [
        {
          id: "evt-1",
          patient_id: " AFR-TEST02 ",
          input_text: "Emergency call button pressed. Coordinates: 0.1251, 35.5533.",
          response_text: "Emergency workflow activated.",
          created_at: "2026-04-14T13:25:00.000Z",
        },
      ],
      [
        {
          id: "booking-1",
          patient_id: "AFR-BOOK",
          urgency: "emergency",
          location: "Chepterit market",
          facility_name: "Nandi Hills Sub-County Hospital",
          created_at: "2026-04-14T12:37:00.000Z",
        },
      ],
      [
        {
          patient_id: "AFR-TEST02",
          location: "0.1200, 35.5500",
          facility_name: "Kapsabet County Referral Hospital",
          created_at: "2026-04-14T13:24:00.000Z",
        },
        {
          patient_id: "AFR-BOOK",
          location: "Chepterit market",
          facility_name: "Nandi Hills Sub-County Hospital",
          created_at: "2026-04-14T12:30:00.000Z",
        },
      ],
      [
        {
          patient_id: "AFR-TEST02",
          input_text: "Emergency route request to Kapsabet County Referral Hospital",
          response_text: "3.1 km, 8 mins, first step: Head north.",
          created_at: "2026-04-14T13:25:10.000Z",
        },
      ]
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      patientId: "AFR-TEST02",
      source: "emergency_alert",
      destinationName: "Kapsabet County Referral Hospital",
      routeSummary: "3.1 km, 8 mins, first step: Head north.",
      locationLabel: "0.1251, 35.5533",
    });
    expect(result[0].aiGuidance.join(" ")).toContain("0.1251, 35.5533");

    const bookingAlert = result.find((alert) => alert.patientId === "AFR-BOOK");
    expect(bookingAlert).toMatchObject({
      source: "emergency_booking",
      locationLabel: "Chepterit market",
      destinationName: "Nandi Hills Sub-County Hospital",
    });
    expect(bookingAlert?.aiGuidance.join(" ")).toContain("Nandi Hills Sub-County Hospital");
  });

  it("uses a fallback emergency destination when no destination context exists", () => {
    const result = buildEmergencyAdminAlerts(
      [
        {
          id: "evt-2",
          patient_id: "AFR-NOCTX",
          input_text: "EMERGENCY CALL ACTIVATED. Location unknown",
          response_text: "Workflow started",
          created_at: "2026-04-14T14:10:00.000Z",
        },
      ],
      [],
      [],
      []
    );

    expect(result).toHaveLength(1);
    expect(result[0].destinationName).toBe(getRecommendedFacility("emergency").name);
    expect(result[0].aiGuidance.join(" ")).toContain("Coordinate transport toward");
  });
});
