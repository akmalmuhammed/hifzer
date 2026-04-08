"use client";

import { useEffect, useRef } from "react";
import { flushPendingBookmarkMutations, loadBookmarksFromApi } from "@/hifzer/bookmarks/client";

const SYNC_INTERVAL_MS = 45_000;
const QF_RECONCILE_INTERVAL_MS = 5 * 60_000;

export function BookmarkSyncAgent() {
  const lastQuranFoundationSyncAtRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function reconcileQuranFoundationBookmarks() {
      const now = Date.now();
      if (now - lastQuranFoundationSyncAtRef.current < QF_RECONCILE_INTERVAL_MS) {
        return;
      }

      try {
        const statusResponse = await fetch("/api/quran-foundation/status", { cache: "no-store" });
        const statusPayload = (await statusResponse.json().catch(() => null)) as {
          status?: { available?: boolean; state?: string };
        } | null;
        const status = statusPayload?.status;
        if (!status?.available || (status.state !== "connected" && status.state !== "degraded")) {
          return;
        }

        lastQuranFoundationSyncAtRef.current = now;
        const response = await fetch("/api/quran-foundation/bookmarks/reconcile", { method: "POST" });
        if (!response.ok) {
          return;
        }
        await loadBookmarksFromApi();
      } catch {
        // keep bookmark sync silent in the background
      }
    }

    async function syncNow() {
      if (cancelled) {
        return;
      }
      await flushPendingBookmarkMutations();
      await reconcileQuranFoundationBookmarks();
    }

    void syncNow();

    const onOnline = () => {
      void syncNow();
    };

    window.addEventListener("online", onOnline);
    const timer = window.setInterval(() => {
      void syncNow();
    }, SYNC_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
