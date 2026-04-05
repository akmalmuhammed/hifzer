import type { QuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/types";

// Shared types between today/page.tsx (server) and today-client.tsx (client).

export type TodayPayload = {
  localDate: string;
  profile: {
    activeSurahNumber: number;
    cursorAyahId: number;
    dailyMinutes: number;
    reciterLabel?: string;
  };
  quran: {
    completionPct: number;
    completedKhatmahCount: number;
    currentSurahName: string;
    currentRef: string;
    continueHref: string;
    anonymousHref: string;
  };
  state: {
    mode: "NORMAL" | "CONSOLIDATION" | "CATCH_UP";
    reviewDebtMinutes: number;
    debtRatio: number;
    reviewFloorPct: number;
    retention3dAvg: number;
    weeklyGateRequired: boolean;
    monthlyTestRequired: boolean;
    warmupRequired: boolean;
    newUnlocked: boolean;
    dueNowCount: number;
    dueSoonCount: number;
    nextDueAt: string | null;
    queue: {
      warmupAyahIds: number[];
      weeklyGateAyahIds: number[];
      sabqiReviewAyahIds: number[];
      manzilReviewAyahIds: number[];
      repairLinks: Array<{ fromAyahId: number; toAyahId: number }>;
      newAyahIds: number[];
    };
    meta: {
      missedDays: number;
      weekOne: boolean;
      reviewPoolSize: number;
    };
  };
  monthlyAdjustmentMessage?: string | null;
  quranFoundation?: QuranFoundationConnectionStatus | null;
};

export type LearningLane = {
  surahNumber: number;
  surahLabel: string;
  ayahNumber: number;
  ayahId: number;
  progressPct: number;
  lastTouchedAt: string | null;
  isActive: boolean;
};

export type TodayDashboardSummary = {
  today: {
    localDate: string;
    status: "idle" | "in_progress" | "completed";
    completedSessions: number;
  };
  progress: {
    quranCompletionPct: number;
    trackedAyahs: number;
    currentSurahName: string;
    currentSurahProgressPct: number;
    completedKhatmahCount: number;
    browseRecitedAyahs7d: number;
    recallEvents7d: number;
  };
  streak: {
    currentStreakDays: number;
    bestStreakDays: number;
    todayQualifiedAyahs: number;
    graceInUseToday: boolean;
    lastQualifiedDate: string | null;
  };
  activityByDate: Array<{
    date: string;
    value: number;
  }>;
};

export type DashboardOverviewLike = {
  today?: {
    localDate?: string;
    status?: TodayDashboardSummary["today"]["status"];
    completedSessions?: number;
  };
  kpis?: {
    trackedAyahs?: number;
    recallEvents7d?: number;
    quranCompletionPct?: number;
  };
  quran?: {
    currentSurahName?: string;
    currentSurahProgressPct?: number;
    completedKhatmahCount?: number;
    browseRecitedAyahs7d?: number;
  };
  streak?: {
    currentStreakDays?: number;
    bestStreakDays?: number;
    todayQualifiedAyahs?: number;
    graceInUseToday?: boolean;
    lastQualifiedDate?: string | null;
  };
  activityByDate?: Array<{
    date?: string;
    value?: number;
  }>;
};

export function toTodayDashboardSummary(overview: DashboardOverviewLike | null | undefined): TodayDashboardSummary | null {
  if (!overview?.today || !overview.kpis || !overview.quran || !overview.streak) {
    return null;
  }

  return {
    today: {
      localDate: String(overview.today.localDate ?? ""),
      status: overview.today.status ?? "idle",
      completedSessions: Number(overview.today.completedSessions ?? 0),
    },
    progress: {
      quranCompletionPct: Number(overview.kpis.quranCompletionPct ?? 0),
      trackedAyahs: Number(overview.kpis.trackedAyahs ?? 0),
      currentSurahName: overview.quran.currentSurahName ?? "Surah 1",
      currentSurahProgressPct: Number(overview.quran.currentSurahProgressPct ?? 0),
      completedKhatmahCount: Number(overview.quran.completedKhatmahCount ?? 0),
      browseRecitedAyahs7d: Number(overview.quran.browseRecitedAyahs7d ?? 0),
      recallEvents7d: Number(overview.kpis.recallEvents7d ?? 0),
    },
    streak: {
      currentStreakDays: Number(overview.streak.currentStreakDays ?? 0),
      bestStreakDays: Number(overview.streak.bestStreakDays ?? 0),
      todayQualifiedAyahs: Number(overview.streak.todayQualifiedAyahs ?? 0),
      graceInUseToday: Boolean(overview.streak.graceInUseToday),
      lastQualifiedDate: overview.streak.lastQualifiedDate ?? null,
    },
    activityByDate: Array.isArray((overview as { activityByDate?: unknown[] }).activityByDate)
      ? (((overview as { activityByDate?: Array<{ date?: string; value?: number }> }).activityByDate ?? [])
        .filter((row): row is { date: string; value: number } => typeof row?.date === "string" && typeof row?.value === "number"))
      : [],
  };
}
