import "server-only";

import ayahsJson from "@/hifzer/quran/data/ayahs.full.json";
import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";
import type { Ayah, AyahId, JuzInfo, SurahInfo, VerseRef } from "@/hifzer/quran/types";

type QuranLookup = {
  ayahs: Ayah[];
  ayahById: Map<AyahId, Ayah>;
  ayahIdBySurahAyah: Map<string, AyahId>;
  surahInfoByNumber: Map<number, SurahInfo>;
  ayahsBySurah: Map<number, Ayah[]>;
  juzInfoByNumber: Map<number, JuzInfo>;
  ayahsByJuz: Map<number, Ayah[]>;
};

let cached: QuranLookup | null = null;

export type AyahFilters = {
  surahNumber?: number;
  juzNumber?: number;
  ayahId?: number;
};

function keyForSurahAyah(surahNumber: number, ayahNumber: number): string {
  return `${surahNumber}:${ayahNumber}`;
}

function buildLookup(): QuranLookup {
  const ayahs = ayahsJson as unknown as Ayah[];

  const ayahById = new Map<AyahId, Ayah>();
  const ayahIdBySurahAyah = new Map<string, AyahId>();
  const ayahsBySurah = new Map<number, Ayah[]>();
  const ayahsByJuz = new Map<number, Ayah[]>();

  for (const ayah of ayahs) {
    ayahById.set(ayah.id, ayah);
    ayahIdBySurahAyah.set(keyForSurahAyah(ayah.surahNumber, ayah.ayahNumber), ayah.id);

    const list = ayahsBySurah.get(ayah.surahNumber) ?? [];
    list.push(ayah);
    ayahsBySurah.set(ayah.surahNumber, list);

    const juzList = ayahsByJuz.get(ayah.juzNumber) ?? [];
    juzList.push(ayah);
    ayahsByJuz.set(ayah.juzNumber, juzList);
  }

  const surahInfoByNumber = new Map<number, SurahInfo>();
  for (const row of SURAH_INDEX) {
    surahInfoByNumber.set(row.surahNumber, {
      surahNumber: row.surahNumber,
      startAyahId: row.startAyahId,
      endAyahId: row.endAyahId,
      ayahCount: row.ayahCount,
      nameArabic: row.nameArabic,
      nameTransliteration: row.nameTransliteration,
      nameEnglish: row.nameEnglish,
      revelationType: row.revelationType,
    });
  }

  const juzInfoByNumber = new Map<number, JuzInfo>();
  for (const [juzNumber, list] of ayahsByJuz.entries()) {
    const first = list[0];
    const last = list[list.length - 1];
    if (!first || !last) {
      continue;
    }
    juzInfoByNumber.set(juzNumber, {
      juzNumber,
      startAyahId: first.id,
      endAyahId: last.id,
      ayahCount: list.length,
    });
  }

  return { ayahs, ayahById, ayahIdBySurahAyah, surahInfoByNumber, ayahsBySurah, juzInfoByNumber, ayahsByJuz };
}

export function getQuranLookup(): QuranLookup {
  if (cached) {
    return cached;
  }
  cached = buildLookup();
  return cached;
}

export function listAllAyahs(): Ayah[] {
  const { ayahs } = getQuranLookup();
  return ayahs;
}

export function listSurahs(): SurahInfo[] {
  const { surahInfoByNumber } = getQuranLookup();
  return Array.from(surahInfoByNumber.values()).sort((a, b) => a.surahNumber - b.surahNumber);
}

export function getAyahById(ayahId: AyahId): Ayah | null {
  const id = Number(ayahId);
  if (!Number.isFinite(id)) {
    return null;
  }
  const { ayahById } = getQuranLookup();
  return ayahById.get(id) ?? null;
}

export function getSurahInfo(surahNumber: number): SurahInfo | null {
  if (!Number.isFinite(surahNumber)) {
    return null;
  }
  const { surahInfoByNumber } = getQuranLookup();
  return surahInfoByNumber.get(surahNumber) ?? null;
}

export function listAyahsForSurah(surahNumber: number): Ayah[] {
  const { ayahsBySurah } = getQuranLookup();
  return ayahsBySurah.get(surahNumber) ?? [];
}

export function listJuzs(): JuzInfo[] {
  const { juzInfoByNumber } = getQuranLookup();
  return Array.from(juzInfoByNumber.values()).sort((a, b) => a.juzNumber - b.juzNumber);
}

export function getJuzInfo(juzNumber: number): JuzInfo | null {
  if (!Number.isFinite(juzNumber)) {
    return null;
  }
  const { juzInfoByNumber } = getQuranLookup();
  return juzInfoByNumber.get(juzNumber) ?? null;
}

export function listAyahsForJuz(juzNumber: number): Ayah[] {
  const { ayahsByJuz } = getQuranLookup();
  return ayahsByJuz.get(juzNumber) ?? [];
}

export function filterAyahs(filters: AyahFilters): Ayah[] {
  const { surahNumber, juzNumber, ayahId } = filters;
  return listAllAyahs().filter((ayah) => {
    if (surahNumber != null && ayah.surahNumber !== surahNumber) {
      return false;
    }
    if (juzNumber != null && ayah.juzNumber !== juzNumber) {
      return false;
    }
    if (ayahId != null && ayah.id !== ayahId) {
      return false;
    }
    return true;
  });
}

export function resolveCompactCursorAyah(
  ayahs: Ayah[],
  cursorAyahId?: number,
): { current: Ayah | null; index: number; prevAyahId: number | null; nextAyahId: number | null } {
  if (!ayahs.length) {
    return { current: null, index: -1, prevAyahId: null, nextAyahId: null };
  }

  const rawIndex = cursorAyahId == null ? -1 : ayahs.findIndex((ayah) => ayah.id === cursorAyahId);
  const index = rawIndex >= 0 ? rawIndex : 0;
  const current = ayahs[index] ?? null;
  const prevAyahId = index > 0 ? (ayahs[index - 1]?.id ?? null) : null;
  const nextAyahId = index < ayahs.length - 1 ? (ayahs[index + 1]?.id ?? null) : null;
  return { current, index, prevAyahId, nextAyahId };
}

export function ayahIdFromVerseRef(ref: VerseRef): AyahId | null {
  const surahNumber = Number(ref.surahNumber);
  const ayahNumber = Number(ref.ayahNumber);
  if (!Number.isFinite(surahNumber) || !Number.isFinite(ayahNumber)) {
    return null;
  }
  const { ayahIdBySurahAyah } = getQuranLookup();
  return ayahIdBySurahAyah.get(keyForSurahAyah(surahNumber, ayahNumber)) ?? null;
}

export function verseRefFromAyahId(ayahId: AyahId): VerseRef | null {
  const id = Number(ayahId);
  if (!Number.isFinite(id)) {
    return null;
  }
  const { ayahById } = getQuranLookup();
  const ayah = ayahById.get(id);
  if (!ayah) {
    return null;
  }
  return { surahNumber: ayah.surahNumber, ayahNumber: ayah.ayahNumber };
}
