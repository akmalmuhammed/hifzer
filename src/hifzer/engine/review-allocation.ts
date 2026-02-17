import type { SrsMode } from "@prisma/client";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function isWeekOne(input: { onboardingCompletedAt: Date | null; now: Date }): boolean {
  if (!input.onboardingCompletedAt) {
    return false;
  }
  const diffMs = input.now.getTime() - input.onboardingCompletedAt.getTime();
  return diffMs >= 0 && diffMs < (7 * 24 * 60 * 60 * 1000);
}

export function resolveReviewFloorPct(input: {
  mode: SrsMode;
  weekOne: boolean;
  hasReviewPool: boolean;
  userReviewFloorPct: number;
  debtRatioPct: number;
}): number {
  if (input.mode === "CATCH_UP") {
    return 100;
  }

  if (input.mode === "CONSOLIDATION") {
    const debt = clamp(input.debtRatioPct, 25, 45);
    const t = (debt - 25) / 20;
    return Math.round(80 + (t * 20));
  }

  if (!input.hasReviewPool) {
    return 0;
  }

  if (input.weekOne) {
    return 30;
  }

  const userFloor = Number.isFinite(input.userReviewFloorPct) ? Math.floor(input.userReviewFloorPct) : 70;
  return Math.max(60, userFloor);
}

