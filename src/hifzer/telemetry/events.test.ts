import { describe, expect, it } from "vitest";
import { sanitizeProductEvent } from "./events";

describe("privacy-safe product telemetry", () => {
  it("keeps approved dimensions and removes URL queries", () => {
    expect(sanitizeProductEvent("next action/started", {
      actionKind: "quran_resume",
      reasonCode: "last_read",
      destination: "/quran/read?verse=2:255&note=private",
      online: true,
      arbitrary: "nope",
    })).toEqual({
      eventName: "next_action_started",
      params: {
        schema_version: 1,
        action_kind: "quran_resume",
        reason_code: "last_read",
        destination: "/quran/read",
        online: true,
      },
    });
  });

  it("rejects personal content and token-like values", () => {
    const result = sanitizeProductEvent("journal.save_outcome", {
      journalContent: "a private reflection",
      email: "person@example.com",
      userId: "user_123",
      errorCode: "Bearer secret-token-value",
      outcome: "saved",
    });
    expect(result?.params).toEqual({ schema_version: 1, outcome: "saved" });
  });

  it("labels third-party destinations without sending their URLs", () => {
    expect(sanitizeProductEvent("source.opened", {
      destination: "https://quran.com/2/255?utm_source=hifzer",
    })?.params.destination).toBe("external");
  });
});
