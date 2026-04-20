import "server-only";

import type { Prisma } from "@prisma/client";
import { buildLegacyJournalBlocks, type JournalEntry, type JournalLinkedAyah } from "@/hifzer/journal/local-store";
import { getAyahById, getSurahInfo } from "@/hifzer/quran/lookup.server";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { db, dbConfigured } from "@/lib/db";
import { getQuranFoundationConfig, normalizeQuranFoundationScopes } from "./config";
import {
  getQuranFoundationUserApiSession,
  quranFoundationUserApiRequest,
  updateQuranFoundationAccountSyncState,
} from "./server";
import {
  QuranFoundationError,
  type QuranFoundationCollectionsSummary,
  type QuranFoundationConnectedOverview,
  type QuranFoundationGoalPlanSummary,
  type QuranFoundationNotesSummary,
  type QuranFoundationReadingSessionSummary,
  type QuranFoundationStreakSummary,
} from "./types";

type RemotePagination = {
  endCursor?: string;
  hasNextPage?: boolean;
};

type RemoteCollection = {
  id: string;
  name: string;
  updatedAt?: string;
};

type RemoteReadingSession = {
  chapterNumber?: number;
  verseNumber?: number;
  updatedAt?: string;
  createdAt?: string;
};

type RemoteAttachedEntity = {
  entityId?: string;
  entityType?: string;
  entityMetadata?: Record<string, unknown> | null;
};

type RemoteNote = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  body: string;
  source?: string | null;
  attachedEntity?: RemoteAttachedEntity | null;
  attachedEntities?: RemoteAttachedEntity[];
  ranges?: string[];
};

type LocalBookmarkCategoryWithBookmarks = Prisma.BookmarkCategoryGetPayload<{
  include: {
    bookmarks: {
      where: { deletedAt: null };
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }];
    };
  };
}>;

const NOTE_CLIENT_ID_PREFIX = "qf-note:";
const GOAL_PLAN_TYPES = [
  "QURAN_READING_PROGRAM",
  "QURAN_RANGE",
  "QURAN_PAGES",
  "QURAN_TIME",
  "COURSE",
] as const;
const GOAL_PLAN_PATHS = [
  "/goals/todays-plan",
  "/goals/today-plan",
  "/goals/todays-goal-plan",
] as const;

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
}

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeCollectionName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

function pickFirstString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function pickFirstNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
  }
  return null;
}

function parseRemotePagination(payload: Record<string, unknown>): RemotePagination | null {
  return asObject(payload.pagination) as RemotePagination | null;
}

function parseRemoteNoteId(clientEntryId: string | null | undefined): string | null {
  const trimmed = normalizeText(clientEntryId);
  if (!trimmed || !trimmed.startsWith(NOTE_CLIENT_ID_PREFIX)) {
    return null;
  }
  return normalizeText(trimmed.slice(NOTE_CLIENT_ID_PREFIX.length));
}

function formatVerseRange(input: {
  startSurahNumber: number;
  startAyahNumber: number;
  endSurahNumber: number;
  endAyahNumber: number;
}): string {
  return `${input.startSurahNumber}:${input.startAyahNumber}-${input.endSurahNumber}:${input.endAyahNumber}`;
}

