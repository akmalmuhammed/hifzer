import "server-only";

import type {
  PlanBias,
  SrsMode,
  SubscriptionPlan,
  SubscriptionStatus,
  UserProfile,
} from "@prisma/client";
import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";
import { getSurahInfo } from "@/hifzer/quran/lookup.server";
import { db, dbConfigured } from "@/lib/db";

const DEFAULT_PRACTICE_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_REMINDER_TIME = "06:00";
const DEFAULT_DAILY_MINUTES = 40;
const DEFAULT_THEME = "standard";
const DEFAULT_ACCENT = "teal";
const DEFAULT_RECITER = "default";

export type ProfileSnapshot = {
  clerkUserId: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
  timezone: string;
  dailyMinutes: number;
  practiceDays: number[];
  reminderTimeLocal: string;
  emailRemindersEnabled: boolean;
  emailUnsubscribedAt: string | null;
  emailSuppressedAt: string | null;
  planBias: PlanBias;
  mode: SrsMode;
  hasTeacher: boolean;
  avgReviewSeconds: number;
  avgNewSeconds: number;
  avgLinkSeconds: number;
  reviewFloorPct: number;
  consolidationThresholdPct: number;
  catchUpThresholdPct: number;
  rebalanceUntil: string | null;
  activeSurahNumber: number;
  cursorAyahId: number;
  plan: SubscriptionPlan;
  paddleCustomerId: string | null;
  paddleSubscriptionId: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
  darkMode: boolean;
  themePreset: string;
  accentPreset: string;
  reciterId: string;
};

