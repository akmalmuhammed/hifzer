"use client";

import {
  getPendingBookmarkSyncMutations,
  getStoredBookmarkState,
  pushPendingBookmarkSyncMutation,
  replacePendingBookmarkSyncMutations,
  replaceStoredBookmarkState,
  type PendingBookmarkSyncMutation,
  type StoredBookmark,
  type StoredBookmarkCategory,
  type StoredBookmarkState,
} from "@/hifzer/local/store";

export type BookmarkCategorySnapshot = StoredBookmarkCategory;
export type BookmarkSnapshot = StoredBookmark;
export type BookmarkStateSnapshot = {
  categories: BookmarkCategorySnapshot[];
  bookmarks: BookmarkSnapshot[];
};

type BookmarkSyncResponse = {
  ok?: boolean;
  results?: Array<{
    clientMutationId?: string;
    ok?: boolean;
    deduped?: boolean;
    error?: string;
    code?: string;
    retryable?: boolean;
  }>;
  state?: BookmarkStateSnapshot;
};

function cacheState(state: BookmarkStateSnapshot) {
  replaceStoredBookmarkState({
    categories: state.categories,
    bookmarks: state.bookmarks,
    syncedAt: new Date().toISOString(),
  });
}

function toQueryString(input: {
  includeDeleted?: boolean;
  includeArchivedCategories?: boolean;
  search?: string | null;
  categoryId?: string | null;
}): string {
  const params = new URLSearchParams();
  if (input.includeDeleted) {
    params.set("includeDeleted", "1");
  }
  if (input.includeArchivedCategories) {
    params.set("includeArchivedCategories", "1");
  }
  if (input.search) {
    params.set("search", input.search);
  }
  if (input.categoryId) {
    params.set("categoryId", input.categoryId);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function newBookmarkMutationId(prefix = "bm"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function readCachedBookmarkState(): StoredBookmarkState {
  return getStoredBookmarkState();
}

export async function loadBookmarksFromApi(input?: {
  includeDeleted?: boolean;
  includeArchivedCategories?: boolean;
  search?: string | null;
  categoryId?: string | null;
}): Promise<BookmarkStateSnapshot | null> {
  const res = await fetch(`/api/bookmarks${toQueryString(input ?? {})}`, { cache: "no-store" });
  if (!res.ok) {
    return null;
  }
  const payload = (await res.json()) as { ok?: boolean; state?: BookmarkStateSnapshot };
  if (!payload.state) {
    return null;
  }
  cacheState(payload.state);
  return payload.state;
}

export function queueBookmarkMutation(input: Omit<PendingBookmarkSyncMutation, "queuedAt">) {
  pushPendingBookmarkSyncMutation(input);
}

export async function queueAndFlushBookmarkMutation(
  input: Omit<PendingBookmarkSyncMutation, "queuedAt">,
): Promise<{
  ok: boolean;
  sent: number;
  remaining: number;
  state: StoredBookmarkState;
  error?: string;
}> {
  queueBookmarkMutation(input);
  return flushPendingBookmarkMutations();
}

export async function flushPendingBookmarkMutations(): Promise<{
  ok: boolean;
  sent: number;
  remaining: number;
  state: StoredBookmarkState;
  error?: string;
}> {
  const pending = getPendingBookmarkSyncMutations();
  if (!pending.length) {
    return {
      ok: true,
      sent: 0,
      remaining: 0,
      state: getStoredBookmarkState(),
    };
  }

  const mutations = pending.map((mutation) => ({
    clientMutationId: mutation.clientMutationId,
    type: mutation.type,
    bookmarkId: mutation.bookmarkId,
    categoryId: mutation.categoryId,
    expectedVersion: mutation.expectedVersion,
    data: mutation.data,
  }));
  let payload: BookmarkSyncResponse | null = null;
  try {
    const res = await fetch("/api/bookmarks/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mutations }),
    });
    if (!res.ok) {
      let error = `Bookmark sync failed (${res.status}).`;
      try {
        const data = (await res.json()) as { error?: unknown; code?: unknown };
        if (typeof data.error === "string" && data.error.trim().length > 0) {
          error = typeof data.code === "string" ? `${data.error} (${data.code})` : data.error;
        }
      } catch {
        // keep default error message
      }
      return {
        ok: false,
        sent: pending.length,
        remaining: pending.length,
        state: getStoredBookmarkState(),
        error,
      };
    }
    payload = (await res.json()) as BookmarkSyncResponse;
  } catch {
    return {
      ok: false,
      sent: pending.length,
      remaining: pending.length,
      state: getStoredBookmarkState(),
      error: "Network error while syncing bookmarks.",
    };
  }

  if (payload?.state) {
    cacheState(payload.state);
  }

  const resultByMutationId = new Map<string, { ok: boolean; retryable: boolean }>();
  for (const row of payload?.results ?? []) {
    const id = typeof row.clientMutationId === "string" ? row.clientMutationId : null;
    if (!id) {
      continue;
    }
    resultByMutationId.set(id, {
      ok: row.ok === true,
      retryable: row.retryable !== false,
    });
  }

  const remainingMutations = pending.filter((mutation) => {
    const result = resultByMutationId.get(mutation.clientMutationId);
    if (!result) {
      return true;
    }
    if (result.ok) {
      return false;
    }
    return result.retryable;
  });
  replacePendingBookmarkSyncMutations(remainingMutations);

  let error: string | undefined;
  if (remainingMutations.length > 0) {
    const failed = (payload?.results ?? []).find((row) => row.ok !== true);
    if (failed?.error && failed.error.trim().length > 0) {
      error = typeof failed.code === "string" ? `${failed.error} (${failed.code})` : failed.error;
    } else {
      error = `${remainingMutations.length} bookmark change(s) are still pending sync.`;
    }
  }

  return {
    ok: remainingMutations.length === 0,
    sent: pending.length,
    remaining: remainingMutations.length,
    state: getStoredBookmarkState(),
    error,
  };
}
