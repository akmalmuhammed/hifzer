"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type MutableRefObject,
} from "react";

function flushTrackedAyahs(
  pendingAyahIdsRef: MutableRefObject<Set<number>>,
  latestPayloadRef: MutableRefObject<VisitPayload | null>,
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

type VisitPayload = {
  surahNumber: number;
  ayahNumber: number;
  ayahId: number;
};

export type ReadProgressSyncHandle = {
  markAyahVisited: (payload: VisitPayload) => void;
};

export const ReadProgressSync = forwardRef<ReadProgressSyncHandle, {
  enabled: boolean;
  surahNumber: number;
  ayahNumber: number;
  ayahId: number;
}>(function ReadProgressSync(props, ref) {
  const lastKeyRef = useRef<string>("");
  const pendingAyahIdsRef = useRef<Set<number>>(new Set());
  const trackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPayloadRef = useRef<VisitPayload | null>(null);

  const queueVisit = useCallback((payload: VisitPayload, options?: { immediate?: boolean }) => {
    if (!props.enabled) {
      return;
    }

    const key = `${payload.surahNumber}:${payload.ayahNumber}:${payload.ayahId}`;
    if (lastKeyRef.current === key) {
      return;
    }
    lastKeyRef.current = key;

    pendingAyahIdsRef.current.add(payload.ayahId);
    latestPayloadRef.current = payload;

    if (trackTimerRef.current) {
      clearTimeout(trackTimerRef.current);
    }
    trackTimerRef.current = setTimeout(() => {
      flushTrackedAyahs(pendingAyahIdsRef, latestPayloadRef, trackTimerRef);
    }, options?.immediate ? 160 : 800);
  }, [props.enabled]);

  useImperativeHandle(ref, () => ({
    markAyahVisited(payload) {
      queueVisit(payload, { immediate: true });
    },
  }), [queueVisit]);

  useEffect(() => () => {
    if (trackTimerRef.current) {
      clearTimeout(trackTimerRef.current);
    }
    flushTrackedAyahs(pendingAyahIdsRef, latestPayloadRef, trackTimerRef, true);
  }, []);

  useEffect(() => {
    queueVisit({
      surahNumber: props.surahNumber,
      ayahNumber: props.ayahNumber,
      ayahId: props.ayahId,
    });

    return () => {
      if (trackTimerRef.current) {
        clearTimeout(trackTimerRef.current);
      }
    };
  }, [props.ayahId, props.ayahNumber, props.surahNumber, queueVisit]);

  return null;
});
