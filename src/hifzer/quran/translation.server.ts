import "server-only";

import translationsJson from "@/hifzer/quran/data/translations/en.sahih.by-ayah-id.json";

let cachedTranslations: string[] | null = null;

function getTranslations(): string[] {
  if (cachedTranslations) {
    return cachedTranslations;
  }
  cachedTranslations = translationsJson as unknown as string[];
  return cachedTranslations;
}

export function getSahihTranslationByAyahId(ayahId: number): string | null {
  const id = Math.floor(Number(ayahId));
  if (!Number.isFinite(id) || id < 1) {
    return null;
  }

  const translations = getTranslations();
  if (id > translations.length) {
    return null;
  }

  const value = translations[id - 1];
  return typeof value === "string" ? value : null;
}

export function listSahihTranslationsForAyahIds(ayahIds: number[]): Record<number, string> {
  const out: Record<number, string> = {};
  const seen = new Set<number>();

  for (const raw of ayahIds) {
    const ayahId = Math.floor(Number(raw));
    if (!Number.isFinite(ayahId) || ayahId < 1 || seen.has(ayahId)) {
      continue;
    }
    seen.add(ayahId);

    const value = getSahihTranslationByAyahId(ayahId);
    if (value) {
      out[ayahId] = value;
    }
  }

  return out;
}
