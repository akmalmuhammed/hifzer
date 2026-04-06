export type ThemeMode = "light" | "dark";
export type ThemePreset = "standard" | "paper" | "noor" | "dawn" | "rose";
export type AccentPreset = "teal" | "cobalt" | "ember";

export type ThemeDocumentState = {
  mode: ThemeMode;
  theme: ThemePreset;
  accent: AccentPreset;
};

export const THEME_MODE_COOKIE = "hifzer_mode";
export const THEME_PRESET_COOKIE = "hifzer_theme";
export const THEME_ACCENT_COOKIE = "hifzer_accent";
export const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const THEME_MODES = ["light", "dark"] as const;
export const THEME_PRESETS = ["standard", "paper", "noor", "dawn", "rose"] as const;
export const THEME_ACCENTS = ["teal", "cobalt", "ember"] as const;

export const DEFAULT_THEME_DOCUMENT_STATE: ThemeDocumentState = {
  mode: "light",
  theme: "standard",
  accent: "teal",
};

function normalizeFromAllowed<T extends string>(value: unknown, fallback: T, allowed: readonly T[]): T {
  const raw = String(value ?? fallback);
  return allowed.includes(raw as T) ? (raw as T) : fallback;
}

export function isThemePreset(value: string): value is ThemePreset {
  return THEME_PRESETS.includes(value as ThemePreset);
}

export function isAccentPreset(value: string): value is AccentPreset {
  return THEME_ACCENTS.includes(value as AccentPreset);
}

export function normalizeThemeMode(value: unknown): ThemeMode {
  return normalizeFromAllowed(value, DEFAULT_THEME_DOCUMENT_STATE.mode, THEME_MODES);
}

export function normalizeThemePreset(value: unknown): ThemePreset {
  return normalizeFromAllowed(value, DEFAULT_THEME_DOCUMENT_STATE.theme, THEME_PRESETS);
}

export function normalizeAccentPreset(value: unknown): AccentPreset {
  return normalizeFromAllowed(value, DEFAULT_THEME_DOCUMENT_STATE.accent, THEME_ACCENTS);
}

export function normalizeThemeDocumentState(
  value: Partial<ThemeDocumentState> | null | undefined,
): ThemeDocumentState {
  return {
    mode: normalizeThemeMode(value?.mode),
    theme: normalizeThemePreset(value?.theme),
    accent: normalizeAccentPreset(value?.accent),
  };
}

export function buildThemeModeCookieValue(mode: ThemeMode): string {
  return `${THEME_MODE_COOKIE}=${mode}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function buildThemePresetCookieValue(theme: ThemePreset): string {
  return `${THEME_PRESET_COOKIE}=${theme}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function buildThemeAccentCookieValue(accent: AccentPreset): string {
  return `${THEME_ACCENT_COOKIE}=${accent}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
