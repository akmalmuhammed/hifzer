import "server-only";

import { readFileSync } from "fs";
import { join } from "path";
import type { QuranTranslationId } from "@/hifzer/quran/translation-prefs";
import { DEFAULT_QURAN_TRANSLATION_ID } from "@/hifzer/quran/translation-prefs";

// ---------------------------------------------------------------------------
// Lazy-load translation JSON files on first access per process.
// Only the translation(s) that a user actually needs are ever loaded into
// memory, reducing cold-start time and server RAM from ~12 MB to ~1-2 MB.
// Files are included in the deployment bundle via outputFileTracingIncludes
// configured in next.config.ts.
// ---------------------------------------------------------------------------

const TRANSLATION_DIR = join(process.cwd(), "src/hifzer/quran/data/translations");

const TRANSLATION_FILENAMES: Record<QuranTranslationId, string> = {
  "en.sahih": "en.sahih.by-ayah-id.json",
  "ur.junagarhi": "ur.junagarhi.by-ayah-id.json",
  "id.indonesian": "id.indonesian.by-ayah-id.json",
  "tr.yildirim": "tr.yildirim.by-ayah-id.json",
  "fa.fooladvand": "fa.fooladvand.by-ayah-id.json",
  "bn.bengali": "bn.bengali.by-ayah-id.json",
  "ml.abdulhameed": "ml.abdulhameed.by-ayah-id.json",
};

const PHONETIC_FILENAME = "en.transliteration.by-ayah-id.json";
const STRIP_HTML_TAGS_REGEX = /<\/?[^>]+>/gi;

// Module-level caches — populated lazily per translation, shared across requests.
const translationCache = new Map<QuranTranslationId, string[]>();
let phoneticCache: string[] | null = null;

function loadTranslationData(id: QuranTranslationId): string[] {
  const cached = translationCache.get(id);
  if (cached) return cached;
  const filePath = join(TRANSLATION_DIR, TRANSLATION_FILENAMES[id]);
  const data = JSON.parse(readFileSync(filePath, "utf-8")) as string[];
  translationCache.set(id, data);
  return data;
}

function loadPhoneticData(): string[] {
  if (phoneticCache) return phoneticCache;
  const filePath = join(TRANSLATION_DIR, PHONETIC_FILENAME);
  phoneticCache = JSON.parse(readFileSync(filePath, "utf-8")) as string[];
  return phoneticCache;
}

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
  return getTranslationRow(ayahId, loadTranslationData(translationId));
}

export function listQuranTranslationsForAyahIds(
  ayahIds: number[],
  translationId: QuranTranslationId = DEFAULT_QURAN_TRANSLATION_ID,
): Record<number, string> {
  const out: Record<number, string> = {};
  const seen = new Set<number>();
  const rows = loadTranslationData(translationId);

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
  const raw = getTranslationRow(ayahId, loadPhoneticData());
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
