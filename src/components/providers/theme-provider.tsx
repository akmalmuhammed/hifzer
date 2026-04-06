"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  buildThemeAccentCookieValue,
  buildThemeModeCookieValue,
  buildThemePresetCookieValue,
  DEFAULT_THEME_DOCUMENT_STATE,
  normalizeThemeDocumentState,
  type AccentPreset,
  type ThemeDocumentState,
  type ThemeMode,
  type ThemePreset,
} from "@/hifzer/theme/preferences";

export type { AccentPreset, ThemeDocumentState, ThemeMode, ThemePreset } from "@/hifzer/theme/preferences";

type ThemeState = {
  mode: ThemeMode;
  theme: ThemePreset;
  accent: AccentPreset;
  setMode: (mode: ThemeMode) => void;
  setTheme: (theme: ThemePreset) => void;
  setAccent: (accent: AccentPreset) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

const STORAGE_KEYS = {
  mode: "hifzer_mode_v1",
  theme: "hifzer_theme_v1",
  accent: "hifzer_accent_v1",
} as const;

function safeStorageSet(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures (private mode / blocked storage) to avoid hydration crashes.
  }
}

function safeCookieSet(value: string): void {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = value;
}

function applyToDocument(mode: ThemeMode, theme: ThemePreset, accent: AccentPreset) {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  root.dataset.mode = mode;
  root.dataset.theme = theme;
  root.dataset.accent = accent;
  root.style.colorScheme = mode;
}

export function ThemeProvider(props: {
  children: React.ReactNode;
  initialState?: ThemeDocumentState;
}) {
  const initialState = normalizeThemeDocumentState(props.initialState ?? DEFAULT_THEME_DOCUMENT_STATE);
  const [mode, setMode] = useState<ThemeMode>(initialState.mode);
  const [theme, setTheme] = useState<ThemePreset>(initialState.theme);
  const [accent, setAccent] = useState<AccentPreset>(initialState.accent);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    applyToDocument(mode, theme, accent);
  }, [accent, mode, theme]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    safeStorageSet(STORAGE_KEYS.mode, mode);
    safeStorageSet(STORAGE_KEYS.theme, theme);
    safeStorageSet(STORAGE_KEYS.accent, accent);
    safeCookieSet(buildThemeModeCookieValue(mode));
    safeCookieSet(buildThemePresetCookieValue(theme));
    safeCookieSet(buildThemeAccentCookieValue(accent));
  }, [accent, mode, theme]);

  const value = useMemo<ThemeState>(
    () => ({
      mode,
      theme,
      accent,
      setMode,
      setTheme,
      setAccent,
      toggleMode: () => setMode((m) => (m === "dark" ? "light" : "dark")),
    }),
    [accent, mode, theme],
  );

  return <ThemeContext.Provider value={value}>{props.children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
