"use client";

import clsx from "clsx";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, BookMarked, BookmarkPlus, MessageSquareText, X } from "lucide-react";
import { queueAndFlushBookmarkMutation, readCachedBookmarkState, loadBookmarksFromApi, newBookmarkMutationId } from "@/hifzer/bookmarks/client";
import { getPendingBookmarkSyncMutations } from "@/hifzer/local/store";
import { Button } from "@/components/ui/button";

type Props = {
  ayahId: number;
  surahNumber: number;
  ayahNumber: number;
  anonymous: boolean;
  className?: string;
};

export function ReaderBookmarkControl(props: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
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

  const refreshCategories = useCallback(async () => {
    const state = await loadBookmarksFromApi({ includeDeleted: false, includeArchivedCategories: false });
    if (state) {
      setCategories(state.categories.filter((x) => !x.archivedAt));
    }
    setPendingCount(getPendingBookmarkSyncMutations().length);
  }, []);

  useEffect(() => {
    setName(defaultName);
    setNote("");
    setCategoryId("");
    setFeedback(null);
    setOpen(false);
  }, [defaultName, props.ayahId]);

  useEffect(() => {
    void refreshCategories();
  }, [refreshCategories]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (!rootRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

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
      await refreshCategories();
      if (result.remaining === 0) {
        setOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={rootRef} className={clsx("relative", props.className)}>
      <button
        type="button"
        onClick={() => {
          if (props.anonymous) {
            return;
          }
          setOpen((prev) => !prev);
          setFeedback(null);
        }}
        disabled={props.anonymous}
        className={clsx(
          "group relative grid h-10 w-10 place-items-center rounded-2xl border shadow-[var(--kw-shadow-soft)] transition",
          props.anonymous
            ? "cursor-not-allowed border-[color:var(--kw-border-2)] bg-white/60 text-[color:var(--kw-faint)]"
            : "border-[rgba(var(--kw-accent-rgb),0.26)] bg-[linear-gradient(145deg,rgba(var(--kw-accent-rgb),0.16),rgba(255,255,255,0.92))] text-[rgba(var(--kw-accent-rgb),1)] hover:scale-[1.03] hover:bg-[linear-gradient(145deg,rgba(var(--kw-accent-rgb),0.22),rgba(255,255,255,0.96))]",
        )}
        aria-label={props.anonymous ? "Bookmarks unavailable in anonymous mode" : "Save bookmark"}
        title={props.anonymous ? "Bookmarks unavailable in anonymous mode" : "Save bookmark"}
      >
        {open ? <BookMarked size={17} /> : <BookmarkPlus size={17} />}
        {pendingCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border border-white bg-[rgba(var(--kw-accent-rgb),1)] px-1 text-[10px] font-bold leading-none text-white">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        ) : null}
      </button>

      {props.anonymous ? (
        <p className="pointer-events-none absolute right-0 top-12 w-56 text-right text-xs text-[color:var(--kw-faint)]">
          Switch off anonymous mode to save bookmarks.
        </p>
      ) : null}

      {open ? (
        <div className="absolute right-0 top-12 z-30 w-[min(92vw,360px)] overflow-hidden rounded-[20px] border border-[rgba(var(--kw-accent-rgb),0.24)] bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(var(--kw-accent-rgb),0.08))] shadow-[0_18px_40px_rgba(8,20,42,0.18)] backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-[color:var(--kw-border-2)] px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">Bookmark ayah</p>
              <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">
                {props.surahNumber}:{props.ayahNumber} <span className="text-[color:var(--kw-faint)]">#{props.ayahId}</span>
              </p>
            </div>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-xl border border-[color:var(--kw-border-2)] bg-white/80 text-[color:var(--kw-muted)] transition hover:bg-white hover:text-[color:var(--kw-ink)]"
              onClick={() => setOpen(false)}
              aria-label="Close bookmark panel"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-3 px-4 py-3">
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-faint)]">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
                className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/85 px-3 text-sm text-[color:var(--kw-ink)]"
              />
            </label>

            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-faint)]">
              Personal note
              <div className="relative mt-1">
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="Add a private reminder for this ayah..."
                  className="w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/85 px-3 py-2 pr-9 text-sm text-[color:var(--kw-ink)]"
                />
                <MessageSquareText size={14} className="pointer-events-none absolute right-3 top-3 text-[color:var(--kw-faint)]" />
              </div>
            </label>

            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-faint)]">
              Category
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/85 px-3 text-sm text-[color:var(--kw-ink)]"
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>

            <div className="flex items-center justify-between gap-2 pt-1">
              <Link
                href="/quran/bookmarks"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--kw-muted)] transition hover:text-[color:var(--kw-ink)]"
              >
                All bookmarks
                <ArrowUpRight size={12} />
              </Link>
              <Button size="sm" onClick={() => void saveBookmark()} loading={saving}>
                Save
              </Button>
            </div>

            {feedback ? (
              <p className="text-xs text-[color:var(--kw-muted)]">{feedback}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
