import "server-only";

import { cache } from "react";
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
import { DEFAULT_QURAN_TRANSLATION_ID, type QuranTranslationId } from "@/hifzer/quran/translation-prefs";
import {
  canAdvanceOnboardingStep,
  maxOnboardingStep,
  normalizeOnboardingStartLane,
  normalizeOnboardingStep,
  type OnboardingStartLane,
  type OnboardingStep,
} from "@/hifzer/profile/onboarding";
import { normalizeReciterId } from "@/hifzer/audio/reciters";
import {
  ensureCoreSchemaCompatibility,
  getCoreSchemaCapabilities,
  type CoreSchemaCapabilities,
} from "@/lib/db-compat";
import { db, dbConfigured } from "@/lib/db";

const DEFAULT_PRACTICE_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_REMINDER_TIME = "06:00";
const DEFAULT_DAILY_MINUTES = 40;
const DEFAULT_THEME = "standard";
const DEFAULT_ACCENT = "teal";
const DEFAULT_RECITER = "default";
const DEFAULT_QURAN_SHOW_DETAILS = true;

export type ProfileSnapshot = {
  clerkUserId: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
  onboardingStep: OnboardingStep;
  onboardingStartLane: OnboardingStartLane | null;
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
  quranTranslationId: string;
  quranShowDetails: boolean;
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

type ProfileSchemaCapabilities = Pick<
  CoreSchemaCapabilities,
  "hasQuranLaneColumns" | "hasOnboardingStateColumns"
>;

const LEGACY_INCOMPATIBLE_PROFILE_KEYS = new Set([
  "emailRemindersEnabled",
  "emailUnsubscribedAt",
  "emailSuppressedAt",
  "hasTeacher",
  "avgReviewSeconds",
  "avgNewSeconds",
  "avgLinkSeconds",
  "reviewFloorPct",
  "consolidationThresholdPct",
  "catchUpThresholdPct",
  "rebalanceUntil",
  "plan",
  "paddleCustomerId",
  "paddleSubscriptionId",
  "subscriptionStatus",
  "currentPeriodEnd",
] satisfies Array<keyof Prisma.UserProfileCreateInput | keyof Prisma.UserProfileUpdateInput>);

function defaultCreateData(
  clerkUserId: string,
  input?: { includeQuranLane?: boolean; includeOnboardingState?: boolean },
) {
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
    ...(input?.includeOnboardingState === false
      ? {}
      : {
          onboardingStep: "welcome",
          onboardingStartLane: null,
        }),
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
    quranTranslationId: DEFAULT_QURAN_TRANSLATION_ID,
    quranShowDetails: DEFAULT_QURAN_SHOW_DETAILS,
  };
}

