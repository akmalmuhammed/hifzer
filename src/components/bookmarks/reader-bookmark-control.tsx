"use client";

import clsx from "clsx";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowUpRight, BookMarked, BookmarkPlus, MessageSquareText, X } from "lucide-react";
import { queueAndFlushBookmarkMutation, readCachedBookmarkState, loadBookmarksFromApi, newBookmarkMutationId } from "@/hifzer/bookmarks/client";
import { getPendingBookmarkSyncMutations } from "@/hifzer/local/store";
import { Button } from "@/components/ui/button";
import type { QuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/types";
import { trackProductEvent } from "@/lib/telemetry/client";

type Props = {
  ayahId: number;
  surahNumber: number;
  ayahNumber: number;
  anonymous: boolean;
  className?: string;
  variant?: "standalone" | "inline";
};

export function ReaderBookmarkControl(props: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();
  const panelTitleId = useId();
  const anonymousHelpId = useId();
  const inline = props.variant === "inline";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(`Surah ${props.surahNumber}:${props.ayahNumber}`);
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState(readCachedBookmarkState().categories.filter((x) => !x.archivedAt));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(getPendingBookmarkSyncMutations().length);
  const [connectionStatus, setConnectionStatus] = useState<QuranFoundationConnectionStatus | null>(null);

  const defaultName = useMemo(
    () => `Surah ${props.surahNumber}:${props.ayahNumber}`,
    [props.ayahNumber, props.surahNumber],
  );

  const refreshCategories = useCallback(async () => {
    if (props.anonymous) {
      setCategories(readCachedBookmarkState().categories.filter((x) => !x.archivedAt));
      setPendingCount(getPendingBookmarkSyncMutations().length);
      return;
    }
    const state = await loadBookmarksFromApi({ includeDeleted: false, includeArchivedCategories: false });
    if (state) {
      setCategories(state.categories.filter((x) => !x.archivedAt));
    }
    setPendingCount(getPendingBookmarkSyncMutations().length);
  }, [props.anonymous]);

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
    let cancelled = false;
    if (props.anonymous) {
      setConnectionStatus(null);
      return () => {
        cancelled = true;
      };
    }
    void (async () => {
      try {
        const response = await fetch("/api/quran-foundation/status", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as { status?: QuranFoundationConnectionStatus } | null;
        if (!cancelled && payload?.status) {
          setConnectionStatus(payload.status);
        }
      } catch {
        if (!cancelled) {
          setConnectionStatus(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.anonymous]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const trigger = triggerRef.current;
    closeRef.current?.focus();
    function onPointerDown(event: PointerEvent) {
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
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
      trigger?.focus();
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
      trackProductEvent("bookmark.save_outcome", {
        outcome: result.remaining > 0 ? "queued" : "saved",
      });
      setFeedback(result.remaining > 0 ? "Saved locally. Sync pending." : "Bookmark saved.");
      await refreshCategories();
      if (result.remaining === 0) {
        setOpen(false);
      }
    } catch {
      setFeedback("Bookmark could not be saved. Your note is still in the form—try again.");
      trackProductEvent("bookmark.save_outcome", { outcome: "failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={rootRef} className={clsx("relative", props.className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (props.anonymous) {
            setFeedback("Sign in to save a bookmark. Reading remains available without an account.");
            return;
          }
          setOpen((prev) => !prev);
          setFeedback(null);
        }}
        aria-disabled={props.anonymous}
        aria-expanded={props.anonymous ? undefined : open}
        aria-controls={props.anonymous ? undefined : panelId}
        aria-haspopup={props.anonymous ? undefined : "dialog"}
        aria-describedby={props.anonymous ? anonymousHelpId : undefined}
        className={clsx(
          inline
            ? "relative inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-200"
            : "group relative grid h-11 w-11 place-items-center rounded-full border transition-colors duration-200",
          props.anonymous
            ? "cursor-not-allowed border-transparent bg-[color:var(--kw-fill)] text-[color:var(--kw-faint)]"
            : inline
              ? "border-transparent bg-[color:var(--kw-fill-strong)] text-[color:var(--kw-ink)] hover:bg-[color:var(--kw-hover-strong)]"
              : "border-transparent bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)] hover:bg-[rgba(var(--kw-accent-rgb),0.18)]",
        )}
        aria-label={props.anonymous ? "Bookmarks unavailable in anonymous mode" : "Save bookmark"}
        title={props.anonymous ? "Bookmarks unavailable in anonymous mode" : "Save bookmark"}
      >
        {open ? <BookMarked size={16} /> : <BookmarkPlus size={16} />}
        {pendingCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border border-[color:var(--kw-card)] bg-[rgba(var(--kw-accent-rgb),1)] px-1 text-[10px] font-medium leading-none text-white">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        ) : null}
      </button>

      {props.anonymous ? (
        <p id={anonymousHelpId} className="sr-only">
          Sign in to save bookmarks. Reading remains available without an account.
        </p>
      ) : null}

      {props.anonymous && feedback ? (
        <p role="status" aria-live="polite" className="mt-2 max-w-64 text-xs leading-5 text-[color:var(--kw-muted)]">
          {feedback}
        </p>
      ) : null}

      {open ? (
        <>
          <button
            type="button"
            aria-label="Dismiss bookmark panel"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 bg-black/35 sm:hidden"
          />
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={panelTitleId}
            className="kw-glass-strong !shadow-[var(--kw-shadow-float)] fixed inset-x-3 bottom-3 z-40 flex max-h-[calc(100dvh-1.5rem)] w-auto flex-col overflow-hidden rounded-[var(--kw-radius-xl)] sm:absolute sm:inset-auto sm:right-0 sm:top-14 sm:z-30 sm:w-[min(92vw,360px)] sm:max-h-[min(80vh,620px)]"
          >
          <div className="flex items-center justify-between border-b border-[color:var(--kw-border-2)] px-4 py-3">
            <div>
              <p id={panelTitleId} className="text-[0.8rem] font-semibold text-[color:var(--kw-faint)]">Bookmark ayah</p>
              <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">
                {props.surahNumber}:{props.ayahNumber}
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--kw-fill-strong)] text-[color:var(--kw-muted)] transition-colors duration-200 hover:bg-[color:var(--kw-hover-strong)] hover:text-[color:var(--kw-ink)]"
              onClick={() => setOpen(false)}
              aria-label="Close bookmark panel"
            >
              <X size={14} />
            </button>
          </div>

            <div className="space-y-3 overflow-y-auto px-4 py-3">
            <label className="block text-[0.8rem] font-semibold text-[color:var(--kw-faint)]">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
                className="mt-1 h-11 w-full rounded-xl border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 text-sm font-normal text-[color:var(--kw-ink)] placeholder:text-[color:var(--kw-faint)] transition-[border-color,box-shadow] duration-200 focus:border-[rgba(var(--kw-accent-rgb),0.55)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(var(--kw-accent-rgb),0.16)]"
              />
            </label>

            <label className="block text-[0.8rem] font-semibold text-[color:var(--kw-faint)]">
              Personal note
              <div className="relative mt-1">
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="Add a private reminder for this ayah..."
                  className="w-full rounded-xl border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 py-2 pr-9 text-sm font-normal text-[color:var(--kw-ink)] placeholder:text-[color:var(--kw-faint)] transition-[border-color,box-shadow] duration-200 focus:border-[rgba(var(--kw-accent-rgb),0.55)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(var(--kw-accent-rgb),0.16)]"
                />
                <MessageSquareText size={14} className="pointer-events-none absolute right-3 top-3 text-[color:var(--kw-faint)]" />
              </div>
            </label>

            <label className="block text-[0.8rem] font-semibold text-[color:var(--kw-faint)]">
              Category
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 text-sm font-normal text-[color:var(--kw-ink)] transition-[border-color,box-shadow] duration-200 focus:border-[rgba(var(--kw-accent-rgb),0.55)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(var(--kw-accent-rgb),0.16)]"
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
                className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--kw-muted)] transition hover:text-[rgba(var(--kw-accent-rgb),1)]"
              >
                All bookmarks
                <ArrowUpRight size={12} />
              </Link>
              <Button size="sm" onClick={() => void saveBookmark()} loading={saving}>
                Save
              </Button>
            </div>

            {feedback ? (
              <p role="status" aria-live="polite" className="text-xs text-[color:var(--kw-muted)]">{feedback}</p>
            ) : null}
            {connectionStatus ? (
              <p className="text-xs text-[color:var(--kw-faint)]">
                {connectionStatus.state === "connected"
                  ? "Quran.com is linked. New bookmarks can sync remotely."
                  : connectionStatus.state === "degraded"
                    ? "Quran.com link needs attention. This bookmark will stay local until it recovers."
                    : "This bookmark will stay local until you link Quran.com."}
              </p>
            ) : null}
          </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
