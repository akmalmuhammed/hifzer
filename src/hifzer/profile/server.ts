import "server-only";

import type {
  PlanBias,
  Prisma,
  SrsMode,
  SubscriptionPlan,
  SubscriptionStatus,
  UserProfile,
} from "@prisma/client";
import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";
import { getSurahInfo } from "@/hifzer/quran/lookup.server";
import { ensureCoreSchemaCompatibility, getCoreSchemaCapabilities } from "@/lib/db-compat";
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
  quranActiveSurahNumber: number;
  quranCursorAyahId: number;
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

function defaultCreateData(clerkUserId: string, input?: { includeQuranLane?: boolean }) {
  const { activeSurahNumber, cursorAyahId } = defaultStartPoint();
  const base = {
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
  };
  if (input?.includeQuranLane === false) {
    return base;
  }
  return {
    ...base,
    emailRemindersEnabled: true,
    emailUnsubscribedAt: null,
    emailSuppressedAt: null,
    hasTeacher: false,
    avgReviewSeconds: 45,
    avgNewSeconds: 90,
    avgLinkSeconds: 35,
    reviewFloorPct: 70,
    consolidationThresholdPct: 25,
    catchUpThresholdPct: 45,
    plan: "FREE" as const,
    quranActiveSurahNumber: activeSurahNumber,
    quranCursorAyahId: cursorAyahId,
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
    quranActiveSurahNumber: row.quranActiveSurahNumber,
    quranCursorAyahId: row.quranCursorAyahId,
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

type MinimalUserProfileRow = Pick<
  UserProfile,
  | "id"
  | "clerkUserId"
  | "timezone"
  | "onboardingCompletedAt"
  | "dailyMinutes"
  | "practiceDays"
  | "reminderTimeLocal"
  | "planBias"
  | "activeSurahNumber"
  | "cursorAyahId"
  | "mode"
  | "darkMode"
  | "themePreset"
  | "accentPreset"
  | "reciterId"
  | "createdAt"
  | "updatedAt"
>;

const MINIMAL_USER_PROFILE_SELECT = {
  id: true,
  clerkUserId: true,
  timezone: true,
  onboardingCompletedAt: true,
  dailyMinutes: true,
  practiceDays: true,
  reminderTimeLocal: true,
  planBias: true,
  activeSurahNumber: true,
  cursorAyahId: true,
  mode: true,
  darkMode: true,
  themePreset: true,
  accentPreset: true,
  reciterId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserProfileSelect;

function withCompatDefaults(row: MinimalUserProfileRow): UserProfile {
  return {
    ...row,
    emailRemindersEnabled: true,
    emailUnsubscribedAt: null,
    emailSuppressedAt: null,
    hasTeacher: false,
    avgReviewSeconds: 45,
    avgNewSeconds: 90,
    avgLinkSeconds: 35,
    reviewFloorPct: 70,
    consolidationThresholdPct: 25,
    catchUpThresholdPct: 45,
    rebalanceUntil: null,
    quranActiveSurahNumber: row.activeSurahNumber,
    quranCursorAyahId: row.cursorAyahId,
    plan: "FREE",
    paddleCustomerId: null,
    paddleSubscriptionId: null,
    subscriptionStatus: null,
    currentPeriodEnd: null,
  };
}

async function upsertProfileCompat(input: {
  clerkUserId: string;
  buildCreate: (hasQuranLaneColumns: boolean) => Prisma.UserProfileCreateInput;
  buildUpdate: (hasQuranLaneColumns: boolean) => Prisma.UserProfileUpdateInput;
  refreshCapabilities?: boolean;
}): Promise<UserProfile> {
  const capabilities = await getCoreSchemaCapabilities({ refresh: input.refreshCapabilities === true });
  const hasQuranLaneColumns = capabilities.hasQuranLaneColumns;
  const prisma = db();

  if (hasQuranLaneColumns) {
    return prisma.userProfile.upsert({
      where: { clerkUserId: input.clerkUserId },
      create: input.buildCreate(true),
      update: input.buildUpdate(true),
    });
  }

  const row = await prisma.userProfile.upsert({
    where: { clerkUserId: input.clerkUserId },
    create: input.buildCreate(false),
    update: input.buildUpdate(false),
    select: MINIMAL_USER_PROFILE_SELECT,
  });
  return withCompatDefaults(row as MinimalUserProfileRow);
}

function looksLikeMissingCoreSchema(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("quranActiveSurahNumber") ||
    message.includes("quranCursorAyahId") ||
    message.includes("planJson") ||
    message.includes("P2021") ||
    message.includes("P2022") ||
    /column .* does not exist/i.test(message) ||
    /relation .* does not exist/i.test(message)
  );
}

function runtimeSchemaPatchEnabled(): boolean {
  return process.env.HIFZER_RUNTIME_SCHEMA_PATCH !== "0";
}

export async function getOrCreateUserProfile(clerkUserId: string): Promise<UserProfile | null> {
  if (!dbConfigured()) {
    return null;
  }

  const patchEnabled = runtimeSchemaPatchEnabled();

  try {
    if (patchEnabled) {
      try {
        await ensureCoreSchemaCompatibility();
      } catch {
        // Continue in compatibility mode even when patching is blocked.
      }
    }
    return await upsertProfileCompat({
      clerkUserId,
      buildCreate: (hasQuranLaneColumns) =>
        defaultCreateData(clerkUserId, { includeQuranLane: hasQuranLaneColumns }),
      buildUpdate: () => ({}),
    });
  } catch (error) {
    if (!looksLikeMissingCoreSchema(error)) {
      throw error;
    }
    if (patchEnabled) {
      try {
        await ensureCoreSchemaCompatibility();
      } catch {
        // Ignore schema patch failures and retry in legacy-compatible mode.
      }
    }
    return upsertProfileCompat({
      clerkUserId,
      buildCreate: (hasQuranLaneColumns) =>
        defaultCreateData(clerkUserId, { includeQuranLane: hasQuranLaneColumns }),
      buildUpdate: () => ({}),
      refreshCapabilities: true,
    });
  }
}

export async function getProfileSnapshot(clerkUserId: string): Promise<ProfileSnapshot | null> {
  const row = await getOrCreateUserProfile(clerkUserId);
  return row ? toSnapshot(row) : null;
}

export async function saveStartPoint(clerkUserId: string, activeSurahNumber: number, cursorAyahId: number) {
  if (!dbConfigured()) {
    return null;
  }
  const row = await upsertProfileCompat({
    clerkUserId,
    buildCreate: (hasQuranLaneColumns) => ({
      ...defaultCreateData(clerkUserId, { includeQuranLane: hasQuranLaneColumns }),
      activeSurahNumber,
      cursorAyahId,
    }),
    buildUpdate: () => ({ activeSurahNumber, cursorAyahId }),
  });
  return toSnapshot(row);
}

export async function saveQuranStartPoint(clerkUserId: string, quranActiveSurahNumber: number, quranCursorAyahId: number) {
  if (!dbConfigured()) {
    return null;
  }

  if (runtimeSchemaPatchEnabled()) {
    try {
      await ensureCoreSchemaCompatibility();
    } catch {
      // Continue in compatibility mode.
    }
  }

  const row = await upsertProfileCompat({
    clerkUserId,
    refreshCapabilities: true,
    buildCreate: (hasQuranLaneColumns) => ({
      ...defaultCreateData(clerkUserId, { includeQuranLane: hasQuranLaneColumns }),
      ...(hasQuranLaneColumns
        ? { quranActiveSurahNumber, quranCursorAyahId }
        : {}),
    }),
    buildUpdate: (hasQuranLaneColumns) =>
      hasQuranLaneColumns
        ? { quranActiveSurahNumber, quranCursorAyahId }
        : {},
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
  const boundedDailyMinutes = Math.max(5, Math.min(240, Math.floor(input.dailyMinutes)));
  const row = await upsertProfileCompat({
    clerkUserId: input.clerkUserId,
    buildCreate: (hasQuranLaneColumns) => ({
      ...defaultCreateData(input.clerkUserId, { includeQuranLane: hasQuranLaneColumns }),
      dailyMinutes: boundedDailyMinutes,
      practiceDays,
      planBias: input.planBias,
      ...(hasQuranLaneColumns ? { hasTeacher: input.hasTeacher } : {}),
      timezone: input.timezone || "UTC",
    }),
    buildUpdate: (hasQuranLaneColumns) => ({
      dailyMinutes: boundedDailyMinutes,
      practiceDays,
      planBias: input.planBias,
      ...(hasQuranLaneColumns ? { hasTeacher: input.hasTeacher } : {}),
      timezone: input.timezone || "UTC",
    }),
  });
  return toSnapshot(row);
}

export async function markOnboardingComplete(clerkUserId: string) {
  if (!dbConfigured()) {
    return null;
  }
  const completedAt = new Date();
  const row = await upsertProfileCompat({
    clerkUserId,
    buildCreate: (hasQuranLaneColumns) => ({
      ...defaultCreateData(clerkUserId, { includeQuranLane: hasQuranLaneColumns }),
      onboardingCompletedAt: completedAt,
    }),
    buildUpdate: () => ({ onboardingCompletedAt: completedAt }),
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
  const unsubscribedAt = input.emailRemindersEnabled ? null : new Date();
  const row = await upsertProfileCompat({
    clerkUserId: input.clerkUserId,
    buildCreate: (hasQuranLaneColumns) => ({
      ...defaultCreateData(input.clerkUserId, { includeQuranLane: hasQuranLaneColumns }),
      reminderTimeLocal: input.reminderTimeLocal,
      ...(hasQuranLaneColumns
        ? {
            emailRemindersEnabled: input.emailRemindersEnabled,
            emailUnsubscribedAt: unsubscribedAt,
          }
        : {}),
    }),
    buildUpdate: (hasQuranLaneColumns) => ({
      reminderTimeLocal: input.reminderTimeLocal,
      ...(hasQuranLaneColumns
        ? {
            emailRemindersEnabled: input.emailRemindersEnabled,
            emailUnsubscribedAt: unsubscribedAt,
          }
        : {}),
    }),
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
  const row = await upsertProfileCompat({
    clerkUserId: input.clerkUserId,
    buildCreate: (hasQuranLaneColumns) => ({
      ...defaultCreateData(input.clerkUserId, { includeQuranLane: hasQuranLaneColumns }),
      darkMode: input.darkMode,
      themePreset: input.themePreset,
      accentPreset: input.accentPreset,
    }),
    buildUpdate: () => ({
      darkMode: input.darkMode,
      themePreset: input.themePreset,
      accentPreset: input.accentPreset,
    }),
  });
  return toSnapshot(row);
}

export async function listLearningLanes(clerkUserId: string, limit = 8): Promise<LearningLaneSnapshot[]> {
  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    return [];
  }
  const activeSurahNumber = profile.activeSurahNumber;

  let rows: Array<{ surahNumber: number; ayahId: number; createdAt: Date }> = [];
  try {
    rows = await db().reviewEvent.findMany({
      where: { userId: profile.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 4000,
      select: {
        surahNumber: true,
        ayahId: true,
        createdAt: true,
      },
    });
  } catch (error) {
    if (!looksLikeMissingCoreSchema(error)) {
      throw error;
    }
  }

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
