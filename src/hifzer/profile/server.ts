import "server-only";

import type { SubscriptionPlan, SubscriptionStatus, UserProfile } from "@prisma/client";
import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";
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
    activeSurahNumber,
    cursorAyahId,
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
