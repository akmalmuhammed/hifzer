import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";
import type { AyahReviewState, SrsMode, TodayQueue } from "@/hifzer/srs/types";

export type QueueProfile = {
  activeSurahNumber: number;
  cursorAyahId: number;
  lastCompletedLocalDate: string | null; // YYYY-MM-DD (local user date)
};

function dateToIsoLocalDateUtc(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function isoLocalDateToUtcMidnightMs(isoLocalDate: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoLocalDate);
  if (!m) {
    return null;
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    return null;
  }
  return Date.UTC(y, mo - 1, d);
}

export function missedDaysSince(lastCompletedLocalDate: string | null, nowLocalDate: string): number {
  const nowMs = isoLocalDateToUtcMidnightMs(nowLocalDate);
  const lastMs = lastCompletedLocalDate ? isoLocalDateToUtcMidnightMs(lastCompletedLocalDate) : null;
  if (!nowMs || !lastMs) {
    return 0;
  }
  const diffDays = Math.floor((nowMs - lastMs) / (24 * 60 * 60 * 1000));
  return Math.max(0, diffDays - 1);
}

export function modeForMissedDays(missedDays: number): SrsMode {
  if (missedDays >= 3) {
    return "CATCH_UP";
  }
  if (missedDays === 2) {
    return "CONSOLIDATION";
  }
  return "NORMAL";
}

function newTargetCount(mode: SrsMode): number {
  if (mode === "CATCH_UP") {
    return 0;
  }
  if (mode === "CONSOLIDATION") {
    return 2;
  }
  return 5;
}

function sortDueReviews(dueReviews: AyahReviewState[]): AyahReviewState[] {
  return [...dueReviews].sort((a, b) => a.nextReviewAt.getTime() - b.nextReviewAt.getTime());
}

export function buildTodayQueue(profile: QueueProfile, dueReviews: AyahReviewState[], now: Date): TodayQueue {
  const nowLocalDate = dateToIsoLocalDateUtc(now);
  const missedDays = missedDaysSince(profile.lastCompletedLocalDate, nowLocalDate);
  const mode = modeForMissedDays(missedDays);

  const dueSorted = sortDueReviews(dueReviews).filter((r) => r.nextReviewAt.getTime() <= now.getTime());

  const warmupIds = dueSorted.slice(0, 2).map((r) => r.ayahId);
  const reviewIds = dueSorted.slice(2, 14).map((r) => r.ayahId);

  const surah = SURAH_INDEX.find((x) => x.surahNumber === profile.activeSurahNumber) ?? null;
  if (!surah) {
    return {
      mode,
      warmupIds,
      reviewIds,
      newStartAyahId: null,
      newEndAyahId: null,
    };
  }

  const cursor = Math.max(surah.startAyahId, Math.min(surah.endAyahId + 1, Math.floor(profile.cursorAyahId)));
  const targetNew = newTargetCount(mode);

  if (targetNew <= 0 || cursor > surah.endAyahId) {
    return { mode, warmupIds, reviewIds, newStartAyahId: null, newEndAyahId: null };
  }

  const newStartAyahId = cursor;
  const newEndAyahId = Math.min(surah.endAyahId, newStartAyahId + targetNew - 1);

  return { mode, warmupIds, reviewIds, newStartAyahId, newEndAyahId };
}

