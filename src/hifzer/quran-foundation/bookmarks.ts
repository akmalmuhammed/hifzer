import "server-only";

import type { Bookmark } from "@prisma/client";
import { getSurahInfo } from "@/hifzer/quran/lookup";
import { ayahIdFromVerseRef } from "@/hifzer/quran/lookup.server";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { db, dbConfigured } from "@/lib/db";
import { getQuranFoundationConfig } from "./config";
import {
  getQuranFoundationUserApiSession,
  quranFoundationUserApiRequest,
  updateQuranFoundationAccountSyncState,
} from "./server";
import {
  syncBookmarkCollectionMembershipForBookmark,
  syncBookmarkCollectionsToQuranFoundation,
} from "./user-features";
import { QuranFoundationError } from "./types";

type RemoteBookmark = {
  id: string;
  createdAt?: string;
  type: string;
  key: number;
  verseNumber?: number;
  isInDefaultCollection?: boolean;
};

type RemoteBookmarkPagination = {
  endCursor?: string;
  hasNextPage?: boolean;
};

type RemoteCollection = {
  id: string;
  name: string;
  isDefault?: boolean;
};

function defaultBookmarkName(surahNumber: number, ayahNumber: number): string {
  const surah = getSurahInfo(surahNumber);
  return surah ? `${surah.nameTransliteration} ${surahNumber}:${ayahNumber}` : `Surah ${surahNumber}:${ayahNumber}`;
}

function normalizeCategoryName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

async function listRemoteAyahBookmarks(clerkUserId: string): Promise<RemoteBookmark[]> {
  const config = getQuranFoundationConfig();
  const bookmarks: RemoteBookmark[] = [];
  let after: string | undefined;

  while (true) {
    const { payload } = await quranFoundationUserApiRequest<RemoteBookmark[]>(clerkUserId, {
      path: "/bookmarks",
      query: {
        type: "ayah",
        mushafId: config.bookmarkMushafId,
        first: 20,
        after,
      },
    });
    const rows = Array.isArray(payload.data) ? (payload.data as RemoteBookmark[]) : [];
    bookmarks.push(...rows);

    const pagination =
      payload.pagination && typeof payload.pagination === "object"
        ? (payload.pagination as RemoteBookmarkPagination)
        : undefined;
    if (!pagination?.hasNextPage || !pagination.endCursor) {
      break;
    }
    after = pagination.endCursor;
  }

  return bookmarks.filter(
    (bookmark) =>
      (!bookmark.type || bookmark.type === "ayah") &&
      Number.isFinite(bookmark.key) &&
      Number.isFinite(bookmark.verseNumber),
  );
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
    const rows = Array.isArray(payload.data) ? (payload.data as RemoteCollection[]) : [];
    collections.push(...rows);

    const pagination =
      payload.pagination && typeof payload.pagination === "object"
        ? (payload.pagination as RemoteBookmarkPagination)
        : undefined;
    if (!pagination?.hasNextPage || !pagination.endCursor) {
      break;
    }
    after = pagination.endCursor;
  }

  return collections.filter((collection) => collection.id && collection.name);
}

async function listRemoteBookmarkCollectionIds(
  clerkUserId: string,
  bookmark: Pick<RemoteBookmark, "key" | "verseNumber">,
): Promise<string[]> {
  const config = getQuranFoundationConfig();
  const { payload } = await quranFoundationUserApiRequest<string[] | RemoteCollection[]>(clerkUserId, {
    path: "/bookmarks/collections",
    query: {
      key: bookmark.key,
      type: "ayah",
      verseNumber: bookmark.verseNumber,
      mushafId: config.bookmarkMushafId,
      first: 20,
    },
  });
  const rows = Array.isArray(payload.data) ? payload.data : [];
  return rows
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }
      return typeof item.id === "string" ? item.id.trim() : "";
    })
    .filter(Boolean);
}

