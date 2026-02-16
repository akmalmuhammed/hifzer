import { describe, expect, it } from "vitest";
import { averageStation, countStations } from "@/hifzer/derived/stations";
import { defaultReviewState } from "@/hifzer/srs/update";
import type { AyahReviewState } from "@/hifzer/srs/types";

describe("derived/stations", () => {
  it("counts and averages station values", () => {
    const now = new Date(2026, 0, 1, 10, 0, 0);
    const reviews: AyahReviewState[] = [
      { ...defaultReviewState(1, now), station: 1 },
      { ...defaultReviewState(2, now), station: 1 },
      { ...defaultReviewState(3, now), station: 4 },
      { ...defaultReviewState(4, now), station: 7 },
    ];

    expect(countStations(reviews)).toEqual({ 1: 2, 4: 1, 7: 1 });
    expect(averageStation(reviews)).toBeCloseTo((1 + 1 + 4 + 7) / 4);
  });
});
