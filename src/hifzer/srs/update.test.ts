import { describe, expect, it } from "vitest";
import { applyGrade, defaultReviewState } from "@/hifzer/srs/update";

describe("srs/update", () => {
  it("applies GOOD by advancing station + scheduling next review", () => {
    const now = new Date(2026, 0, 1, 10, 0, 0);
    const state = defaultReviewState(123, now);
    const next = applyGrade(state, "GOOD", now);

    expect(next.ayahId).toBe(123);
    expect(next.station).toBe(2);
    expect(next.intervalDays).toBe(2);
    expect(next.repetitions).toBe(1);
    expect(next.lapses).toBe(0);

    const expected = new Date(now);
    expected.setDate(expected.getDate() + 2);
    expect(next.nextReviewAt.getTime()).toBe(expected.getTime());
  });

  it("applies AGAIN without moving below station 1", () => {
    const now = new Date(2026, 0, 1, 10, 0, 0);
    const state = defaultReviewState(123, now);
    const next = applyGrade(state, "AGAIN", now);

    expect(next.station).toBe(1);
    expect(next.intervalDays).toBe(1);
    expect(next.repetitions).toBe(0);
    expect(next.lapses).toBe(1);
    expect(next.easeFactor).toBeLessThan(state.easeFactor);
  });

  it("caps station at 7", () => {
    const now = new Date(2026, 0, 1, 10, 0, 0);
    const state = {
      ...defaultReviewState(999, now),
      station: 7,
    };
    const next = applyGrade(state, "EASY", now);
    expect(next.station).toBe(7);
    expect(next.intervalDays).toBe(90);
  });

  it("uses ease factor to nudge interval length within station baseline", () => {
    const now = new Date(2026, 0, 1, 10, 0, 0);
    const lowEfState = {
      ...defaultReviewState(200, now),
      station: 5,
      easeFactor: 1.3,
    };
    const highEfState = {
      ...defaultReviewState(201, now),
      station: 5,
      easeFactor: 3.0,
    };

    const low = applyGrade(lowEfState, "GOOD", now);
    const high = applyGrade(highEfState, "GOOD", now);

    expect(low.station).toBe(6);
    expect(high.station).toBe(6);
    expect(low.intervalDays).toBeLessThan(high.intervalDays);
  });
});
