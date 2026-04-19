"use client";

import { useEffect, useRef } from "react";
import { flushPendingBookmarkMutations, loadBookmarksFromApi } from "@/hifzer/bookmarks/client";

const SYNC_INTERVAL_MS = 45_000;
const QF_RECONCILE_INTERVAL_MS = 5 * 60_000;
const INITIAL_SYNC_DELAY_MS = 8_000;

export function BookmarkSyncAgent() {
  const lastQuranFoundationSyncAtRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;
    let timeoutId: number | null = null;
    let idleHandle: number | null = null;

    async function reconcileQuranFoundationBookmarks() {
      if (document.visibilityState !== "visible") {
        return;
      }
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
      if (cancelled || document.visibilityState !== "visible") {
        return;
      }
      await flushPendingBookmarkMutations();
      await reconcileQuranFoundationBookmarks();
    }

    const startSyncLoop = () => {
      if (cancelled || intervalId != null) {
        return;
      }
      void syncNow();
      intervalId = window.setInterval(() => {
        void syncNow();
      }, SYNC_INTERVAL_MS);
    };

    const scheduleStart = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(() => {
          startSyncLoop();
        }, { timeout: INITIAL_SYNC_DELAY_MS });
        return;
      }
      timeoutId = window.setTimeout(() => {
        startSyncLoop();
      }, INITIAL_SYNC_DELAY_MS);
    };

    const onOnline = () => {
      void syncNow();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (intervalId == null) {
          scheduleStart();
          return;
        }
        void syncNow();
      }
    };

    scheduleStart();
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (intervalId != null) {
        window.clearInterval(intervalId);
      }
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
      }
      if (idleHandle != null) {
        window.cancelIdleCallback?.(idleHandle);
      }
    };
  }, []);

  return null;
}