export function buildVerseRangesFromAyahIds(ayahIds: number[]): string[] {
  const uniqueAyahIds = Array.from(
    new Set(
      ayahIds
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0)
        .map((value) => Math.floor(value)),
    ),
  ).sort((a, b) => a - b);

  const ranges: string[] = [];
  let currentStart = null as ReturnType<typeof getAyahById> | null;
  let currentEnd = null as ReturnType<typeof getAyahById> | null;

  for (const ayahId of uniqueAyahIds) {
    const ayah = getAyahById(ayahId);
    if (!ayah) {
      continue;
    }

    if (!currentStart || !currentEnd) {
      currentStart = ayah;
      currentEnd = ayah;
      continue;
    }

    const sameSurah = ayah.surahNumber === currentEnd.surahNumber;
    const contiguousAyah = ayah.ayahNumber === currentEnd.ayahNumber + 1;
    if (sameSurah && contiguousAyah) {
      currentEnd = ayah;
      continue;
    }

    ranges.push(
      formatVerseRange({
        startSurahNumber: currentStart.surahNumber,
        startAyahNumber: currentStart.ayahNumber,
        endSurahNumber: currentEnd.surahNumber,
        endAyahNumber: currentEnd.ayahNumber,
      }),
    );
    currentStart = ayah;
    currentEnd = ayah;
  }

  if (currentStart && currentEnd) {
    ranges.push(
      formatVerseRange({
        startSurahNumber: currentStart.surahNumber,
        startAyahNumber: currentStart.ayahNumber,
        endSurahNumber: currentEnd.surahNumber,
        endAyahNumber: currentEnd.ayahNumber,
      }),
    );
  }

  return ranges;
}

function linkedAyahFromRangeStart(range: string): JournalLinkedAyah | null {
  const match = range.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
  if (!match) {
    return null;
  }

  const surahNumber = Number(match[1]);
  const ayahNumber = Number(match[2]);
  if (!Number.isFinite(surahNumber) || !Number.isFinite(ayahNumber)) {
    return null;
  }

  const surah = getSurahInfo(surahNumber);
  const ayah = getAyahById((surah?.startAyahId ?? 1) + (ayahNumber - 1));
  if (!surah || !ayah || ayah.surahNumber !== surahNumber || ayah.ayahNumber !== ayahNumber) {
    return null;
  }

  return {
    ayahId: ayah.id,
    surahNumber,
    ayahNumber,
    surahNameArabic: surah.nameArabic,
    surahNameTransliteration: surah.nameTransliteration,
  };
}

function collectJournalAyahIds(entry: JournalEntry): number[] {
  const ayahIds = new Set<number>();
  for (const block of entry.blocks ?? []) {
    if (block.kind === "ayah" && block.ayah?.ayahId) {
      ayahIds.add(block.ayah.ayahId);
    }
  }
  if (entry.linkedAyah?.ayahId) {
    ayahIds.add(entry.linkedAyah.ayahId);
  }
  return Array.from(ayahIds);
}

function buildRemoteNoteBody(entry: JournalEntry): string | null {
  const contentParts = [normalizeText(entry.title), normalizeText(entry.content)].filter(
    (value): value is string => Boolean(value),
  );
  let body = contentParts.join("\n\n");
  if (!body && entry.tags.length > 0) {
    body = `Tags: ${entry.tags.join(", ")}`;
  }
  if (body.length >= 6) {
    return body.slice(0, 10_000);
  }
  return null;
}

function isDuplicateCollectionBookmarkError(error: unknown): boolean {
  if (!(error instanceof QuranFoundationError)) {
    return false;
  }
  const message = error.message.toLocaleLowerCase();
  return message.includes("already") && message.includes("bookmark");
}

async function ensureLinkedQuranFoundationUser(clerkUserId: string) {
  const session = await getQuranFoundationUserApiSession(clerkUserId);
  if (!session) {
    throw new QuranFoundationError("Link your Quran.com account before using connected sync.", {
      status: 412,
      code: "qf_not_linked",
      retryable: false,
    });
  }
  return session;
}

function hasGrantedScope(scopes: string[] | null | undefined, ...candidates: string[]): boolean {
  const granted = normalizeQuranFoundationScopes(scopes);
  return candidates.some((scope) => granted.includes(scope));
}

function assertGrantedScope(scopes: string[] | null | undefined, candidates: string[], message: string) {
  if (!hasGrantedScope(scopes, ...candidates)) {
    throw new QuranFoundationError(message, {
      status: 412,
      code: "qf_scope_missing",
      retryable: false,
    });
  }
}

