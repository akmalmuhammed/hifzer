import { describe, expect, it } from "vitest";
import { toPublicAudioStatus } from "./public-status";

describe("toPublicAudioStatus", () => {
  it.each(["not_configured", "degraded", "not_found"] as const)("returns safe copy for %s", (status) => {
    const result = toPublicAudioStatus(status);
    expect(result.userMessage).not.toMatch(/QF_|CLIENT_SECRET|token|HTTP|stack/i);
    expect(result.diagnosticCode).toMatch(/^audio_/);
  });
});
