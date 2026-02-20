"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import {
  flushPendingBookmarkMutations,
  loadBookmarksFromApi,
  newBookmarkMutationId,
  queueAndFlushBookmarkMutation,
  readCachedBookmarkState,
  type BookmarkCategorySnapshot,
  type BookmarkSnapshot,
} from "@/hifzer/bookmarks/client";
import { getPendingBookmarkSyncMutations } from "@/hifzer/local/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

type BookmarkDraft = {
  name: string;
  note: string;
  categoryId: string;
  isPinned: boolean;
};

async function readApiError(res: Response): Promise<string | null> {
  try {
    const data = (await res.json()) as { error?: unknown; code?: unknown };
    if (typeof data.error === "string" && data.error.trim().length > 0) {
      return typeof data.code === "string" ? `${data.error} (${data.code})` : data.error;
    }
    return null;
  } catch {
    return null;
  }
}

function toDraft(bookmark: BookmarkSnapshot): BookmarkDraft {
  return {
    name: bookmark.name,
    note: bookmark.note ?? "",
    categoryId: bookmark.categoryId ?? "",
    isPinned: bookmark.isPinned,
  };
}

export function BookmarkManagerClient() {
  const cached = readCachedBookmarkState();
  const [categories, setCategories] = useState<BookmarkCategorySnapshot[]>(cached.categories);
  const [bookmarks, setBookmarks] = useState<BookmarkSnapshot[]>(cached.bookmarks);
  const [drafts, setDrafts] = useState<Record<string, BookmarkDraft>>(() => {
    const next: Record<string, BookmarkDraft> = {};
    for (const bookmark of cached.bookmarks) {
      next[bookmark.id] = toDraft(bookmark);
    }
    return next;
  });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySortOrder, setNewCategorySortOrder] = useState("0");
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(getPendingBookmarkSyncMutations().length);

  const applyState = useCallback((next: { categories: BookmarkCategorySnapshot[]; bookmarks: BookmarkSnapshot[] }) => {
    setCategories(next.categories);
    setBookmarks(next.bookmarks);
    setDrafts((prev) => {
      const draftMap: Record<string, BookmarkDraft> = {};
      for (const bookmark of next.bookmarks) {
        draftMap[bookmark.id] = prev[bookmark.id] ?? toDraft(bookmark);
      }
      return draftMap;
    });
  }, []);

  const refreshFromApi = useCallback(async () => {
    const state = await loadBookmarksFromApi({
      includeDeleted: true,
      includeArchivedCategories: true,
    });
    if (state) {
      applyState(state);
    }
  }, [applyState]);

  const syncQueuedMutations = useCallback(async (manual = false) => {
    if (manual) {
      setBusyKey("manual-sync");
    }
    try {
      const result = await flushPendingBookmarkMutations();
      setPendingCount(result.remaining);
      if (result.remaining > 0) {
        setFeedback(result.error ?? `${result.remaining} bookmark changes pending sync.`);
      }
    } finally {
      if (manual) {
        setBusyKey(null);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      await syncQueuedMutations();
      await refreshFromApi();
      if (!cancelled) {
        setPendingCount(getPendingBookmarkSyncMutations().length);
        setLoading(false);
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [refreshFromApi, syncQueuedMutations]);

  const visibleBookmarks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bookmarks.filter((bookmark) => {
      if (!showDeleted && bookmark.deletedAt) {
        return false;
      }
      if (categoryFilter === "__none__" && bookmark.categoryId) {
        return false;
      }
      if (categoryFilter && categoryFilter !== "__none__" && bookmark.categoryId !== categoryFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = [
        bookmark.name,
        bookmark.note ?? "",
        String(bookmark.surahNumber),
        String(bookmark.ayahNumber),
      ].join(" ").toLowerCase();
      return haystack.includes(term);
    });
  }, [bookmarks, categoryFilter, search, showDeleted]);

  async function runMutation(
    key: string,
    mutation: Parameters<typeof queueAndFlushBookmarkMutation>[0],
    successText: string,
  ) {
    setBusyKey(key);
    setFeedback(null);
    try {
      const result = await queueAndFlushBookmarkMutation(mutation);
      setPendingCount(result.remaining);
      setFeedback(result.remaining > 0 ? (result.error ?? "Saved locally, pending sync.") : successText);
      await refreshFromApi();
    } finally {
      setBusyKey(null);
    }
  }

  async function createCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed || busyKey) {
      return;
    }
    const sortOrder = Number(newCategorySortOrder);
    const normalizedSortOrder = Number.isFinite(sortOrder) ? Math.floor(sortOrder) : 0;
    const clientMutationId = newBookmarkMutationId("cat_create");

    setBusyKey("category-create");
    setFeedback(null);
    try {
      const res = await fetch("/api/bookmarks/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientMutationId,
          name: trimmed,
          sortOrder: normalizedSortOrder,
        }),
      });

      if (res.ok) {
        await refreshFromApi();
        setPendingCount(getPendingBookmarkSyncMutations().length);
        setFeedback("Category created.");
        setNewCategoryName("");
        setNewCategorySortOrder("0");
        return;
      }

      if (res.status < 500) {
        setFeedback((await readApiError(res)) ?? "Could not create category.");
        return;
      }

      const result = await queueAndFlushBookmarkMutation({
        clientMutationId,
        type: "CATEGORY_CREATE",
        data: {
          name: trimmed,
          sortOrder: normalizedSortOrder,
        },
      });
      setPendingCount(result.remaining);
      setFeedback(result.remaining > 0 ? (result.error ?? "Saved locally, pending sync.") : "Category created.");
      await refreshFromApi();
      if (result.remaining === 0) {
        setNewCategoryName("");
        setNewCategorySortOrder("0");
      }
    } catch {
      const result = await queueAndFlushBookmarkMutation({
        clientMutationId,
        type: "CATEGORY_CREATE",
        data: {
          name: trimmed,
          sortOrder: normalizedSortOrder,
        },
      });
      setPendingCount(result.remaining);
      setFeedback(result.remaining > 0 ? (result.error ?? "Saved locally, pending sync.") : "Category created.");
      await refreshFromApi();
      if (result.remaining === 0) {
        setNewCategoryName("");
        setNewCategorySortOrder("0");
      }
    } finally {
      setBusyKey(null);
    }
  }

  async function saveBookmark(bookmark: BookmarkSnapshot) {
    const draft = drafts[bookmark.id];
    if (!draft || busyKey) {
      return;
    }
    await runMutation(
      `bookmark-save-${bookmark.id}`,
      {
        clientMutationId: newBookmarkMutationId("bm_update"),
        type: "UPDATE",
        bookmarkId: bookmark.id,
        data: {
          name: draft.name,
          note: draft.note,
          categoryId: draft.categoryId || null,
          isPinned: draft.isPinned,
          expectedVersion: bookmark.version,
        },
      },
      "Bookmark updated.",
    );
  }

  async function deleteBookmark(bookmark: BookmarkSnapshot) {
    if (busyKey) {
      return;
    }
    await runMutation(
      `bookmark-delete-${bookmark.id}`,
      {
        clientMutationId: newBookmarkMutationId("bm_delete"),
        type: "DELETE",
        bookmarkId: bookmark.id,
        expectedVersion: bookmark.version,
      },
      "Bookmark deleted.",
    );
  }

  async function restoreBookmark(bookmark: BookmarkSnapshot) {
    if (busyKey) {
      return;
    }
    await runMutation(
      `bookmark-restore-${bookmark.id}`,
      {
        clientMutationId: newBookmarkMutationId("bm_restore"),
        type: "RESTORE",
        bookmarkId: bookmark.id,
        expectedVersion: bookmark.version,
      },
      "Bookmark restored.",
    );
  }

  async function archiveCategory(category: BookmarkCategorySnapshot) {
    if (busyKey) {
      return;
    }
    await runMutation(
      `category-delete-${category.id}`,
      {
        clientMutationId: newBookmarkMutationId("cat_delete"),
        type: "CATEGORY_DELETE",
        categoryId: category.id,
      },
      "Category archived.",
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="accent">Manager</Pill>
          {pendingCount > 0 ? <Pill tone="warn">{pendingCount} pending sync</Pill> : <Pill tone="success">All synced</Pill>}
          <Button
            size="sm"
            variant="secondary"
            className="ml-auto gap-2"
            onClick={() => void syncQueuedMutations(true)}
            loading={busyKey === "manual-sync"}
          >
            Sync now
          </Button>
        </div>
        {feedback ? <p className="mt-2 text-sm text-[color:var(--kw-muted)]">{feedback}</p> : null}

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="text-sm text-[color:var(--kw-muted)] md:col-span-2">
            Search bookmarks
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, note, or ayah"
              className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/80 px-3 text-sm text-[color:var(--kw-ink)]"
            />
          </label>
          <label className="text-sm text-[color:var(--kw-muted)]">
            Category filter
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/80 px-3 text-sm text-[color:var(--kw-ink)]"
            >
              <option value="">All categories</option>
              <option value="__none__">No category</option>
              {categories.filter((x) => !x.archivedAt).map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-[color:var(--kw-muted)] md:pt-7">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(event) => setShowDeleted(event.target.checked)}
            />
            Show deleted bookmarks
          </label>
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Categories</p>
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_130px_auto]">
          <input
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            placeholder="New category name"
            className="h-10 rounded-xl border border-[color:var(--kw-border-2)] bg-white/80 px-3 text-sm text-[color:var(--kw-ink)]"
          />
          <input
            value={newCategorySortOrder}
            onChange={(event) => setNewCategorySortOrder(event.target.value)}
            placeholder="Sort order"
            className="h-10 rounded-xl border border-[color:var(--kw-border-2)] bg-white/80 px-3 text-sm text-[color:var(--kw-ink)]"
          />
          <Button onClick={() => void createCategory()} loading={busyKey === "category-create"}>
            Add category
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {categories.length < 1 ? (
            <span className="text-sm text-[color:var(--kw-muted)]">No categories yet.</span>
          ) : (
            categories.map((category) => (
              <span
                key={category.id}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--kw-border-2)] bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--kw-ink)]"
              >
                {category.name}
                {category.archivedAt ? (
                  <Pill tone="warn" className="px-2 py-0.5 text-[10px]">Archived</Pill>
                ) : (
                  <button
                    type="button"
                    className="text-[color:var(--kw-faint)] hover:text-[color:var(--kw-ink)]"
                    onClick={() => void archiveCategory(category)}
                    title="Archive category"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </span>
            ))
          )}
        </div>
      </Card>

      {loading ? (
        <Card>
          <p className="text-sm text-[color:var(--kw-muted)]">Loading bookmarks...</p>
        </Card>
      ) : null}

      {!loading && visibleBookmarks.length < 1 ? (
        <Card>
          <p className="text-sm text-[color:var(--kw-muted)]">No bookmarks matched the current filters.</p>
        </Card>
      ) : null}

      {!loading && visibleBookmarks.map((bookmark) => {
        const draft = drafts[bookmark.id] ?? toDraft(bookmark);
        const categoryName = bookmark.category?.name ?? "No category";
        const openHref = `/quran/read?view=compact&surah=${bookmark.surahNumber}&cursor=${bookmark.ayahId}`;
        const rowBusy = busyKey === `bookmark-save-${bookmark.id}` ||
          busyKey === `bookmark-delete-${bookmark.id}` ||
          busyKey === `bookmark-restore-${bookmark.id}`;

        return (
          <Card key={bookmark.id} className={bookmark.deletedAt ? "opacity-75" : ""}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={bookmark.deletedAt ? "warn" : "neutral"}>
                    {bookmark.surahNumber}:{bookmark.ayahNumber}
                  </Pill>
                  <Pill tone={bookmark.isPinned ? "accent" : "neutral"}>
                    {bookmark.isPinned ? "Pinned" : "Unpinned"}
                  </Pill>
                  <span className="text-xs text-[color:var(--kw-faint)]">v{bookmark.version}</span>
                </div>
                <p className="text-xs text-[color:var(--kw-faint)]">Category: {categoryName}</p>
              </div>

              <Link href={openHref}>
                <Button size="sm" variant="secondary">Open in reader</Button>
              </Link>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-[color:var(--kw-muted)]">
                Name
                <input
                  value={draft.name}
                  disabled={Boolean(bookmark.deletedAt)}
                  onChange={(event) => {
                    const next = event.target.value;
                    setDrafts((prev) => ({ ...prev, [bookmark.id]: { ...draft, name: next } }));
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/80 px-3 text-sm text-[color:var(--kw-ink)] disabled:opacity-60"
                />
              </label>

              <label className="text-sm text-[color:var(--kw-muted)]">
                Category
                <select
                  value={draft.categoryId}
                  disabled={Boolean(bookmark.deletedAt)}
                  onChange={(event) => {
                    const next = event.target.value;
                    setDrafts((prev) => ({ ...prev, [bookmark.id]: { ...draft, categoryId: next } }));
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/80 px-3 text-sm text-[color:var(--kw-ink)] disabled:opacity-60"
                >
                  <option value="">No category</option>
                  {categories.filter((x) => !x.archivedAt).map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-[color:var(--kw-muted)] md:col-span-2">
                Personal note
                <textarea
                  value={draft.note}
                  disabled={Boolean(bookmark.deletedAt)}
                  onChange={(event) => {
                    const next = event.target.value;
                    setDrafts((prev) => ({ ...prev, [bookmark.id]: { ...draft, note: next } }));
                  }}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/80 px-3 py-2 text-sm text-[color:var(--kw-ink)] disabled:opacity-60"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {!bookmark.deletedAt ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-2"
                    onClick={() => {
                      setDrafts((prev) => ({
                        ...prev,
                        [bookmark.id]: { ...draft, isPinned: !draft.isPinned },
                      }));
                    }}
                    disabled={rowBusy}
                  >
                    <Check size={14} />
                    {draft.isPinned ? "Keep pinned" : "Pin bookmark"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void saveBookmark({ ...bookmark, isPinned: draft.isPinned })}
                    loading={busyKey === `bookmark-save-${bookmark.id}`}
                  >
                    Save changes
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="gap-2"
                    onClick={() => void deleteBookmark(bookmark)}
                    loading={busyKey === `bookmark-delete-${bookmark.id}`}
                  >
                    <Trash2 size={14} />
                    Delete
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-2"
                  onClick={() => void restoreBookmark(bookmark)}
                  loading={busyKey === `bookmark-restore-${bookmark.id}`}
                >
                  <RotateCcw size={14} />
                  Restore
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
