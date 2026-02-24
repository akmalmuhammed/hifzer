import "server-only";

import type { QuranTranslationId } from "@/hifzer/quran/translation-prefs";
import { DEFAULT_QURAN_TRANSLATION_ID } from "@/hifzer/quran/translation-prefs";
import enSahihJson from "@/hifzer/quran/data/translations/en.sahih.by-ayah-id.json";
import urJunagarhiJson from "@/hifzer/quran/data/translations/ur.junagarhi.by-ayah-id.json";
import idIndonesianJson from "@/hifzer/quran/data/translations/id.indonesian.by-ayah-id.json";
import trYildirimJson from "@/hifzer/quran/data/translations/tr.yildirim.by-ayah-id.json";
import faFooladvandJson from "@/hifzer/quran/data/translations/fa.fooladvand.by-ayah-id.json";
import bnBengaliJson from "@/hifzer/quran/data/translations/bn.bengali.by-ayah-id.json";
import mlAbdulhameedJson from "@/hifzer/quran/data/translations/ml.abdulhameed.by-ayah-id.json";
import enTransliterationJson from "@/hifzer/quran/data/translations/en.transliteration.by-ayah-id.json";

const TRANSLATION_DATA_BY_ID: Record<QuranTranslationId, string[]> = {
  "en.sahih": enSahihJson as unknown as string[],
  "ur.junagarhi": urJunagarhiJson as unknown as string[],
  "id.indonesian": idIndonesianJson as unknown as string[],
  "tr.yildirim": trYildirimJson as unknown as string[],
  "fa.fooladvand": faFooladvandJson as unknown as string[],
  "bn.bengali": bnBengaliJson as unknown as string[],
  "ml.abdulhameed": mlAbdulhameedJson as unknown as string[],
};

const PHONETIC_TRANSLITERATION_BY_AYAH_ID = enTransliterationJson as unknown as string[];
const STRIP_HTML_TAGS_REGEX = /<\/?[^>]+>/gi;

function normalizeAyahId(ayahId: number): number | null {
  const id = Math.floor(Number(ayahId));
  if (!Number.isFinite(id) || id < 1) {
    return null;
  }
  return id;
}

function stripInlineMarkup(value: string): string {
  // Tanzil transliteration contains simple inline tags such as <u> and <b>.
  return value.replace(STRIP_HTML_TAGS_REGEX, "").replace(/\s+/g, " ").trim();
}

function getTranslationRow(ayahId: number, rows: string[]): string | null {
  const id = normalizeAyahId(ayahId);
  if (!id || id > rows.length) {
    return null;
  }
  const value = rows[id - 1];
  return typeof value === "string" ? value : null;
}

export function getQuranTranslationByAyahId(
  ayahId: number,
  translationId: QuranTranslationId = DEFAULT_QURAN_TRANSLATION_ID,
): string | null {
  return getTranslationRow(ayahId, TRANSLATION_DATA_BY_ID[translationId]);
}

export function listQuranTranslationsForAyahIds(
  ayahIds: number[],
  translationId: QuranTranslationId = DEFAULT_QURAN_TRANSLATION_ID,
): Record<number, string> {
  const out: Record<number, string> = {};
  const seen = new Set<number>();
  const rows = TRANSLATION_DATA_BY_ID[translationId];

  for (const raw of ayahIds) {
    const ayahId = normalizeAyahId(raw);
    if (!ayahId || seen.has(ayahId)) {
      continue;
    }
    seen.add(ayahId);

    const value = getTranslationRow(ayahId, rows);
    if (value) {
      out[ayahId] = value;
    }
  }

  return out;
}

export function getPhoneticByAyahId(ayahId: number): string | null {
  const raw = getTranslationRow(ayahId, PHONETIC_TRANSLITERATION_BY_AYAH_ID);
  if (!raw) {
    return null;
  }
  return stripInlineMarkup(raw);
}

export function listPhoneticsForAyahIds(ayahIds: number[]): Record<number, string> {
  const out: Record<number, string> = {};
  const seen = new Set<number>();

  for (const raw of ayahIds) {
    const ayahId = normalizeAyahId(raw);
    if (!ayahId || seen.has(ayahId)) {
      continue;
    }
    seen.add(ayahId);

    const value = getPhoneticByAyahId(ayahId);
    if (value) {
      out[ayahId] = value;
    }
  }

  return out;
}

export function getSahihTranslationByAyahId(ayahId: number): string | null {
  return getQuranTranslationByAyahId(ayahId, "en.sahih");
}

export function listSahihTranslationsForAyahIds(ayahIds: number[]): Record<number, string> {
  return listQuranTranslationsForAyahIds(ayahIds, "en.sahih");
}
