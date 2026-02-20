"use client";

import { useEffect, useRef } from "react";

export function ReadProgressSync(props: {
  enabled: boolean;
  surahNumber: number;
  ayahNumber: number;
  ayahId: number;
}) {
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    if (!props.enabled) {
      return;
    }

    const key = `${props.surahNumber}:${props.ayahNumber}:${props.ayahId}`;
    if (lastKeyRef.current === key) {
      return;
    }
    lastKeyRef.current = key;

    void fetch("/api/profile/start-point", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        surahNumber: props.surahNumber,
        ayahNumber: props.ayahNumber,
        cursorAyahId: props.ayahId,
        source: "quran_read",
      }),
    }).catch(() => {
      // Fail-open: local reading should continue even if profile sync fails.
    });
  }, [props.ayahId, props.ayahNumber, props.enabled, props.surahNumber]);

  return null;
}
