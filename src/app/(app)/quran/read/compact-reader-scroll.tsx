"use client";

import { useEffect } from "react";

export function CompactReaderScroll(props: { targetId: string; ayahId: number }) {
  useEffect(() => {
    if (window.location.hash !== `#${props.targetId}`) {
      return;
    }

    const target = document.getElementById(props.targetId);
    if (!target) {
      return;
    }

    window.requestAnimationFrame(() => {
      target.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }, [props.ayahId, props.targetId]);

  return null;
}
