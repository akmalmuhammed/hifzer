import "server-only";

import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { getAyahById, getSurahInfo, listSurahs } from "@/hifzer/quran/lookup.server";
import { listQuranBrowseEvents } from "@/hifzer/quran/read-progress.server";
import { db, dbConfigured } from "@/lib/db";

export type SurahProgressItem = {
  lane: "QURAN" | "HIFZ";
  surahNumber: number;
  surahName: string;
  ayahCount: number;
  completedAyahCount: number;
  completionPct: number;
  completionCount: number;
  lastTouchedAt: string | null;
  isCurrent: boolean;
  isCompleted: boolean;
};

type QuranProgressEvent = {
  ayahId: number;
  surahNumber: number;
  localDate: string;
  lastSeenAt: Date;
};

type HifzProgressEvent = {
  ayahId: number;
  surahNumber: number;
  createdAt: Date;
};

type Aggregate = {
  surahNumber: number;
  ayahIds: Set<number>;
  completionMarkers: Set<string>;
  lastTouchedAt: Date | null;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function percent(count: number, total: number): number {
  if (!Number.isFinite(count) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.round((clamp(count, 0, total) / total) * 100);
}

function getAggregate(map: Map<number, Aggregate>, surahNumber: number): Aggregate {
  const existing = map.get(surahNumber);
  if (existing) {
    return existing;
  }
  const created: Aggregate = {
    surahNumber,
    ayahIds: new Set<number>(),
    completionMarkers: new Set<string>(),
    lastTouchedAt: null,
  };
  map.set(surahNumber, created);
  return created;
}

function toSortedItems(items: SurahProgressItem[]): SurahProgressItem[] {
  return [...items].sort((left, right) =>
    Number(right.isCurrent) - Number(left.isCurrent) ||
    Number(right.isCompleted) - Number(left.isCompleted) ||
    right.completionCount - left.completionCount ||
    right.completionPct - left.completionPct ||
    (right.lastTouchedAt ? new Date(right.lastTouchedAt).getTime() : 0) -
      (left.lastTouchedAt ? new Date(left.lastTouchedAt).getTime() : 0) ||
    left.surahNumber - right.surahNumber
  );
}

export function summarizeQuranSurahProgress(input: {
  events: QuranProgressEvent[];
  quranActiveSurahNumber: number;
  quranCursorAyahId: number;
}): SurahProgressItem[] {
  const aggregates = new Map<number, Aggregate>();

  for (const event of input.events) {
    const surah = getSurahInfo(event.surahNumber);
    if (!surah) {
      continue;
    }
    const aggregate = getAggregate(aggregates, event.surahNumber);
    aggregate.ayahIds.add(event.ayahId);
    if (event.ayahId === surah.endAyahId) {
      aggregate.completionMarkers.add(event.localDate);
    }
    if (!aggregate.lastTouchedAt || event.lastSeenAt.getTime() > aggregate.lastTouchedAt.getTime()) {
      aggregate.lastTouchedAt = event.lastSeenAt;
    }
  }

  const currentAyah = getAyahById(input.quranCursorAyahId);
  if (currentAyah && currentAyah.surahNumber === input.quranActiveSurahNumber) {
    const aggregate = getAggregate(aggregates, currentAyah.surahNumber);
    for (let ayahNumber = 1; ayahNumber <= currentAyah.ayahNumber; ayahNumber += 1) {
      aggregate.ayahIds.add((currentAyah.id - currentAyah.ayahNumber) + ayahNumber);
    }
  } else if (getSurahInfo(input.quranActiveSurahNumber)) {
    getAggregate(aggregates, input.quranActiveSurahNumber);
  }

  const items = listSurahs()
    .map((surah) => {
      const aggregate = aggregates.get(surah.surahNumber);
      if (!aggregate) {
        return null;
      }
      const completedAyahCount = clamp(aggregate.ayahIds.size, 0, surah.ayahCount);
      const isCompleted = completedAyahCount >= surah.ayahCount;
      const completionCount = isCompleted
        ? Math.max(aggregate.completionMarkers.size, 1)
        : 0;
      const item: SurahProgressItem = {
        lane: "QURAN",
        surahNumber: surah.surahNumber,
        surahName: surah.nameTransliteration,
        ayahCount: surah.ayahCount,
        completedAyahCount,
        completionPct: percent(completedAyahCount, surah.ayahCount),
        completionCount,
        lastTouchedAt: aggregate.lastTouchedAt?.toISOString() ?? null,
        isCurrent: surah.surahNumber === input.quranActiveSurahNumber,
        isCompleted,
      };
      if (!item.isCurrent && item.completedAyahCount < 1 && item.completionCount < 1) {
        return null;
      }
      return item;
    })
    .filter((item): item is SurahProgressItem => item != null);

  return toSortedItems(items);
}

export function summarizeHifzSurahProgress(input: {
  events: HifzProgressEvent[];
  activeSurahNumber: number;
  cursorAyahId: number;
}): SurahProgressItem[] {
  const aggregates = new Map<number, Aggregate>();

  for (const event of input.events) {
    const surah = getSurahInfo(event.surahNumber);
    if (!surah) {
      continue;
    }
    const aggregate = getAggregate(aggregates, event.surahNumber);
    aggregate.ayahIds.add(event.ayahId);
    if (!aggregate.lastTouchedAt || event.createdAt.getTime() > aggregate.lastTouchedAt.getTime()) {
      aggregate.lastTouchedAt = event.createdAt;
    }
  }

  const currentAyah = getAyahById(input.cursorAyahId);
  if (currentAyah && currentAyah.surahNumber === input.activeSurahNumber) {
    getAggregate(aggregates, currentAyah.surahNumber);
  } else if (getSurahInfo(input.activeSurahNumber)) {
    getAggregate(aggregates, input.activeSurahNumber);
  }

  const items = listSurahs()
    .map((surah) => {
      const aggregate = aggregates.get(surah.surahNumber);
      if (!aggregate) {
        return null;
      }

      const isCurrent = surah.surahNumber === input.activeSurahNumber;
      const cursorCompletedAyahCount = isCurrent
        ? clamp(input.cursorAyahId - surah.startAyahId, 0, surah.ayahCount)
        : 0;
      const completedAyahCount = clamp(
        Math.max(aggregate.ayahIds.size, cursorCompletedAyahCount),
        0,
        surah.ayahCount,
      );
      const isCompleted = completedAyahCount >= surah.ayahCount;

      const item: SurahProgressItem = {
        lane: "HIFZ",
        surahNumber: surah.surahNumber,
        surahName: surah.nameTransliteration,
        ayahCount: surah.ayahCount,
        completedAyahCount,
        completionPct: percent(completedAyahCount, surah.ayahCount),
        completionCount: isCompleted ? 1 : 0,
        lastTouchedAt: aggregate.lastTouchedAt?.toISOString() ?? null,
        isCurrent,
        isCompleted,
      };
      if (!item.isCurrent && item.completedAyahCount < 1 && item.completionCount < 1) {
        return null;
      }
      return item;
    })
    .filter((item): item is SurahProgressItem => item != null);

  return toSortedItems(items);
}

export async function listQuranSurahProgress(clerkUserId: string): Promise<SurahProgressItem[]> {
  if (!dbConfigured()) {
    return [];
  }
  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    return [];
  }
  const events = await listQuranBrowseEvents({ profileId: profile.id });
  return summarizeQuranSurahProgress({
    events,
    quranActiveSurahNumber: profile.quranActiveSurahNumber,
    quranCursorAyahId: profile.quranCursorAyahId,
  });
}

export async function listHifzSurahProgress(clerkUserId: string): Promise<SurahProgressItem[]> {
  if (!dbConfigured()) {
    return [];
  }
  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    return [];
  }
  const events = await db().reviewEvent.findMany({
    where: {
      userId: profile.id,
      grade: { not: null },
    },
    select: {
      ayahId: true,
      surahNumber: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return summarizeHifzSurahProgress({
    events,
    activeSurahNumber: profile.activeSurahNumber,
    cursorAyahId: profile.cursorAyahId,
  });
}
