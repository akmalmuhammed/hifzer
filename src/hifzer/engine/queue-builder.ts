import type { AyahReview, SrsMode, UserProfile, WeakTransition } from "@prisma/client";
import { getSurahInfo } from "@/hifzer/quran/lookup.server";
import { isoDateInTimeZone, missedDaysSince as missedDaysFromDates } from "@/hifzer/engine/date";
import { computeDebtRatioPct, computeReviewDebtMinutes } from "@/hifzer/engine/debt";
import { resolveMode } from "@/hifzer/engine/mode-manager";
import { resolveReviewFloorPct, isWeekOne } from "@/hifzer/engine/review-allocation";
import { weeklyGateSampleSize } from "@/hifzer/engine/gates";
import { dueRepairTransitions } from "@/hifzer/engine/transitions";
import type { TodayEngineResult } from "@/hifzer/engine/types";

function uniqueNumbers(input: number[]): number[] {
  return Array.from(new Set(input.filter((n) => Number.isFinite(n))));
}

function isSabqiBand(review: AyahReview): boolean {
  if (review.band === "ENCODING" || review.band === "SABQI") {
    return true;
  }
  return review.station <= 3;
}

function sortedByDue(input: AyahReview[]): AyahReview[] {
  return [...input].sort((a, b) => a.nextReviewAt.getTime() - b.nextReviewAt.getTime());
}

function chooseWeeklySample(sabqiPool: number[], sampleSize: number): number[] {
  return sabqiPool.slice(0, Math.max(0, sampleSize));
}

function safeSeconds(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.max(1, value);
}