function toSnapshot(row: UserProfile): ProfileSnapshot {
  return {
    clerkUserId: row.clerkUserId,
    onboardingCompleted: Boolean(row.onboardingCompletedAt),
    onboardingCompletedAt: row.onboardingCompletedAt ? row.onboardingCompletedAt.toISOString() : null,
    onboardingStep: normalizeOnboardingStep(row.onboardingStep),
    onboardingStartLane: normalizeOnboardingStartLane(row.onboardingStartLane),
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
    quranTranslationId: row.quranTranslationId,
    quranShowDetails: row.quranShowDetails,
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

type CompatUserProfileRow = Pick<
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
> & Partial<
  Pick<
    UserProfile,
    | "quranActiveSurahNumber"
    | "quranCursorAyahId"
    | "quranTranslationId"
    | "quranShowDetails"
    | "onboardingStep"
    | "onboardingStartLane"
  >
>;

const BASE_USER_PROFILE_SELECT = {
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

function buildCompatUserProfileSelect(capabilities: ProfileSchemaCapabilities): Prisma.UserProfileSelect {
  return {
    ...BASE_USER_PROFILE_SELECT,
    ...(capabilities.hasQuranLaneColumns
      ? {
          quranActiveSurahNumber: true,
          quranCursorAyahId: true,
          quranTranslationId: true,
          quranShowDetails: true,
        }
      : {}),
    ...(capabilities.hasOnboardingStateColumns
      ? {
          onboardingStep: true,
          onboardingStartLane: true,
        }
      : {}),
  };
}

function withCompatDefaults(row: CompatUserProfileRow, capabilities: ProfileSchemaCapabilities): UserProfile {
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
    quranActiveSurahNumber: capabilities.hasQuranLaneColumns
      ? (row.quranActiveSurahNumber ?? row.activeSurahNumber)
      : row.activeSurahNumber,
    quranCursorAyahId: capabilities.hasQuranLaneColumns
      ? (row.quranCursorAyahId ?? row.cursorAyahId)
      : row.cursorAyahId,
    quranTranslationId: capabilities.hasQuranLaneColumns
      ? (row.quranTranslationId ?? DEFAULT_QURAN_TRANSLATION_ID)
      : DEFAULT_QURAN_TRANSLATION_ID,
    quranShowDetails: capabilities.hasQuranLaneColumns
      ? (row.quranShowDetails ?? DEFAULT_QURAN_SHOW_DETAILS)
      : DEFAULT_QURAN_SHOW_DETAILS,
    onboardingStep: capabilities.hasOnboardingStateColumns
      ? normalizeOnboardingStep(row.onboardingStep)
      : "welcome",
    onboardingStartLane: capabilities.hasOnboardingStateColumns
      ? normalizeOnboardingStartLane(row.onboardingStartLane)
      : null,
    plan: "FREE",
    paddleCustomerId: null,
    paddleSubscriptionId: null,
    subscriptionStatus: null,
    currentPeriodEnd: null,
  };
}

function stripLegacyIncompatibleProfileFields<T extends Prisma.UserProfileCreateInput | Prisma.UserProfileUpdateInput>(
  input: T,
): T {
  const next = { ...input } as Record<string, unknown>;
  for (const key of LEGACY_INCOMPATIBLE_PROFILE_KEYS) {
    delete next[key];
  }
  return next as T;
}

async function upsertProfileCompat(input: {
  clerkUserId: string;
  buildCreate: (capabilities: ProfileSchemaCapabilities) => Prisma.UserProfileCreateInput;
  buildUpdate: (capabilities: ProfileSchemaCapabilities) => Prisma.UserProfileUpdateInput;
  refreshCapabilities?: boolean;
}): Promise<UserProfile> {
  const capabilities = await getCoreSchemaCapabilities({ refresh: input.refreshCapabilities === true });
  const profileCapabilities: ProfileSchemaCapabilities = {
    hasQuranLaneColumns: capabilities.hasQuranLaneColumns,
    hasOnboardingStateColumns: capabilities.hasOnboardingStateColumns,
  };
  const hasFullProfileColumns =
    profileCapabilities.hasQuranLaneColumns &&
    profileCapabilities.hasOnboardingStateColumns;
  const prisma = db();

  if (hasFullProfileColumns) {
    try {
      return await prisma.userProfile.upsert({
        where: { clerkUserId: input.clerkUserId },
        create: input.buildCreate(profileCapabilities),
        update: input.buildUpdate(profileCapabilities),
      });
    } catch (error) {
      if (!looksLikeMissingCoreSchema(error)) {
        throw error;
      }
      // Drift-safe fallback: use legacy-safe profile shape for first-time users.
    }
  }

  const compatCreate = stripLegacyIncompatibleProfileFields(input.buildCreate(profileCapabilities));
  const compatUpdate = stripLegacyIncompatibleProfileFields(input.buildUpdate(profileCapabilities));
  const row = await prisma.userProfile.upsert({
    where: { clerkUserId: input.clerkUserId },
    create: compatCreate,
    update: compatUpdate,
    select: buildCompatUserProfileSelect(profileCapabilities),
  });
  return withCompatDefaults(row as CompatUserProfileRow, profileCapabilities);
}

function looksLikeMissingCoreSchema(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("emailRemindersEnabled") ||
    message.includes("emailUnsubscribedAt") ||
    message.includes("emailSuppressedAt") ||
    message.includes("hasTeacher") ||
    message.includes("avgReviewSeconds") ||
    message.includes("avgNewSeconds") ||
    message.includes("avgLinkSeconds") ||
    message.includes("reviewFloorPct") ||
    message.includes("consolidationThresholdPct") ||
    message.includes("catchUpThresholdPct") ||
    message.includes("rebalanceUntil") ||
    message.includes('"plan"') ||
    message.includes("`plan`") ||
    message.includes("paddleCustomerId") ||
    message.includes("paddleSubscriptionId") ||
    message.includes("subscriptionStatus") ||
    message.includes("currentPeriodEnd") ||
    message.includes("quranActiveSurahNumber") ||
    message.includes("quranCursorAyahId") ||
    message.includes("quranTranslationId") ||
    message.includes("quranShowDetails") ||
    message.includes("onboardingStep") ||
    message.includes("onboardingStartLane") ||
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

async function getOrCreateUserProfileUncached(clerkUserId: string): Promise<UserProfile | null> {
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
      buildCreate: (capabilities) =>
        defaultCreateData(clerkUserId, {
          includeQuranLane: capabilities.hasQuranLaneColumns,
          includeOnboardingState: capabilities.hasOnboardingStateColumns,
        }),
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
      buildCreate: (capabilities) =>
        defaultCreateData(clerkUserId, {
          includeQuranLane: capabilities.hasQuranLaneColumns,
          includeOnboardingState: capabilities.hasOnboardingStateColumns,
        }),
      buildUpdate: () => ({}),
      refreshCapabilities: true,
    });
  }
}

