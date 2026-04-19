import "server-only";

import { SrsGrade } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { getAyahById } from "@/hifzer/quran/lookup.server";
import { db } from "@/lib/db";

export type ChallengeAyah = {
  ayahId: number;
  surahNumber: number;
  ayahNumber: number;
  snippet: string | null;
  againCount: number;
  hardCount: number;
  totalCount: number;
  lastSeenAt: string;
};

export type TransitionHotspot = {
  id: string;
  fromAyahId: number;
  toAyahId: number;
  fromRef: string;
  toRef: string;
  fromSnippet: string | null;
  toSnippet: string | null;
  attemptCount: number;
  failCount: number;
  successRatePct: number;
  nextRepairAt: string | null;
  lastOccurredAt: string;
};

export type RecitationInsights = {
  challengeAyahs: ChallengeAyah[];
  weakTransitions: TransitionHotspot[];
  struggleEvents30d: number;
  uniqueChallengeAyahs30d: number;
  openWeakTransitions: number;
};

const RECITATION_INSIGHTS_CACHE_TTL_SECONDS = 120;

function trimSnippet(text: string | null | undefined, limit = 52): string | null {
  if (!text) {
    return null;
  }
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

export async function getRecitationInsights(
  clerkUserId: string,
  input?: { challengeLimit?: number; transitionLimit?: number },
): Promise<RecitationInsights | null> {
  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    return null;
  }

  const challengeLimit = Math.max(1, Math.min(12, input?.challengeLimit ?? 6));
  const transitionLimit = Math.max(1, Math.min(12, input?.transitionLimit ?? 6));
  const since = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));

  const [struggleEvents, weakTransitions, openWeakTransitions] = await Promise.all([
    db().reviewEvent.findMany({
      where: {
        userId: profile.id,
        grade: {
          in: [SrsGrade.AGAIN, SrsGrade.HARD],
        },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        ayahId: true,
        surahNumber: true,
        grade: true,
        createdAt: true,
      },
    }),
    db().weakTransition.findMany({
      where: {
        userId: profile.id,
        resolvedAt: null,
      },
      orderBy: [{ failCount: "desc" }, { attemptCount: "desc" }, { lastOccurredAt: "desc" }],
      take: transitionLimit,
      select: {
        id: true,
        fromAyahId: true,
        toAyahId: true,
        attemptCount: true,
        failCount: true,
        successRateCached: true,
        nextRepairAt: true,
        lastOccurredAt: true,
      },
    }),
    db().weakTransition.count({
      where: {
        userId: profile.id,
        resolvedAt: null,
      },
    }),
  ]);

  const challengeMap = new Map<number, ChallengeAyah>();
  for (const event of struggleEvents) {
    const ayah = getAyahById(event.ayahId);
    const existing = challengeMap.get(event.ayahId);
    if (!existing) {
      challengeMap.set(event.ayahId, {
        ayahId: event.ayahId,
        surahNumber: event.surahNumber,
        ayahNumber: ayah?.ayahNumber ?? 1,
        snippet: trimSnippet(ayah?.textUthmani ?? null),
        againCount: event.grade === SrsGrade.AGAIN ? 1 : 0,
        hardCount: event.grade === SrsGrade.HARD ? 1 : 0,
        totalCount: 1,
        lastSeenAt: event.createdAt.toISOString(),
      });
      continue;
    }
    existing.totalCount += 1;
    if (event.grade === SrsGrade.AGAIN) {
      existing.againCount += 1;
    }
    if (event.grade === SrsGrade.HARD) {
      existing.hardCount += 1;
    }
  }

  const challengeAyahs = Array.from(challengeMap.values())
    .sort((a, b) => {
      if (b.totalCount !== a.totalCount) {
        return b.totalCount - a.totalCount;
      }
      return b.lastSeenAt.localeCompare(a.lastSeenAt);
    })
    .slice(0, challengeLimit);

  const transitionRows: TransitionHotspot[] = weakTransitions.map((row) => {
    const fromAyah = getAyahById(row.fromAyahId);
    const toAyah = getAyahById(row.toAyahId);
    return {
      id: row.id,
      fromAyahId: row.fromAyahId,
      toAyahId: row.toAyahId,
      fromRef: fromAyah ? `${fromAyah.surahNumber}:${fromAyah.ayahNumber}` : `#${row.fromAyahId}`,
      toRef: toAyah ? `${toAyah.surahNumber}:${toAyah.ayahNumber}` : `#${row.toAyahId}`,
      fromSnippet: trimSnippet(fromAyah?.textUthmani ?? null, 34),
      toSnippet: trimSnippet(toAyah?.textUthmani ?? null, 34),
      attemptCount: row.attemptCount,
      failCount: row.failCount,
      successRatePct: Math.round(row.successRateCached * 100),
      nextRepairAt: row.nextRepairAt ? row.nextRepairAt.toISOString() : null,
      lastOccurredAt: row.lastOccurredAt.toISOString(),
    };
  });

  return {
    challengeAyahs,
    weakTransitions: transitionRows,
    struggleEvents30d: struggleEvents.length,
    uniqueChallengeAyahs30d: challengeMap.size,
    openWeakTransitions,
  };
}

export function getCachedRecitationInsights(
  clerkUserId: string,
  input?: { challengeLimit?: number; transitionLimit?: number },
) {
  const challengeLimit = Math.max(1, Math.min(12, input?.challengeLimit ?? 6));
  const transitionLimit = Math.max(1, Math.min(12, input?.transitionLimit ?? 6));

  return unstable_cache(
    async () => getRecitationInsights(clerkUserId, { challengeLimit, transitionLimit }),
    [`recitation-insights:${clerkUserId}:${challengeLimit}:${transitionLimit}`],
    {
      revalidate: RECITATION_INSIGHTS_CACHE_TTL_SECONDS,
      tags: [`recitation-insights:${clerkUserId}`],
    },
  )();
}
