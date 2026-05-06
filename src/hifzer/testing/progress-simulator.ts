import "server-only";

import type { SrsGrade } from "@prisma/client";
import { completeSession, loadTodayState, runMonthlyAuditForUser, startTodaySession } from "@/hifzer/engine/server";
import type { SessionEventInput, SessionStep } from "@/hifzer/engine/types";
import {
  getOrCreateUserProfile,
  markOnboardingComplete,
  saveAssessment,
  saveQuranStartPoint,
  saveStartPoint,
} from "@/hifzer/profile/server";
import { getAyahById, getSurahInfo } from "@/hifzer/quran/lookup.server";
import { getQuranReadProgress, recordQuranBrowseAyahRead, recordQuranBrowseAyahSet } from "@/hifzer/quran/read-progress.server";
import { getUserStreakSummary } from "@/hifzer/streak/server";
import { db } from "@/lib/db";

const TOTAL_AYAHS = 6236;
const SESSION_PLAN_VERSION = 1;

type SimulatedGradeKey = "WARMUP" | "REVIEW" | "WEEKLY_TEST" | "LINK" | "LINK_REPAIR" | "NEW_BLIND";

export type ProgressSimulationGradePlan = Partial<Record<SimulatedGradeKey, SrsGrade>>;

export type ProgressSimulationDayPlan = {
  dayNumber: number;
  quranAyahsPerDay?: number;
  skipQuran?: boolean;
  skipHifz?: boolean;
  gradePlan?: ProgressSimulationGradePlan;
};

export type ProgressSimulationDay = {
  dayNumber: number;
  simulatedAt: string;
  quranAyahRange: {
    startAyahId: number;
    endAyahId: number;
  };
  hifzSession: {
    sessionId: string | null;
    mode: "NORMAL" | "CONSOLIDATION" | "CATCH_UP";
    stepCount: number;
    newAyahCount: number;
    warmupRequired: boolean;
    warmupPassed: boolean | null;
    weeklyGateRequired: boolean;
    weeklyGatePassed: boolean | null;
    monthlyTestRequired: boolean;
    weeklyTestStepCount: number;
    completed: boolean;
    updatedCursorAyahId: number | null;
  };
  streak: {
    currentDays: number;
    bestDays: number;
    todayQualifiedAyahs: number;
  };
  quran: {
    uniqueReadAyahCount: number;
    completionPct: number;
    lastReadAyahId: number | null;
  };
  lanes: {
    hifzCursorAyahId: number;
    quranCursorAyahId: number;
    separated: boolean;
  };
};

export type ProgressSimulationReport = {
  clerkUserId: string;
  timezone: string;
  days: number;
  quranAyahsPerDay: number;
  initial: {
    hifzCursorAyahId: number;
    quranCursorAyahId: number;
  };
  final: {
    hifzCursorAyahId: number;
    quranCursorAyahId: number;
    streakCurrentDays: number;
    streakBestDays: number;
    quranUniqueReadAyahCount: number;
    quranLastReadAyahId: number | null;
    completedHifzSessions: number;
    weeklyGateRunCount: number;
    separatedLanes: boolean;
  };
  daysSummary: ProgressSimulationDay[];
};

export type ProgressSimulationSnapshot = {
  simulatedAt: string;
  localDate: string;
  profile: {
    userId: string;
    timezone: string;
    activeSurahNumber: number;
    cursorAyahId: number;
    quranActiveSurahNumber: number;
    quranCursorAyahId: number;
    mode: "NORMAL" | "CONSOLIDATION" | "CATCH_UP";
  };
  reviewHealth: {
    dueNow: number;
    dueSoon6h: number;
    nextDueAt: string | null;
    reviewDebtMinutes: number;
    debtRatioPct: number;
    retention3dAvg: number;
    weakTransitions: number;
    warmupRequired: boolean;
    weeklyGateRequired: boolean;
    monthlyTestRequired: boolean;
    missedDays: number;
    reviewPoolSize: number;
  };
  streak: {
    currentDays: number;
    bestDays: number;
    graceInUseToday: boolean;
    todayQualifiedAyahs: number;
    lastQualifiedDate: string | null;
  };
  quran: {
    uniqueReadAyahCount: number;
    completionPct: number;
    lastReadAyahId: number | null;
    lastReadAt: string | null;
  };
  counts: {
    completedSessions: number;
    openSessions: number;
    trackedAyahs: number;
    reviewEvents: number;
    weeklyGateRuns: number;
    monthlyGateRuns: number;
  };
  lanes: {
    hifzCursorAyahId: number;
    quranCursorAyahId: number;
    separated: boolean;
  };
};

