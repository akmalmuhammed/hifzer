"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";
export type ThemePreset = "standard" | "paper";
export type AccentPreset = "teal" | "cobalt" | "ember";

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

function readStored<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() =>
    readStored(STORAGE_KEYS.mode, "light", ["light", "dark"] as const),
  );
  const [theme, setTheme] = useState<ThemePreset>(() =>
    readStored(STORAGE_KEYS.theme, "standard", ["standard", "paper"] as const),
  );
  const [accent, setAccent] = useState<AccentPreset>(() =>
    readStored(STORAGE_KEYS.accent, "teal", ["teal", "cobalt", "ember"] as const),
  );

  useEffect(() => {
    applyToDocument(mode, theme, accent);
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.mode, mode);
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
    window.localStorage.setItem(STORAGE_KEYS.accent, accent);
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

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
