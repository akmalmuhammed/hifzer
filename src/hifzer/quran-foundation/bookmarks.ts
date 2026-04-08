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
import { QuranFoundationError } from "./types";

type RemoteBookmark = {
  id: string;
  createdAt?: string;
  type: string;
  key: number;
  verseNumber?: number;
};

type RemoteBookmarkPagination = {
  endCursor?: string;
  hasNextPage?: boolean;
};

function defaultBookmarkName(surahNumber: number, ayahNumber: number): string {
  const surah = getSurahInfo(surahNumber);
  return surah ? `${surah.nameTransliteration} ${surahNumber}:${ayahNumber}` : `Surah ${surahNumber}:${ayahNumber}`;
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
    (bookmark) => bookmark.type === "ayah" && Number.isFinite(bookmark.key) && Number.isFinite(bookmark.verseNumber),
  );
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
}) {
  await db().bookmark.update({
    where: { id: input.bookmarkId },
    data: {
      quranFoundationBookmarkId: input.remoteBookmarkId,
      quranFoundationSyncState: input.syncState,
      quranFoundationLastSyncedAt: new Date(),
      quranFoundationSyncError: input.syncError,
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
  let matched = 0;
  let imported = 0;

  for (const remote of remoteBookmarks) {
    if (!remote.verseNumber) {
      continue;
    }
    const ayahId = ayahIdFromVerseRef({ surahNumber: remote.key, ayahNumber: remote.verseNumber });
    if (!ayahId) {
      continue;
    }
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
      });
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
        isPinned: false,
        quranFoundationBookmarkId: remote.id,
        quranFoundationSyncState: "synced",
        quranFoundationLastSyncedAt: new Date(),
      },
    });
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

  const pushed = {
    total: pendingBookmarks.length,
    synced,
    failed,
  };

  return {
    hydrated,
    pushed,
  };
}