async function listRemoteCollections(clerkUserId: string): Promise<RemoteCollection[]> {
  const collections: RemoteCollection[] = [];
  let after: string | undefined;

  while (true) {
    const { payload } = await quranFoundationUserApiRequest<RemoteCollection[]>(clerkUserId, {
      path: "/collections",
      query: {
        type: "ayah",
        first: 20,
        after,
      },
    });

    collections.push(...(Array.isArray(payload.data) ? (payload.data as RemoteCollection[]) : []));
    const pagination = parseRemotePagination(payload);
    if (!pagination?.hasNextPage || !pagination.endCursor) {
      break;
    }
    after = pagination.endCursor;
  }

  return collections;
}

async function createRemoteCollection(clerkUserId: string, name: string): Promise<RemoteCollection> {
  const { data } = await quranFoundationUserApiRequest<RemoteCollection>(clerkUserId, {
    path: "/collections",
    method: "POST",
    mutation: true,
    body: { name },
  });
  return data;
}

async function addBookmarkToRemoteCollection(input: {
  clerkUserId: string;
  collectionId: string;
  surahNumber: number;
  ayahNumber: number;
}) {
  const config = getQuranFoundationConfig();
  await quranFoundationUserApiRequest(input.clerkUserId, {
    path: `/collections/${encodeURIComponent(input.collectionId)}/bookmarks`,
    method: "POST",
    mutation: true,
    body: {
      key: input.surahNumber,
      type: "ayah",
      verseNumber: input.ayahNumber,
      mushaf: config.bookmarkMushafId,
    },
  });
}

async function ensureRemoteCollectionIdByName(
  clerkUserId: string,
  name: string,
  cache: Map<string, RemoteCollection>,
): Promise<{ collectionId: string; created: boolean }> {
  const normalized = normalizeCollectionName(name);
  const existing = cache.get(normalized);
  if (existing) {
    return { collectionId: existing.id, created: false };
  }

  const created = await createRemoteCollection(clerkUserId, name);
  cache.set(normalized, created);
  return { collectionId: created.id, created: true };
}

async function listRemoteNotes(clerkUserId: string): Promise<RemoteNote[]> {
  const notes: RemoteNote[] = [];
  let cursor: string | undefined;

  while (true) {
    const { payload } = await quranFoundationUserApiRequest<RemoteNote[]>(clerkUserId, {
      path: "/notes",
      query: {
        limit: 50,
        sortBy: "newest",
        cursor,
      },
    });

    notes.push(...(Array.isArray(payload.data) ? (payload.data as RemoteNote[]) : []));
    const pagination = parseRemotePagination(payload);
    if (!pagination?.hasNextPage || !pagination.endCursor) {
      break;
    }
    cursor = pagination.endCursor;
  }

  return notes;
}

async function fetchLatestRemoteReadingSession(
  clerkUserId: string,
): Promise<QuranFoundationReadingSessionSummary | null> {
  const { data } = await quranFoundationUserApiRequest<RemoteReadingSession[] | RemoteReadingSession>(clerkUserId, {
    path: "/reading-sessions",
    query: {
      first: 5,
    },
  });

  const rows =
    Array.isArray(data)
      ? data
      : asArray(asObject(data)?.items).length > 0
        ? (asArray(asObject(data)?.items) as RemoteReadingSession[])
        : [data].filter(Boolean) as RemoteReadingSession[];

  const sessions = rows
    .map((row) => ({
      surahNumber: Number(row.chapterNumber),
      ayahNumber: Number(row.verseNumber),
      updatedAt: normalizeText(row.updatedAt ?? row.createdAt) ?? null,
    }))
    .filter((row) => Number.isFinite(row.surahNumber) && Number.isFinite(row.ayahNumber));

  if (sessions.length === 0) {
    return null;
  }

  sessions.sort((left, right) => (right.updatedAt ?? "").localeCompare(left.updatedAt ?? ""));
  return {
    surahNumber: Math.floor(sessions[0].surahNumber),
    ayahNumber: Math.floor(sessions[0].ayahNumber),
    updatedAt: sessions[0].updatedAt,
  };
}

