import "server-only";

import type {
  AyahReview,
  AttemptStage,
  Prisma,
  ReviewPhase,
  SrsGrade,
  UserProfile,
  WeakTransition,
} from "@prisma/client";
import { db } from "@/lib/db";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { isoDateInTimeZone } from "@/hifzer/engine/date";
import { buildTodayEngineQueue } from "@/hifzer/engine/queue-builder";
import { isWarmupGatePassed } from "@/hifzer/engine/gates";
import {
  monthlyGateOutcome,
  moderateRebalanceProfilePatch,
  retention3dAverage,
  shouldForceMonthlyTest,
} from "@/hifzer/engine/monthly-audit";
import { isTransitionSuccess, isWeakTransition } from "@/hifzer/engine/transitions";
import { updateLearnedAverages } from "@/hifzer/engine/debt";
import type { SessionEventInput, SessionStep, TodayEngineResult, TodayQueuePlan } from "@/hifzer/engine/types";
import { applyGrade, defaultReviewState } from "@/hifzer/srs/update";
import { getAyahById, verseRefFromAyahId } from "@/hifzer/quran/lookup.server";
import { listSahihTranslationsForAyahIds } from "@/hifzer/quran/translation.server";
import { getCoreSchemaCapabilities } from "@/lib/db-compat";

function shiftIsoDate(iso: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) {
    return iso;
  }
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function seconds(n: number, fallback: number): number {
  if (!Number.isFinite(n) || n <= 0) {
    return fallback;
  }
  return Math.max(1, Math.floor(n));
}

function isRecallEvent(event: SessionEventInput): boolean {
  if (!event.grade) {
    return false;
  }
  if (event.stage === "WARMUP" || event.stage === "REVIEW" || event.stage === "WEEKLY_TEST" || event.stage === "LINK_REPAIR") {
    return true;
  }
  if (event.stage === "NEW" && event.phase === "NEW_BLIND") {
    return true;
  }
  if (event.stage === "LINK" || event.phase === "LINK_REPAIR") {
    return true;
  }
  return false;
}

function classifyBand(station: number): "ENCODING" | "SABQI" | "MANZIL" | "MASTERED" {
  if (station <= 2) {
    return "ENCODING";
  }
  if (station <= 4) {
    return "SABQI";
  }
  if (station <= 6) {
    return "MANZIL";
  }
  return "MASTERED";
}

function buildSteps(queue: TodayEngineResult["queue"]): SessionStep[] {
  const steps: SessionStep[] = [];

  for (const ayahId of queue.warmupAyahIds) {
    steps.push({ kind: "AYAH", stage: "WARMUP", phase: "STANDARD", ayahId });
  }
  for (const ayahId of queue.weeklyGateAyahIds) {
    steps.push({ kind: "AYAH", stage: "WEEKLY_TEST", phase: "WEEKLY_TEST", ayahId });
  }
  for (const ayahId of queue.sabqiReviewAyahIds) {
    steps.push({ kind: "AYAH", stage: "REVIEW", phase: "STANDARD", ayahId, reviewTier: "SABQI" });
  }
  for (const ayahId of queue.manzilReviewAyahIds) {
    steps.push({ kind: "AYAH", stage: "REVIEW", phase: "STANDARD", ayahId, reviewTier: "MANZIL" });
  }
  for (const link of queue.repairLinks) {
    steps.push({
      kind: "LINK",
      stage: "LINK_REPAIR",
      phase: "LINK_REPAIR",
      fromAyahId: link.fromAyahId,
      toAyahId: link.toAyahId,
    });
  }

  let previousNewAyahId: number | null = null;
  for (const ayahId of queue.newAyahIds) {
    steps.push({ kind: "AYAH", stage: "NEW", phase: "NEW_EXPOSE", ayahId });
    steps.push({ kind: "AYAH", stage: "NEW", phase: "NEW_GUIDED", ayahId });
    steps.push({ kind: "AYAH", stage: "NEW", phase: "NEW_BLIND", ayahId });
    if (previousNewAyahId) {
      steps.push({
        kind: "LINK",
        stage: "LINK",
        phase: "STANDARD",
        fromAyahId: previousNewAyahId,
        toAyahId: ayahId,
      });
    }
    previousNewAyahId = ayahId;
  }

  return steps;
}

const SESSION_PLAN_VERSION = 1;

