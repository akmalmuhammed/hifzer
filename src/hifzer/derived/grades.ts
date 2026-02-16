import type { StoredAttempt } from "@/hifzer/local/store";
import type { SrsGrade } from "@/hifzer/srs/types";

export type GradeCounts = Record<SrsGrade, number>;

export function emptyGradeCounts(): GradeCounts {
  return { AGAIN: 0, HARD: 0, GOOD: 0, EASY: 0 };
}

export function countGrades(attempts: StoredAttempt[], sinceIsoDateUtc: string): GradeCounts {
  const since = sinceIsoDateUtc;
  const out = emptyGradeCounts();
  for (const a of attempts) {
    const iso = a.createdAt.slice(0, 10);
    if (iso < since) {
      continue;
    }
    out[a.grade] = (out[a.grade] ?? 0) + 1;
  }
  return out;
}

