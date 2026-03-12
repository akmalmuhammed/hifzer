"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

type AyahVisitPayload = {
  ayahId: number;
  surahNumber: number;
  ayahNumber: number;
};

function flushTrackedAyahs(
  pendingAyahIdsRef: MutableRefObject<Set<number>>,
  latestPayloadRef: MutableRefObject<AyahVisitPayload | null>,
  trackTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>,
  keepalive = false,
) {
  if (pendingAyahIdsRef.current.size < 1) {
    return;
  }

  const ayahIds = Array.from(pendingAyahIdsRef.current);
  const latestPayload = latestPayloadRef.current;
  pendingAyahIdsRef.current = new Set();

  void fetch("/api/quran/progress/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    keepalive,
    body: JSON.stringify({
      ayahIds,
      latestAyahId: latestPayload?.ayahId,
      latestSurahNumber: latestPayload?.surahNumber,
      latestAyahNumber: latestPayload?.ayahNumber,
    }),
  }).catch(() => {
    for (const ayahId of ayahIds) {
      pendingAyahIdsRef.current.add(ayahId);
    }
    if (trackTimerRef.current) {
      clearTimeout(trackTimerRef.current);
    }
    trackTimerRef.current = setTimeout(() => {
      flushTrackedAyahs(pendingAyahIdsRef, latestPayloadRef, trackTimerRef);
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
  const latestPayloadRef = useRef<AyahVisitPayload | null>(null);

  useEffect(() => {
    if (!props.enabled || typeof window === "undefined") {
      return;
    }

    const selector = props.selector ?? "[data-quran-track='1']";

    function queueVisit(payload: AyahVisitPayload) {
      const key = `${payload.surahNumber}:${payload.ayahNumber}:${payload.ayahId}`;
      if (seenKeysRef.current.has(key)) {
        return;
      }
      seenKeysRef.current.add(key);
      pendingAyahIdsRef.current.add(payload.ayahId);
      latestPayloadRef.current = payload;

      if (trackTimerRef.current) {
        clearTimeout(trackTimerRef.current);
      }
      trackTimerRef.current = setTimeout(() => {
        flushTrackedAyahs(pendingAyahIdsRef, latestPayloadRef, trackTimerRef);
      }, 450);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const visibleEnough = entry.intersectionRatio >= 0.15 || entry.intersectionRect.height >= 120;
          if (!entry.isIntersecting || !visibleEnough) {
            continue;
          }
          const payload = parseElementPayload(entry.target as HTMLElement);
          if (payload) {
            queueVisit(payload);
          }
        }
      },
      {
        threshold: [0.1, 0.15, 0.35, 0.6],
        rootMargin: "0px 0px -18% 0px",
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
      flushTrackedAyahs(pendingAyahIdsRef, latestPayloadRef, trackTimerRef, true);
    };
  }, [props.enabled, props.selector]);

  return null;
}