async function fetchRemoteStreakSummary(clerkUserId: string): Promise<QuranFoundationStreakSummary | null> {
  const { data } = await quranFoundationUserApiRequest<Record<string, unknown>[] | Record<string, unknown>>(clerkUserId, {
    path: "/streaks",
  });

  const items = Array.isArray(data) ? data : asArray(asObject(data)?.items);
  if (items.length === 0) {
    return null;
  }

  const normalized = items.map((item) => {
    const days = pickFirstNumber(item, ["days", "currentStreakDays", "streakDays"]);
    const status = normalizeText(pickFirstString(item, ["status", "state", "kind"]));
    return {
      days: days ? Math.max(0, Math.floor(days)) : 0,
      status: status?.toLocaleLowerCase() ?? null,
      hasEndDate: Boolean(normalizeText(pickFirstString(item, ["endDate"]))),
    };
  });

  const activeRows = normalized.filter(
    (item) => item.status === "current" || item.status === "active" || (!item.hasEndDate && item.days > 0),
  );
  const currentDays = activeRows.reduce((max, item) => Math.max(max, item.days), 0);
  const bestDays = normalized.reduce((max, item) => Math.max(max, item.days), 0);

  return {
    currentDays,
    bestDays: bestDays > 0 ? bestDays : null,
    activeCount: activeRows.length,
  };
}

function summarizeGoalPlan(type: string, payload: unknown): QuranFoundationGoalPlanSummary | null {
  const record = asObject(payload);
  if (!record || Object.keys(record).length === 0) {
    return null;
  }

  const title =
    pickFirstString(record, ["title", "name", "label", "programName", "goalName"]) ??
    (type === "QURAN_TIME"
      ? "Reading time goal"
      : type === "QURAN_PAGES"
        ? "Pages goal"
        : type === "QURAN_RANGE"
          ? "Reading range goal"
          : "Qur'an goal");

  const remainingValue = pickFirstNumber(record, [
    "remainingDailyTarget",
    "remainingTarget",
    "remainingPages",
    "remainingVerses",
    "remainingSeconds",
    "remainingMinutes",
  ]);

  let remaining: string | null = null;
  if (remainingValue !== null) {
    if (type === "QURAN_TIME") {
      const roundedMinutes = Math.max(1, Math.round(remainingValue / 60));
      remaining = `${roundedMinutes} min left`;
    } else if (type === "QURAN_PAGES") {
      remaining = `${Math.max(0, Math.round(remainingValue))} pages left`;
    } else if (type === "QURAN_RANGE") {
      remaining = `${Math.max(0, Math.round(remainingValue))} ayahs left`;
    } else {
      remaining = `${Math.max(0, Math.round(remainingValue))} left`;
    }
  }

  if (!remaining) {
    const completed = record.completed === true || record.isCompleted === true;
    if (completed) {
      remaining = "Completed";
    }
  }

  return {
    type,
    title,
    remaining,
  };
}

async function fetchRemoteGoalPlan(
  clerkUserId: string,
  timezone: string,
): Promise<QuranFoundationGoalPlanSummary | null> {
  for (const type of GOAL_PLAN_TYPES) {
    for (const path of GOAL_PLAN_PATHS) {
      try {
        const { data } = await quranFoundationUserApiRequest<Record<string, unknown>>(clerkUserId, {
          path,
          query: { type },
          headers: { "x-timezone": timezone },
        });
        const summary = summarizeGoalPlan(type, data);
        if (summary) {
          return summary;
        }
      } catch (error) {
        if (error instanceof QuranFoundationError && (error.status === 404 || error.status === 422)) {
          continue;
        }
        throw error;
      }
    }
  }

  return null;
}

