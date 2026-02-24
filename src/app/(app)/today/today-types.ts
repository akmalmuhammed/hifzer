// Shared types between today/page.tsx (server) and today-client.tsx (client).

export type TodayPayload = {
  localDate: string;
  profile: {
    activeSurahNumber: number;
    cursorAyahId: number;
    dailyMinutes: number;
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