export type LearningLaneSnapshot = {
  surahNumber: number;
  surahLabel: string;
  ayahNumber: number;
  ayahId: number;
  progressPct: number;
  lastTouchedAt: string | null;
  isActive: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function defaultStartPoint() {
  const first = SURAH_INDEX[0];
  if (!first) {
    return { activeSurahNumber: 1, cursorAyahId: 1 };
  }
  return { activeSurahNumber: first.surahNumber, cursorAyahId: first.startAyahId };
}

function defaultCreateData(clerkUserId: string) {
  const { activeSurahNumber, cursorAyahId } = defaultStartPoint();
  return {
    clerkUserId,
    timezone: "UTC",
    dailyMinutes: DEFAULT_DAILY_MINUTES,
    practiceDays: DEFAULT_PRACTICE_DAYS,
    reminderTimeLocal: DEFAULT_REMINDER_TIME,
    emailRemindersEnabled: true,
    emailUnsubscribedAt: null,
    emailSuppressedAt: null,
    activeSurahNumber,
    cursorAyahId,
    hasTeacher: false,
    avgReviewSeconds: 45,
    avgNewSeconds: 90,
    avgLinkSeconds: 35,
    reviewFloorPct: 70,
    consolidationThresholdPct: 25,
    catchUpThresholdPct: 45,
    plan: "FREE" as const,
    darkMode: false,
    themePreset: DEFAULT_THEME,
    accentPreset: DEFAULT_ACCENT,
    reciterId: DEFAULT_RECITER,
  };
}

function toSnapshot(row: UserProfile): ProfileSnapshot {
  return {
    clerkUserId: row.clerkUserId,
    onboardingCompleted: Boolean(row.onboardingCompletedAt),
    onboardingCompletedAt: row.onboardingCompletedAt ? row.onboardingCompletedAt.toISOString() : null,
    timezone: row.timezone,
    dailyMinutes: row.dailyMinutes,
    practiceDays: row.practiceDays,
    reminderTimeLocal: row.reminderTimeLocal,
    emailRemindersEnabled: row.emailRemindersEnabled,
    emailUnsubscribedAt: row.emailUnsubscribedAt ? row.emailUnsubscribedAt.toISOString() : null,
    emailSuppressedAt: row.emailSuppressedAt ? row.emailSuppressedAt.toISOString() : null,
    planBias: row.planBias,
    mode: row.mode,
    hasTeacher: row.hasTeacher,
    avgReviewSeconds: row.avgReviewSeconds,
    avgNewSeconds: row.avgNewSeconds,
    avgLinkSeconds: row.avgLinkSeconds,
    reviewFloorPct: row.reviewFloorPct,
    consolidationThresholdPct: row.consolidationThresholdPct,
    catchUpThresholdPct: row.catchUpThresholdPct,
    rebalanceUntil: row.rebalanceUntil ? row.rebalanceUntil.toISOString() : null,
    activeSurahNumber: row.activeSurahNumber,
    cursorAyahId: row.cursorAyahId,
    plan: row.plan,
    paddleCustomerId: row.paddleCustomerId,
    paddleSubscriptionId: row.paddleSubscriptionId,
    subscriptionStatus: row.subscriptionStatus,
    currentPeriodEnd: row.currentPeriodEnd ? row.currentPeriodEnd.toISOString() : null,
    darkMode: row.darkMode,
    themePreset: row.themePreset,
    accentPreset: row.accentPreset,
    reciterId: row.reciterId,
  };
}

export async function getOrCreateUserProfile(clerkUserId: string): Promise<UserProfile | null> {
  if (!dbConfigured()) {
    return null;
  }

  const prisma = db();

  return prisma.userProfile.upsert({
    where: { clerkUserId },
    create: defaultCreateData(clerkUserId),
    update: {},
  });
}

export async function getProfileSnapshot(clerkUserId: string): Promise<ProfileSnapshot | null> {
  const row = await getOrCreateUserProfile(clerkUserId);
  return row ? toSnapshot(row) : null;
}

export async function saveStartPoint(clerkUserId: string, activeSurahNumber: number, cursorAyahId: number) {
  if (!dbConfigured()) {
    return null;
  }
  const prisma = db();
  const row = await prisma.userProfile.upsert({
    where: { clerkUserId },
    create: {
      ...defaultCreateData(clerkUserId),
      activeSurahNumber,
      cursorAyahId,
    },
    update: { activeSurahNumber, cursorAyahId },
  });
  return toSnapshot(row);
}

export async function saveAssessment(input: {
  clerkUserId: string;
  dailyMinutes: number;
  practiceDaysPerWeek: number;
  planBias: PlanBias;
  hasTeacher: boolean;
  timezone: string;
}) {
  if (!dbConfigured()) {
    return null;
  }
  const practiceDays = Array.from({ length: 7 }, (_, i) => i).slice(
    0,
    Math.max(1, Math.min(7, Math.floor(input.practiceDaysPerWeek))),
  );
  const prisma = db();
  const row = await prisma.userProfile.upsert({
    where: { clerkUserId: input.clerkUserId },
    create: {
      ...defaultCreateData(input.clerkUserId),
      dailyMinutes: Math.max(5, Math.min(240, Math.floor(input.dailyMinutes))),
      practiceDays,
      planBias: input.planBias,
      hasTeacher: input.hasTeacher,
      timezone: input.timezone || "UTC",
    },
    update: {
      dailyMinutes: Math.max(5, Math.min(240, Math.floor(input.dailyMinutes))),
      practiceDays,
      planBias: input.planBias,
      hasTeacher: input.hasTeacher,
      timezone: input.timezone || "UTC",
    },
  });
  return toSnapshot(row);
}

export async function markOnboardingComplete(clerkUserId: string) {
  if (!dbConfigured()) {
    return null;
  }
  const prisma = db();
  const completedAt = new Date();
  const row = await prisma.userProfile.upsert({
    where: { clerkUserId },
    create: {
      ...defaultCreateData(clerkUserId),
      onboardingCompletedAt: completedAt,
    },
    update: { onboardingCompletedAt: completedAt },
  });
  return toSnapshot(row);
}

export async function saveReminderPrefs(input: {
  clerkUserId: string;
  reminderTimeLocal: string;
  emailRemindersEnabled: boolean;
}) {
  if (!dbConfigured()) {
    return null;
  }
  const prisma = db();
  const row = await prisma.userProfile.upsert({
    where: { clerkUserId: input.clerkUserId },
    create: {
      ...defaultCreateData(input.clerkUserId),
      reminderTimeLocal: input.reminderTimeLocal,
      emailRemindersEnabled: input.emailRemindersEnabled,
      emailUnsubscribedAt: input.emailRemindersEnabled ? null : new Date(),
    },
    update: {
      reminderTimeLocal: input.reminderTimeLocal,
      emailRemindersEnabled: input.emailRemindersEnabled,
      emailUnsubscribedAt: input.emailRemindersEnabled ? null : new Date(),
    },
  });
  return toSnapshot(row);
}

export async function saveDisplayPrefs(input: {
  clerkUserId: string;
  darkMode: boolean;
  themePreset: string;
  accentPreset: string;
}) {
  if (!dbConfigured()) {
    return null;
  }
  const prisma = db();
  const row = await prisma.userProfile.upsert({
    where: { clerkUserId: input.clerkUserId },
    create: {
      ...defaultCreateData(input.clerkUserId),
      darkMode: input.darkMode,
      themePreset: input.themePreset,
      accentPreset: input.accentPreset,
    },
    update: {
      darkMode: input.darkMode,
      themePreset: input.themePreset,
      accentPreset: input.accentPreset,
    },
  });
  return toSnapshot(row);
}

export async function listLearningLanes(clerkUserId: string, limit = 8): Promise<LearningLaneSnapshot[]> {
  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    return [];
  }
  const activeSurahNumber = profile.activeSurahNumber;

  const rows = await db().reviewEvent.findMany({
    where: { userId: profile.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 4000,
    select: {
      surahNumber: true,
      ayahId: true,
      createdAt: true,
    },
  });

  const lanes: LearningLaneSnapshot[] = [];
  const seen = new Set<number>();

  function pushLane(input: { surahNumber: number; ayahId: number; touchedAt: Date | null }) {
    if (seen.has(input.surahNumber)) {
      return;
    }
    const surah = getSurahInfo(input.surahNumber);
    if (!surah) {
      return;
    }
    const ayahNumber = clamp(input.ayahId - surah.startAyahId + 1, 1, surah.ayahCount);
    const ayahId = surah.startAyahId + (ayahNumber - 1);
    const progressPct = Math.max(1, Math.round((ayahNumber / Math.max(1, surah.ayahCount)) * 100));
    lanes.push({
      surahNumber: surah.surahNumber,
      surahLabel: `${surah.nameTransliteration} (${surah.surahNumber})`,
      ayahNumber,
      ayahId,
      progressPct,
      lastTouchedAt: input.touchedAt ? input.touchedAt.toISOString() : null,
      isActive: surah.surahNumber === activeSurahNumber,
    });
    seen.add(surah.surahNumber);
  }

  pushLane({
    surahNumber: profile.activeSurahNumber,
    ayahId: profile.cursorAyahId,
    touchedAt: null,
  });

  for (const row of rows) {
    pushLane({
      surahNumber: row.surahNumber,
      ayahId: row.ayahId,
      touchedAt: row.createdAt,
    });
    if (lanes.length >= limit) {
      break;
    }
  }

  return lanes;
}