function summarizeRemoteCollections(collections: RemoteCollection[]): QuranFoundationCollectionsSummary | null {
  return collections.length > 0 ? { count: collections.length } : null;
}

function summarizeRemoteNotes(notes: RemoteNote[]): QuranFoundationNotesSummary | null {
  return notes.length > 0 ? { count: notes.length } : null;
}

async function estimateReadingTimeSeconds(clerkUserId: string, ranges: string[]): Promise<number | null> {
  const { data } = await quranFoundationUserApiRequest<Record<string, unknown>>(clerkUserId, {
    path: "/activity-days/estimate-reading-time",
    query: { ranges },
  });
  const record = asObject(data);
  if (!record) {
    return null;
  }
  const seconds = pickFirstNumber(record, ["seconds", "readingTime", "estimatedReadingTime"]);
  return seconds && seconds > 0 ? Math.round(seconds) : null;
}

export async function syncReadingSessionToQuranFoundation(input: {
  clerkUserId: string;
  surahNumber: number;
  ayahNumber: number;
}) {
  const session = await ensureLinkedQuranFoundationUser(input.clerkUserId);
  assertGrantedScope(
    session.account.scopes,
    ["reading_session", "reading_session.create", "reading_session.update"],
    "Reconnect Quran.com to sync your reading place.",
  );
  await quranFoundationUserApiRequest(input.clerkUserId, {
    path: "/reading-sessions",
    method: "POST",
    mutation: true,
    body: {
      chapterNumber: input.surahNumber,
      verseNumber: input.ayahNumber,
    },
  });

  await updateQuranFoundationAccountSyncState(input.clerkUserId, {
    lastSyncedAt: new Date(),
    lastError: null,
    status: "connected",
  });
}

export async function syncActivityDayToQuranFoundation(input: {
  clerkUserId: string;
  ayahIds: number[];
  localDate: string | null;
  timezone: string;
}) {
  if (!input.localDate) {
    return false;
  }

  const session = await ensureLinkedQuranFoundationUser(input.clerkUserId);
  assertGrantedScope(
    session.account.scopes,
    ["activity_day", "activity_day.create", "activity_day.update", "activity_day.estimate"],
    "Reconnect Quran.com to sync your reading activity.",
  );
  const ranges = buildVerseRangesFromAyahIds(input.ayahIds);
  if (ranges.length === 0) {
    return false;
  }

  let seconds = Math.max(45, Math.round(input.ayahIds.length * 24));
  try {
    const estimated = await estimateReadingTimeSeconds(input.clerkUserId, ranges);
    if (estimated && estimated > 0) {
      seconds = estimated;
    }
  } catch {
    // Fail open to a reasonable local estimate if the helper endpoint is unavailable.
  }

  await quranFoundationUserApiRequest(input.clerkUserId, {
    path: "/activity-days",
    method: "POST",
    mutation: true,
    headers: { "x-timezone": input.timezone },
    body: {
      date: input.localDate,
      type: "QURAN",
      seconds,
      mushafId: getQuranFoundationConfig().bookmarkMushafId,
      ranges,
    },
  });

  await updateQuranFoundationAccountSyncState(input.clerkUserId, {
    lastSyncedAt: new Date(),
    lastError: null,
    status: "connected",
  });
  return true;
}

