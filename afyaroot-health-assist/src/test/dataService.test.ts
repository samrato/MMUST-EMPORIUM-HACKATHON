import { describe, expect, it } from "vitest";
import { buildAnonymousUserActivity } from "@/services/dataService";

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
});
