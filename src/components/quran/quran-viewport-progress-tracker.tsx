"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

type AyahVisitPayload = {
  ayahId: number;
  surahNumber: number;
  ayahNumber: number;
};

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
    body: JSON.stringify({ ayahIds }),
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

function parseElementPayload(element: HTMLElement): AyahVisitPayload | null {
  const ayahId = Number(element.dataset.quranAyahId);
  const surahNumber = Number(element.dataset.quranSurahNumber);
  const ayahNumber = Number(element.dataset.quranAyahNumber);
  if (!Number.isFinite(ayahId) || !Number.isFinite(surahNumber) || !Number.isFinite(ayahNumber)) {
    return null;
  }
  return {
    ayahId: Math.floor(ayahId),
    surahNumber: Math.floor(surahNumber),
    ayahNumber: Math.floor(ayahNumber),
  };
}

export function QuranViewportProgressTracker(props: {
  enabled: boolean;
  selector?: string;
}) {
  const pendingAyahIdsRef = useRef<Set<number>>(new Set());
  const seenKeysRef = useRef<Set<string>>(new Set());
  const trackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCursorPayloadRef = useRef<AyahVisitPayload | null>(null);

  useEffect(() => {
    if (!props.enabled || typeof window === "undefined") {
      return;
    }

    const selector = props.selector ?? "[data-quran-track='1']";

    function sendCursorSync(payload: AyahVisitPayload, keepalive = false) {
      lastCursorPayloadRef.current = payload;
      void fetch("/api/profile/start-point", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive,
        body: JSON.stringify({
          surahNumber: payload.surahNumber,
          ayahNumber: payload.ayahNumber,
          cursorAyahId: payload.ayahId,
          source: "quran_read",
        }),
      }).catch(() => {
        // Fail-open: local reading should continue even if cursor sync fails.
      });
    }

    function queueVisit(payload: AyahVisitPayload) {
      const key = `${payload.surahNumber}:${payload.ayahNumber}:${payload.ayahId}`;
      if (seenKeysRef.current.has(key)) {
        return;
      }
      seenKeysRef.current.add(key);
      pendingAyahIdsRef.current.add(payload.ayahId);

      if (trackTimerRef.current) {
        clearTimeout(trackTimerRef.current);
      }
      trackTimerRef.current = setTimeout(() => {
        flushTrackedAyahs(pendingAyahIdsRef, trackTimerRef);
      }, 450);

      if (cursorTimerRef.current) {
        clearTimeout(cursorTimerRef.current);
      }
      cursorTimerRef.current = setTimeout(() => {
        sendCursorSync(payload);
      }, 650);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) {
            continue;
          }
          const payload = parseElementPayload(entry.target as HTMLElement);
          if (payload) {
            queueVisit(payload);
          }
        }
      },
      {
        threshold: [0.25, 0.6, 0.85],
        rootMargin: "0px 0px -10% 0px",
      },
    );

    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    for (const element of elements) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
      if (trackTimerRef.current) {
        clearTimeout(trackTimerRef.current);
      }
      if (cursorTimerRef.current) {
        clearTimeout(cursorTimerRef.current);
      }
      flushTrackedAyahs(pendingAyahIdsRef, trackTimerRef, true);
      if (lastCursorPayloadRef.current) {
        sendCursorSync(lastCursorPayloadRef.current, true);
      }
    };
  }, [props.enabled, props.selector]);

  return null;
}