export async function syncQuranReadingContinuityToQuranFoundation(input: {
  clerkUserId: string;
  ayahIds: number[];
  latestSurahNumber: number;
  latestAyahNumber: number;
  localDate: string | null;
  timezone: string;
}) {
  const session = await getQuranFoundationUserApiSession(input.clerkUserId);
  if (!session) {
    return {
      linked: false,
      readingSessionSynced: false,
      activityDaySynced: false,
    };
  }

  const canSyncReadingSession = hasGrantedScope(
    session.account.scopes,
    "reading_session",
    "reading_session.create",
    "reading_session.update",
  );
  const canSyncActivityDay = hasGrantedScope(
    session.account.scopes,
    "activity_day",
    "activity_day.create",
    "activity_day.update",
  );

  const [readingSessionResult, activityDayResult] = await Promise.allSettled([
    canSyncReadingSession
      ? syncReadingSessionToQuranFoundation({
          clerkUserId: input.clerkUserId,
          surahNumber: input.latestSurahNumber,
          ayahNumber: input.latestAyahNumber,
        })
      : Promise.resolve(),
    canSyncActivityDay
      ? syncActivityDayToQuranFoundation({
          clerkUserId: input.clerkUserId,
          ayahIds: input.ayahIds,
          localDate: input.localDate,
          timezone: input.timezone,
        })
      : Promise.resolve(false),
  ]);

  const firstFailure = [readingSessionResult, activityDayResult].find((result) => result.status === "rejected");
  if (firstFailure?.status === "rejected") {
    await updateQuranFoundationAccountSyncState(input.clerkUserId, {
      lastError: firstFailure.reason instanceof Error ? firstFailure.reason.message : "Connected Quran sync failed.",
      status: "degraded",
    });
  }

  return {
    linked: true,
    readingSessionSynced: canSyncReadingSession && readingSessionResult.status === "fulfilled",
    activityDaySynced: activityDayResult.status === "fulfilled" && Boolean(activityDayResult.value),
  };
}

export async function syncBookmarkCollectionsToQuranFoundation(clerkUserId: string) {
  if (!dbConfigured()) {
    throw new QuranFoundationError("Database not configured.", {
      status: 503,
      code: "db_unavailable",
    });
  }

  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    throw new QuranFoundationError("Database not configured.", {
      status: 503,
      code: "db_unavailable",
    });
  }
  const session = await ensureLinkedQuranFoundationUser(clerkUserId);
  assertGrantedScope(
    session.account.scopes,
    ["collection", "collection.create", "collection.update"],
    "Reconnect Quran.com to sync bookmark folders.",
  );

  const categories = await db().bookmarkCategory.findMany({
    where: {
      userId: profile.id,
      archivedAt: null,
      bookmarks: {
        some: {
          deletedAt: null,
        },
      },
    },
    include: {
      bookmarks: {
        where: {
          deletedAt: null,
        },
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      },
    },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  }) as LocalBookmarkCategoryWithBookmarks[];

  const remoteCollections = await listRemoteCollections(clerkUserId);
  const collectionCache = new Map(
    remoteCollections.map((collection) => [normalizeCollectionName(collection.name), collection] as const),
  );

  let createdCollections = 0;
  let syncedBookmarks = 0;
  let alreadyPresent = 0;

  for (const category of categories) {
    if (!normalizeText(category.name)) {
      continue;
    }

    const ensured = await ensureRemoteCollectionIdByName(clerkUserId, category.name, collectionCache);
    if (ensured.created) {
      createdCollections += 1;
    }

    for (const bookmark of category.bookmarks) {
      try {
        await addBookmarkToRemoteCollection({
          clerkUserId,
          collectionId: ensured.collectionId,
          surahNumber: bookmark.surahNumber,
          ayahNumber: bookmark.ayahNumber,
        });
        syncedBookmarks += 1;
      } catch (error) {
        if (isDuplicateCollectionBookmarkError(error)) {
          alreadyPresent += 1;
          continue;
        }
        throw error;
      }
    }
  }

  await updateQuranFoundationAccountSyncState(clerkUserId, {
    lastSyncedAt: new Date(),
    lastError: null,
    status: "connected",
  });

  return {
    categories: categories.length,
    createdCollections,
    syncedBookmarks,
    alreadyPresent,
    remoteCollectionCount: collectionCache.size,
  };
}

