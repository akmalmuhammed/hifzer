"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  buildThemeAccentCookieValue,
  buildThemeModeCookieValue,
  buildThemePresetCookieValue,
  DEFAULT_THEME_DOCUMENT_STATE,
  THEME_ACCENT_COOKIE,
  THEME_MODE_COOKIE,
  THEME_PRESET_COOKIE,
  normalizeAccentPreset,
  normalizeThemeDocumentState,
  normalizeThemeMode,
  normalizeThemePreset,
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
const THEME_CHANGE_EVENT = "hifzer:theme-change";
let cachedThemeSnapshot: ThemeDocumentState | null = null;

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

function safeStorageGet(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

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

function readPersistedThemeState(fallback: ThemeDocumentState): ThemeDocumentState {
  const persistedMode = safeStorageGet(STORAGE_KEYS.mode) ?? readCookie(THEME_MODE_COOKIE);
  const persistedTheme = safeStorageGet(STORAGE_KEYS.theme) ?? readCookie(THEME_PRESET_COOKIE);
  const persistedAccent = safeStorageGet(STORAGE_KEYS.accent) ?? readCookie(THEME_ACCENT_COOKIE);

  return {
    mode: normalizeThemeMode(persistedMode ?? fallback.mode),
    theme: normalizeThemePreset(persistedTheme ?? fallback.theme),
    accent: normalizeAccentPreset(persistedAccent ?? fallback.accent),
  };
}

function getThemeSnapshot(fallback: ThemeDocumentState): ThemeDocumentState {
  const next = readPersistedThemeState(fallback);

  if (
    cachedThemeSnapshot &&
    cachedThemeSnapshot.mode === next.mode &&
    cachedThemeSnapshot.theme === next.theme &&
    cachedThemeSnapshot.accent === next.accent
  ) {
    return cachedThemeSnapshot;
  }

  cachedThemeSnapshot = next;
  return next;
}

function dispatchThemeChange() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function subscribeTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handleChange = () => onStoreChange();
  window.addEventListener(THEME_CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);
  window.addEventListener("focus", handleChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
    window.removeEventListener("focus", handleChange);
  };
}

function persistThemeState(nextState: ThemeDocumentState) {
  const normalized = normalizeThemeDocumentState(nextState);
  cachedThemeSnapshot = normalized;
  safeStorageSet(STORAGE_KEYS.mode, normalized.mode);
  safeStorageSet(STORAGE_KEYS.theme, normalized.theme);
  safeStorageSet(STORAGE_KEYS.accent, normalized.accent);
  safeCookieSet(buildThemeModeCookieValue(normalized.mode));
  safeCookieSet(buildThemePresetCookieValue(normalized.theme));
  safeCookieSet(buildThemeAccentCookieValue(normalized.accent));
  applyToDocument(normalized.mode, normalized.theme, normalized.accent);
  dispatchThemeChange();
}

export function ThemeProvider(props: {
  children: React.ReactNode;
  initialState?: ThemeDocumentState;
}) {
  const initialState = normalizeThemeDocumentState(props.initialState ?? DEFAULT_THEME_DOCUMENT_STATE);
  const themeState = useSyncExternalStore(
    subscribeTheme,
    () => getThemeSnapshot(initialState),
    () => initialState,
  );
  const { mode, theme, accent } = themeState;

  useEffect(() => {
    applyToDocument(mode, theme, accent);
  }, [accent, mode, theme]);

  const value = useMemo<ThemeState>(
    () => ({
      mode,
      theme,
      accent,
      setMode: (nextMode) => persistThemeState({ mode: nextMode, theme, accent }),
      setTheme: (nextTheme) => persistThemeState({ mode, theme: nextTheme, accent }),
      setAccent: (nextAccent) => persistThemeState({ mode, theme, accent: nextAccent }),
      toggleMode: () =>
        persistThemeState({
          mode: mode === "dark" ? "light" : "dark",
          theme,
          accent,
        }),
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
