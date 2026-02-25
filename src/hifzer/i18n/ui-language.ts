import {
  DEFAULT_QURAN_TRANSLATION_ID,
  isSupportedQuranTranslationId,
  type QuranTranslationId,
} from "@/hifzer/quran/translation-prefs";

export type UiLanguage = QuranTranslationId;

export const UI_LANGUAGE_COOKIE = "hifzer_ui_language";
export const UI_LANGUAGE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
export const DEFAULT_UI_LANGUAGE: UiLanguage = DEFAULT_QURAN_TRANSLATION_ID;

export const UI_LANGUAGE_OPTIONS: Array<{ id: UiLanguage; label: string }> = [
  { id: "en.sahih", label: "English" },
  { id: "ur.junagarhi", label: "اردو" },
  { id: "id.indonesian", label: "Bahasa Indonesia" },
  { id: "tr.yildirim", label: "Türkçe" },
  { id: "fa.fooladvand", label: "فارسی" },
  { id: "bn.bengali", label: "বাংলা" },
  { id: "ml.abdulhameed", label: "മലയാളം" },
];

export function normalizeUiLanguage(value: unknown): UiLanguage {
  const raw = String(value ?? DEFAULT_UI_LANGUAGE);
  if (isSupportedQuranTranslationId(raw)) {
    return raw;
  }
  return DEFAULT_UI_LANGUAGE;
}

export function uiLanguageToHtmlLang(value: UiLanguage): string {
  if (value === "ur.junagarhi") return "ur";
  if (value === "id.indonesian") return "id";
  if (value === "tr.yildirim") return "tr";
  if (value === "fa.fooladvand") return "fa";
  if (value === "bn.bengali") return "bn";
  if (value === "ml.abdulhameed") return "ml";
  return "en";
}

export function isUiLanguageRtl(value: UiLanguage): boolean {
  return value === "ur.junagarhi" || value === "fa.fooladvand";
}

export function buildUiLanguageCookieValue(language: UiLanguage): string {
  return `${UI_LANGUAGE_COOKIE}=${language}; Path=/; Max-Age=${UI_LANGUAGE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
