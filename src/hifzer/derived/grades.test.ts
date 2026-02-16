import { describe, expect, it } from "vitest";
import { countGrades } from "@/hifzer/derived/grades";
import type { StoredAttempt } from "@/hifzer/local/store";

describe("derived/grades", () => {
  it("counts grades since a UTC date", () => {
    const attempts: StoredAttempt[] = [
      {
        id: "a1",
        sessionId: "s1",
        ayahId: 1,
        stage: "REVIEW",
        grade: "AGAIN",
        createdAt: "2026-02-13T10:00:00.000Z",
      },
      {
        id: "a2",
        sessionId: "s1",
        ayahId: 2,
        stage: "REVIEW",
        grade: "GOOD",
        createdAt: "2026-02-14T10:00:00.000Z",
      },
      {
        id: "a3",
        sessionId: "s1",
        ayahId: 3,
        stage: "NEW",
        grade: "EASY",
        createdAt: "2026-02-14T11:00:00.000Z",
      },
      {
        id: "a4",
        sessionId: "s2",
        ayahId: 4,
        stage: "REVIEW",
        grade: "HARD",
        createdAt: "2026-02-16T09:00:00.000Z",
      },
    ];

    expect(countGrades(attempts, "2026-02-14")).toEqual({
      AGAIN: 0,
      HARD: 1,
      GOOD: 1,
      EASY: 1,
    });
  });
});