async function buildRemoteBookmarkCategoryMap(
  clerkUserId: string,
  remoteBookmarks: RemoteBookmark[],
): Promise<Map<string, RemoteCollection>> {
  const remoteCollections = await listRemoteCollections(clerkUserId);
  const collectionById = new Map(remoteCollections.map((collection) => [collection.id, collection] as const));
  const defaultCollection = remoteCollections.find(
    (collection) => collection.isDefault === true || collection.id === "__default__",
  ) ?? null;
  const categoryByBookmarkId = new Map<string, RemoteCollection>();

  await Promise.all(
    remoteBookmarks.map(async (bookmark) => {
      if (!bookmark.verseNumber) {
        return;
      }
      const collectionIds = await listRemoteBookmarkCollectionIds(clerkUserId, bookmark).catch(() => []);
      const collections = collectionIds
        .map((id) => collectionById.get(id) ?? null)
        .filter((collection): collection is RemoteCollection => Boolean(collection));
      const chosenCollection =
        collections.find((collection) => collection.id !== "__default__" && collection.isDefault !== true) ??
        collections[0] ??
        (bookmark.isInDefaultCollection ? defaultCollection : null);
      if (chosenCollection) {
        categoryByBookmarkId.set(bookmark.id, chosenCollection);
      }
    }),
  );

  return categoryByBookmarkId;
}

async function buildLocalCategoryCache(userId: string): Promise<Map<string, string>> {
  const categories = await db().bookmarkCategory.findMany({
    where: {
      userId,
      archivedAt: null,
    },
  });
  return new Map(categories.map((category) => [normalizeCategoryName(category.name), category.id] as const));
}

async function ensureLocalCategoryId(input: {
  userId: string;
  name: string | null | undefined;
  cache: Map<string, string>;
}): Promise<string | null> {
  const name = input.name?.trim();
  if (!name) {
    return null;
  }
  const normalized = normalizeCategoryName(name);
  const existingId = input.cache.get(normalized);
  if (existingId) {
    return existingId;
  }
  const category = await db().bookmarkCategory.create({
    data: {
      userId: input.userId,
      name,
      sortOrder: input.cache.size + 1,
    },
  });
  input.cache.set(normalized, category.id);
  return category.id;
}

function findRemoteBookmarkByVerse(
  remote: RemoteBookmark[],
  surahNumber: number,
  ayahNumber: number,
): RemoteBookmark | null {
  return remote.find((bookmark) => bookmark.key === surahNumber && bookmark.verseNumber === ayahNumber) ?? null;
}

async function markLocalBookmarkSyncResult(input: {
  bookmarkId: string;
  remoteBookmarkId: string | null;
  syncState: string;
  syncError: string | null;
  categoryId?: string | null;
}) {
  await db().bookmark.update({
    where: { id: input.bookmarkId },
    data: {
      quranFoundationBookmarkId: input.remoteBookmarkId,
      quranFoundationSyncState: input.syncState,
      quranFoundationLastSyncedAt: new Date(),
      quranFoundationSyncError: input.syncError,
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
    },
  });
}

async function createRemoteBookmark(
  clerkUserId: string,
  bookmark: Pick<Bookmark, "surahNumber" | "ayahNumber">,
): Promise<RemoteBookmark> {
  const config = getQuranFoundationConfig();
  const { data } = await quranFoundationUserApiRequest<RemoteBookmark>(clerkUserId, {
    path: "/bookmarks",
    method: "POST",
    mutation: true,
    body: {
      key: bookmark.surahNumber,
      type: "ayah",
      verseNumber: bookmark.ayahNumber,
      mushaf: config.bookmarkMushafId,
      isReading: false,
    },
  });
  return data;
}

async function deleteRemoteBookmark(clerkUserId: string, remoteBookmarkId: string) {
  await quranFoundationUserApiRequest(clerkUserId, {
    path: `/bookmarks/${encodeURIComponent(remoteBookmarkId)}`,
    method: "DELETE",
    mutation: true,
  });
}

async function readBookmarkForUser(clerkUserId: string, bookmarkId: string) {
  if (!dbConfigured()) {
    return null;
  }
  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    return null;
  }
  return db().bookmark.findFirst({
    where: {
      id: bookmarkId,
      userId: profile.id,
    },
    include: {
      category: true,
    },
  });
}

