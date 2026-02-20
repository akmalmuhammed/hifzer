"use client";

import { useEffect } from "react";
import { flushPendingBookmarkMutations } from "@/hifzer/bookmarks/client";

const SYNC_INTERVAL_MS = 45_000;

export function BookmarkSyncAgent() {
  useEffect(() => {
    let cancelled = false;

    async function syncNow() {
      if (cancelled) {
        return;
      }
      await flushPendingBookmarkMutations();
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
