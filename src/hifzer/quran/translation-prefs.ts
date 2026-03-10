import type { QuranDataSourceId } from "@/hifzer/quran/source-catalog";

export const DEFAULT_QURAN_TRANSLATION_ID = "en.sahih" as const;
export const QURAN_TRANSLATION_COOKIE = "hifzer_quran_translation";
export const QURAN_TRANSLATION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const QURAN_TRANSLATION_OPTIONS = [
  {
    id: "en.sahih",
    label: "English - Saheeh International",
    rtl: false,
    providerKey: "tanzil.en.sahih",
    sourceId: "tanzil" as QuranDataSourceId,
    sourceLabel: "Tanzil",
    sourceStatus: "verified",
    sourceUrl: "https://tanzil.net/trans/en.sahih",
    sourceNote: "Bundled from the Tanzil Saheeh International export with explicit attribution.",
  },
  {
    id: "ur.junagarhi",
    label: "Urdu - Muhammad Junagarhi",
    rtl: true,
    providerKey: "local-bundle.ur.junagarhi",
    sourceId: null,
    sourceLabel: "Bundled dataset",
    sourceStatus: "review_required",
    sourceUrl: "/legal/sources",
    sourceNote: "Available in-app today, but its external provenance is still being normalized into the new source registry.",
  },
  {
    id: "id.indonesian",
    label: "Indonesian - Ministry of Religious Affairs",
    rtl: false,
    providerKey: "local-bundle.id.indonesian",
    sourceId: null,
    sourceLabel: "Bundled dataset",
    sourceStatus: "review_required",
    sourceUrl: "/legal/sources",
    sourceNote: "Available in-app today, but its external provenance is still being normalized into the new source registry.",
  },
  {
    id: "tr.yildirim",
    label: "Turkish - Suat Yildirim",
    rtl: false,
    providerKey: "local-bundle.tr.yildirim",
    sourceId: null,
    sourceLabel: "Bundled dataset",
    sourceStatus: "review_required",
    sourceUrl: "/legal/sources",
    sourceNote: "Available in-app today, but its external provenance is still being normalized into the new source registry.",
  },
  {
    id: "fa.fooladvand",
    label: "Persian - Mohammad Mahdi Fooladvand",
    rtl: true,
    providerKey: "local-bundle.fa.fooladvand",
    sourceId: null,
    sourceLabel: "Bundled dataset",
    sourceStatus: "review_required",
    sourceUrl: "/legal/sources",
    sourceNote: "Available in-app today, but its external provenance is still being normalized into the new source registry.",
  },
  {
    id: "bn.bengali",
    label: "Bengali - Muhiuddin Khan",
    rtl: false,
    providerKey: "local-bundle.bn.bengali",
    sourceId: null,
    sourceLabel: "Bundled dataset",
    sourceStatus: "review_required",
    sourceUrl: "/legal/sources",
    sourceNote: "Available in-app today, but its external provenance is still being normalized into the new source registry.",
  },
  {
    id: "ml.abdulhameed",
    label: "Malayalam - Abdul Hameed & Parappoor",
    rtl: false,
    providerKey: "local-bundle.ml.abdulhameed",
    sourceId: null,
    sourceLabel: "Bundled dataset",
    sourceStatus: "review_required",
    sourceUrl: "/legal/sources",
    sourceNote: "Available in-app today, but its external provenance is still being normalized into the new source registry.",
  },
] as const;

export type QuranTranslationId = (typeof QURAN_TRANSLATION_OPTIONS)[number]["id"];
export type QuranTranslationOption = (typeof QURAN_TRANSLATION_OPTIONS)[number];
export type QuranTranslationSourceStatus = QuranTranslationOption["sourceStatus"];

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

export function getQuranTranslationOption(value: unknown): QuranTranslationOption | null {
  const id = normalizeQuranTranslationId(value);
  return QURAN_TRANSLATION_OPTIONS.find((option) => option.id === id) ?? null;
}

export function getQuranTranslationProviderKey(value: unknown): string {
  return getQuranTranslationOption(value)?.providerKey ?? `local-bundle.${DEFAULT_QURAN_TRANSLATION_ID}`;
}

export function buildQuranTranslationCookieValue(translationId: QuranTranslationId): string {
  return `${QURAN_TRANSLATION_COOKIE}=${translationId}; Path=/; Max-Age=${QURAN_TRANSLATION_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
