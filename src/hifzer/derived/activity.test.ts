import { describe, expect, it } from "vitest";
import { buildActivityDays } from "@/hifzer/derived/activity";
import type { StoredAttempt } from "@/hifzer/local/store";

describe("derived/activity", () => {
  it("builds a fixed-length series ending at endIsoDateUtc", () => {
    const attempts: StoredAttempt[] = [
      {
        id: "a1",
        sessionId: "s1",
        ayahId: 1,
        stage: "REVIEW",
        grade: "GOOD",
        createdAt: "2026-02-14T10:00:00.000Z",
      },
      {
        id: "a2",
        sessionId: "s1",
        ayahId: 2,
        stage: "REVIEW",
        grade: "GOOD",
        createdAt: "2026-02-14T11:00:00.000Z",
      },
      {
        id: "a3",
        sessionId: "s2",
        ayahId: 3,
        stage: "NEW",
        grade: "EASY",
        createdAt: "2026-02-16T09:00:00.000Z",
      },
    ];

    const days = buildActivityDays(attempts, "2026-02-16", 3);
    expect(days).toEqual([
      { date: "2026-02-14", value: 2 },
      { date: "2026-02-15", value: 0 },
      { date: "2026-02-16", value: 1 },
    ]);
  });
});
