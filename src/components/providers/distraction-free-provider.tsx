"use client";

import { createContext, useContext, useState } from "react";
import { buildDistractionFreeCookieValue } from "@/hifzer/focus/distraction-free";

type DistractionFreeContextValue = {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  toggle: () => void;
};

const DistractionFreeContext = createContext<DistractionFreeContextValue | null>(null);

export function DistractionFreeProvider(props: { initialEnabled: boolean; children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(Boolean(props.initialEnabled));

  function persist(next: boolean) {
    document.cookie = buildDistractionFreeCookieValue(next);
    document.documentElement.dataset.distractionFree = next ? "1" : "0";
  }

  function setEnabled(next: boolean) {
    const normalized = Boolean(next);
    setEnabledState(normalized);
    persist(normalized);
  }

  function toggle() {
    setEnabledState((current) => {
      const next = !current;
      persist(next);
      return next;
    });
  }

  const value: DistractionFreeContextValue = {
    enabled,
    setEnabled,
    toggle,
  };

  return (
    <DistractionFreeContext.Provider value={value}>
      {props.children}
    </DistractionFreeContext.Provider>
  );
}

export function useDistractionFree(): DistractionFreeContextValue {
  const value = useContext(DistractionFreeContext);
  if (!value) {
    throw new Error("useDistractionFree must be used within DistractionFreeProvider.");
  }
  return value;
}