type SessionPlanSnapshot = {
  version: number;
  localDate: string;
  mode: TodayEngineResult["mode"];
  warmupRequired: boolean;
  weeklyGateRequired: boolean;
  monthlyTestRequired: boolean;
  newUnlocked: boolean;
  steps: SessionStep[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseSessionStep(raw: unknown): SessionStep | null {
  if (!isRecord(raw)) {
    return null;
  }

  const kind = raw.kind;
  if (kind === "AYAH") {
    const stage = raw.stage;
    const phase = raw.phase;
    const ayahId = Number(raw.ayahId);
    const reviewTierRaw = raw.reviewTier;
    const reviewTier = reviewTierRaw === "SABQI" || reviewTierRaw === "MANZIL" ? reviewTierRaw : undefined;
    if (
      (stage !== "WARMUP" && stage !== "REVIEW" && stage !== "NEW" && stage !== "WEEKLY_TEST" && stage !== "LINK_REPAIR") ||
      (phase !== "STANDARD" && phase !== "NEW_EXPOSE" && phase !== "NEW_GUIDED" && phase !== "NEW_BLIND" && phase !== "WEEKLY_TEST" && phase !== "LINK_REPAIR") ||
      !Number.isFinite(ayahId) ||
      ayahId < 1
    ) {
      return null;
    }
    return {
      kind: "AYAH",
      stage,
      phase,
      ayahId: Math.floor(ayahId),
      reviewTier,
    };
  }

  if (kind === "LINK") {
    const stage = raw.stage;
    const phase = raw.phase;
    const fromAyahId = Number(raw.fromAyahId);
    const toAyahId = Number(raw.toAyahId);
    if (
      (stage !== "LINK" && stage !== "LINK_REPAIR") ||
      (phase !== "STANDARD" && phase !== "LINK_REPAIR") ||
      !Number.isFinite(fromAyahId) ||
      !Number.isFinite(toAyahId) ||
      fromAyahId < 1 ||
      toAyahId < 1
    ) {
      return null;
    }
    return {
      kind: "LINK",
      stage,
      phase,
      fromAyahId: Math.floor(fromAyahId),
      toAyahId: Math.floor(toAyahId),
    };
  }

  return null;
}

function parseSessionPlanSnapshot(raw: Prisma.JsonValue | null | undefined): SessionPlanSnapshot | null {
  if (!isRecord(raw)) {
    return null;
  }
  const version = Number(raw.version);
  const localDate = typeof raw.localDate === "string" ? raw.localDate : "";
  const mode = raw.mode;
  const warmupRequired = raw.warmupRequired;
  const weeklyGateRequired = raw.weeklyGateRequired;
  const monthlyTestRequired = raw.monthlyTestRequired;
  const newUnlocked = raw.newUnlocked;
  const rawSteps = raw.steps;

  if (
    version !== SESSION_PLAN_VERSION ||
    !/^\d{4}-\d{2}-\d{2}$/.test(localDate) ||
    (mode !== "NORMAL" && mode !== "CONSOLIDATION" && mode !== "CATCH_UP") ||
    typeof warmupRequired !== "boolean" ||
    typeof weeklyGateRequired !== "boolean" ||
    typeof monthlyTestRequired !== "boolean" ||
    typeof newUnlocked !== "boolean" ||
    !Array.isArray(rawSteps)
  ) {
    return null;
  }

  const steps: SessionStep[] = [];
  for (const item of rawSteps) {
    const step = parseSessionStep(item);
    if (!step) {
      return null;
    }
    steps.push(step);
  }

  return {
    version,
    localDate,
    mode,
    warmupRequired,
    weeklyGateRequired,
    monthlyTestRequired,
    newUnlocked,
    steps,
  };
}

function buildSessionPlanSnapshot(localDate: string, state: TodayEngineResult, steps: SessionStep[]): Prisma.JsonObject {
  return {
    version: SESSION_PLAN_VERSION,
    localDate,
    mode: state.mode,
    warmupRequired: state.warmupRequired,
    weeklyGateRequired: state.weeklyGateRequired,
    monthlyTestRequired: state.monthlyTestRequired,
    newUnlocked: state.newUnlocked,
    steps,
  } satisfies Prisma.JsonObject;
}

function queueFromSteps(steps: SessionStep[]): TodayQueuePlan {
  const newAyahIdsSet = new Set<number>();
  const queue: TodayQueuePlan = {
    warmupAyahIds: [],
    weeklyGateAyahIds: [],
    sabqiReviewAyahIds: [],
    manzilReviewAyahIds: [],
    repairLinks: [],
    newAyahIds: [],
  };

  for (const step of steps) {
    if (step.kind === "LINK") {
      if (step.stage === "LINK_REPAIR") {
        queue.repairLinks.push({ fromAyahId: step.fromAyahId, toAyahId: step.toAyahId });
      }
      continue;
    }

    if (step.stage === "WARMUP") {
      queue.warmupAyahIds.push(step.ayahId);
      continue;
    }

    if (step.stage === "WEEKLY_TEST") {
      queue.weeklyGateAyahIds.push(step.ayahId);
      continue;
    }

    if (step.stage === "REVIEW") {
      if (step.reviewTier === "SABQI") {
        queue.sabqiReviewAyahIds.push(step.ayahId);
      } else if (step.reviewTier === "MANZIL") {
        queue.manzilReviewAyahIds.push(step.ayahId);
      }
      continue;
    }

    if (step.stage === "NEW") {
      newAyahIdsSet.add(step.ayahId);
    }
  }

  queue.newAyahIds = Array.from(newAyahIdsSet).sort((a, b) => a - b);
  return queue;
}

function stateWithSessionPlan(baseState: TodayEngineResult, plan: SessionPlanSnapshot): TodayEngineResult {
  return {
    ...baseState,
    localDate: plan.localDate,
    mode: plan.mode,
    warmupRequired: plan.warmupRequired,
    weeklyGateRequired: plan.weeklyGateRequired,
    monthlyTestRequired: plan.monthlyTestRequired,
    newUnlocked: plan.newUnlocked,
    queue: queueFromSteps(plan.steps),
  };
}

function toAttemptStage(stage: SessionEventInput["stage"]): AttemptStage {
  return stage;
}

function toReviewPhase(phase: SessionEventInput["phase"]): ReviewPhase {
  return phase;
}

function looksLikeMissingCoreSchema(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("P2021") ||
    message.includes("P2022") ||
    /column .* does not exist/i.test(message) ||
    /relation .* does not exist/i.test(message)
  );
}

async function withMissingSchemaFallback<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!looksLikeMissingCoreSchema(error)) {
      throw error;
    }
    return fallback;
  }
}

