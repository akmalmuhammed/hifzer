import "server-only";

import type { AttemptStage, SrsGrade, SrsMode } from "@prisma/client";
import { addIsoDaysUtc } from "@/hifzer/derived/dates";
import { isoDateInTimeZone } from "@/hifzer/engine/date";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { getAyahById, getSurahInfo } from "@/hifzer/quran/lookup.server";
import { getQuranReadProgress } from "@/hifzer/quran/read-progress.server";
import { getUserStreakSummary } from "@/hifzer/streak/server";
import { db } from "@/lib/db";

const TOTAL_AYAHS = 6236;
const MAX_SESSION_MINUTES_BUCKET = 240;
const DUE_SOON_WINDOW_HOURS = 6;
const WARMUP_STAGES: AttemptStage[] = ["WARMUP", "REVIEW", "WEEKLY_TEST", "LINK", "LINK_REPAIR", "NEW"];

type TrendPoint = {
  date: string;
  completedSessions: number;
  minutes: number;
  recallEvents: number;
  browseAyahs: number;
};

type GradeMix = Record<"AGAIN" | "HARD" | "GOOD" | "EASY", number>;

type BandMix = Record<"ENCODING" | "SABQI" | "MANZIL" | "MASTERED", number>;

type StageMix = Record<AttemptStage, number>;

type TodayStatus = "idle" | "in_progress" | "completed";

