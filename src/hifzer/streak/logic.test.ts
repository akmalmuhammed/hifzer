import { describe, expect, it } from "vitest";
import {
  MIN_QUALIFIED_SECONDS_PER_DAY,
  aggregateSecondsByLocalDate,
  buildCalendar84d,
  computeChainSummary,
  deriveQualifiedDates,
} from "@/hifzer/streak/logic";

describe("streak/logic", () => {
  it("aggregates seconds across multiple sessions on one day", () => {
    const out = aggregateSecondsByLocalDate([
      { localDate: "2026-02-15", durationSec: 120 },
      { localDate: "2026-02-15", durationSec: 240 },
      { localDate: "2026-02-16", durationSec: 300 },
    ]);
    expect(out["2026-02-15"]).toBe(360);
    expect(out["2026-02-16"]).toBe(300);
  });

  it("validates threshold boundary 299 vs 300", () => {
    const secondsByDate = {
      "2026-02-15": 299,
      "2026-02-16": 300,
    };
    const qualified = deriveQualifiedDates({
      secondsByDate,
      startLocalDate: "2026-02-15",
      todayLocalDate: "2026-02-16",
      minQualifiedSecondsPerDay: MIN_QUALIFIED_SECONDS_PER_DAY,
    });
    expect(qualified).toEqual(["2026-02-16"]);
  });

  it("continues streak with one-day gap", () => {
    const summary = computeChainSummary({
      qualifiedDates: ["2026-02-14", "2026-02-16"],
      todayLocalDate: "2026-02-16",
    });
    expect(summary.currentStreakDays).toBe(2);
    expect(summary.bestStreakDays).toBe(2);
  });

  it("breaks current streak after two missed days", () => {
    const summary = computeChainSummary({
      qualifiedDates: ["2026-02-14", "2026-02-16"],
      todayLocalDate: "2026-02-19",
    });
    expect(summary.currentStreakDays).toBe(0);
    expect(summary.bestStreakDays).toBe(2);
  });

  it("computes best streak across separated chains", () => {
    const summary = computeChainSummary({
      qualifiedDates: ["2026-02-01", "2026-02-02", "2026-02-04", "2026-02-10", "2026-02-11"],
      todayLocalDate: "2026-02-11",
    });
    expect(summary.bestStreakDays).toBe(3);
    expect(summary.currentStreakDays).toBe(2);
  });

  it("sets grace flag only when today is unqualified and yesterday is qualified", () => {
    const summary = computeChainSummary({
      qualifiedDates: ["2026-02-14", "2026-02-16"],
      todayLocalDate: "2026-02-17",
    });
    expect(summary.graceInUseToday).toBe(true);
  });

  it("excludes pre-onboarding days from qualification", () => {
    const secondsByDate = {
      "2026-02-01": 900,
      "2026-02-02": 900,
      "2026-02-03": 900,
    };
    const qualified = deriveQualifiedDates({
      secondsByDate,
      startLocalDate: "2026-02-03",
      todayLocalDate: "2026-02-03",
    });
    expect(qualified).toEqual(["2026-02-03"]);
  });

  it("builds an 84-day calendar window with eligibility cutover", () => {
    const calendar = buildCalendar84d({
      todayLocalDate: "2026-02-20",
      startLocalDate: "2026-02-18",
      secondsByDate: {
        "2026-02-17": 500,
        "2026-02-18": 299,
        "2026-02-19": 301,
        "2026-02-20": 600,
      },
    });
    const last3 = calendar.slice(-3);
    expect(last3[0]?.date).toBe("2026-02-18");
    expect(last3[0]?.eligible).toBe(true);
    expect(last3[0]?.qualified).toBe(false);
    expect(last3[1]?.qualified).toBe(true);
    expect(last3[2]?.qualifiedMinutes).toBe(10);
    const preStart = calendar[calendar.length - 4];
    expect(preStart?.date).toBe("2026-02-17");
    expect(preStart?.eligible).toBe(false);
    expect(preStart?.qualified).toBe(false);
  });
});
