import { getAyahById, getSurahInfo } from "@/hifzer/quran/lookup";

export type QuranSearchScope = "all" | "arabic" | "translation";

export type QuranSearchResult = {
  ayahId: number;
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  textUthmani: string;
  translation: string;
  score: number;
};

type IndexedAyah = {
  ayahId: number;
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  textUthmani: string;
  translation: string;
  normalizedArabic: string;
  normalizedTranslation: string;
};

const TOTAL_AYAHS = 6236;

let indexPromise: Promise<IndexedAyah[]> | null = null;

function normalizeArabic(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/ـ/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\u0600-\u06FF0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTranslation(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return text.split(" ").map((part) => part.trim()).filter(Boolean);
}

async function buildIndex(): Promise<IndexedAyah[]> {
  const translationModule = await import("@/hifzer/quran/data/translations/en.sahih.by-ayah-id.json");
  const translationRows = translationModule.default as string[];
  const rows: IndexedAyah[] = [];

  for (let ayahId = 1; ayahId <= TOTAL_AYAHS; ayahId += 1) {
    const ayah = getAyahById(ayahId);
    if (!ayah) {
      continue;
    }
    const translation = typeof translationRows[ayahId - 1] === "string" ? translationRows[ayahId - 1] : "";
    const surahName = getSurahInfo(ayah.surahNumber)?.nameTransliteration ?? `Surah ${ayah.surahNumber}`;

    rows.push({
      ayahId: ayah.id,
      surahNumber: ayah.surahNumber,
      ayahNumber: ayah.ayahNumber,
      surahName,
      textUthmani: ayah.textUthmani,
      translation,
      normalizedArabic: normalizeArabic(ayah.textUthmani),
      normalizedTranslation: normalizeTranslation(translation),
    });
  }

  return rows;
}

async function getIndex(): Promise<IndexedAyah[]> {
  if (!indexPromise) {
    indexPromise = buildIndex();
  }
  return indexPromise;
}

function containsAllTokens(text: string, tokens: string[]): boolean {
  for (const token of tokens) {
    if (!text.includes(token)) {
      return false;
    }
  }
  return true;
}

function scoreRow(
  row: IndexedAyah,
  queryArabic: string,
  queryTranslation: string,
  queryTokensArabic: string[],
  queryTokensTranslation: string[],
  scope: QuranSearchScope,
): number {
  let score = 0;

  const checkArabic = scope === "all" || scope === "arabic";
  const checkTranslation = scope === "all" || scope === "translation";

  if (checkArabic && queryArabic) {
    if (row.normalizedArabic.includes(queryArabic)) {
      score += 60;
    }
    if (queryTokensArabic.length > 0 && containsAllTokens(row.normalizedArabic, queryTokensArabic)) {
      score += 35;
    }
    for (const token of queryTokensArabic) {
      if (token.length >= 2 && row.normalizedArabic.includes(token)) {
        score += 8;
      }
    }
  }

  if (checkTranslation && queryTranslation) {
    if (row.normalizedTranslation.includes(queryTranslation)) {
      score += 55;
    }
    if (queryTokensTranslation.length > 0 && containsAllTokens(row.normalizedTranslation, queryTokensTranslation)) {
      score += 30;
    }
    for (const token of queryTokensTranslation) {
      if (token.length >= 2 && row.normalizedTranslation.includes(token)) {
        score += 7;
      }
    }
  }

  if (score > 0 && row.ayahNumber <= 5) {
    score += 2;
  }

  return score;
}

export async function searchQuranAyahsOffline(input: {
  query: string;
  scope?: QuranSearchScope;
  limit?: number;
}): Promise<QuranSearchResult[]> {
  const scope = input.scope ?? "all";
  const limit = Math.max(1, Math.min(80, Math.floor(input.limit ?? 30)));
  const raw = input.query.trim();
  if (!raw) {
    return [];
  }

  const queryArabic = normalizeArabic(raw);
  const queryTranslation = normalizeTranslation(raw);
  const queryTokensArabic = tokenize(queryArabic);
  const queryTokensTranslation = tokenize(queryTranslation);
  if (!queryArabic && !queryTranslation) {
    return [];
  }

  const rows = await getIndex();
  const scored: QuranSearchResult[] = [];

  for (const row of rows) {
    const score = scoreRow(row, queryArabic, queryTranslation, queryTokensArabic, queryTokensTranslation, scope);
    if (score <= 0) {
      continue;
    }
    scored.push({
      ayahId: row.ayahId,
      surahNumber: row.surahNumber,
      ayahNumber: row.ayahNumber,
      surahName: row.surahName,
      textUthmani: row.textUthmani,
      translation: row.translation,
      score,
    });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.ayahId - b.ayahId;
  });

  return scored.slice(0, limit);
}