type OpenSessionRecord = {
  id: string;
  startedAt: Date;
  localDate: string;
  mode: UserProfile["mode"];
  weeklyGateRequired: boolean;
  newUnlocked: boolean;
  planJson: Prisma.JsonValue | null;
};

function toOpenSessionRecord(input: {
  id: string;
  startedAt: Date;
  localDate: string;
  mode?: UserProfile["mode"] | null;
  weeklyGateRequired?: boolean | null;
  newUnlocked?: boolean | null;
  planJson?: Prisma.JsonValue | null;
}): OpenSessionRecord {
  return {
    id: input.id,
    startedAt: input.startedAt,
    localDate: input.localDate,
    mode: input.mode ?? "NORMAL",
    weeklyGateRequired: input.weeklyGateRequired ?? false,
    newUnlocked: input.newUnlocked ?? true,
    planJson: input.planJson ?? null,
  };
}

async function findLastCompletedLocalDate(profileId: string): Promise<string | null> {
  const prisma = db();
  const row = await prisma.session.findFirst({
    where: { userId: profileId, status: "COMPLETED" },
    orderBy: { startedAt: "desc" },
    select: { localDate: true },
  });
  return row?.localDate ?? null;
}

async function yesterdayNewAyahIds(profileId: string, localDate: string): Promise<number[]> {
  const yesterday = shiftIsoDate(localDate, -1);
  const prisma = db();
  const row = await prisma.session.findFirst({
    where: { userId: profileId, status: "COMPLETED", localDate: yesterday },
    orderBy: { startedAt: "desc" },
    select: { newStartAyahId: true, newEndAyahId: true },
  });
  if (!row?.newStartAyahId || !row?.newEndAyahId) {
    return [];
  }
  const out: number[] = [];
  for (let ayahId = row.newStartAyahId; ayahId <= row.newEndAyahId; ayahId += 1) {
    out.push(ayahId);
  }
  return out;
}

