import type { AyahReviewState } from "@/hifzer/srs/types";

export type StationCounts = Record<number, number>;

export function countStations(reviews: AyahReviewState[]): StationCounts {
  const out: StationCounts = {};
  for (const r of reviews) {
    const s = Math.max(1, Math.min(7, Math.floor(r.station)));
    out[s] = (out[s] ?? 0) + 1;
  }
  return out;
}

export function averageStation(reviews: AyahReviewState[]): number {
  if (reviews.length === 0) {
    return 0;
  }
  const sum = reviews.reduce((acc, r) => acc + Math.max(1, Math.min(7, Math.floor(r.station))), 0);
  return sum / reviews.length;
}

