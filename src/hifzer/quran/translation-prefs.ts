export const DEFAULT_QURAN_TRANSLATION_ID = "en.sahih" as const;
export const QURAN_TRANSLATION_COOKIE = "hifzer_quran_translation";
export const QURAN_TRANSLATION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const QURAN_TRANSLATION_OPTIONS = [
  { id: "en.sahih", label: "English - Saheeh International", rtl: false },
  { id: "ur.junagarhi", label: "Urdu - Muhammad Junagarhi", rtl: true },
  { id: "id.indonesian", label: "Indonesian - Ministry of Religious Affairs", rtl: false },
  { id: "tr.yildirim", label: "Turkish - Suat Yildirim", rtl: false },
  { id: "fa.fooladvand", label: "Persian - Mohammad Mahdi Fooladvand", rtl: true },
  { id: "bn.bengali", label: "Bengali - Muhiuddin Khan", rtl: false },
  { id: "ml.abdulhameed", label: "Malayalam - Abdul Hameed & Parappoor", rtl: false },
] as const;

export type QuranTranslationId = (typeof QURAN_TRANSLATION_OPTIONS)[number]["id"];

const SUPPORTED_TRANSLATION_ID_SET = new Set<string>(QURAN_TRANSLATION_OPTIONS.map((item) => item.id));

export function isSupportedQuranTranslationId(value: string): value is QuranTranslationId {
  return SUPPORTED_TRANSLATION_ID_SET.has(value);
}

export function normalizeQuranTranslationId(value: unknown): QuranTranslationId {
  const raw = String(value ?? DEFAULT_QURAN_TRANSLATION_ID);
  if (isSupportedQuranTranslationId(raw)) {
    return raw;
  }
  return DEFAULT_QURAN_TRANSLATION_ID;
}

export function buildQuranTranslationCookieValue(translationId: QuranTranslationId): string {
  return `${QURAN_TRANSLATION_COOKIE}=${translationId}; Path=/; Max-Age=${QURAN_TRANSLATION_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