export type ProgressSimulationInvariantFailure = {
  dayNumber: number;
  code: string;
  message: string;
  severity: "error" | "warn";
};

export type ProgressSimulationMonthlyAuditRun = {
  dayNumber: number;
  simulatedAt: string;
  localDate: string;
  forceMonthlyTest: boolean;
  outcome: string | null;
  passRate: number | null;
  sampleSize: number | null;
  windowEnd: string | null;
  rebalanceUntil: string | null;
  reviewFloorPct: number;
};

export type ProgressSimulationMilestone = {
  dayNumber: number;
  simulatedAt: string;
  snapshot: ProgressSimulationSnapshot;
  monthlyAudit: ProgressSimulationMonthlyAuditRun | null;
  invariantFailures: ProgressSimulationInvariantFailure[];
};

export type ProgressSimulationRangeReport = {
  clerkUserId: string;
  timezone: string;
  days: number;
  continueExistingState: boolean;
  defaultQuranAyahsPerDay: number;
  startAt: string;
  initial: ProgressSimulationSnapshot;
  final: ProgressSimulationSnapshot;
  daysSummary: ProgressSimulationDay[];
  milestones: ProgressSimulationMilestone[];
  monthlyAuditRuns: ProgressSimulationMonthlyAuditRun[];
  invariantFailures: ProgressSimulationInvariantFailure[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function clampInt(value: number, fallback: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function cursorAyahIdFromRef(surahNumber: number, ayahNumber: number): number {
  const surah = getSurahInfo(surahNumber);
  if (!surah) {
    throw new Error(`Surah ${surahNumber} not found.`);
  }
  const boundedAyah = clampInt(ayahNumber, 1, 1, surah.ayahCount);
  return surah.startAyahId + (boundedAyah - 1);
}

function resolveStepGrade(
  step: SessionStep,
  gradePlan?: ProgressSimulationGradePlan,
): SrsGrade | undefined {
  if (step.kind === "LINK") {
    return gradePlan?.[step.stage] ?? "GOOD";
  }

  if (step.stage === "NEW" && (step.phase === "NEW_EXPOSE" || step.phase === "NEW_GUIDED")) {
    return undefined;
  }
  if (step.stage === "NEW" && step.phase === "NEW_BLIND") {
    return gradePlan?.NEW_BLIND ?? "EASY";
  }
  if (step.stage === "WARMUP" || step.stage === "REVIEW" || step.stage === "WEEKLY_TEST" || step.stage === "LINK_REPAIR") {
    return gradePlan?.[step.stage] ?? "GOOD";
  }
  return "GOOD";
}

function buildSessionEvents(
  steps: SessionStep[],
  startedAt: Date,
  gradePlan?: ProgressSimulationGradePlan,
): SessionEventInput[] {
  return steps.map((step, index) => {
    const createdAt = new Date(startedAt.getTime() + ((index + 1) * 45_000)).toISOString();
    const textVisible = !(step.kind === "AYAH" && (step.stage === "WARMUP" || step.stage === "REVIEW" || step.stage === "WEEKLY_TEST"));
    const assisted = false;

    if (step.kind === "LINK") {
      return {
        stepIndex: index,
        stage: step.stage,
        phase: step.phase,
        ayahId: step.toAyahId,
        fromAyahId: step.fromAyahId,
        toAyahId: step.toAyahId,
        grade: resolveStepGrade(step, gradePlan),
        durationSec: 28,
        textVisible,
        assisted,
        createdAt,
      };
    }

    return {
      stepIndex: index,
      stage: step.stage,
      phase: step.phase,
      ayahId: step.ayahId,
      grade: resolveStepGrade(step, gradePlan),
      durationSec: step.stage === "NEW" ? 42 : 24,
      textVisible,
      assisted,
      createdAt,
    };
  });
}

function buildSessionPlanJson(startedSession: Awaited<ReturnType<typeof startTodaySession>>) {
  return {
    version: SESSION_PLAN_VERSION,
    localDate: startedSession.localDate,
    mode: startedSession.state.mode,
    warmupRequired: startedSession.state.warmupRequired,
    weeklyGateRequired: startedSession.state.weeklyGateRequired,
    monthlyTestRequired: startedSession.state.monthlyTestRequired,
    newUnlocked: startedSession.state.newUnlocked,
    steps: startedSession.steps,
  };
}

function buildQuranDayAyahIds(startAyahId: number, quranAyahsPerDay: number): number[] {
  const ids: number[] = [];
  const start = clampInt(startAyahId, 1, 1, TOTAL_AYAHS);
  const count = clampInt(quranAyahsPerDay, 8, 1, 200);
  for (let offset = 0; offset < count; offset += 1) {
    const ayahId = start + offset;
    if (ayahId > TOTAL_AYAHS) {
      break;
    }
    ids.push(ayahId);
  }
  return ids;
}

export async function readProgressSimulationSnapshot(
  clerkUserId: string,
  input?: { now?: Date },
): Promise<ProgressSimulationSnapshot> {
  const { profile, state } = await loadTodayState(clerkUserId, { now: input?.now });
  const [
    quranProgress,
    streakSummary,
    trackedAyahs,
    completedSessions,
    openSessions,
    reviewEvents,
    weakTransitions,
    weeklyGateRuns,
    monthlyGateRuns,
  ] = await Promise.all([
    getQuranReadProgress(profile.id),
    getUserStreakSummary(clerkUserId, { now: input?.now }),
    db().ayahReview.count({
      where: {
        userId: profile.id,
      },
    }),
    db().session.count({
      where: {
        userId: profile.id,
        status: "COMPLETED",
      },
    }),
    db().session.count({
      where: {
        userId: profile.id,
        status: "OPEN",
      },
    }),
    db().reviewEvent.count({
      where: {
        userId: profile.id,
      },
    }),
    db().weakTransition.count({
      where: {
        userId: profile.id,
        resolvedAt: null,
      },
    }),
    db().qualityGateRun.count({
      where: {
        userId: profile.id,
        gateType: "WEEKLY",
      },
    }),
    db().qualityGateRun.count({
      where: {
        userId: profile.id,
        gateType: "MONTHLY",
      },
    }),
  ]);

  return {
    simulatedAt: (input?.now ?? new Date()).toISOString(),
    localDate: state.localDate,
    profile: {
      userId: profile.id,
      timezone: profile.timezone,
      activeSurahNumber: profile.activeSurahNumber,
      cursorAyahId: profile.cursorAyahId,
      quranActiveSurahNumber: profile.quranActiveSurahNumber,
      quranCursorAyahId: profile.quranCursorAyahId,
      mode: profile.mode,
    },
    reviewHealth: {
      dueNow: state.dueNowCount,
      dueSoon6h: state.dueSoonCount,
      nextDueAt: state.nextDueAt,
      reviewDebtMinutes: Number(state.reviewDebtMinutes.toFixed(1)),
      debtRatioPct: Number(state.debtRatio.toFixed(1)),
      retention3dAvg: Number(state.retention3dAvg.toFixed(3)),
      weakTransitions,
      warmupRequired: state.warmupRequired,
      weeklyGateRequired: state.weeklyGateRequired,
      monthlyTestRequired: state.monthlyTestRequired,
      missedDays: state.meta.missedDays,
      reviewPoolSize: state.meta.reviewPoolSize,
    },
    streak: {
      currentDays: streakSummary.streak.currentStreakDays,
      bestDays: streakSummary.streak.bestStreakDays,
      graceInUseToday: streakSummary.streak.graceInUseToday,
      todayQualifiedAyahs: streakSummary.streak.todayQualifiedAyahs,
      lastQualifiedDate: streakSummary.streak.lastQualifiedDate,
    },
    quran: {
      uniqueReadAyahCount: quranProgress.uniqueReadAyahCount,
      completionPct: quranProgress.completionPct,
      lastReadAyahId: quranProgress.lastReadAyahId,
      lastReadAt: quranProgress.lastReadAt,
    },
    counts: {
      completedSessions,
      openSessions,
      trackedAyahs,
      reviewEvents,
      weeklyGateRuns,
      monthlyGateRuns,
    },
    lanes: {
      hifzCursorAyahId: profile.cursorAyahId,
      quranCursorAyahId: profile.quranCursorAyahId,
      separated: profile.cursorAyahId !== profile.quranCursorAyahId,
    },
  };
}

function evaluateProgressSimulationInvariants(input: {
  dayNumber: number;
  now: Date;
  previous: ProgressSimulationSnapshot;
  current: ProgressSimulationSnapshot;
  dayReport: ProgressSimulationDay;
  dayPlan?: ProgressSimulationDayPlan;
}): ProgressSimulationInvariantFailure[] {
  const failures: ProgressSimulationInvariantFailure[] = [];

  if (input.current.lanes.hifzCursorAyahId < input.previous.lanes.hifzCursorAyahId) {
    failures.push({
      dayNumber: input.dayNumber,
      code: "hifz_cursor_regressed",
      message: `Hifz cursor moved backwards from ${input.previous.lanes.hifzCursorAyahId} to ${input.current.lanes.hifzCursorAyahId}.`,
      severity: "error",
    });
  }

  if (input.current.lanes.quranCursorAyahId < input.previous.lanes.quranCursorAyahId) {
    failures.push({
      dayNumber: input.dayNumber,
      code: "quran_cursor_regressed",
      message: `Qur'an cursor moved backwards from ${input.previous.lanes.quranCursorAyahId} to ${input.current.lanes.quranCursorAyahId}.`,
      severity: "error",
    });
  }

  if (!input.current.lanes.separated) {
    failures.push({
      dayNumber: input.dayNumber,
      code: "lanes_merged",
      message: "Hifz and Qur'an lanes converged to the same cursor.",
      severity: "error",
    });
  }

  if (!input.dayPlan?.skipHifz && input.dayReport.hifzSession.sessionId && !input.dayReport.hifzSession.completed) {
    failures.push({
      dayNumber: input.dayNumber,
      code: "session_not_completed",
      message: `Hifz session ${input.dayReport.hifzSession.sessionId} did not complete successfully.`,
      severity: "error",
    });
  }

  if (
    input.current.reviewHealth.dueNow === 0 &&
    input.current.reviewHealth.nextDueAt &&
    new Date(input.current.reviewHealth.nextDueAt).getTime() < input.now.getTime()
  ) {
    failures.push({
      dayNumber: input.dayNumber,
      code: "next_due_in_past_without_due_reviews",
      message: "Next due review is in the past even though the due-now count is zero.",
      severity: "error",
    });
  }

  if (
    input.dayReport.hifzSession.weeklyGateRequired &&
    input.dayReport.hifzSession.weeklyTestStepCount < 1
  ) {
    failures.push({
      dayNumber: input.dayNumber,
      code: "weekly_gate_missing_steps",
      message: "A weekly gate was required but no weekly test steps were produced.",
      severity: "error",
    });
  }

  if (
    input.dayReport.hifzSession.updatedCursorAyahId != null &&
    input.current.lanes.hifzCursorAyahId < input.dayReport.hifzSession.updatedCursorAyahId
  ) {
    failures.push({
      dayNumber: input.dayNumber,
      code: "cursor_update_not_persisted",
      message: `Session reported cursor ${input.dayReport.hifzSession.updatedCursorAyahId} but persisted cursor is ${input.current.lanes.hifzCursorAyahId}.`,
      severity: "error",
    });
  }

  return failures;
}

export async function prepareProgressSimulationUser(input: {
  clerkUserId: string;
  timezone: string;
  hifzStartSurahNumber: number;
  hifzStartAyahNumber: number;
  quranStartSurahNumber: number;
  quranStartAyahNumber: number;
  now?: Date;
}) {
  await saveAssessment({
    clerkUserId: input.clerkUserId,
    dailyMinutes: 12,
    practiceDaysPerWeek: 7,
    planBias: "BALANCED",
    hasTeacher: false,
    timezone: input.timezone,
    onboardingStartLane: "hifz",
  });
  await saveStartPoint(
    input.clerkUserId,
    input.hifzStartSurahNumber,
    cursorAyahIdFromRef(input.hifzStartSurahNumber, input.hifzStartAyahNumber),
    { onboardingStep: "complete" },
  );
  await markOnboardingComplete({
    clerkUserId: input.clerkUserId,
    onboardingStartLane: "hifz",
  });
  await saveQuranStartPoint(
    input.clerkUserId,
    input.quranStartSurahNumber,
    cursorAyahIdFromRef(input.quranStartSurahNumber, input.quranStartAyahNumber),
  );
  if (input.now) {
    await db().userProfile.update({
      where: { clerkUserId: input.clerkUserId },
      data: {
        onboardingCompletedAt: input.now,
      },
    });
  }
}

export async function simulateWeekProgressForUser(input: {
  clerkUserId: string;
  days?: number;
  timezone?: string;
  quranAyahsPerDay?: number;
  hifzStartSurahNumber?: number;
  hifzStartAyahNumber?: number;
  quranStartSurahNumber?: number;
  quranStartAyahNumber?: number;
  startAt?: Date;
  dayPlans?: ProgressSimulationDayPlan[];
}): Promise<ProgressSimulationReport> {
  const days = clampInt(input.days ?? 7, 7, 1, 14);
  const quranAyahsPerDay = clampInt(input.quranAyahsPerDay ?? 8, 8, 1, 200);
  const timezone = input.timezone?.trim() || "UTC";
  const hifzStartSurahNumber = clampInt(input.hifzStartSurahNumber ?? 1, 1, 1, 114);
  const hifzStartAyahNumber = clampInt(input.hifzStartAyahNumber ?? 1, 1, 1, 286);
  const quranStartSurahNumber = clampInt(input.quranStartSurahNumber ?? 2, 2, 1, 114);
  const quranStartAyahNumber = clampInt(input.quranStartAyahNumber ?? 1, 1, 1, 286);

  await prepareProgressSimulationUser({
    clerkUserId: input.clerkUserId,
    timezone,
    hifzStartSurahNumber,
    hifzStartAyahNumber,
    quranStartSurahNumber,
    quranStartAyahNumber,
    now: input.startAt,
  });

  const profile = await getOrCreateUserProfile(input.clerkUserId);
  if (!profile) {
    throw new Error("Simulation profile could not be created.");
  }

  const initial = {
    hifzCursorAyahId: profile.cursorAyahId,
    quranCursorAyahId: profile.quranCursorAyahId,
  };
  const dayPlanByNumber = new Map((input.dayPlans ?? []).map((plan) => [plan.dayNumber, plan]));
  const daysSummary: ProgressSimulationDay[] = [];
  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const dayNow = input.startAt
      ? new Date(input.startAt.getTime() + (dayIndex * 24 * 60 * 60 * 1000))
      : undefined;
    const dayPlan = dayPlanByNumber.get(dayIndex + 1);
    daysSummary.push(await simulateProgressDayForUser({
      clerkUserId: input.clerkUserId,
      dayNumber: dayIndex + 1,
      quranAyahsPerDay: dayPlan?.quranAyahsPerDay ?? quranAyahsPerDay,
      skipQuran: dayPlan?.skipQuran,
      skipHifz: dayPlan?.skipHifz,
      gradePlan: dayPlan?.gradePlan,
      now: dayNow,
    }));
  }

  const finalProfile = await getOrCreateUserProfile(input.clerkUserId);
  if (!finalProfile) {
    throw new Error("Simulation profile missing at completion.");
  }

  const [finalQuranProgress, finalStreakSummary, completedHifzSessions, weeklyGateRunCount] = await Promise.all([
    getQuranReadProgress(finalProfile.id),
    getUserStreakSummary(input.clerkUserId, {
      now: input.startAt
        ? new Date(input.startAt.getTime() + ((days - 1) * 24 * 60 * 60 * 1000))
        : undefined,
    }),
    db().session.count({
      where: {
        userId: finalProfile.id,
        status: "COMPLETED",
      },
    }),
    db().qualityGateRun.count({
      where: {
        userId: finalProfile.id,
        gateType: "WEEKLY",
      },
    }),
  ]);

  return {
    clerkUserId: input.clerkUserId,
    timezone: finalProfile.timezone,
    days,
    quranAyahsPerDay,
    initial,
    final: {
      hifzCursorAyahId: finalProfile.cursorAyahId,
      quranCursorAyahId: finalProfile.quranCursorAyahId,
      streakCurrentDays: finalStreakSummary.streak.currentStreakDays,
      streakBestDays: finalStreakSummary.streak.bestStreakDays,
      quranUniqueReadAyahCount: finalQuranProgress.uniqueReadAyahCount,
      quranLastReadAyahId: finalQuranProgress.lastReadAyahId,
      completedHifzSessions,
      weeklyGateRunCount,
      separatedLanes: finalProfile.cursorAyahId !== finalProfile.quranCursorAyahId,
    },
    daysSummary,
  };
}

export async function simulateProgressRangeForUser(input: {
  clerkUserId: string;
  days: number;
  startAt: Date;
  continueExistingState: boolean;
  timezone?: string;
  defaultQuranAyahsPerDay?: number;
  dayPlans?: ProgressSimulationDayPlan[];
  monthlyAuditDays?: number[];
}): Promise<ProgressSimulationRangeReport> {
  const days = clampInt(input.days, 90, 1, 365);
  const defaultQuranAyahsPerDay = clampInt(input.defaultQuranAyahsPerDay ?? 8, 8, 1, 200);
  const monthlyAuditDays = Array.from(new Set((input.monthlyAuditDays ?? []).map((day) => clampInt(day, 1, 1, days)))).sort((a, b) => a - b);
  const milestoneDays = new Set<number>([days, ...monthlyAuditDays]);
  const dayPlanByNumber = new Map((input.dayPlans ?? []).map((plan) => [plan.dayNumber, plan]));

  if (!input.continueExistingState) {
    await getOrCreateUserProfile(input.clerkUserId);
  }

  const initial = await readProgressSimulationSnapshot(input.clerkUserId, { now: input.startAt });
  const daysSummary: ProgressSimulationDay[] = [];
  const milestones: ProgressSimulationMilestone[] = [];
  const monthlyAuditRuns: ProgressSimulationMonthlyAuditRun[] = [];
  const invariantFailures: ProgressSimulationInvariantFailure[] = [];

  let latestSnapshot = initial;
  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const dayNumber = dayIndex + 1;
    const dayNow = new Date(input.startAt.getTime() + (dayIndex * DAY_MS));
    const dayPlan = dayPlanByNumber.get(dayNumber);
    const daySummary = await simulateProgressDayForUser({
      clerkUserId: input.clerkUserId,
      dayNumber,
      quranAyahsPerDay: dayPlan?.quranAyahsPerDay ?? defaultQuranAyahsPerDay,
      skipQuran: dayPlan?.skipQuran,
      skipHifz: dayPlan?.skipHifz,
      gradePlan: dayPlan?.gradePlan,
      now: dayNow,
    });
    daysSummary.push(daySummary);

    let monthlyAudit: ProgressSimulationMonthlyAuditRun | null = null;
    if (monthlyAuditDays.includes(dayNumber)) {
      const result = await runMonthlyAuditForUser(input.clerkUserId, { now: dayNow });
      const latestProfile = await getOrCreateUserProfile(input.clerkUserId);
      const latestMonthlyRun = latestProfile
        ? await db().qualityGateRun.findFirst({
            where: {
              userId: latestProfile.id,
              gateType: "MONTHLY",
            },
            orderBy: {
              windowEnd: "desc",
            },
            select: {
              outcome: true,
              passRate: true,
              sampleSize: true,
              windowEnd: true,
            },
          })
        : null;

      monthlyAudit = {
        dayNumber,
        simulatedAt: dayNow.toISOString(),
        localDate: daySummary.simulatedAt.slice(0, 10),
        forceMonthlyTest: result.forceMonthlyTest,
        outcome: latestMonthlyRun?.outcome ?? null,
        passRate: latestMonthlyRun?.passRate ?? null,
        sampleSize: latestMonthlyRun?.sampleSize ?? null,
        windowEnd: latestMonthlyRun?.windowEnd?.toISOString() ?? null,
        rebalanceUntil: latestProfile?.rebalanceUntil?.toISOString() ?? null,
        reviewFloorPct: latestProfile?.reviewFloorPct ?? 70,
      };
      monthlyAuditRuns.push(monthlyAudit);
    }

    const currentSnapshot = await readProgressSimulationSnapshot(input.clerkUserId, { now: dayNow });
    const dayFailures = evaluateProgressSimulationInvariants({
      dayNumber,
      now: dayNow,
      previous: latestSnapshot,
      current: currentSnapshot,
      dayReport: daySummary,
      dayPlan,
    });
    invariantFailures.push(...dayFailures);

    if (milestoneDays.has(dayNumber)) {
      milestones.push({
        dayNumber,
        simulatedAt: dayNow.toISOString(),
        snapshot: currentSnapshot,
        monthlyAudit,
        invariantFailures: dayFailures,
      });
    }

    latestSnapshot = currentSnapshot;
  }

  return {
    clerkUserId: input.clerkUserId,
    timezone: latestSnapshot.profile.timezone || input.timezone?.trim() || initial.profile.timezone,
    days,
    continueExistingState: input.continueExistingState,
    defaultQuranAyahsPerDay,
    startAt: input.startAt.toISOString(),
    initial,
    final: latestSnapshot,
    daysSummary,
    milestones,
    monthlyAuditRuns,
    invariantFailures,
  };
}

export async function simulateProgressDayForUser(input: {
  clerkUserId: string;
  dayNumber: number;
  quranAyahsPerDay: number;
  skipQuran?: boolean;
  skipHifz?: boolean;
  gradePlan?: ProgressSimulationGradePlan;
  now?: Date;
}): Promise<ProgressSimulationDay> {
  const profile = await getOrCreateUserProfile(input.clerkUserId);
  if (!profile) {
    throw new Error("Simulation profile became unavailable.");
  }

  const quranStartAyahId = clampInt(
    input.dayNumber > 1 ? profile.quranCursorAyahId + 1 : profile.quranCursorAyahId,
    profile.quranCursorAyahId,
    1,
    TOTAL_AYAHS,
  );
  const quranDayAyahIds = buildQuranDayAyahIds(quranStartAyahId, input.quranAyahsPerDay);
  const quranDayEndAyahId = quranDayAyahIds[quranDayAyahIds.length - 1] ?? profile.quranCursorAyahId;

  if (!input.skipQuran) {
    await recordQuranBrowseAyahSet({
      profileId: profile.id,
      timezone: profile.timezone,
      ayahIds: quranDayAyahIds,
      source: "READER_VIEW",
      now: input.now,
    });
    if (quranDayAyahIds.length > 0) {
      await recordQuranBrowseAyahRead({
        profileId: profile.id,
        timezone: profile.timezone,
        ayahId: quranDayEndAyahId,
        source: "AUDIO_PLAY",
        now: input.now,
      });
      const endAyah = getAyahById(quranDayEndAyahId);
      if (endAyah) {
        await saveQuranStartPoint(input.clerkUserId, endAyah.surahNumber, endAyah.id);
      }
    }
  }

  const session = input.skipHifz ? null : await startTodaySession(input.clerkUserId, { now: input.now });
  const weeklyTestStepCount = session
    ? session.steps.filter((step) => step.kind === "AYAH" && step.stage === "WEEKLY_TEST").length
    : 0;
  let sessionCompleted = false;
  let updatedCursorAyahId: number | null = null;
  if (session && session.steps.length > 0) {
    await db().session.update({
      where: { id: session.sessionId },
      data: {
        planJson: buildSessionPlanJson(session),
      },
    });
    const startedAt = new Date(session.startedAt);
    const events = buildSessionEvents(session.steps, startedAt, input.gradePlan);
    const endedAt = new Date(startedAt.getTime() + ((events.length + 1) * 45_000));
    const result = await completeSession({
      clerkUserId: input.clerkUserId,
      sessionId: session.sessionId,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      localDate: session.localDate,
      events,
      now: input.now,
      transactionTimeoutMs: 20_000,
    });
    sessionCompleted = result.ok === true && result.skipped !== true;
    updatedCursorAyahId = result.updatedCursorAyahId ?? null;
  }

  const [profileAfterDay, quranProgress, streakSummary, completedSession] = await Promise.all([
    getOrCreateUserProfile(input.clerkUserId),
    getQuranReadProgress(profile.id),
    getUserStreakSummary(input.clerkUserId, { now: input.now }),
    session
      ? db().session.findUnique({
          where: { id: session.sessionId },
          select: {
            warmupPassed: true,
            weeklyGatePassed: true,
          },
        })
      : Promise.resolve(null),
  ]);
  if (!profileAfterDay) {
    throw new Error("Simulation profile could not be reloaded.");
  }

  return {
    dayNumber: input.dayNumber,
    simulatedAt: (input.now ?? new Date()).toISOString(),
    quranAyahRange: {
      startAyahId: quranDayAyahIds[0] ?? profileAfterDay.quranCursorAyahId,
      endAyahId: quranDayEndAyahId,
    },
    hifzSession: {
      sessionId: session?.sessionId ?? null,
      mode: session?.state.mode ?? "NORMAL",
      stepCount: session?.steps.length ?? 0,
      newAyahCount: session?.state.queue.newAyahIds.length ?? 0,
      warmupRequired: session?.state.warmupRequired ?? false,
      warmupPassed: completedSession?.warmupPassed ?? null,
      weeklyGateRequired: session?.state.weeklyGateRequired ?? false,
      weeklyGatePassed: completedSession?.weeklyGatePassed ?? null,
      monthlyTestRequired: session?.state.monthlyTestRequired ?? false,
      weeklyTestStepCount,
      completed: sessionCompleted,
      updatedCursorAyahId,
    },
    streak: {
      currentDays: streakSummary.streak.currentStreakDays,
      bestDays: streakSummary.streak.bestStreakDays,
      todayQualifiedAyahs: streakSummary.streak.todayQualifiedAyahs,
    },
    quran: {
      uniqueReadAyahCount: quranProgress.uniqueReadAyahCount,
      completionPct: quranProgress.completionPct,
      lastReadAyahId: quranProgress.lastReadAyahId,
    },
    lanes: {
      hifzCursorAyahId: profileAfterDay.cursorAyahId,
      quranCursorAyahId: profileAfterDay.quranCursorAyahId,
      separated: profileAfterDay.cursorAyahId !== profileAfterDay.quranCursorAyahId,
    },
  };
}
