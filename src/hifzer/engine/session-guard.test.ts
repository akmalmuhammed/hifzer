import { describe, expect, it } from "vitest";
import {
  SessionGuardError,
  parseSessionEventList,
  validateSessionCompletionAgainstPlan,
} from "@/hifzer/engine/session-guard";
import type { SessionStep } from "@/hifzer/engine/types";

function planSteps(): SessionStep[] {
  return [
    { kind: "AYAH", stage: "WARMUP", phase: "STANDARD", ayahId: 1 },
    { kind: "AYAH", stage: "NEW", phase: "NEW_EXPOSE", ayahId: 2 },
    { kind: "AYAH", stage: "NEW", phase: "NEW_GUIDED", ayahId: 2 },
    { kind: "AYAH", stage: "NEW", phase: "NEW_BLIND", ayahId: 2 },
    { kind: "LINK", stage: "LINK", phase: "STANDARD", fromAyahId: 1, toAyahId: 2 },
  ];
}

describe("engine/session-guard", () => {
  it("rejects malformed payload enums early", () => {
    expect(() =>
      parseSessionEventList([
        {
          stepIndex: 0,
          stage: "BOGUS",
          phase: "STANDARD",
          ayahId: 1,
          durationSec: 12,
          createdAt: "2026-03-09T08:00:00.000Z",
        },
      ]),
    ).toThrow(SessionGuardError);
  });

  it("rejects off-plan events", () => {
    expect(() =>
      validateSessionCompletionAgainstPlan({
        steps: planSteps(),
        warmupRequired: true,
        weeklyGateRequired: false,
        cursorAyahIdAtStart: 2,
        newAyahIds: [2],
        events: parseSessionEventList([
          {
            stepIndex: 0,
            stage: "WARMUP",
            phase: "STANDARD",
            ayahId: 999,
            grade: "GOOD",
            durationSec: 10,
            createdAt: "2026-03-09T08:00:00.000Z",
          },
        ]),
      }),
    ).toThrow(SessionGuardError);
  });

  it("fails closed when warm-up evidence is missing", () => {
    expect(() =>
      validateSessionCompletionAgainstPlan({
        steps: planSteps(),
        warmupRequired: true,
        weeklyGateRequired: false,
        cursorAyahIdAtStart: 2,
        newAyahIds: [2],
        events: parseSessionEventList([
          {
            stepIndex: 1,
            stage: "NEW",
            phase: "NEW_EXPOSE",
            ayahId: 2,
            durationSec: 10,
            createdAt: "2026-03-09T08:00:01.000Z",
          },
        ]),
      }),
    ).toThrow(SessionGuardError);
  });

  it("allows warm-up retry but rejects duplicate non-warmup steps", () => {
    const valid = validateSessionCompletionAgainstPlan({
      steps: planSteps(),
      warmupRequired: true,
      weeklyGateRequired: false,
      cursorAyahIdAtStart: 2,
      newAyahIds: [2],
      events: parseSessionEventList([
        {
          stepIndex: 0,
          stage: "WARMUP",
          phase: "STANDARD",
          ayahId: 1,
          grade: "AGAIN",
          durationSec: 10,
          createdAt: "2026-03-09T08:00:00.000Z",
        },
        {
          stepIndex: 0,
          stage: "WARMUP",
          phase: "STANDARD",
          ayahId: 1,
          grade: "GOOD",
          durationSec: 11,
          createdAt: "2026-03-09T08:01:00.000Z",
        },
      ]),
    });

    expect(valid.warmupRetryUsed).toBe(true);
    expect(() =>
      validateSessionCompletionAgainstPlan({
        steps: planSteps(),
        warmupRequired: true,
        weeklyGateRequired: false,
        cursorAyahIdAtStart: 2,
        newAyahIds: [2],
        events: parseSessionEventList([
          {
            stepIndex: 0,
            stage: "WARMUP",
            phase: "STANDARD",
            ayahId: 1,
            grade: "GOOD",
            durationSec: 10,
            createdAt: "2026-03-09T08:00:00.000Z",
          },
          {
            stepIndex: 3,
            stage: "NEW",
            phase: "NEW_BLIND",
            ayahId: 2,
            grade: "GOOD",
            durationSec: 12,
            createdAt: "2026-03-09T08:02:00.000Z",
          },
          {
            stepIndex: 3,
            stage: "NEW",
            phase: "NEW_BLIND",
            ayahId: 2,
            grade: "GOOD",
            durationSec: 12,
            createdAt: "2026-03-09T08:03:00.000Z",
          },
        ]),
      }),
    ).toThrow(SessionGuardError);
  });

  it("bounds cursor progression to the planned new ayah range", () => {
    const result = validateSessionCompletionAgainstPlan({
      steps: planSteps(),
      warmupRequired: true,
      weeklyGateRequired: false,
      cursorAyahIdAtStart: 2,
      newAyahIds: [2],
      events: parseSessionEventList([
        {
          stepIndex: 0,
          stage: "WARMUP",
          phase: "STANDARD",
          ayahId: 1,
          grade: "GOOD",
          durationSec: 10,
          createdAt: "2026-03-09T08:00:00.000Z",
        },
        {
          stepIndex: 1,
          stage: "NEW",
          phase: "NEW_EXPOSE",
          ayahId: 2,
          durationSec: 10,
          createdAt: "2026-03-09T08:00:01.000Z",
        },
        {
          stepIndex: 2,
          stage: "NEW",
          phase: "NEW_GUIDED",
          ayahId: 2,
          durationSec: 10,
          createdAt: "2026-03-09T08:00:02.000Z",
        },
        {
          stepIndex: 3,
          stage: "NEW",
          phase: "NEW_BLIND",
          ayahId: 2,
          grade: "GOOD",
          durationSec: 10,
          createdAt: "2026-03-09T08:00:03.000Z",
        },
        {
          stepIndex: 4,
          stage: "LINK",
          phase: "STANDARD",
          ayahId: 2,
          fromAyahId: 1,
          toAyahId: 2,
          grade: "GOOD",
          durationSec: 10,
          createdAt: "2026-03-09T08:00:04.000Z",
        },
      ]),
    });

    expect(result.nextCursorAyahId).toBe(3);
  });
});