export async function syncBookmarkCollectionMembershipForBookmark(input: {
  clerkUserId: string;
  surahNumber: number;
  ayahNumber: number;
  categoryName: string | null | undefined;
}) {
  const categoryName = normalizeText(input.categoryName);
  const session = await getQuranFoundationUserApiSession(input.clerkUserId);
  if (
    !categoryName ||
    !session ||
    !hasGrantedScope(session.account.scopes, "collection", "collection.create", "collection.update")
  ) {
    return false;
  }

  const remoteCollections = await listRemoteCollections(input.clerkUserId);
  const collectionCache = new Map(
    remoteCollections.map((collection) => [normalizeCollectionName(collection.name), collection] as const),
  );
  const ensured = await ensureRemoteCollectionIdByName(input.clerkUserId, categoryName, collectionCache);

  try {
    await addBookmarkToRemoteCollection({
      clerkUserId: input.clerkUserId,
      collectionId: ensured.collectionId,
      surahNumber: input.surahNumber,
      ayahNumber: input.ayahNumber,
    });
  } catch (error) {
    if (!isDuplicateCollectionBookmarkError(error)) {
      throw error;
    }
  }

  await updateQuranFoundationAccountSyncState(input.clerkUserId, {
    lastSyncedAt: new Date(),
    lastError: null,
    status: "connected",
  });
  return true;
}

export async function syncJournalEntryNoteToQuranFoundation(input: {
  clerkUserId: string;
  journalEntryId: string;
  clientEntryId: string | null | undefined;
  entry: JournalEntry;
}) {
  const session = await getQuranFoundationUserApiSession(input.clerkUserId);
  if (!session) {
    return null;
  }
  if (!hasGrantedScope(session.account.scopes, "note", "note.create", "note.update")) {
    return null;
  }

  const body = buildRemoteNoteBody(input.entry);
  if (!body) {
    return null;
  }

  const ranges = buildVerseRangesFromAyahIds(collectJournalAyahIds(input.entry));
  const attachedEntity = {
    entityId: input.journalEntryId,
    entityType: "reflection",
    entityMetadata: {
      entryType: input.entry.type,
    },
  };
  const createNotePayload = {
    body,
    saveToQR: false,
    attachedEntity,
    ranges,
  };
  const updateNotePayload = {
    body,
    saveToQR: false,
  };

  const remoteNoteId = parseRemoteNoteId(input.clientEntryId);
  if (remoteNoteId) {
    await quranFoundationUserApiRequest(input.clerkUserId, {
      path: `/notes/${encodeURIComponent(remoteNoteId)}`,
      method: "PATCH",
      mutation: true,
      body: updateNotePayload,
    });
    await updateQuranFoundationAccountSyncState(input.clerkUserId, {
      lastSyncedAt: new Date(),
      lastError: null,
      status: "connected",
    });
    return remoteNoteId;
  }

  const { data } = await quranFoundationUserApiRequest<RemoteNote>(input.clerkUserId, {
    path: "/notes",
    method: "POST",
    mutation: true,
    body: createNotePayload,
  });

  const createdNoteId = normalizeText(data.id);
  if (createdNoteId && dbConfigured()) {
    await db().privateJournalEntry.update({
      where: { id: input.journalEntryId },
      data: {
        clientEntryId: `${NOTE_CLIENT_ID_PREFIX}${createdNoteId}`,
      },
    });
  }

  await updateQuranFoundationAccountSyncState(input.clerkUserId, {
    lastSyncedAt: new Date(),
    lastError: null,
    status: "connected",
  });
  return createdNoteId;
}

export async function deleteJournalEntryNoteFromQuranFoundation(input: {
  clerkUserId: string;
  clientEntryId: string | null | undefined;
}) {
  const remoteNoteId = parseRemoteNoteId(input.clientEntryId);
  const session = await getQuranFoundationUserApiSession(input.clerkUserId);
  if (!remoteNoteId || !session || !hasGrantedScope(session.account.scopes, "note", "note.delete")) {
    return false;
  }

  try {
    await quranFoundationUserApiRequest(input.clerkUserId, {
      path: `/notes/${encodeURIComponent(remoteNoteId)}`,
      method: "DELETE",
      mutation: true,
    });
  } catch (error) {
    if (error instanceof QuranFoundationError && error.status === 404) {
      return false;
    }
    throw error;
  }

  await updateQuranFoundationAccountSyncState(input.clerkUserId, {
    lastSyncedAt: new Date(),
    lastError: null,
    status: "connected",
  });
  return true;
}