const getOrCreateUserProfileCached = cache(async (clerkUserId: string): Promise<UserProfile | null> => {
  return getOrCreateUserProfileUncached(clerkUserId);
});

export async function getOrCreateUserProfile(clerkUserId: string): Promise<UserProfile | null> {
  return getOrCreateUserProfileCached(clerkUserId);
}

const getProfileSnapshotCached = cache(async (clerkUserId: string): Promise<ProfileSnapshot | null> => {
  const row = await getOrCreateUserProfile(clerkUserId);
  return row ? toSnapshot(row) : null;
});

export async function getProfileSnapshot(clerkUserId: string): Promise<ProfileSnapshot | null> {
  return getProfileSnapshotCached(clerkUserId);
}

export class OnboardingStateError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 409, code = "onboarding_state_invalid") {
    super(message);
    this.name = "OnboardingStateError";
    this.status = status;
    this.code = code;
  }
}

export async function saveOnboardingProgress(input: {
  clerkUserId: string;
  step: OnboardingStep;
  onboardingStartLane?: OnboardingStartLane;
}) {
  if (!dbConfigured()) {
    return null;
  }

  const profile = await getOrCreateUserProfile(input.clerkUserId);
  if (!profile) {
    return null;
  }
  if (profile.onboardingCompletedAt) {
    return toSnapshot(profile);
  }

  const currentStep = normalizeOnboardingStep(profile.onboardingStep);
  if (!canAdvanceOnboardingStep(currentStep, input.step)) {
    throw new OnboardingStateError("Finish the current onboarding step before moving ahead.", 409, "onboarding_step_locked");
  }

  const effectiveLane = input.onboardingStartLane ?? normalizeOnboardingStartLane(profile.onboardingStartLane) ?? null;
  if (input.step === "permissions" && !effectiveLane) {
    throw new OnboardingStateError("Choose a starting lane before opening permissions.", 409, "onboarding_lane_required");
  }
  if (input.step === "complete" && !effectiveLane) {
    throw new OnboardingStateError("Choose a starting lane before finishing onboarding.", 409, "onboarding_lane_required");
  }

  const nextStep = maxOnboardingStep(currentStep, input.step);
  const row = await upsertProfileCompat({
    clerkUserId: input.clerkUserId,
    buildCreate: (capabilities) => ({
      ...defaultCreateData(input.clerkUserId, {
        includeQuranLane: capabilities.hasQuranLaneColumns,
        includeOnboardingState: capabilities.hasOnboardingStateColumns,
      }),
      ...(capabilities.hasOnboardingStateColumns
        ? {
            onboardingStep: nextStep,
            ...(effectiveLane ? { onboardingStartLane: effectiveLane } : {}),
          }
        : {}),
    }),
    buildUpdate: (capabilities) => (
      capabilities.hasOnboardingStateColumns
        ? {
            onboardingStep: nextStep,
            ...(input.onboardingStartLane ? { onboardingStartLane: effectiveLane } : {}),
          }
        : {}
    ),
  });
  return toSnapshot(row);
}

