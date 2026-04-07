"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import {
  DISTRACTION_FREE_COOKIE,
  buildDistractionFreeCookieValue,
  normalizeDistractionFree,
} from "@/hifzer/focus/distraction-free";

type DistractionFreeContextValue = {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  toggle: () => void;
};

const DistractionFreeContext = createContext<DistractionFreeContextValue | null>(null);
const DISTRACTION_FREE_CHANGE_EVENT = "hifzer:distraction-free-change";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const token = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  if (!token) {
    return null;
  }
  return token.slice(name.length + 1);
}

function readPersistedDistractionFree(fallback: boolean): boolean {
  const cookieValue = readCookie(DISTRACTION_FREE_COOKIE);
  return cookieValue === null ? fallback : normalizeDistractionFree(cookieValue);
}

function dispatchDistractionFreeChange() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(DISTRACTION_FREE_CHANGE_EVENT));
}

function subscribeDistractionFree(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handleChange = () => onStoreChange();
  window.addEventListener(DISTRACTION_FREE_CHANGE_EVENT, handleChange);
  window.addEventListener("focus", handleChange);
  return () => {
    window.removeEventListener(DISTRACTION_FREE_CHANGE_EVENT, handleChange);
    window.removeEventListener("focus", handleChange);
  };
}

export function DistractionFreeProvider(props: { initialEnabled: boolean; children: React.ReactNode }) {
  const enabled = useSyncExternalStore(
    subscribeDistractionFree,
    () => readPersistedDistractionFree(Boolean(props.initialEnabled)),
    () => Boolean(props.initialEnabled),
  );

  function persist(next: boolean) {
    document.cookie = buildDistractionFreeCookieValue(next);
    document.documentElement.dataset.distractionFree = next ? "1" : "0";
    dispatchDistractionFreeChange();
  }

  function setEnabled(next: boolean) {
    const normalized = Boolean(next);
    persist(normalized);
  }

  function toggle() {
    persist(!enabled);
  }

  useEffect(() => {
    document.documentElement.dataset.distractionFree = enabled ? "1" : "0";
  }, [enabled]);

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