export async function listJournalEntriesFromQuranFoundationNotes(clerkUserId: string): Promise<JournalEntry[]> {
  const session = await ensureLinkedQuranFoundationUser(clerkUserId);
  assertGrantedScope(
    session.account.scopes,
    ["note", "note.read"],
    "Quran.com notes are not available for this connection yet.",
  );
  const notes = await listRemoteNotes(clerkUserId);

  return notes.map((note) => {
    const linkedAyah =
      Array.isArray(note.ranges) && note.ranges.length > 0 ? linkedAyahFromRangeStart(note.ranges[0]) : null;

    return {
      id: `${NOTE_CLIENT_ID_PREFIX}${note.id}`,
      type: "reflection",
      title: "",
      content: note.body,
      blocks: buildLegacyJournalBlocks({
        content: note.body,
        linkedAyah,
      }),
      tags: [],
      pinned: false,
      createdAt: normalizeText(note.createdAt) ?? new Date().toISOString(),
      updatedAt: normalizeText(note.updatedAt) ?? normalizeText(note.createdAt) ?? new Date().toISOString(),
      linkedAyah,
      linkedDua: null,
      duaStatus: null,
      autoDeleteAt: null,
    };
  });
}

export async function getQuranFoundationConnectedOverview(
  clerkUserId: string | null,
): Promise<QuranFoundationConnectedOverview | null> {
  if (!clerkUserId) {
    return null;
  }

  let session;
  try {
    session = await getQuranFoundationUserApiSession(clerkUserId);
    if (!session) {
      return null;
    }
  } catch (error) {
    if (error instanceof QuranFoundationError) {
      return null;
    }
    throw error;
  }

  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    return null;
  }

  const grantedScopes = normalizeQuranFoundationScopes(session.account.scopes);
  const [readingSession, streak, goalPlan, remoteCollections, remoteNotes] = await Promise.allSettled([
    hasGrantedScope(grantedScopes, "reading_session", "reading_session.read")
      ? fetchLatestRemoteReadingSession(clerkUserId)
      : Promise.resolve(null),
    hasGrantedScope(grantedScopes, "streak", "streak.read")
      ? fetchRemoteStreakSummary(clerkUserId)
      : Promise.resolve(null),
    hasGrantedScope(grantedScopes, "goal", "goal.read")
      ? fetchRemoteGoalPlan(clerkUserId, profile.timezone)
      : Promise.resolve(null),
    hasGrantedScope(grantedScopes, "collection", "collection.read")
      ? listRemoteCollections(clerkUserId)
      : Promise.resolve([]),
    hasGrantedScope(grantedScopes, "note", "note.read")
      ? listRemoteNotes(clerkUserId)
      : Promise.resolve([]),
  ]);

  const overview: QuranFoundationConnectedOverview = {
    readingSession: readingSession.status === "fulfilled" ? readingSession.value : null,
    streak: streak.status === "fulfilled" ? streak.value : null,
    goalPlan: goalPlan.status === "fulfilled" ? goalPlan.value : null,
    collections:
      remoteCollections.status === "fulfilled" ? summarizeRemoteCollections(remoteCollections.value) : null,
    notes: remoteNotes.status === "fulfilled" ? summarizeRemoteNotes(remoteNotes.value) : null,
  };

  if (!overview.readingSession && !overview.streak && !overview.goalPlan && !overview.collections && !overview.notes) {
    return null;
  }

  return overview;
}