async function weeklyGateDue(profileId: string, now: Date): Promise<boolean> {
  const prisma = db();
  const row = await prisma.qualityGateRun.findFirst({
    where: { userId: profileId, gateType: "WEEKLY" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!row) {
    return true;
  }
  const diffMs = now.getTime() - row.createdAt.getTime();
  return diffMs >= (7 * 24 * 60 * 60 * 1000);
}

async function loadRetention3d(profileId: string, now: Date): Promise<number> {
  const prisma = db();
  const since = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
  const events = await prisma.reviewEvent.findMany({
    where: { userId: profileId, createdAt: { gte: since } },
    select: { stage: true, phase: true, grade: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return retention3dAverage({ events, now });
}

export async function loadTodayState(clerkUserId: string): Promise<{
  profile: UserProfile;
  state: TodayEngineResult;
  steps: SessionStep[];
}> {
  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    throw new Error("Database not configured.");
  }

  const prisma = db();
  const now = new Date();
  const localDate = isoDateInTimeZone(now, profile.timezone);
  const capabilities = await getCoreSchemaCapabilities();
  const hasSessionModernColumns = capabilities.hasSessionModernColumns;

  const [allReviews, weakTransitions, lastCompletedLocalDate, retention3dAvg, weeklyDue, yesterdayNew] = await Promise.all([
    hasSessionModernColumns
      ? withMissingSchemaFallback<AyahReview[]>(
          () => prisma.ayahReview.findMany({ where: { userId: profile.id } }),
          [],
        )
      : Promise.resolve<AyahReview[]>([]),
    hasSessionModernColumns
      ? withMissingSchemaFallback<WeakTransition[]>(
          () => prisma.weakTransition.findMany({ where: { userId: profile.id } }),
          [],
        )
      : Promise.resolve<WeakTransition[]>([]),
    withMissingSchemaFallback<string | null>(() => findLastCompletedLocalDate(profile.id), null),
    hasSessionModernColumns
      ? withMissingSchemaFallback<number>(() => loadRetention3d(profile.id, now), 2)
      : Promise.resolve(2),
    hasSessionModernColumns
      ? withMissingSchemaFallback<boolean>(() => weeklyGateDue(profile.id, now), true)
      : Promise.resolve(true),
    withMissingSchemaFallback<number[]>(() => yesterdayNewAyahIds(profile.id, localDate), []),
  ]);
  const dueReviews = allReviews.filter((r) => r.nextReviewAt.getTime() <= now.getTime());
  const dueSoonHorizon = now.getTime() + (6 * 60 * 60 * 1000);
  const dueSoonCount = allReviews.filter((r) => {
    const ts = r.nextReviewAt.getTime();
    return ts > now.getTime() && ts <= dueSoonHorizon;
  }).length;
  const nextDueAtDate = allReviews
    .map((r) => r.nextReviewAt)
    .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

  let state = buildTodayEngineQueue({
    profile,
    now,
    allReviews,
    dueReviews,
    weakTransitions,
    yesterdayNewAyahIds: yesterdayNew,
    lastCompletedLocalDate,
    weeklyGateDue: weeklyDue,
    retention3dAvg,
    monthlyTestRequired: false,
  });
  state = {
    ...state,
    monthlyTestRequired: shouldForceMonthlyTest({
      debtRatio: state.debtRatio,
      retention3dAvg: state.retention3dAvg,
    }),
    dueNowCount: dueReviews.length,
    dueSoonCount,
    nextDueAt: nextDueAtDate ? nextDueAtDate.toISOString() : null,
  };

  return { profile, state, steps: buildSteps(state.queue) };
}

async function ensureOpenSession(
  profile: UserProfile,
  state: TodayEngineResult,
  steps: SessionStep[],
): Promise<{ session: OpenSessionRecord; state: TodayEngineResult; steps: SessionStep[] }> {
  const prisma = db();
  const capabilities = await getCoreSchemaCapabilities();
  const hasSessionModernColumns = capabilities.hasSessionModernColumns;
  const hasSessionPlanJson = hasSessionModernColumns && capabilities.hasSessionPlanJson;

  let existing: OpenSessionRecord | null;
  if (hasSessionModernColumns) {
    if (hasSessionPlanJson) {
      const row = await withMissingSchemaFallback(
        () =>
          prisma.session.findFirst({
            where: {
              userId: profile.id,
              status: "OPEN",
              localDate: state.localDate,
            },
            orderBy: { startedAt: "desc" },
            select: {
              id: true,
              startedAt: true,
              localDate: true,
              mode: true,
              weeklyGateRequired: true,
              newUnlocked: true,
              planJson: true,
            },
          }),
        null,
      );
      existing = row ? toOpenSessionRecord(row) : null;
    } else {
      const row = await withMissingSchemaFallback(
        () =>
          prisma.session.findFirst({
            where: {
              userId: profile.id,
              status: "OPEN",
              localDate: state.localDate,
            },
            orderBy: { startedAt: "desc" },
            select: {
              id: true,
              startedAt: true,
              localDate: true,
              mode: true,
              weeklyGateRequired: true,
              newUnlocked: true,
            },
          }),
        null,
      );
      existing = row ? toOpenSessionRecord(row) : null;
    }
  } else {
    const row = await withMissingSchemaFallback(
      () =>
        prisma.session.findFirst({
          where: {
            userId: profile.id,
            status: "OPEN",
            localDate: state.localDate,
          },
          orderBy: { startedAt: "desc" },
          select: {
            id: true,
            startedAt: true,
            localDate: true,
          },
        }),
      null,
    );
    existing = row ? toOpenSessionRecord(row) : null;
  }

  if (existing) {
    if (hasSessionPlanJson) {
      const plan = parseSessionPlanSnapshot(existing.planJson);
      if (plan && plan.localDate === existing.localDate) {
        return {
          session: existing,
          state: stateWithSessionPlan(state, plan),
          steps: plan.steps,
        };
      }
      const updated = await withMissingSchemaFallback(
        () =>
          prisma.session.update({
            where: { id: existing.id },
            data: {
              planJson: buildSessionPlanSnapshot(existing.localDate, state, steps),
            },
            select: {
              id: true,
              startedAt: true,
              localDate: true,
              mode: true,
              weeklyGateRequired: true,
              newUnlocked: true,
              planJson: true,
            },
          }),
        null,
      );
      if (updated) {
        return { session: toOpenSessionRecord(updated), state, steps };
      }
    }
    return { session: existing, state, steps };
  }

  const reviewAyahIds = [
    ...state.queue.weeklyGateAyahIds,
    ...state.queue.sabqiReviewAyahIds,
    ...state.queue.manzilReviewAyahIds,
  ];

  if (hasSessionModernColumns) {
    if (hasSessionPlanJson) {
      const session = await prisma.session.create({
        data: {
          userId: profile.id,
          status: "OPEN",
          localDate: state.localDate,
          mode: state.mode,
          reviewDebtMinutesAtStart: Math.round(state.reviewDebtMinutes),
          warmupPassed: state.warmupRequired ? null : true,
          warmupRetryUsed: false,
          weeklyGateRequired: state.weeklyGateRequired,
          weeklyGatePassed: state.weeklyGateRequired ? null : true,
          newUnlocked: state.newUnlocked,
          warmupAyahIds: state.queue.warmupAyahIds,
          reviewAyahIds,
          newStartAyahId: state.queue.newAyahIds[0] ?? null,
          newEndAyahId: state.queue.newAyahIds.length
            ? state.queue.newAyahIds[state.queue.newAyahIds.length - 1]
            : null,
          planJson: buildSessionPlanSnapshot(state.localDate, state, steps),
        },
        select: {
          id: true,
          startedAt: true,
          localDate: true,
          mode: true,
          weeklyGateRequired: true,
          newUnlocked: true,
          planJson: true,
        },
      });
      return { session: toOpenSessionRecord(session), state, steps };
    }

    const session = await prisma.session.create({
      data: {
        userId: profile.id,
        status: "OPEN",
        localDate: state.localDate,
        mode: state.mode,
        reviewDebtMinutesAtStart: Math.round(state.reviewDebtMinutes),
        warmupPassed: state.warmupRequired ? null : true,
        warmupRetryUsed: false,
        weeklyGateRequired: state.weeklyGateRequired,
        weeklyGatePassed: state.weeklyGateRequired ? null : true,
        newUnlocked: state.newUnlocked,
        warmupAyahIds: state.queue.warmupAyahIds,
        reviewAyahIds,
        newStartAyahId: state.queue.newAyahIds[0] ?? null,
        newEndAyahId: state.queue.newAyahIds.length
          ? state.queue.newAyahIds[state.queue.newAyahIds.length - 1]
          : null,
      },
      select: {
        id: true,
        startedAt: true,
        localDate: true,
        mode: true,
        weeklyGateRequired: true,
        newUnlocked: true,
      },
    });
    return { session: toOpenSessionRecord(session), state, steps };
  }

  const legacySession = await prisma.session.create({
    data: {
      userId: profile.id,
      status: "OPEN",
      localDate: state.localDate,
      warmupAyahIds: state.queue.warmupAyahIds,
      reviewAyahIds,
      newStartAyahId: state.queue.newAyahIds[0] ?? null,
      newEndAyahId: state.queue.newAyahIds.length
        ? state.queue.newAyahIds[state.queue.newAyahIds.length - 1]
        : null,
    },
    select: {
      id: true,
      startedAt: true,
      localDate: true,
    },
  });
  return { session: toOpenSessionRecord(legacySession), state, steps };
}

export async function startTodaySession(clerkUserId: string) {
  const { profile, state, steps } = await loadTodayState(clerkUserId);
  const openSession = await ensureOpenSession(profile, state, steps);
  const session = openSession.session;
  const sessionState = openSession.state;
  const sessionSteps = openSession.steps;
  const ayahIdSet = new Set<number>();
  for (const step of sessionSteps) {
    if (step.kind === "AYAH") {
      ayahIdSet.add(step.ayahId);
    }
  }
  const stepAyahIds = Array.from(ayahIdSet);
  const translationsByAyahId = listSahihTranslationsForAyahIds(stepAyahIds);
  const ayahTextByAyahId: Record<number, string> = {};
  for (const ayahId of stepAyahIds) {
    const ayah = getAyahById(ayahId);
    if (ayah?.textUthmani) {
      ayahTextByAyahId[ayahId] = ayah.textUthmani;
    }
  }

  return {
    sessionId: session.id,
    startedAt: session.startedAt.toISOString(),
    localDate: session.localDate,
    state: sessionState,
    steps: sessionSteps,
    translations: {
      provider: "tanzil.en.sahih" as const,
      byAyahId: translationsByAyahId,
    },
    ayahTextByAyahId,
  };
}

type CompleteSessionInput = {
  clerkUserId: string;
  sessionId: string;
  startedAt: string;
  endedAt: string;
  localDate?: string;
  events: SessionEventInput[];
};

type CompleteSessionResult = {
  ok: boolean;
  skipped?: boolean;
  sessionId: string;
  updatedCursorAyahId?: number;
};

export async function completeSession(input: CompleteSessionInput): Promise<CompleteSessionResult> {
  const profile = await getOrCreateUserProfile(input.clerkUserId);
  if (!profile) {
    throw new Error("Database not configured.");
  }
  const prisma = db();
  const endedAt = new Date(input.endedAt);
  const startedAt = new Date(input.startedAt);
  if (Number.isNaN(endedAt.getTime()) || Number.isNaN(startedAt.getTime())) {
    throw new Error("Invalid session timestamps.");
  }

  const localDate = input.localDate || isoDateInTimeZone(endedAt, profile.timezone);
  const events = [...input.events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const result = await prisma.$transaction(async (tx) => {
    const currentSession = await tx.session.findFirst({
      where: { id: input.sessionId, userId: profile.id },
    });
    if (currentSession?.status === "COMPLETED") {
      return { ok: true, skipped: true, sessionId: currentSession.id } as CompleteSessionResult;
    }

    const session = currentSession ?? await tx.session.create({
      data: {
        id: input.sessionId,
        userId: profile.id,
        status: "OPEN",
        localDate,
        startedAt,
        mode: profile.mode,
        reviewDebtMinutesAtStart: 0,
        warmupRetryUsed: false,
        weeklyGateRequired: false,
        newUnlocked: true,
        warmupAyahIds: [],
        reviewAyahIds: [],
      },
    });

    if (events.length) {
      await tx.reviewEvent.createMany({
        data: events.map((event) => ({
          userId: profile.id,
          sessionId: session.id,
          surahNumber: verseRefFromAyahId(event.ayahId)?.surahNumber ?? profile.activeSurahNumber,
          ayahId: event.ayahId,
          stage: toAttemptStage(event.stage),
          phase: toReviewPhase(event.phase),
          grade: event.grade ?? null,
          durationSec: Math.max(0, Math.floor(event.durationSec)),
          fromAyahId: event.fromAyahId ?? null,
          toAyahId: event.toAyahId ?? null,
          createdAt: new Date(event.createdAt),
        })),
      });

      const attemptRows = events.filter((event) => event.grade).map((event) => ({
        userId: profile.id,
        sessionId: session.id,
        ayahId: event.ayahId,
        stage: toAttemptStage(event.stage),
        grade: event.grade as SrsGrade,
        createdAt: new Date(event.createdAt),
      }));
      if (attemptRows.length) {
        await tx.ayahAttempt.createMany({ data: attemptRows });
      }
    }

    const recallEvents = events.filter((event) => isRecallEvent(event));
    const touchedAyahIds = Array.from(new Set(recallEvents.map((event) => event.ayahId)));
    if (touchedAyahIds.length) {
      const existing = await tx.ayahReview.findMany({
        where: { userId: profile.id, ayahId: { in: touchedAyahIds } },
      });
      const byAyahId = new Map<number, (typeof existing)[number]>();
      for (const row of existing) {
        byAyahId.set(row.ayahId, row);
      }

      for (const event of recallEvents) {
        if (!event.grade) {
          continue;
        }
        const now = new Date(event.createdAt);
        const current = byAyahId.get(event.ayahId);
        const next = applyGrade(
          current
            ? {
                ayahId: current.ayahId,
                station: current.station,
                checkpointIndex: current.checkpointIndex,
                nextIntervalMinutes: current.nextIntervalMinutes,
                intervalDays: current.intervalDays,
                easeFactor: current.easeFactor,
                repetitions: current.repetitions,
                lapses: current.lapses,
                nextReviewAt: current.nextReviewAt,
                lastDurationSec: current.lastDurationSec ?? undefined,
                lastReviewAt: current.lastReviewAt ?? undefined,
                lastGrade: current.lastGrade ?? undefined,
              }
            : defaultReviewState(event.ayahId, now),
          event.grade,
          now,
          event.durationSec,
        );
        const band = classifyBand(next.station);
        const upserted = await tx.ayahReview.upsert({
          where: {
            userId_ayahId: { userId: profile.id, ayahId: event.ayahId },
          },
          create: {
            userId: profile.id,
            ayahId: event.ayahId,
            band,
            checkpointIndex: next.checkpointIndex,
            nextIntervalMinutes: next.nextIntervalMinutes,
            station: next.station,
            intervalDays: next.intervalDays,
            easeFactor: next.easeFactor,
            repetitions: next.repetitions,
            lapses: next.lapses,
            nextReviewAt: next.nextReviewAt,
            lastDurationSec: next.lastDurationSec ?? null,
            lastReviewAt: next.lastReviewAt ?? null,
            lastGrade: next.lastGrade ?? null,
          },
          update: {
            band,
            checkpointIndex: next.checkpointIndex,
            nextIntervalMinutes: next.nextIntervalMinutes,
            station: next.station,
            intervalDays: next.intervalDays,
            easeFactor: next.easeFactor,
            repetitions: next.repetitions,
            lapses: next.lapses,
            nextReviewAt: next.nextReviewAt,
            lastDurationSec: next.lastDurationSec ?? null,
            lastReviewAt: next.lastReviewAt ?? null,
            lastGrade: next.lastGrade ?? null,
          },
        });
        byAyahId.set(event.ayahId, upserted);
      }
    }

    const latestWarmup = new Map<number, SrsGrade>();
    const warmupEvents = events.filter((event) => event.stage === "WARMUP" && event.grade);
    for (const event of warmupEvents) {
      latestWarmup.set(event.ayahId, event.grade as SrsGrade);
    }
    const warmupGrades = Array.from(latestWarmup.values());
    const warmupPassed = isWarmupGatePassed(warmupGrades);
    const warmupRetryUsed = warmupEvents.length > latestWarmup.size;

    const latestWeekly = new Map<number, SrsGrade>();
    const weeklyEvents = events.filter((event) => event.stage === "WEEKLY_TEST" && event.grade);
    for (const event of weeklyEvents) {
      latestWeekly.set(event.ayahId, event.grade as SrsGrade);
    }
    const weeklyGrades = Array.from(latestWeekly.values());
    const weeklyPassed = isWarmupGatePassed(weeklyGrades);

    let nextCursor = profile.cursorAyahId;
    const newBlindEvents = events
      .filter((event) => event.stage === "NEW" && event.phase === "NEW_BLIND" && event.grade)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const gateBlocked = !warmupPassed || (session.weeklyGateRequired && !weeklyPassed);
    if (!gateBlocked) {
      for (const event of newBlindEvents) {
        if (event.ayahId !== nextCursor) {
          continue;
        }
        if (event.grade === "GOOD" || event.grade === "EASY") {
          nextCursor += 1;
          continue;
        }
        break;
      }
    }

    const linkEvents = events.filter(
      (event) => (event.stage === "LINK" || event.stage === "LINK_REPAIR") &&
        Number.isFinite(event.fromAyahId) &&
        Number.isFinite(event.toAyahId) &&
        event.grade,
    );
    for (const event of linkEvents) {
      const fromAyahId = Number(event.fromAyahId);
      const toAyahId = Number(event.toAyahId);
      const row = await tx.weakTransition.upsert({
        where: {
          userId_fromAyahId_toAyahId: {
            userId: profile.id,
            fromAyahId,
            toAyahId,
          },
        },
        create: {
          userId: profile.id,
          fromAyahId,
          toAyahId,
          attemptCount: 1,
          successCount: isTransitionSuccess(event.grade as SrsGrade) ? 1 : 0,
          failCount: isTransitionSuccess(event.grade as SrsGrade) ? 0 : 1,
          successRateCached: isTransitionSuccess(event.grade as SrsGrade) ? 1 : 0,
          lastGrade: event.grade as SrsGrade,
          lastOccurredAt: new Date(event.createdAt),
        },
        update: {
          attemptCount: { increment: 1 },
          successCount: { increment: isTransitionSuccess(event.grade as SrsGrade) ? 1 : 0 },
          failCount: { increment: isTransitionSuccess(event.grade as SrsGrade) ? 0 : 1 },
          lastGrade: event.grade as SrsGrade,
          lastOccurredAt: new Date(event.createdAt),
        },
      });
      const attemptCount = row.attemptCount;
      const successCount = row.successCount;
      const successRate = attemptCount ? (successCount / attemptCount) : 0;
      const weak = isWeakTransition({ attemptCount, successCount });
      const nextRepairAt = weak ? new Date(endedAt.getTime() + (24 * 60 * 60 * 1000)) : null;
      await tx.weakTransition.update({
        where: { id: row.id },
        data: {
          successRateCached: successRate,
          nextRepairAt,
          resolvedAt: weak ? null : new Date(event.createdAt),
        },
      });
    }

    const reviewDurations = events
      .filter((event) => (event.stage === "WARMUP" || event.stage === "REVIEW" || event.stage === "WEEKLY_TEST") && event.durationSec > 0)
      .map((event) => seconds(event.durationSec, 45));
    const newDurations = events
      .filter((event) => event.stage === "NEW" && event.durationSec > 0)
      .map((event) => seconds(event.durationSec, 90));
    const linkDurations = events
      .filter((event) => (event.stage === "LINK" || event.stage === "LINK_REPAIR") && event.durationSec > 0)
      .map((event) => seconds(event.durationSec, 35));
    const averages = updateLearnedAverages({
      avgReviewSeconds: profile.avgReviewSeconds,
      avgNewSeconds: profile.avgNewSeconds,
      avgLinkSeconds: profile.avgLinkSeconds,
      reviewDurations,
      newDurations,
      linkDurations,
    });

    await tx.userProfile.update({
      where: { id: profile.id },
      data: {
        cursorAyahId: Math.max(profile.cursorAyahId, nextCursor),
        avgReviewSeconds: averages.avgReviewSeconds,
        avgNewSeconds: averages.avgNewSeconds,
        avgLinkSeconds: averages.avgLinkSeconds,
        mode: session.mode,
      },
    });

    if (weeklyEvents.length) {
      const passRate = weeklyEvents.filter((event) => event.grade === "GOOD" || event.grade === "EASY").length /
        weeklyEvents.length;
      await tx.qualityGateRun.create({
        data: {
          userId: profile.id,
          gateType: "WEEKLY",
          windowStart: new Date(endedAt.getTime() - (7 * 24 * 60 * 60 * 1000)),
          windowEnd: endedAt,
          sampleSize: weeklyEvents.length,
          passRate,
          outcome: weeklyPassed ? "PASS" : "FAIL",
          detailsJson: {
            weeklyPassed,
            warmupPassed,
          } satisfies Prisma.JsonObject,
        },
      });
    }

    await tx.session.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        startedAt,
        endedAt,
        localDate,
        warmupPassed,
        warmupRetryUsed,
        weeklyGatePassed: session.weeklyGateRequired ? weeklyPassed : true,
        newUnlocked: session.newUnlocked && warmupPassed && (!session.weeklyGateRequired || weeklyPassed),
      },
    });

    return { ok: true, sessionId: session.id, updatedCursorAyahId: Math.max(profile.cursorAyahId, nextCursor) };
  });

  return result;
}

export async function runMonthlyAuditForUser(clerkUserId: string) {
  const { profile, state } = await loadTodayState(clerkUserId);
  const prisma = db();
  const now = new Date();
  const forceMonthlyTest = shouldForceMonthlyTest({
    debtRatio: state.debtRatio,
    retention3dAvg: state.retention3dAvg,
  });

  await prisma.$transaction(async (tx) => {
    await tx.qualityGateRun.create({
      data: {
        userId: profile.id,
        gateType: "MONTHLY",
        windowStart: new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)),
        windowEnd: now,
        sampleSize: 0,
        passRate: state.retention3dAvg / 3,
        outcome: monthlyGateOutcome({ forceMonthlyTest }),
        detailsJson: {
          debtRatio: state.debtRatio,
          retention3dAvg: state.retention3dAvg,
          forceMonthlyTest,
        } satisfies Prisma.JsonObject,
      },
    });

    await tx.userProfile.update({
      where: { id: profile.id },
      data: moderateRebalanceProfilePatch(now),
    });
  });

  return { forceMonthlyTest };
}
