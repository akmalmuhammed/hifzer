import "server-only";

import type { QuranBrowseSource } from "@prisma/client";
import { isoDateInTimeZone } from "@/hifzer/engine/date";
import { getAyahById } from "@/hifzer/quran/lookup.server";
import { db } from "@/lib/db";
import { getCoreSchemaCapabilities } from "@/lib/db-compat";

const TOTAL_AYAHS = 6236;
const RESUME_SOURCES: QuranBrowseSource[] = ["READER_VIEW", "BACKFILL"];

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
    message.includes("QuranBrowseEvent") ||
    message.includes("QuranBrowseSource") ||
    message.includes("P2021") ||
    message.includes("P2022") ||
    /column .* does not exist/i.test(message) ||
    /relation .* does not exist/i.test(message) ||
    /type .* does not exist/i.test(message)
  );
}

async function quranBrowseTrackingAvailable(): Promise<boolean> {
  const capabilities = await getCoreSchemaCapabilities();
  return capabilities.hasQuranBrowseTable;
}

async function upsertQuranBrowseEvent(input: {
  profileId: string;
  ayahId: number;
  source: QuranBrowseSource;
  timezone: string;
  now: Date;
}): Promise<boolean> {
  const ayah = getAyahById(input.ayahId);
  if (!ayah) {
    return false;
  }

  const localDate = isoDateInTimeZone(input.now, input.timezone);
  try {
    const existing = await db().quranBrowseEvent.findUnique({
      where: {
        userId_localDate_ayahId_source: {
          userId: input.profileId,
          localDate,
          ayahId: input.ayahId,
          source: input.source,
        },
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      await db().quranBrowseEvent.update({
        where: { id: existing.id },
        data: {
          lastSeenAt: input.now,
        },
      });
      return false;
    }

    await db().quranBrowseEvent.create({
      data: {
        userId: input.profileId,
        ayahId: input.ayahId,
        surahNumber: ayah.surahNumber,
        localDate,
        source: input.source,
        firstSeenAt: input.now,
        lastSeenAt: input.now,
      },
    });
    return true;
  } catch (error) {
    if (looksLikeMissingCoreSchema(error)) {
      return false;
    }
    throw error;
  }
}

export async function recordQuranBrowseAyahRead(input: {
  profileId: string;
  timezone: string;
  ayahId: number;
  source: QuranBrowseSource;
  now?: Date;
}): Promise<{ recorded: boolean; localDate: string | null }> {
  const normalizedAyahId = normalizeAyahId(input.ayahId);
  if (normalizedAyahId == null) {
    return { recorded: false, localDate: null };
  }
  if (!(await quranBrowseTrackingAvailable())) {
    return { recorded: false, localDate: null };
  }

  const now = input.now ?? new Date();
  const localDate = isoDateInTimeZone(now, input.timezone);
  const recorded = await upsertQuranBrowseEvent({
    profileId: input.profileId,
    ayahId: normalizedAyahId,
    source: input.source,
    timezone: input.timezone,
    now,
  });

  return {
    recorded,
    localDate,
  };
}

export async function recordQuranBrowseAyahSet(input: {
  profileId: string;
  timezone: string;
  ayahIds: number[];
  source: QuranBrowseSource;
  now?: Date;
}): Promise<{ recordedAyahCount: number; alreadyTrackedAyahCount: number; localDate: string | null }> {
  const normalizedAyahIds = Array.from(
    new Set(input.ayahIds.map(normalizeAyahId).filter((ayahId): ayahId is number => ayahId != null)),
  ).sort((a, b) => a - b);

  if (normalizedAyahIds.length < 1) {
    return { recordedAyahCount: 0, alreadyTrackedAyahCount: 0, localDate: null };
  }
  if (!(await quranBrowseTrackingAvailable())) {
    return { recordedAyahCount: 0, alreadyTrackedAyahCount: 0, localDate: null };
  }

  const now = input.now ?? new Date();
  const localDate = isoDateInTimeZone(now, input.timezone);
  let recordedAyahCount = 0;
  let alreadyTrackedAyahCount = 0;

  for (const ayahId of normalizedAyahIds) {
    const recorded = await upsertQuranBrowseEvent({
      profileId: input.profileId,
      ayahId,
      source: input.source,
      timezone: input.timezone,
      now,
    });
    if (recorded) {
      recordedAyahCount += 1;
    } else {
      alreadyTrackedAyahCount += 1;
    }
  }

  return {
    recordedAyahCount,
    alreadyTrackedAyahCount,
    localDate,
  };
}

export async function recordQuranBrowseAyahRangeRead(input: {
  profileId: string;
  timezone: string;
  ayahIds: number[];
  now?: Date;
}): Promise<{ recordedAyahCount: number; alreadyTrackedAyahCount: number; localDate: string | null }> {
  return recordQuranBrowseAyahSet({
    profileId: input.profileId,
    timezone: input.timezone,
    ayahIds: input.ayahIds,
    source: "BACKFILL",
    now: input.now,
  });
}

export async function listQuranBrowseEvents(input: {
  profileId: string;
  sources?: QuranBrowseSource[];
  startLocalDate?: string;
  endLocalDate?: string;
}) {
  if (!(await quranBrowseTrackingAvailable())) {
    return [];
  }

  try {
    return await db().quranBrowseEvent.findMany({
      where: {
        userId: input.profileId,
        ...(input.sources?.length ? { source: { in: input.sources } } : {}),
        ...((input.startLocalDate || input.endLocalDate)
          ? {
              localDate: {
                ...(input.startLocalDate ? { gte: input.startLocalDate } : {}),
                ...(input.endLocalDate ? { lte: input.endLocalDate } : {}),
              },
            }
          : {}),
      },
      select: {
        ayahId: true,
        surahNumber: true,
        localDate: true,
        source: true,
        lastSeenAt: true,
      },
      orderBy: [{ lastSeenAt: "desc" }, { id: "desc" }],
    });
  } catch (error) {
    if (looksLikeMissingCoreSchema(error)) {
      return [];
    }
    throw error;
  }
}

export async function getQuranReadProgress(profileId: string): Promise<QuranReadProgress> {
  if (!(await quranBrowseTrackingAvailable())) {
    return {
      uniqueReadAyahCount: 0,
      completionPct: 0,
      completionKhatmahCount: 0,
      lastReadAyahId: null,
      lastReadAt: null,
    };
  }

  try {
    const [distinctAyahs, latestRead] = await Promise.all([
      db().quranBrowseEvent.groupBy({
        by: ["ayahId"],
        where: { userId: profileId },
      }),
      db().quranBrowseEvent.findFirst({
        where: {
          userId: profileId,
          source: { in: RESUME_SOURCES },
        },
        orderBy: [{ lastSeenAt: "desc" }, { id: "desc" }],
        select: {
          ayahId: true,
          lastSeenAt: true,
        },
      }),
    ]);

    const uniqueReadAyahCount = distinctAyahs.length;
    const completionPct = Number(((clamp(uniqueReadAyahCount, 0, TOTAL_AYAHS) / TOTAL_AYAHS) * 100).toFixed(1));
    const completionKhatmahCount = uniqueReadAyahCount >= TOTAL_AYAHS ? 1 : 0;

    return {
      uniqueReadAyahCount,
      completionPct,
      completionKhatmahCount,
      lastReadAyahId: latestRead?.ayahId ?? null,
      lastReadAt: latestRead?.lastSeenAt.toISOString() ?? null,
    };
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
}
