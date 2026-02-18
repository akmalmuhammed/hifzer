import "server-only";

import type { AttemptStage, ReviewPhase } from "@prisma/client";
import { isoDateInTimeZone } from "@/hifzer/engine/date";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import {
  QURAN_BROWSE_MARKER_DURATION_SEC,
  QURAN_BROWSE_MARKER_PHASE,
  QURAN_BROWSE_MARKER_STAGE,
  recordQuranBrowseAyahRead,
} from "@/hifzer/quran/read-progress.server";
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
const MIN_QUALIFIED_AYAHS_PER_DAY = 1;

export type StreakSummary = {
  onboardingEligible: boolean;
  rule: {
    minQualifiedAyahsPerDay: number;
    minQualifiedSecondsPerDay: number;
    minQualifiedMinutesPerDay: number;
    gracePolicy: "always_allow_1_day_gap";
  };
  streak: {
    currentStreakDays: number;
    bestStreakDays: number;
    graceInUseToday: boolean;
    todayQualifiedAyahs: number;
    todayQualifiedSeconds: number;
    todayQualifiedMinutes: number;
    lastQualifiedDate: string | null;
  };
  calendar84d: Array<{
    date: string;
    qualified: boolean;
    qualifiedAyahCount: number;
    qualifiedSeconds: number;
    qualifiedMinutes: number;
    eligible: boolean;
  }>;
};

type StreakRecordResult = {
  ok: boolean;
  onboardingEligible: boolean;
  recorded: boolean;
  localDate: string | null;
};

function emptySummary(todayLocalDate: string): StreakSummary {
  const calendar84d = buildCalendar84d({
    todayLocalDate,
    startLocalDate: todayLocalDate,
    secondsByDate: {},
    minQualifiedSecondsPerDay: MIN_QUALIFIED_SECONDS_PER_DAY,
  }).map((d) => ({ ...d, eligible: false, qualified: false, qualifiedAyahCount: 0, qualifiedSeconds: 0, qualifiedMinutes: 0 }));

  return {
    onboardingEligible: false,
    rule: {
      minQualifiedAyahsPerDay: MIN_QUALIFIED_AYAHS_PER_DAY,
      minQualifiedSecondsPerDay: MIN_QUALIFIED_SECONDS_PER_DAY,
      minQualifiedMinutesPerDay: Math.floor(MIN_QUALIFIED_SECONDS_PER_DAY / 60),
      gracePolicy: "always_allow_1_day_gap",
    },
    streak: {
      currentStreakDays: 0,
      bestStreakDays: 0,
      graceInUseToday: false,
      todayQualifiedAyahs: 0,
      todayQualifiedSeconds: 0,
      todayQualifiedMinutes: 0,
      lastQualifiedDate: null,
    },
    calendar84d,
  };
}

function isRecallRelevantRow(row: { stage: AttemptStage; phase: ReviewPhase; grade: string | null }): boolean {
  if (!row.grade) {
    return false;
  }
  if (RECALL_STAGES.includes(row.stage)) {
    return true;
  }
  return row.stage === "NEW" && row.phase === NEW_BLIND_PHASE;
}

function isBrowseMarkerRow(row: {
  stage: AttemptStage;
  phase: ReviewPhase;
  grade: string | null;
  durationSec: number;
  ayahId: number;
  fromAyahId: number | null;
  toAyahId: number | null;
}): boolean {
  return row.stage === QURAN_BROWSE_MARKER_STAGE &&
    row.phase === QURAN_BROWSE_MARKER_PHASE &&
    row.grade == null &&
    row.durationSec === QURAN_BROWSE_MARKER_DURATION_SEC &&
    row.fromAyahId === row.ayahId &&
    row.toAyahId === row.ayahId;
}

export async function recordBrowseAyahRecitation(clerkUserId: string, ayahId: number): Promise<StreakRecordResult> {
  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile || !profile.onboardingCompletedAt || !Number.isFinite(ayahId) || ayahId <= 0) {
    return {
      ok: true,
      onboardingEligible: Boolean(profile?.onboardingCompletedAt),
      recorded: false,
      localDate: null,
    };
  }

  const result = await recordQuranBrowseAyahRead({
    profileId: profile.id,
    mode: profile.mode,
    timezone: profile.timezone,
    ayahId: Math.floor(ayahId),
  });

  return {
    ok: true,
    onboardingEligible: true,
    recorded: result.recorded,
    localDate: result.localDate,
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
      durationSec: { gt: 0 },
      OR: [
        {
          grade: { not: null },
          OR: [
            { stage: { in: RECALL_STAGES } },
            { stage: "NEW", phase: NEW_BLIND_PHASE },
          ],
        },
        {
          stage: QURAN_BROWSE_MARKER_STAGE,
          phase: QURAN_BROWSE_MARKER_PHASE,
          grade: null,
          durationSec: QURAN_BROWSE_MARKER_DURATION_SEC,
        },
      ],
      session: {
        localDate: {
          gte: startLocalDate,
          lte: todayLocalDate,
        },
      },
    },
    select: {
      ayahId: true,
      stage: true,
      phase: true,
      grade: true,
      fromAyahId: true,
      toAyahId: true,
      durationSec: true,
      session: {
        select: {
          localDate: true,
        },
      },
    },
  });

  const ayahSetByDate = new Map<string, Set<number>>();
  for (const row of rows) {
    const isRelevant = isRecallRelevantRow(row) || isBrowseMarkerRow(row);
    if (!isRelevant) {
      continue;
    }
    const localDate = row.session.localDate;
    if (!localDate) {
      continue;
    }
    const set = ayahSetByDate.get(localDate) ?? new Set<number>();
    set.add(row.ayahId);
    ayahSetByDate.set(localDate, set);
  }

  const qualifiedAyahCountByDate: Record<string, number> = {};
  for (const [date, set] of ayahSetByDate.entries()) {
    qualifiedAyahCountByDate[date] = set.size;
  }

  // Keep calendar/value units stable by mapping each qualified ayah to one qualified block.
  const secondsByDate = aggregateSecondsByLocalDate(
    Object.keys(qualifiedAyahCountByDate).map((localDate) => ({
      localDate,
      durationSec: qualifiedAyahCountByDate[localDate] * MIN_QUALIFIED_SECONDS_PER_DAY,
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
  }).map((day) => ({
    ...day,
    qualifiedAyahCount: day.eligible ? (qualifiedAyahCountByDate[day.date] ?? 0) : 0,
  }));

  const todayQualifiedSeconds = Math.max(0, secondsByDate[todayLocalDate] ?? 0);
  const todayQualifiedAyahs = Math.max(0, qualifiedAyahCountByDate[todayLocalDate] ?? 0);

  return {
    onboardingEligible: true,
    rule: {
      minQualifiedAyahsPerDay: MIN_QUALIFIED_AYAHS_PER_DAY,
      minQualifiedSecondsPerDay: MIN_QUALIFIED_SECONDS_PER_DAY,
      minQualifiedMinutesPerDay: Math.floor(MIN_QUALIFIED_SECONDS_PER_DAY / 60),
      gracePolicy: "always_allow_1_day_gap",
    },
    streak: {
      currentStreakDays: chainSummary.currentStreakDays,
      bestStreakDays: chainSummary.bestStreakDays,
      graceInUseToday: chainSummary.graceInUseToday,
      todayQualifiedAyahs,
      todayQualifiedSeconds,
      todayQualifiedMinutes: Math.floor(todayQualifiedSeconds / 60),
      lastQualifiedDate: chainSummary.lastQualifiedDate,
    },
    calendar84d,
  };
}
