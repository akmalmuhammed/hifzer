import "server-only";

import type { UserProfile } from "@prisma/client";
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

function toSnapshot(row: UserProfile): ProfileSnapshot {
  return {
    clerkUserId: row.clerkUserId,
    onboardingCompleted: Boolean(row.onboardingCompletedAt),
    activeSurahNumber: row.activeSurahNumber,
    cursorAyahId: row.cursorAyahId,
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

  const { activeSurahNumber, cursorAyahId } = defaultStartPoint();
  const prisma = db();

  return prisma.userProfile.upsert({
    where: { clerkUserId },
    create: {
      clerkUserId,
      timezone: "UTC",
      dailyMinutes: DEFAULT_DAILY_MINUTES,
      practiceDays: DEFAULT_PRACTICE_DAYS,
      reminderTimeLocal: DEFAULT_REMINDER_TIME,
      activeSurahNumber,
      cursorAyahId,
      darkMode: false,
      themePreset: DEFAULT_THEME,
      accentPreset: DEFAULT_ACCENT,
      reciterId: DEFAULT_RECITER,
    },
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
  await getOrCreateUserProfile(clerkUserId);
  const row = await prisma.userProfile.update({
    where: { clerkUserId },
    data: { activeSurahNumber, cursorAyahId },
  });
  return toSnapshot(row);
}

export async function markOnboardingComplete(clerkUserId: string) {
  if (!dbConfigured()) {
    return null;
  }
  const prisma = db();
  await getOrCreateUserProfile(clerkUserId);
  const row = await prisma.userProfile.update({
    where: { clerkUserId },
    data: { onboardingCompletedAt: new Date() },
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
  await getOrCreateUserProfile(input.clerkUserId);
  const row = await prisma.userProfile.update({
    where: { clerkUserId: input.clerkUserId },
    data: {
      darkMode: input.darkMode,
      themePreset: input.themePreset,
      accentPreset: input.accentPreset,
    },
  });
  return toSnapshot(row);
}