export type DashboardOverview = {
  generatedAt: string;
  profile: {
    mode: SrsMode;
    timezone: string;
    dailyMinutes: number;
    practiceDaysPerWeek: number;
    reminderTimeLocal: string;
  };
  today: {
    localDate: string;
    status: TodayStatus;
    completedSessions: number;
    openSessions: number;
  };
  kpis: {
    completedSessions7d: number;
    totalSessionMinutes7d: number;
    avgSessionMinutes7d: number;
    recallEvents7d: number;
    trackedAyahs: number;
    quranCompletionPct: number;
    retentionScore14d: number;
  };
  sessionTrend14d: TrendPoint[];
  gradeMix14d: GradeMix;
  stageMix14d: StageMix;
  reviewHealth: {
    dueNow: number;
    dueSoon6h: number;
    nextDueAt: string | null;
    weakTransitions: number;
    byBand: BandMix;
  };
  quran: {
    cursorAyahId: number;
    cursorRef: string;
    currentSurahName: string;
    currentSurahProgressPct: number;
    completedKhatmahCount: number;
    browseRecitedAyahs7d: number;
    uniqueSurahsRecited14d: number;
  };
  streak: {
    currentStreakDays: number;
    bestStreakDays: number;
    graceInUseToday: boolean;
    todayQualifiedAyahs: number;
    lastQualifiedDate: string | null;
  };
  activityByDate: Array<{
    date: string;
    value: number;
  }>;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function emptyGradeMix(): GradeMix {
  return { AGAIN: 0, HARD: 0, GOOD: 0, EASY: 0 };
}

function emptyBandMix(): BandMix {
  return { ENCODING: 0, SABQI: 0, MANZIL: 0, MASTERED: 0 };
}

function emptyStageMix(): StageMix {
  return {
    WARMUP: 0,
    REVIEW: 0,
    NEW: 0,
    LINK: 0,
    WEEKLY_TEST: 0,
    LINK_REPAIR: 0,
  };
}

function gradeValue(grade: SrsGrade): number {
  if (grade === "EASY") {
    return 3;
  }
  if (grade === "GOOD") {
    return 2;
  }
  if (grade === "HARD") {
    return 1;
  }
  return 0;
}

function sessionDurationMinutes(startedAt: Date, endedAt: Date | null): number {
  if (!endedAt) {
    return 0;
  }
  const raw = (endedAt.getTime() - startedAt.getTime()) / 60000;
  if (!Number.isFinite(raw) || raw <= 0) {
    return 0;
  }
  return clamp(raw, 0, MAX_SESSION_MINUTES_BUCKET);
}

function sumBy<T>(rows: T[], pick: (row: T) => number): number {
  let total = 0;
  for (const row of rows) {
    total += pick(row);
  }
  return total;
}

export async function getDashboardOverview(clerkUserId: string): Promise<DashboardOverview | null> {
  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    return null;
  }

  const prisma = db();
  const now = new Date();
  const soonWindowEnds = new Date(now.getTime() + (DUE_SOON_WINDOW_HOURS * 60 * 60 * 1000));
  const todayLocalDate = isoDateInTimeZone(now, profile.timezone);
  const start14d = addIsoDaysUtc(todayLocalDate, -13);
  const start7d = addIsoDaysUtc(todayLocalDate, -6);
  const start365d = addIsoDaysUtc(todayLocalDate, -364);

  const [
    sessions14d,
    sessions365d,
    gradedEvents14d,
    stageAgg14d,
    browseEvents14d,
    dueNow,
    dueSoon6h,
    nextDue,
    trackedAyahs,
    bandsAgg,
    weakTransitions,
    streak,
    quranReadProgress,
  ] = await Promise.all([
    prisma.session.findMany({
      where: {
        userId: profile.id,
        localDate: { gte: start14d, lte: todayLocalDate },
      },
      orderBy: { startedAt: "asc" },
      select: {
        id: true,
        localDate: true,
        status: true,
        mode: true,
        startedAt: true,
        endedAt: true,
        warmupPassed: true,
        weeklyGatePassed: true,
        _count: {
          select: {
            reviewEvents: true,
            attempts: true,
          },
        },
      },
    }),
    prisma.session.findMany({
      where: {
        userId: profile.id,
        localDate: { gte: start365d, lte: todayLocalDate },
      },
      select: {
        localDate: true,
        status: true,
        _count: {
          select: {
            attempts: true,
            reviewEvents: true,
          },
        },
      },
    }),
    prisma.reviewEvent.findMany({
      where: {
        userId: profile.id,
        grade: { not: null },
        stage: { in: WARMUP_STAGES },
        session: {
          localDate: {
            gte: start14d,
            lte: todayLocalDate,
          },
        },
      },
      select: {
        grade: true,
        durationSec: true,
        surahNumber: true,
        session: {
          select: {
            localDate: true,
          },
        },
      },
    }),
    prisma.reviewEvent.groupBy({
      by: ["stage"],
      where: {
        userId: profile.id,
        session: {
          localDate: {
            gte: start14d,
            lte: todayLocalDate,
          },
        },
      },
      _count: { _all: true },
    }),
    prisma.reviewEvent.findMany({
      where: {
        userId: profile.id,
        stage: "REVIEW",
        phase: "STANDARD",
        grade: null,
        durationSec: { gt: 0 },
        session: {
          localDate: {
            gte: start14d,
            lte: todayLocalDate,
          },
        },
      },
      select: {
        ayahId: true,
        surahNumber: true,
        fromAyahId: true,
        toAyahId: true,
        session: {
          select: {
            localDate: true,
          },
        },
      },
    }),
    prisma.ayahReview.count({
      where: {
        userId: profile.id,
        nextReviewAt: { lte: now },
      },
    }),
    prisma.ayahReview.count({
      where: {
        userId: profile.id,
        nextReviewAt: {
          gt: now,
          lte: soonWindowEnds,
        },
      },
    }),
    prisma.ayahReview.findFirst({
      where: { userId: profile.id },
      orderBy: { nextReviewAt: "asc" },
      select: { nextReviewAt: true },
    }),
    prisma.ayahReview.count({
      where: { userId: profile.id },
    }),
    prisma.ayahReview.groupBy({
      by: ["band"],
      where: { userId: profile.id },
      _count: { _all: true },
    }),
    prisma.weakTransition.count({
      where: {
        userId: profile.id,
        resolvedAt: null,
      },
    }),
    getUserStreakSummary(clerkUserId),
    getQuranReadProgress(profile.id),
  ]);

  const trendDates = Array.from({ length: 14 }, (_, idx) => addIsoDaysUtc(start14d, idx));
  const trendIndex = new Map<string, TrendPoint>();
  for (const date of trendDates) {
    trendIndex.set(date, {
      date,
      completedSessions: 0,
      minutes: 0,
      recallEvents: 0,
      browseAyahs: 0,
    });
  }

  let completedToday = 0;
  let openToday = 0;
  for (const session of sessions14d) {
    if (session.localDate === todayLocalDate) {
      if (session.status === "OPEN") {
        openToday += 1;
      }
      if (session.status === "COMPLETED" && session._count.attempts > 0) {
        completedToday += 1;
      }
    }

    if (session.status !== "COMPLETED" || session._count.attempts <= 0) {
      continue;
    }
    const bucket = trendIndex.get(session.localDate);
    if (!bucket) {
      continue;
    }
    bucket.completedSessions += 1;
    bucket.minutes += sessionDurationMinutes(session.startedAt, session.endedAt);
  }

  const gradeMix14d = emptyGradeMix();
  let weightedGradeScore = 0;
  let gradedEventCount = 0;
  for (const event of gradedEvents14d) {
    const grade = event.grade;
    if (!grade) {
      continue;
    }
    gradeMix14d[grade] += 1;
    weightedGradeScore += gradeValue(grade);
    gradedEventCount += 1;
    const bucket = trendIndex.get(event.session.localDate);
    if (!bucket) {
      continue;
    }
    bucket.recallEvents += 1;
  }

  const browseByDate = new Map<string, Set<number>>();
  const uniqueBrowseSurahsRecited14d = new Set<number>();
  for (const event of browseEvents14d) {
    const isBrowseMarker = event.fromAyahId === event.ayahId && event.toAyahId === event.ayahId;
    if (!isBrowseMarker) {
      continue;
    }
    uniqueBrowseSurahsRecited14d.add(event.surahNumber);
    const dateKey = event.session.localDate;
    const set = browseByDate.get(dateKey) ?? new Set<number>();
    set.add(event.ayahId);
    browseByDate.set(dateKey, set);
  }

  const sessionTrend14d = trendDates.map((date) => {
    const base = trendIndex.get(date);
    const browseAyahs = browseByDate.get(date)?.size ?? 0;
    if (!base) {
      return {
        date,
        completedSessions: 0,
        minutes: 0,
        recallEvents: 0,
        browseAyahs,
      };
    }
    return {
      date: base.date,
      completedSessions: base.completedSessions,
      minutes: Math.round(base.minutes),
      recallEvents: base.recallEvents,
      browseAyahs,
    };
  });

  const latestWindow7d = sessionTrend14d.filter((day) => day.date >= start7d);
  const completedSessions7d = sumBy(latestWindow7d, (day) => day.completedSessions);
  const totalSessionMinutes7d = sumBy(latestWindow7d, (day) => day.minutes);
  const recallEvents7d = sumBy(latestWindow7d, (day) => day.recallEvents);
  const avgSessionMinutes7d = completedSessions7d > 0
    ? Number((totalSessionMinutes7d / completedSessions7d).toFixed(1))
    : 0;

  const browseRecitedAyahs7dSet = new Set<number>();
  for (const day of trendDates) {
    if (day < start7d) {
      continue;
    }
    for (const ayahId of browseByDate.get(day) ?? []) {
      browseRecitedAyahs7dSet.add(ayahId);
    }
  }

  const stageMix14d = emptyStageMix();
  for (const row of stageAgg14d) {
    stageMix14d[row.stage] = row._count._all;
  }

  const byBand = emptyBandMix();
  for (const row of bandsAgg) {
    byBand[row.band] = row._count._all;
  }

  const retentionScore14d = gradedEventCount > 0
    ? Math.round((weightedGradeScore / (gradedEventCount * 3)) * 100)
    : 0;

  const quranCursorAyahId = clamp(quranReadProgress.lastReadAyahId ?? profile.quranCursorAyahId, 1, TOTAL_AYAHS);
  const cursorAyah = getAyahById(quranCursorAyahId) ?? getAyahById(1);
  const cursorRef = cursorAyah ? `${cursorAyah.surahNumber}:${cursorAyah.ayahNumber}` : "1:1";
  const currentSurah = getSurahInfo(cursorAyah?.surahNumber ?? profile.quranActiveSurahNumber);
  const currentSurahProgressPct = currentSurah && cursorAyah
    ? Math.round((cursorAyah.ayahNumber / Math.max(1, currentSurah.ayahCount)) * 100)
    : 0;
  const quranCompletionPct = quranReadProgress.completionPct;
  const completedKhatmahCount = quranReadProgress.completionKhatmahCount;

  const activityByDateMap = new Map<string, number>();
  for (const session of sessions365d) {
    const attemptsScore = session._count.attempts > 0
      ? Math.max(1, Math.round(session._count.attempts * 0.55))
      : 0;
    const eventsScore = session._count.reviewEvents > 0
      ? Math.max(1, Math.min(8, Math.round(session._count.reviewEvents / 4)))
      : 0;
    const openSessionScore = session.status === "OPEN" ? 1 : 0;
    const value = attemptsScore + eventsScore + openSessionScore;
    if (value < 1) {
      continue;
    }
    const current = activityByDateMap.get(session.localDate) ?? 0;
    activityByDateMap.set(session.localDate, current + value);
  }

  const activityByDate = Array.from(activityByDateMap.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const todayStatus: TodayStatus = completedToday > 0 ? "completed" : (openToday > 0 ? "in_progress" : "idle");

  return {
    generatedAt: now.toISOString(),
    profile: {
      mode: profile.mode,
      timezone: profile.timezone,
      dailyMinutes: profile.dailyMinutes,
      practiceDaysPerWeek: profile.practiceDays.length,
      reminderTimeLocal: profile.reminderTimeLocal,
    },
    today: {
      localDate: todayLocalDate,
      status: todayStatus,
      completedSessions: completedToday,
      openSessions: openToday,
    },
    kpis: {
      completedSessions7d,
      totalSessionMinutes7d,
      avgSessionMinutes7d,
      recallEvents7d,
      trackedAyahs,
      quranCompletionPct,
      retentionScore14d,
    },
    sessionTrend14d,
    gradeMix14d,
    stageMix14d,
    reviewHealth: {
      dueNow,
      dueSoon6h,
      nextDueAt: nextDue?.nextReviewAt ? nextDue.nextReviewAt.toISOString() : null,
      weakTransitions,
      byBand,
    },
    quran: {
      cursorAyahId: quranCursorAyahId,
      cursorRef,
      currentSurahName: currentSurah?.nameTransliteration ?? `Surah ${cursorAyah?.surahNumber ?? 1}`,
      currentSurahProgressPct,
      completedKhatmahCount,
      browseRecitedAyahs7d: browseRecitedAyahs7dSet.size,
      uniqueSurahsRecited14d: uniqueBrowseSurahsRecited14d.size,
    },
    streak: {
      currentStreakDays: streak.streak.currentStreakDays,
      bestStreakDays: streak.streak.bestStreakDays,
      graceInUseToday: streak.streak.graceInUseToday,
      todayQualifiedAyahs: streak.streak.todayQualifiedAyahs,
      lastQualifiedDate: streak.streak.lastQualifiedDate,
    },
    activityByDate,
  };
}
