import "server-only";

import type { AttemptStage, ReviewPhase } from "@prisma/client";
import { isoDateInTimeZone } from "@/hifzer/engine/date";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { db } from "@/lib/db";
import {
  MIN_QUALIFIED_SECONDS_PER_DAY,
  aggregateSecondsByLocalDate,
  buildCalendar84d,
  computeChainSummary,
  deriveQualifiedDates,
} from "@/hifzer/streak/logic";

const RECALL_STAGES: AttemptStage[] = ["WARMUP", "REVIEW", "WEEKLY_TEST", "LINK", "LINK_REPAIR"];
const NEW_BLIND_PHASE: ReviewPhase = "NEW_BLIND";

export type StreakSummary = {
  onboardingEligible: boolean;
  rule: {
    minQualifiedSecondsPerDay: number;
    minQualifiedMinutesPerDay: number;
    gracePolicy: "always_allow_1_day_gap";
  };
  streak: {
    currentStreakDays: number;
    bestStreakDays: number;
    graceInUseToday: boolean;
    todayQualifiedSeconds: number;
    todayQualifiedMinutes: number;
    lastQualifiedDate: string | null;
  };
  calendar84d: Array<{
    date: string;
    qualified: boolean;
    qualifiedSeconds: number;
    qualifiedMinutes: number;
    eligible: boolean;
  }>;
};

function emptySummary(todayLocalDate: string): StreakSummary {
  const calendar84d = buildCalendar84d({
    todayLocalDate,
    startLocalDate: todayLocalDate,
    secondsByDate: {},
    minQualifiedSecondsPerDay: MIN_QUALIFIED_SECONDS_PER_DAY,
  }).map((d) => ({ ...d, eligible: false, qualified: false, qualifiedSeconds: 0, qualifiedMinutes: 0 }));

  return {
    onboardingEligible: false,
    rule: {
      minQualifiedSecondsPerDay: MIN_QUALIFIED_SECONDS_PER_DAY,
      minQualifiedMinutesPerDay: Math.floor(MIN_QUALIFIED_SECONDS_PER_DAY / 60),
      gracePolicy: "always_allow_1_day_gap",
    },
    streak: {
      currentStreakDays: 0,
      bestStreakDays: 0,
      graceInUseToday: false,
      todayQualifiedSeconds: 0,
      todayQualifiedMinutes: 0,
      lastQualifiedDate: null,
    },
    calendar84d,
  };
}

export async function getUserStreakSummary(clerkUserId: string): Promise<StreakSummary> {
  const profile = await getOrCreateUserProfile(clerkUserId);
  const now = new Date();

  if (!profile) {
    return emptySummary(isoDateInTimeZone(now, "UTC"));
  }

  const todayLocalDate = isoDateInTimeZone(now, profile.timezone);
  if (!profile.onboardingCompletedAt) {
    return emptySummary(todayLocalDate);
  }

  const onboardingLocalDate = isoDateInTimeZone(profile.onboardingCompletedAt, profile.timezone);
  const startLocalDate = onboardingLocalDate <= todayLocalDate ? onboardingLocalDate : todayLocalDate;

  const prisma = db();
  const rows = await prisma.reviewEvent.findMany({
    where: {
      userId: profile.id,
      grade: { not: null },
      durationSec: { gt: 0 },
      OR: [
        { stage: { in: RECALL_STAGES } },
        { stage: "NEW", phase: NEW_BLIND_PHASE },
      ],
      session: {
        status: "COMPLETED",
        localDate: {
          gte: startLocalDate,
          lte: todayLocalDate,
        },
      },
    },
    select: {
      durationSec: true,
      session: {
        select: {
          localDate: true,
        },
      },
    },
  });

  const secondsByDate = aggregateSecondsByLocalDate(
    rows.map((row) => ({
      localDate: row.session.localDate,
      durationSec: row.durationSec,
    })),
  );

  const qualifiedDates = deriveQualifiedDates({
    secondsByDate,
    startLocalDate,
    todayLocalDate,
    minQualifiedSecondsPerDay: MIN_QUALIFIED_SECONDS_PER_DAY,
  });

  const chainSummary = computeChainSummary({
    qualifiedDates,
    todayLocalDate,
  });

  const calendar84d = buildCalendar84d({
    todayLocalDate,
    startLocalDate,
    secondsByDate,
    minQualifiedSecondsPerDay: MIN_QUALIFIED_SECONDS_PER_DAY,
  });

  const todayQualifiedSeconds = Math.max(0, secondsByDate[todayLocalDate] ?? 0);

  return {
    onboardingEligible: true,
    rule: {
      minQualifiedSecondsPerDay: MIN_QUALIFIED_SECONDS_PER_DAY,
      minQualifiedMinutesPerDay: Math.floor(MIN_QUALIFIED_SECONDS_PER_DAY / 60),
      gracePolicy: "always_allow_1_day_gap",
    },
    streak: {
      currentStreakDays: chainSummary.currentStreakDays,
      bestStreakDays: chainSummary.bestStreakDays,
      graceInUseToday: chainSummary.graceInUseToday,
      todayQualifiedSeconds,
      todayQualifiedMinutes: Math.floor(todayQualifiedSeconds / 60),
      lastQualifiedDate: chainSummary.lastQualifiedDate,
    },
    calendar84d,
  };
}
