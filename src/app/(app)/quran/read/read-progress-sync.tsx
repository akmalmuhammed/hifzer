"use client";

import type { MutableRefObject } from "react";
import { useEffect, useRef } from "react";

function flushTrackedAyahs(
  pendingAyahIdsRef: MutableRefObject<Set<number>>,
  trackTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>,
  keepalive = false,
) {
  if (pendingAyahIdsRef.current.size < 1) {
    return;
  }
  const ayahIds = Array.from(pendingAyahIdsRef.current);
  pendingAyahIdsRef.current = new Set();
  void fetch("/api/quran/progress/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    keepalive,
    body: JSON.stringify({
      ayahIds,
    }),
  }).catch(() => {
    for (const ayahId of ayahIds) {
      pendingAyahIdsRef.current.add(ayahId);
    }
    if (trackTimerRef.current) {
      clearTimeout(trackTimerRef.current);
    }
    trackTimerRef.current = setTimeout(() => {
      flushTrackedAyahs(pendingAyahIdsRef, trackTimerRef);
    }, 1500);
  });
}

export function ReadProgressSync(props: {
  enabled: boolean;
  surahNumber: number;
  ayahNumber: number;
  ayahId: number;
}) {
  const lastKeyRef = useRef<string>("");
  const pendingAyahIdsRef = useRef<Set<number>>(new Set());
  const trackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (trackTimerRef.current) {
      clearTimeout(trackTimerRef.current);
    }
    if (cursorTimerRef.current) {
      clearTimeout(cursorTimerRef.current);
    }
    flushTrackedAyahs(pendingAyahIdsRef, trackTimerRef, true);
  }, []);

  useEffect(() => {
    if (!props.enabled) {
      return;
    }

    const key = `${props.surahNumber}:${props.ayahNumber}:${props.ayahId}`;
    if (lastKeyRef.current === key) {
      return;
    }
    lastKeyRef.current = key;

    pendingAyahIdsRef.current.add(props.ayahId);

    if (trackTimerRef.current) {
      clearTimeout(trackTimerRef.current);
    }
    trackTimerRef.current = setTimeout(() => {
      flushTrackedAyahs(pendingAyahIdsRef, trackTimerRef);
    }, 800);

    if (cursorTimerRef.current) {
      clearTimeout(cursorTimerRef.current);
    }
    cursorTimerRef.current = setTimeout(() => {
      void fetch("/api/profile/start-point", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          surahNumber: props.surahNumber,
          ayahNumber: props.ayahNumber,
          cursorAyahId: props.ayahId,
          source: "quran_read",
        }),
      }).catch(() => {
        // Fail-open: local reading should continue even if cursor sync fails.
      });
    }, 2000);

    return () => {
      if (trackTimerRef.current) {
        clearTimeout(trackTimerRef.current);
      }
      if (cursorTimerRef.current) {
        clearTimeout(cursorTimerRef.current);
      }
    };
  }, [props.ayahId, props.ayahNumber, props.enabled, props.surahNumber]);

  return null;
}
