import "server-only";

import type { AttemptStage, ReviewPhase, SrsMode } from "@prisma/client";
import { isoDateToUtcMidnightMs } from "@/hifzer/derived/dates";
import { isoDateInTimeZone } from "@/hifzer/engine/date";
import { getAyahById } from "@/hifzer/quran/lookup.server";
import { db } from "@/lib/db";
import { getCoreSchemaCapabilities } from "@/lib/db-compat";

const TOTAL_AYAHS = 6236;
const MARKER_SESSION_OFFSET_MS = 36 * 60 * 60 * 1000;

export const QURAN_BROWSE_MARKER_STAGE: AttemptStage = "REVIEW";
export const QURAN_BROWSE_MARKER_PHASE: ReviewPhase = "STANDARD";
export const QURAN_BROWSE_MARKER_DURATION_SEC = 1;

type MarkerShape = {
  ayahId: number;
  stage: AttemptStage;
  phase: ReviewPhase;
  grade: string | null;
  durationSec: number;
  fromAyahId: number | null;
  toAyahId: number | null;
};

export type QuranReadProgress = {
  uniqueReadAyahCount: number;
  completionPct: number;
  completionKhatmahCount: number;
  lastReadAyahId: number | null;
  lastReadAt: string | null;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function markerSessionStartedAt(localDate: string): Date {
  const base = isoDateToUtcMidnightMs(localDate);
  if (base == null) {
    return new Date(0);
  }
  return new Date(base - MARKER_SESSION_OFFSET_MS);
}

function isBrowseMarker(row: MarkerShape): boolean {
  return row.stage === QURAN_BROWSE_MARKER_STAGE &&
    row.phase === QURAN_BROWSE_MARKER_PHASE &&
    row.grade == null &&
    row.durationSec === QURAN_BROWSE_MARKER_DURATION_SEC &&
    row.fromAyahId === row.ayahId &&
    row.toAyahId === row.ayahId;
}

function markerWhere(profileId: string) {
  return {
    userId: profileId,
    stage: QURAN_BROWSE_MARKER_STAGE,
    phase: QURAN_BROWSE_MARKER_PHASE,
    grade: null,
    durationSec: QURAN_BROWSE_MARKER_DURATION_SEC,
    fromAyahId: { not: null },
    toAyahId: { not: null },
  };
}

function normalizeAyahId(value: number): number | null {
  if (!Number.isFinite(value)) {
    return null;
  }
  const n = Math.floor(value);
  if (n < 1 || n > TOTAL_AYAHS) {
    return null;
  }
  return n;
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

async function getOrCreateBrowseMarkerSession(input: {
  profileId: string;
  mode: SrsMode;
  timezone: string;
  now: Date;
}) {
  const localDate = isoDateInTimeZone(input.now, input.timezone);
  const startedAt = markerSessionStartedAt(localDate);
  const capabilities = await getCoreSchemaCapabilities();
  const hasSessionModernColumns = capabilities.hasSessionModernColumns;
  const prisma = db();

  const existing = await prisma.session.findFirst({
    where: {
      userId: input.profileId,
      startedAt,
    },
    select: { id: true, localDate: true },
  });

  if (existing) {
    await prisma.session.update({
      where: { id: existing.id },
      data: {
        localDate,
        endedAt: input.now,
        status: "COMPLETED",
      },
    });
    return { id: existing.id, localDate };
  }

  if (hasSessionModernColumns) {
    try {
      return await prisma.session.create({
        data: {
          userId: input.profileId,
          status: "COMPLETED",
          startedAt,
          endedAt: input.now,
          localDate,
          mode: input.mode,
          reviewDebtMinutesAtStart: 0,
          warmupPassed: true,
          warmupRetryUsed: false,
          weeklyGateRequired: false,
          weeklyGatePassed: true,
          newUnlocked: false,
          warmupAyahIds: [],
          reviewAyahIds: [],
        },
        select: { id: true, localDate: true },
      });
    } catch (error) {
      if (!looksLikeMissingCoreSchema(error)) {
        throw error;
      }
      // Fall through to legacy create shape.
    }
  }

  return prisma.session.create({
    data: {
      userId: input.profileId,
      status: "COMPLETED",
      startedAt,
      endedAt: input.now,
      localDate,
      warmupAyahIds: [],
      reviewAyahIds: [],
      newStartAyahId: null,
      newEndAyahId: null,
    },
    select: { id: true, localDate: true },
  });
}

export async function recordQuranBrowseAyahRead(input: {
  profileId: string;
  mode: SrsMode;
  timezone: string;
  ayahId: number;
  now?: Date;
}): Promise<{ recorded: boolean; localDate: string | null }> {
  const normalizedAyahId = normalizeAyahId(input.ayahId);
  if (normalizedAyahId == null) {
    return { recorded: false, localDate: null };
  }

  const ayah = getAyahById(normalizedAyahId);
  if (!ayah) {
    return { recorded: false, localDate: null };
  }

  const now = input.now ?? new Date();
  let markerSession: { id: string; localDate: string };
  try {
    markerSession = await getOrCreateBrowseMarkerSession({
      profileId: input.profileId,
      mode: input.mode,
      timezone: input.timezone,
      now,
    });
  } catch (error) {
    if (looksLikeMissingCoreSchema(error)) {
      return { recorded: false, localDate: null };
    }
    throw error;
  }

  try {
    const existing = await db().reviewEvent.findFirst({
      where: {
        userId: input.profileId,
        sessionId: markerSession.id,
        ayahId: normalizedAyahId,
        stage: QURAN_BROWSE_MARKER_STAGE,
        phase: QURAN_BROWSE_MARKER_PHASE,
        grade: null,
        durationSec: QURAN_BROWSE_MARKER_DURATION_SEC,
        fromAyahId: normalizedAyahId,
        toAyahId: normalizedAyahId,
      },
      select: { id: true },
    });

    if (existing) {
      return {
        recorded: false,
        localDate: markerSession.localDate,
      };
    }

    await db().reviewEvent.create({
      data: {
        userId: input.profileId,
        sessionId: markerSession.id,
        surahNumber: ayah.surahNumber,
        ayahId: normalizedAyahId,
        stage: QURAN_BROWSE_MARKER_STAGE,
        phase: QURAN_BROWSE_MARKER_PHASE,
        grade: null,
        durationSec: QURAN_BROWSE_MARKER_DURATION_SEC,
        fromAyahId: normalizedAyahId,
        toAyahId: normalizedAyahId,
        createdAt: now,
      },
    });

    return {
      recorded: true,
      localDate: markerSession.localDate,
    };
  } catch (error) {
    if (looksLikeMissingCoreSchema(error)) {
      return {
        recorded: false,
        localDate: markerSession.localDate,
      };
    }
    throw error;
  }
}

export async function recordQuranBrowseAyahRangeRead(input: {
  profileId: string;
  mode: SrsMode;
  timezone: string;
  ayahIds: number[];
  now?: Date;
}): Promise<{ recordedAyahCount: number; alreadyTrackedAyahCount: number; localDate: string | null }> {
  const normalizedAyahIds = Array.from(
    new Set(input.ayahIds.map(normalizeAyahId).filter((ayahId): ayahId is number => ayahId != null)),
  ).sort((a, b) => a - b);

  if (normalizedAyahIds.length < 1) {
    return { recordedAyahCount: 0, alreadyTrackedAyahCount: 0, localDate: null };
  }

  const now = input.now ?? new Date();
  let markerSession: { id: string; localDate: string };
  try {
    markerSession = await getOrCreateBrowseMarkerSession({
      profileId: input.profileId,
      mode: input.mode,
      timezone: input.timezone,
      now,
    });
  } catch (error) {
    if (looksLikeMissingCoreSchema(error)) {
      return { recordedAyahCount: 0, alreadyTrackedAyahCount: 0, localDate: null };
    }
    throw error;
  }

  try {
    const existingRows = await db().reviewEvent.findMany({
      where: {
        userId: input.profileId,
        sessionId: markerSession.id,
        ayahId: { in: normalizedAyahIds },
        stage: QURAN_BROWSE_MARKER_STAGE,
        phase: QURAN_BROWSE_MARKER_PHASE,
        grade: null,
        durationSec: QURAN_BROWSE_MARKER_DURATION_SEC,
      },
      select: {
        ayahId: true,
        fromAyahId: true,
        toAyahId: true,
      },
    });

    const existingAyahSet = new Set<number>();
    for (const row of existingRows) {
      if (row.fromAyahId === row.ayahId && row.toAyahId === row.ayahId) {
        existingAyahSet.add(row.ayahId);
      }
    }

    const missingAyahs = normalizedAyahIds.filter((ayahId) => !existingAyahSet.has(ayahId));
    if (missingAyahs.length > 0) {
      await db().reviewEvent.createMany({
        data: missingAyahs.map((ayahId) => {
          const ayah = getAyahById(ayahId);
          return {
            userId: input.profileId,
            sessionId: markerSession.id,
            surahNumber: ayah?.surahNumber ?? 1,
            ayahId,
            stage: QURAN_BROWSE_MARKER_STAGE,
            phase: QURAN_BROWSE_MARKER_PHASE,
            grade: null,
            durationSec: QURAN_BROWSE_MARKER_DURATION_SEC,
            fromAyahId: ayahId,
            toAyahId: ayahId,
            createdAt: now,
          };
        }),
      });
    }

    return {
      recordedAyahCount: missingAyahs.length,
      alreadyTrackedAyahCount: normalizedAyahIds.length - missingAyahs.length,
      localDate: markerSession.localDate,
    };
  } catch (error) {
    if (looksLikeMissingCoreSchema(error)) {
      return {
        recordedAyahCount: 0,
        alreadyTrackedAyahCount: 0,
        localDate: markerSession.localDate,
      };
    }
    throw error;
  }
}

export async function getQuranReadProgress(profileId: string): Promise<QuranReadProgress> {
  const where = markerWhere(profileId);
  let distinctAyahs: Array<{ ayahId: number }>;
  let latestRead: {
    ayahId: number;
    createdAt: Date;
    stage: AttemptStage;
    phase: ReviewPhase;
    grade: string | null;
    durationSec: number;
    fromAyahId: number | null;
    toAyahId: number | null;
  } | null;

  try {
    [distinctAyahs, latestRead] = await Promise.all([
      db().reviewEvent.groupBy({
        by: ["ayahId"],
        where,
      }),
      db().reviewEvent.findFirst({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          ayahId: true,
          createdAt: true,
          stage: true,
          phase: true,
          grade: true,
          durationSec: true,
          fromAyahId: true,
          toAyahId: true,
        },
      }),
    ]);
  } catch (error) {
    if (looksLikeMissingCoreSchema(error)) {
      return {
        uniqueReadAyahCount: 0,
        completionPct: 0,
        completionKhatmahCount: 0,
        lastReadAyahId: null,
        lastReadAt: null,
      };
    }
    throw error;
  }

  const uniqueReadAyahCount = distinctAyahs.length;
  const completionPct = Number(((clamp(uniqueReadAyahCount, 0, TOTAL_AYAHS) / TOTAL_AYAHS) * 100).toFixed(1));
  const completionKhatmahCount = uniqueReadAyahCount >= TOTAL_AYAHS ? 1 : 0;
  const hasValidLatest = latestRead ? isBrowseMarker(latestRead as MarkerShape) : false;

  return {
    uniqueReadAyahCount,
    completionPct,
    completionKhatmahCount,
    lastReadAyahId: hasValidLatest ? latestRead!.ayahId : null,
    lastReadAt: hasValidLatest ? latestRead!.createdAt.toISOString() : null,
  };
}
