import { describe, expect, it } from "vitest";
import type { AyahReview, UserProfile, WeakTransition } from "@prisma/client";
import { buildTodayEngineQueue } from "@/hifzer/engine/queue-builder";

function profileFixture(overrides?: Partial<UserProfile>): UserProfile {
  return {
    id: "u1",
    clerkUserId: "clerk_u1",
    timezone: "UTC",
    onboardingCompletedAt: new Date("2026-02-01T00:00:00.000Z"),
    dailyMinutes: 30,
    practiceDays: [1, 2, 3, 4, 5, 6, 0],
    reminderTimeLocal: "08:00",
    planBias: "BALANCED",
    activeSurahNumber: 1,
    cursorAyahId: 1,
    mode: "NORMAL",
    hasTeacher: false,
    avgReviewSeconds: 45,
    avgNewSeconds: 90,
    avgLinkSeconds: 35,
    reviewFloorPct: 70,
    consolidationThresholdPct: 25,
    catchUpThresholdPct: 45,
    rebalanceUntil: null,
    plan: "FREE",
    paddleCustomerId: null,
    paddleSubscriptionId: null,
    subscriptionStatus: null,
    currentPeriodEnd: null,
    darkMode: false,
    themePreset: "standard",
    accentPreset: "teal",
    reciterId: "default",
    createdAt: new Date("2026-02-01T00:00:00.000Z"),
    updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    ...overrides,
  };
}

function reviewFixture(ayahId: number, nextReviewAtIso: string): AyahReview {
  return {
    id: `r_${ayahId}`,
    userId: "u1",
    ayahId,
    band: "SABQI",
    checkpointIndex: 2,
    nextIntervalMinutes: 1440,
    lastDurationSec: 30,
    station: 3,
    intervalDays: 2,
    easeFactor: 2.5,
    repetitions: 1,
    lapses: 0,
    nextReviewAt: new Date(nextReviewAtIso),
    lastReviewAt: new Date("2026-02-14T08:00:00.000Z"),
    lastGrade: "GOOD",
  };
}

describe("engine/queue-builder", () => {
  it("keeps newUnlocked true in NORMAL mode even when warm-up is required", () => {
    const now = new Date("2026-02-15T09:00:00.000Z");
    const state = buildTodayEngineQueue({
      profile: profileFixture(),
      now,
      allReviews: [],
      dueReviews: [],
      weakTransitions: [] as WeakTransition[],
      yesterdayNewAyahIds: [1, 2],
      lastCompletedLocalDate: "2026-02-14",
      weeklyGateDue: false,
      retention3dAvg: 2.2,
      monthlyTestRequired: false,
    });

    expect(state.mode).toBe("NORMAL");
    expect(state.warmupRequired).toBe(true);
    expect(state.newUnlocked).toBe(true);
  });

  it("locks newUnlocked in CATCH_UP mode", () => {
    const now = new Date("2026-02-15T09:00:00.000Z");
    const due = Array.from({ length: 35 }, (_, idx) => reviewFixture(200 + idx, "2026-02-15T05:00:00.000Z"));
    const state = buildTodayEngineQueue({
      profile: profileFixture({ dailyMinutes: 20 }),
      now,
      allReviews: due,
      dueReviews: due,
      weakTransitions: [] as WeakTransition[],
      yesterdayNewAyahIds: [],
      lastCompletedLocalDate: "2026-02-14",
      weeklyGateDue: false,
      retention3dAvg: 2.2,
      monthlyTestRequired: false,
    });

    expect(state.mode).toBe("CATCH_UP");
    expect(state.newUnlocked).toBe(false);
  });
});
