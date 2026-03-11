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
  const cursorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCursorPayloadRef = useRef<VisitPayload | null>(null);

  const sendCursorSync = useCallback((payload: VisitPayload, keepalive = false) => {
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
  }, []);

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

    if (trackTimerRef.current) {
      clearTimeout(trackTimerRef.current);
    }
    trackTimerRef.current = setTimeout(() => {
      flushTrackedAyahs(pendingAyahIdsRef, trackTimerRef);
    }, options?.immediate ? 160 : 800);

    if (cursorTimerRef.current) {
      clearTimeout(cursorTimerRef.current);
    }
    cursorTimerRef.current = setTimeout(() => {
      sendCursorSync(payload, options?.immediate === true);
    }, options?.immediate ? 180 : 900);
  }, [props.enabled, sendCursorSync]);

  useImperativeHandle(ref, () => ({
    markAyahVisited(payload) {
      queueVisit(payload, { immediate: true });
    },
  }), [queueVisit]);

  useEffect(() => () => {
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
  }, [sendCursorSync]);

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
      if (cursorTimerRef.current) {
        clearTimeout(cursorTimerRef.current);
      }
    };
  }, [props.ayahId, props.ayahNumber, props.surahNumber, queueVisit]);

  return null;
});
