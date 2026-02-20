"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookmarkPlus } from "lucide-react";
import { queueAndFlushBookmarkMutation, readCachedBookmarkState, loadBookmarksFromApi, newBookmarkMutationId } from "@/hifzer/bookmarks/client";
import { getPendingBookmarkSyncMutations } from "@/hifzer/local/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

type Props = {
  ayahId: number;
  surahNumber: number;
  ayahNumber: number;
  anonymous: boolean;
};

export function ReaderBookmarkControl(props: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(`Surah ${props.surahNumber}:${props.ayahNumber}`);
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState(readCachedBookmarkState().categories.filter((x) => !x.archivedAt));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(getPendingBookmarkSyncMutations().length);

  const defaultName = useMemo(
    () => `Surah ${props.surahNumber}:${props.ayahNumber}`,
    [props.ayahNumber, props.surahNumber],
  );

  useEffect(() => {
    setName(defaultName);
    setNote("");
    setCategoryId("");
    setFeedback(null);
    setOpen(false);
  }, [defaultName, props.ayahId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const state = await loadBookmarksFromApi({ includeDeleted: false, includeArchivedCategories: false });
      if (cancelled) {
        return;
      }
      if (state) {
        setCategories(state.categories.filter((x) => !x.archivedAt));
      }
      setPendingCount(getPendingBookmarkSyncMutations().length);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveBookmark() {
    if (props.anonymous || saving) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const result = await queueAndFlushBookmarkMutation({
        clientMutationId: newBookmarkMutationId("create"),
        type: "CREATE",
        data: {
          ayahId: props.ayahId,
          surahNumber: props.surahNumber,
          ayahNumber: props.ayahNumber,
          name,
          note,
          categoryId: categoryId || null,
          isPinned: false,
        },
      });
      setPendingCount(result.remaining);
      setFeedback(result.remaining > 0 ? "Saved locally. Sync pending." : "Bookmark saved.");

      const state = await loadBookmarksFromApi({ includeDeleted: false, includeArchivedCategories: false });
      if (state) {
        setCategories(state.categories.filter((x) => !x.archivedAt));
      }
      if (result.remaining === 0) {
        setOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (props.anonymous) {
    return (
      <Card className="mt-4 border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-[color:var(--kw-muted)]">Bookmarks are disabled in anonymous mode.</p>
          <Link href="/quran/read?view=compact">
            <Button size="sm" variant="secondary">Switch to tracking mode</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-4 border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Pill tone="accent">Bookmarks</Pill>
          <span className="text-xs text-[color:var(--kw-faint)]">Ayah #{props.ayahId}</span>
          {pendingCount > 0 ? (
            <Pill tone="warn">{pendingCount} pending sync</Pill>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/quran/bookmarks">
            <Button size="sm" variant="secondary">Open all bookmarks</Button>
          </Link>
          <Button size="sm" onClick={() => setOpen((prev) => !prev)} className="gap-2">
            <BookmarkPlus size={14} />
            {open ? "Close" : "Save bookmark"}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-[color:var(--kw-muted)]">
            Bookmark name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/80 px-3 text-sm text-[color:var(--kw-ink)]"
            />
          </label>

          <label className="text-sm text-[color:var(--kw-muted)]">
            Category
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/80 px-3 text-sm text-[color:var(--kw-ink)]"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-[color:var(--kw-muted)] md:col-span-2">
            Personal note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Add a private reminder for this bookmark."
              className="mt-1 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/80 px-3 py-2 text-sm text-[color:var(--kw-ink)]"
            />
          </label>

          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => void saveBookmark()} loading={saving}>
              Save bookmark
            </Button>
            {feedback ? <span className="text-xs text-[color:var(--kw-muted)]">{feedback}</span> : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
