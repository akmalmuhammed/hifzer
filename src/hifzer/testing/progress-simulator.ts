import "server-only";

import type { SrsGrade } from "@prisma/client";
import { completeSession, startTodaySession } from "@/hifzer/engine/server";
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
  });
  await markOnboardingComplete(input.clerkUserId);
  await saveStartPoint(
    input.clerkUserId,
    input.hifzStartSurahNumber,
    cursorAyahIdFromRef(input.hifzStartSurahNumber, input.hifzStartAyahNumber),
  );
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
