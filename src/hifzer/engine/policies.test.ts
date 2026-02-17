import { describe, expect, it } from "vitest";
import { isWarmupGatePassed, weeklyGateSampleSize } from "@/hifzer/engine/gates";
import { resolveMode } from "@/hifzer/engine/mode-manager";
import { resolveReviewFloorPct } from "@/hifzer/engine/review-allocation";

describe("engine/review-allocation", () => {
  it("applies mode-specific review floor rules", () => {
    expect(resolveReviewFloorPct({
      mode: "CATCH_UP",
      weekOne: false,
      hasReviewPool: true,
      userReviewFloorPct: 70,
      debtRatioPct: 50,
    })).toBe(100);

    expect(resolveReviewFloorPct({
      mode: "CONSOLIDATION",
      weekOne: false,
      hasReviewPool: true,
      userReviewFloorPct: 70,
      debtRatioPct: 25,
    })).toBe(80);

    expect(resolveReviewFloorPct({
      mode: "CONSOLIDATION",
      weekOne: false,
      hasReviewPool: true,
      userReviewFloorPct: 70,
      debtRatioPct: 35,
    })).toBe(90);

    expect(resolveReviewFloorPct({
      mode: "CONSOLIDATION",
      weekOne: false,
      hasReviewPool: true,
      userReviewFloorPct: 70,
      debtRatioPct: 45,
    })).toBe(100);

    expect(resolveReviewFloorPct({
      mode: "NORMAL",
      weekOne: false,
      hasReviewPool: false,
      userReviewFloorPct: 80,
      debtRatioPct: 0,
    })).toBe(0);

    expect(resolveReviewFloorPct({
      mode: "NORMAL",
      weekOne: true,
      hasReviewPool: true,
      userReviewFloorPct: 80,
      debtRatioPct: 0,
    })).toBe(30);

    expect(resolveReviewFloorPct({
      mode: "NORMAL",
      weekOne: false,
      hasReviewPool: true,
      userReviewFloorPct: 55,
      debtRatioPct: 0,
    })).toBe(60);
  });
});

describe("engine/gates", () => {
  it("uses budget-sensitive weekly sample sizing", () => {
    expect(weeklyGateSampleSize({
      dailyMinutes: 20,
      avgReviewSeconds: 45,
      sabqiPoolSize: 100,
    })).toBe(6);

    expect(weeklyGateSampleSize({
      dailyMinutes: 120,
      avgReviewSeconds: 30,
      sabqiPoolSize: 100,
    })).toBe(20);

    expect(weeklyGateSampleSize({
      dailyMinutes: 30,
      avgReviewSeconds: 45,
      sabqiPoolSize: 3,
    })).toBe(3);
  });

  it("passes warmup gate only with adequate quality", () => {
    expect(isWarmupGatePassed(["GOOD", "GOOD", "EASY"])).toBe(true);
    expect(isWarmupGatePassed(["EASY", "EASY", "AGAIN"])).toBe(true);
    expect(isWarmupGatePassed(["GOOD", "AGAIN", "AGAIN"])).toBe(false);
    expect(isWarmupGatePassed(["HARD", "HARD", "HARD"])).toBe(false);
  });
});

describe("engine/mode-manager", () => {
  it("switches modes based on debt, misses, and retention", () => {
    expect(resolveMode({
      debtRatioPct: 50,
      missedDays: 0,
      retention3dAvg: 2.2,
      consolidationThresholdPct: 25,
      catchUpThresholdPct: 45,
    })).toBe("CATCH_UP");

    expect(resolveMode({
      debtRatioPct: 10,
      missedDays: 3,
      retention3dAvg: 2.2,
      consolidationThresholdPct: 25,
      catchUpThresholdPct: 45,
    })).toBe("CATCH_UP");

    expect(resolveMode({
      debtRatioPct: 25,
      missedDays: 0,
      retention3dAvg: 2.2,
      consolidationThresholdPct: 25,
      catchUpThresholdPct: 45,
    })).toBe("CONSOLIDATION");

    expect(resolveMode({
      debtRatioPct: 10,
      missedDays: 2,
      retention3dAvg: 2.2,
      consolidationThresholdPct: 25,
      catchUpThresholdPct: 45,
    })).toBe("CONSOLIDATION");

    expect(resolveMode({
      debtRatioPct: 10,
      missedDays: 0,
      retention3dAvg: 1.7,
      consolidationThresholdPct: 25,
      catchUpThresholdPct: 45,
    })).toBe("CONSOLIDATION");

    expect(resolveMode({
      debtRatioPct: 10,
      missedDays: 0,
      retention3dAvg: 2.1,
      consolidationThresholdPct: 25,
      catchUpThresholdPct: 45,
    })).toBe("NORMAL");
  });
});