export async function saveStartPoint(
  clerkUserId: string,
  activeSurahNumber: number,
  cursorAyahId: number,
  input?: { onboardingStep?: OnboardingStep },
) {
  if (!dbConfigured()) {
    return null;
  }
  const profile = input?.onboardingStep ? await getOrCreateUserProfile(clerkUserId) : null;
  const nextOnboardingStep = input?.onboardingStep
    ? maxOnboardingStep(normalizeOnboardingStep(profile?.onboardingStep), input.onboardingStep)
    : null;
  const row = await upsertProfileCompat({
    clerkUserId,
    buildCreate: (capabilities) => ({
      ...defaultCreateData(clerkUserId, {
        includeQuranLane: capabilities.hasQuranLaneColumns,
        includeOnboardingState: capabilities.hasOnboardingStateColumns,
      }),
      activeSurahNumber,
      cursorAyahId,
      ...(capabilities.hasOnboardingStateColumns && nextOnboardingStep
        ? { onboardingStep: nextOnboardingStep }
        : {}),
    }),
    buildUpdate: (capabilities) => ({
      activeSurahNumber,
      cursorAyahId,
      ...(capabilities.hasOnboardingStateColumns && nextOnboardingStep
        ? { onboardingStep: nextOnboardingStep }
        : {}),
    }),
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
    buildCreate: (capabilities) => ({
      ...defaultCreateData(clerkUserId, {
        includeQuranLane: capabilities.hasQuranLaneColumns,
        includeOnboardingState: capabilities.hasOnboardingStateColumns,
      }),
      ...(capabilities.hasQuranLaneColumns
        ? { quranActiveSurahNumber, quranCursorAyahId }
        : {}),
    }),
    buildUpdate: (capabilities) =>
      capabilities.hasQuranLaneColumns
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
  quranTranslationId?: QuranTranslationId;
}) {
  if (!dbConfigured()) {
    return null;
  }
  const practiceDays = Array.from({ length: 7 }, (_, i) => i).slice(
    0,
    Math.max(1, Math.min(7, Math.floor(input.practiceDaysPerWeek))),
  );
  const boundedDailyMinutes = Math.max(5, Math.min(240, Math.floor(input.dailyMinutes)));
  const profile = await getOrCreateUserProfile(input.clerkUserId);
  const nextOnboardingStep = maxOnboardingStep(normalizeOnboardingStep(profile?.onboardingStep), "start-point");
  const row = await upsertProfileCompat({
    clerkUserId: input.clerkUserId,
    buildCreate: (capabilities) => ({
      ...defaultCreateData(input.clerkUserId, {
        includeQuranLane: capabilities.hasQuranLaneColumns,
        includeOnboardingState: capabilities.hasOnboardingStateColumns,
      }),
      dailyMinutes: boundedDailyMinutes,
      practiceDays,
      planBias: input.planBias,
      ...(capabilities.hasQuranLaneColumns ? { hasTeacher: input.hasTeacher } : {}),
      ...(capabilities.hasQuranLaneColumns && input.quranTranslationId
        ? { quranTranslationId: input.quranTranslationId }
        : {}),
      timezone: input.timezone || "UTC",
      ...(capabilities.hasOnboardingStateColumns
        ? { onboardingStep: nextOnboardingStep }
        : {}),
    }),
    buildUpdate: (capabilities) => ({
      dailyMinutes: boundedDailyMinutes,
      practiceDays,
      planBias: input.planBias,
      ...(capabilities.hasQuranLaneColumns ? { hasTeacher: input.hasTeacher } : {}),
      ...(capabilities.hasQuranLaneColumns && input.quranTranslationId
        ? { quranTranslationId: input.quranTranslationId }
        : {}),
      timezone: input.timezone || "UTC",
      ...(capabilities.hasOnboardingStateColumns
        ? { onboardingStep: nextOnboardingStep }
        : {}),
    }),
  });
  return toSnapshot(row);
}

export async function quickStartOnboarding(input: {
  clerkUserId: string;
  dailyMinutes: number;
  practiceDaysPerWeek: number;
  planBias: PlanBias;
  hasTeacher: boolean;
  timezone: string;
  quranTranslationId: QuranTranslationId;
  onboardingStartLane?: OnboardingStartLane;
}) {
  if (!dbConfigured()) {
    return null;
  }

  const practiceDays = Array.from({ length: 7 }, (_, i) => i).slice(
    0,
    Math.max(1, Math.min(7, Math.floor(input.practiceDaysPerWeek))),
  );
  const boundedDailyMinutes = Math.max(5, Math.min(240, Math.floor(input.dailyMinutes)));
  const completedAt = new Date();
  const startLane = normalizeOnboardingStartLane(input.onboardingStartLane) ?? "hifz";

  const row = await upsertProfileCompat({
    clerkUserId: input.clerkUserId,
    buildCreate: (capabilities) => ({
      ...defaultCreateData(input.clerkUserId, {
        includeQuranLane: capabilities.hasQuranLaneColumns,
        includeOnboardingState: capabilities.hasOnboardingStateColumns,
      }),
      dailyMinutes: boundedDailyMinutes,
      practiceDays,
      planBias: input.planBias,
      timezone: input.timezone || "UTC",
      onboardingCompletedAt: completedAt,
      ...(capabilities.hasQuranLaneColumns
        ? {
            hasTeacher: input.hasTeacher,
            quranTranslationId: input.quranTranslationId,
          }
        : {}),
      ...(capabilities.hasOnboardingStateColumns
        ? {
            onboardingStep: "complete",
            onboardingStartLane: startLane,
          }
        : {}),
    }),
    buildUpdate: (capabilities) => ({
      dailyMinutes: boundedDailyMinutes,
      practiceDays,
      planBias: input.planBias,
      timezone: input.timezone || "UTC",
      onboardingCompletedAt: completedAt,
      ...(capabilities.hasQuranLaneColumns
        ? {
            hasTeacher: input.hasTeacher,
            quranTranslationId: input.quranTranslationId,
          }
        : {}),
      ...(capabilities.hasOnboardingStateColumns
        ? {
            onboardingStep: "complete",
            onboardingStartLane: startLane,
          }
        : {}),
    }),
  });

  return toSnapshot(row);
}

export async function markOnboardingComplete(input: {
  clerkUserId: string;
  onboardingStartLane?: OnboardingStartLane;
}) {
  if (!dbConfigured()) {
    return null;
  }
  const profile = await getOrCreateUserProfile(input.clerkUserId);
  if (!profile) {
    return null;
  }
  if (profile.onboardingCompletedAt) {
    return toSnapshot(profile);
  }

  // The completion endpoint is the last recovery point in the onboarding flow.
  // If earlier progress writes failed, we still want a new user who reached the
  // final screen to be able to finish with a valid starting lane.
  const startLane = normalizeOnboardingStartLane(input.onboardingStartLane ?? profile.onboardingStartLane);
  if (!startLane) {
    throw new OnboardingStateError("Choose your opening lane before completing onboarding.", 409, "onboarding_lane_required");
  }
  const completedAt = new Date();
  const row = await upsertProfileCompat({
    clerkUserId: input.clerkUserId,
    buildCreate: (capabilities) => ({
      ...defaultCreateData(input.clerkUserId, {
        includeQuranLane: capabilities.hasQuranLaneColumns,
        includeOnboardingState: capabilities.hasOnboardingStateColumns,
      }),
      onboardingCompletedAt: completedAt,
      ...(capabilities.hasOnboardingStateColumns
        ? {
            onboardingStep: "complete",
            onboardingStartLane: startLane,
          }
        : {}),
    }),
    buildUpdate: (capabilities) => ({
      onboardingCompletedAt: completedAt,
      ...(capabilities.hasOnboardingStateColumns
        ? {
            onboardingStep: "complete",
            onboardingStartLane: startLane,
          }
        : {}),
    }),
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
    buildCreate: (capabilities) => ({
      ...defaultCreateData(input.clerkUserId, {
        includeQuranLane: capabilities.hasQuranLaneColumns,
        includeOnboardingState: capabilities.hasOnboardingStateColumns,
      }),
      reminderTimeLocal: input.reminderTimeLocal,
      ...(capabilities.hasQuranLaneColumns
        ? {
            emailRemindersEnabled: input.emailRemindersEnabled,
            emailUnsubscribedAt: unsubscribedAt,
          }
        : {}),
    }),
    buildUpdate: (capabilities) => ({
      reminderTimeLocal: input.reminderTimeLocal,
      ...(capabilities.hasQuranLaneColumns
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
    buildCreate: (capabilities) => ({
      ...defaultCreateData(input.clerkUserId, {
        includeQuranLane: capabilities.hasQuranLaneColumns,
        includeOnboardingState: capabilities.hasOnboardingStateColumns,
      }),
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

export async function saveReciterPrefs(input: {
  clerkUserId: string;
  reciterId: string;
}) {
  if (!dbConfigured()) {
    return null;
  }
  const reciterId = normalizeReciterId(input.reciterId);
  const row = await upsertProfileCompat({
    clerkUserId: input.clerkUserId,
    buildCreate: (capabilities) => ({
      ...defaultCreateData(input.clerkUserId, {
        includeQuranLane: capabilities.hasQuranLaneColumns,
        includeOnboardingState: capabilities.hasOnboardingStateColumns,
      }),
      reciterId,
    }),
    buildUpdate: () => ({ reciterId }),
  });
  return toSnapshot(row);
}

export async function saveLanguagePrefs(input: {
  clerkUserId: string;
  quranTranslationId: QuranTranslationId;
}) {
  if (!dbConfigured()) {
    return null;
  }
  const row = await upsertProfileCompat({
    clerkUserId: input.clerkUserId,
    buildCreate: (capabilities) => ({
      ...defaultCreateData(input.clerkUserId, {
        includeQuranLane: capabilities.hasQuranLaneColumns,
        includeOnboardingState: capabilities.hasOnboardingStateColumns,
      }),
      ...(capabilities.hasQuranLaneColumns ? { quranTranslationId: input.quranTranslationId } : {}),
    }),
    buildUpdate: (capabilities) =>
      capabilities.hasQuranLaneColumns
        ? { quranTranslationId: input.quranTranslationId }
        : {},
  });
  return toSnapshot(row);
}

export async function saveQuranReaderPrefs(input: {
  clerkUserId: string;
  quranShowDetails: boolean;
}) {
  if (!dbConfigured()) {
    return null;
  }
  const row = await upsertProfileCompat({
    clerkUserId: input.clerkUserId,
    buildCreate: (capabilities) => ({
      ...defaultCreateData(input.clerkUserId, {
        includeQuranLane: capabilities.hasQuranLaneColumns,
        includeOnboardingState: capabilities.hasOnboardingStateColumns,
      }),
      ...(capabilities.hasQuranLaneColumns ? { quranShowDetails: input.quranShowDetails } : {}),
    }),
    buildUpdate: (capabilities) =>
      capabilities.hasQuranLaneColumns
        ? { quranShowDetails: input.quranShowDetails }
        : {},
  });
  return toSnapshot(row);
}

export async function listLearningLanes(clerkUserId: string, limit = 8): Promise<LearningLaneSnapshot[]> {
  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    return [];
  }
  const activeSurahNumber = profile.activeSurahNumber;

  // Use a single SQL query (ROW_NUMBER OVER PARTITION BY) instead of fetching
  // up to 4000 rows and reducing in JS. Returns at most 114 rows (one per surah).
  let rows: Array<{ surahNumber: number; ayahId: number; createdAt: Date }> = [];
  try {
    rows = await db().$queryRaw<Array<{ surahNumber: number; ayahId: number; createdAt: Date }>>`
      SELECT "surahNumber", "ayahId", "createdAt"
      FROM (
        SELECT "surahNumber", "ayahId", "createdAt",
               ROW_NUMBER() OVER (
                 PARTITION BY "surahNumber"
                 ORDER BY "createdAt" DESC, "id" DESC
               ) AS rn
        FROM "ReviewEvent"
        WHERE "userId" = ${profile.id}
          AND "grade" IS NOT NULL
      ) sub
      WHERE rn = 1
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `;
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