export function buildTodayEngineQueue(input: {
  profile: UserProfile;
  now: Date;
  allReviews: AyahReview[];
  dueReviews: AyahReview[];
  weakTransitions: WeakTransition[];
  yesterdayNewAyahIds: number[];
  lastCompletedLocalDate: string | null;
  weeklyGateDue: boolean;
  retention3dAvg: number;
  monthlyTestRequired: boolean;
}): TodayEngineResult {
  const now = input.now;
  const profile = input.profile;
  const localDate = isoDateInTimeZone(now, profile.timezone);
  const missedDays = missedDaysFromDates(input.lastCompletedLocalDate, localDate);
  const weekOne = isWeekOne({ onboardingCompletedAt: profile.onboardingCompletedAt, now });

  const repairDue = dueRepairTransitions(input.weakTransitions, now);
  const reviewDebtMinutes = computeReviewDebtMinutes({
    dueReviewCount: input.dueReviews.length,
    dueRepairCount: repairDue.length,
    avgReviewSeconds: profile.avgReviewSeconds,
    avgLinkSeconds: profile.avgLinkSeconds,
  });
  const debtRatio = computeDebtRatioPct(reviewDebtMinutes, profile.dailyMinutes);

  const mode = resolveMode({
    debtRatioPct: debtRatio,
    missedDays,
    retention3dAvg: input.retention3dAvg,
    consolidationThresholdPct: profile.consolidationThresholdPct,
    catchUpThresholdPct: profile.catchUpThresholdPct,
  });

  const reviewFloorPct = resolveReviewFloorPct({
    mode,
    weekOne,
    hasReviewPool: input.allReviews.length > 0,
    userReviewFloorPct: profile.reviewFloorPct,
    debtRatioPct: debtRatio,
  });

  const warmupAyahIds = uniqueNumbers(input.yesterdayNewAyahIds);
  const sabqiDue = sortedByDue(input.dueReviews.filter((r) => isSabqiBand(r)));
  const manzilDue = sortedByDue(input.dueReviews.filter((r) => !isSabqiBand(r)));
  const sabqiPool = uniqueNumbers(input.allReviews.filter((r) => isSabqiBand(r)).map((r) => r.ayahId));

  const weeklySize = input.weeklyGateDue
    ? weeklyGateSampleSize({
        dailyMinutes: profile.dailyMinutes,
        avgReviewSeconds: profile.avgReviewSeconds,
        sabqiPoolSize: sabqiPool.length,
      })
    : 0;
  const weeklyGateAyahIds = input.weeklyGateDue
    ? chooseWeeklySample(sabqiPool.filter((id) => !warmupAyahIds.includes(id)), weeklySize)
    : [];

  const totalSeconds = Math.max(300, profile.dailyMinutes * 60);
  const avgReviewSeconds = safeSeconds(profile.avgReviewSeconds, 45);
  const avgNewSeconds = safeSeconds(profile.avgNewSeconds, 90);
  const avgLinkSeconds = safeSeconds(profile.avgLinkSeconds, 35);

  const mandatoryReviewCount = warmupAyahIds.length + weeklyGateAyahIds.length;
  const reviewTargetCount = Math.max(
    mandatoryReviewCount,
    Math.floor((totalSeconds * (reviewFloorPct / 100)) / avgReviewSeconds),
  );

  let reviewSlots = Math.max(0, reviewTargetCount - mandatoryReviewCount);
  const usedAyah = new Set<number>([...warmupAyahIds, ...weeklyGateAyahIds]);

  const sabqiReviewAyahIds: number[] = [];
  for (const row of sabqiDue) {
    if (!reviewSlots) {
      break;
    }
    if (usedAyah.has(row.ayahId)) {
      continue;
    }
    sabqiReviewAyahIds.push(row.ayahId);
    usedAyah.add(row.ayahId);
    reviewSlots -= 1;
  }

  const manzilReviewAyahIds: number[] = [];
  for (const row of manzilDue) {
    if (!reviewSlots) {
      break;
    }
    if (usedAyah.has(row.ayahId)) {
      continue;
    }
    manzilReviewAyahIds.push(row.ayahId);
    usedAyah.add(row.ayahId);
    reviewSlots -= 1;
  }

  const usedReviewSeconds =
    (warmupAyahIds.length + weeklyGateAyahIds.length + sabqiReviewAyahIds.length + manzilReviewAyahIds.length) *
    avgReviewSeconds;

  const remainingAfterReviews = Math.max(0, totalSeconds - usedReviewSeconds);
  const repairShare = mode === "CATCH_UP" ? 0.35 : mode === "CONSOLIDATION" ? 0.25 : 0.15;
  const repairSlots = Math.min(
    repairDue.length,
    Math.floor((remainingAfterReviews * repairShare) / avgLinkSeconds),
  );
  const repairLinks = repairDue.slice(0, Math.max(0, repairSlots)).map((r) => ({
    fromAyahId: r.fromAyahId,
    toAyahId: r.toAyahId,
  }));

  const usedSeconds = usedReviewSeconds + (repairLinks.length * avgLinkSeconds);
  const remainingForNew = Math.max(0, totalSeconds - usedSeconds);

  let newCount = mode === "CATCH_UP" ? 0 : Math.floor(remainingForNew / avgNewSeconds);
  if (mode === "CONSOLIDATION") {
    newCount = Math.min(newCount, 2);
  }
  if (profile.rebalanceUntil && profile.rebalanceUntil.getTime() > now.getTime()) {
    newCount = Math.floor(newCount * 0.75);
  }
  newCount = Math.max(0, newCount);

  const surah = getSurahInfo(profile.activeSurahNumber);
  const newAyahIds: number[] = [];
  if (surah && newCount > 0) {
    let cursor = Math.max(surah.startAyahId, Math.floor(profile.cursorAyahId));
    while (newAyahIds.length < newCount && cursor <= surah.endAyahId) {
      newAyahIds.push(cursor);
      cursor += 1;
    }
  }

  // Gate requirements are evaluated inside the session (warm-up / weekly pass).
  // `newUnlocked` only represents mode-level eligibility.
  const newUnlocked = mode !== "CATCH_UP";

  return {
    localDate,
    mode: mode as SrsMode,
    reviewDebtMinutes,
    debtRatio,
    reviewFloorPct,
    retention3dAvg: input.retention3dAvg,
    weeklyGateRequired: weeklyGateAyahIds.length > 0,
    monthlyTestRequired: input.monthlyTestRequired,
    warmupRequired: warmupAyahIds.length > 0,
    warmupRetryAllowed: warmupAyahIds.length > 0,
    newUnlocked,
    dueNowCount: input.dueReviews.length,
    dueSoonCount: 0,
    nextDueAt: null,
    queue: {
      warmupAyahIds,
      weeklyGateAyahIds,
      sabqiReviewAyahIds,
      manzilReviewAyahIds,
      repairLinks,
      newAyahIds,
    },
    meta: {
      missedDays,
      weekOne,
      reviewPoolSize: input.allReviews.length,
    },
  };
}
