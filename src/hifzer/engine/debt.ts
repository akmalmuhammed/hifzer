type DebtInput = {
  dueReviewCount: number;
  dueRepairCount: number;
  avgReviewSeconds: number;
  avgLinkSeconds: number;
};

function safeSeconds(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.max(1, value);
}

export function computeReviewDebtMinutes(input: DebtInput): number {
  const reviewSec = Math.max(0, Math.floor(input.dueReviewCount)) * safeSeconds(input.avgReviewSeconds, 45);
  const repairSec = Math.max(0, Math.floor(input.dueRepairCount)) * safeSeconds(input.avgLinkSeconds, 35);
  return (reviewSec + repairSec) / 60;
}

export function computeDebtRatioPct(reviewDebtMinutes: number, dailyMinutes: number): number {
  const budget = Number.isFinite(dailyMinutes) ? Math.max(1, dailyMinutes) : 1;
  return (Math.max(0, reviewDebtMinutes) / budget) * 100;
}

export function updateLearnedAverages(input: {
  avgReviewSeconds: number;
  avgNewSeconds: number;
  avgLinkSeconds: number;
  reviewDurations: number[];
  newDurations: number[];
  linkDurations: number[];
}) {
  function blend(current: number, samples: number[], fallback: number): number {
    if (!samples.length) {
      return safeSeconds(current, fallback);
    }
    const avgSample = samples.reduce((sum, x) => sum + Math.max(1, x), 0) / samples.length;
    return Math.max(1, Math.round((safeSeconds(current, fallback) * 0.7) + (avgSample * 0.3)));
  }

  return {
    avgReviewSeconds: blend(input.avgReviewSeconds, input.reviewDurations, 45),
    avgNewSeconds: blend(input.avgNewSeconds, input.newDurations, 90),
    avgLinkSeconds: blend(input.avgLinkSeconds, input.linkDurations, 35),
  };
}

