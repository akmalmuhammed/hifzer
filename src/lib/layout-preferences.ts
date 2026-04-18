import {
  normalizeAccentPreset,
  normalizeThemeMode,
  normalizeThemePreset,
  THEME_ACCENT_COOKIE,
  THEME_MODE_COOKIE,
  THEME_PRESET_COOKIE,
  type ThemeDocumentState,
} from "@/hifzer/theme/preferences";
import { normalizeUiLanguage, UI_LANGUAGE_COOKIE, type UiLanguage } from "@/hifzer/i18n/ui-language";

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

export function resolveInitialUiLanguage(cookieStore: CookieReader): UiLanguage {
  return normalizeUiLanguage(cookieStore.get(UI_LANGUAGE_COOKIE)?.value);
}

export function resolveInitialThemeState(cookieStore: CookieReader): ThemeDocumentState {
  return {
    mode: normalizeThemeMode(cookieStore.get(THEME_MODE_COOKIE)?.value),
    theme: normalizeThemePreset(cookieStore.get(THEME_PRESET_COOKIE)?.value),
    accent: normalizeAccentPreset(cookieStore.get(THEME_ACCENT_COOKIE)?.value),
  };
}