export async function syncBookmarkToQuranFoundation(input: {
  clerkUserId: string;
  bookmarkId: string;
  action: "create_or_restore" | "delete" | "metadata";
}) {
  if (!dbConfigured()) {
    return;
  }
  const session = await getQuranFoundationUserApiSession(input.clerkUserId);
  if (!session) {
    return;
  }

  const bookmark = await readBookmarkForUser(input.clerkUserId, input.bookmarkId);
  if (!bookmark) {
    return;
  }

  try {
    if (input.action === "metadata") {
      if (bookmark.quranFoundationBookmarkId) {
        await markLocalBookmarkSyncResult({
          bookmarkId: bookmark.id,
          remoteBookmarkId: bookmark.quranFoundationBookmarkId,
          syncState: "synced",
          syncError: null,
        });
      }
      return;
    }

    const remoteBookmarks = await listRemoteAyahBookmarks(input.clerkUserId);
    const existingRemote = bookmark.quranFoundationBookmarkId
      ? remoteBookmarks.find((row) => row.id === bookmark.quranFoundationBookmarkId) ?? null
      : findRemoteBookmarkByVerse(remoteBookmarks, bookmark.surahNumber, bookmark.ayahNumber);

    if (input.action === "delete") {
      if (existingRemote?.id) {
        await deleteRemoteBookmark(input.clerkUserId, existingRemote.id);
      }
      await markLocalBookmarkSyncResult({
        bookmarkId: bookmark.id,
        remoteBookmarkId: null,
        syncState: "synced",
        syncError: null,
      });
      await updateQuranFoundationAccountSyncState(input.clerkUserId, {
        lastSyncedAt: new Date(),
        lastError: null,
        status: "connected",
      });
      return;
    }

    const remoteBookmark = existingRemote ?? await createRemoteBookmark(input.clerkUserId, bookmark);
    await markLocalBookmarkSyncResult({
      bookmarkId: bookmark.id,
      remoteBookmarkId: remoteBookmark.id,
      syncState: "synced",
      syncError: null,
    });
    await syncBookmarkCollectionMembershipForBookmark({
      clerkUserId: input.clerkUserId,
      surahNumber: bookmark.surahNumber,
      ayahNumber: bookmark.ayahNumber,
      categoryName: bookmark.category?.name,
    }).catch(() => false);
    await updateQuranFoundationAccountSyncState(input.clerkUserId, {
      lastSyncedAt: new Date(),
      lastError: null,
      status: "connected",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sync this bookmark to Quran.com.";
    await markLocalBookmarkSyncResult({
      bookmarkId: bookmark.id,
      remoteBookmarkId: bookmark.quranFoundationBookmarkId,
      syncState: "error",
      syncError: message,
    });
    await updateQuranFoundationAccountSyncState(input.clerkUserId, {
      lastError: message,
      status: "degraded",
    });
  }
}

export async function pushExistingBookmarksToQuranFoundation(clerkUserId: string) {
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
  if (!(await getQuranFoundationUserApiSession(clerkUserId))) {
    throw new QuranFoundationError("Link a Quran.com account before syncing bookmarks.", {
      status: 412,
      code: "qf_not_linked",
      retryable: false,
    });
  }

  const bookmarks = await db().bookmark.findMany({
    where: {
      userId: profile.id,
      deletedAt: null,
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });

  let synced = 0;
  let failed = 0;

  for (const bookmark of bookmarks) {
    try {
      await syncBookmarkToQuranFoundation({
        clerkUserId,
        bookmarkId: bookmark.id,
        action: "create_or_restore",
      });
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  return {
    total: bookmarks.length,
    synced,
    failed,
  };
}

export async function hydrateBookmarksFromQuranFoundation(clerkUserId: string) {
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
  if (!(await getQuranFoundationUserApiSession(clerkUserId))) {
    throw new QuranFoundationError("Link a Quran.com account before importing bookmarks.", {
      status: 412,
      code: "qf_not_linked",
      retryable: false,
    });
  }

  const remoteBookmarks = await listRemoteAyahBookmarks(clerkUserId);
  const remoteCategoryByBookmarkId = await buildRemoteBookmarkCategoryMap(clerkUserId, remoteBookmarks);
  const localCategoryCache = await buildLocalCategoryCache(profile.id);
  let matched = 0;
  let imported = 0;
  let categorized = 0;

  for (const remote of remoteBookmarks) {
    if (!remote.verseNumber) {
      continue;
    }
    const ayahId = ayahIdFromVerseRef({ surahNumber: remote.key, ayahNumber: remote.verseNumber });
    if (!ayahId) {
      continue;
    }
    const remoteCategory = remoteCategoryByBookmarkId.get(remote.id);
    const categoryId = remoteCategory
      ? await ensureLocalCategoryId({
          userId: profile.id,
          name: remoteCategory.name,
          cache: localCategoryCache,
        })
      : undefined;
    const existing = await db().bookmark.findFirst({
      where: {
        userId: profile.id,
        ayahId,
        deletedAt: null,
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    if (existing) {
      await markLocalBookmarkSyncResult({
        bookmarkId: existing.id,
        remoteBookmarkId: remote.id,
        syncState: "synced",
        syncError: null,
        categoryId,
      });
      if (categoryId) {
        categorized += 1;
      }
      matched += 1;
      continue;
    }

    await db().bookmark.create({
      data: {
        userId: profile.id,
        ayahId,
        surahNumber: remote.key,
        ayahNumber: remote.verseNumber,
        name: defaultBookmarkName(remote.key, remote.verseNumber),
        note: null,
        categoryId: categoryId ?? null,
        isPinned: false,
        quranFoundationBookmarkId: remote.id,
        quranFoundationSyncState: "synced",
        quranFoundationLastSyncedAt: new Date(),
      },
    });
    if (categoryId) {
      categorized += 1;
    }
    imported += 1;
  }

  await updateQuranFoundationAccountSyncState(clerkUserId, {
    lastSyncedAt: new Date(),
    lastError: null,
    status: "connected",
  });

  return {
    totalRemote: remoteBookmarks.length,
    matched,
    imported,
    categorized,
  };
}

export async function reconcileQuranFoundationBookmarks(clerkUserId: string) {
  const hydrated = await hydrateBookmarksFromQuranFoundation(clerkUserId);

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
  if (!(await getQuranFoundationUserApiSession(clerkUserId))) {
    throw new QuranFoundationError("Link a Quran.com account before syncing bookmarks.", {
      status: 412,
      code: "qf_not_linked",
      retryable: false,
    });
  }

  const pendingBookmarks = await db().bookmark.findMany({
    where: {
      userId: profile.id,
      deletedAt: null,
      OR: [
        { quranFoundationBookmarkId: null },
        { quranFoundationSyncState: { in: ["local_only", "error", "not_linked"] } },
      ],
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });
  const pendingDeletedBookmarks = await db().bookmark.findMany({
    where: {
      userId: profile.id,
      deletedAt: { not: null },
      quranFoundationBookmarkId: { not: null },
      quranFoundationSyncState: { in: ["error", "local_only", "not_linked"] },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  let synced = 0;
  let failed = 0;

  for (const bookmark of pendingBookmarks) {
    try {
      await syncBookmarkToQuranFoundation({
        clerkUserId,
        bookmarkId: bookmark.id,
        action: "create_or_restore",
      });
      synced += 1;
    } catch {
      failed += 1;
    }
  }
  for (const bookmark of pendingDeletedBookmarks) {
    try {
      await syncBookmarkToQuranFoundation({
        clerkUserId,
        bookmarkId: bookmark.id,
        action: "delete",
      });
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  const pushed = {
    total: pendingBookmarks.length + pendingDeletedBookmarks.length,
    synced,
    failed,
  };

  return {
    hydrated,
    pushed,
  };
}

export async function syncBookmarkCollectionsForExistingBookmarks(clerkUserId: string) {
  return syncBookmarkCollectionsToQuranFoundation(clerkUserId);
}
