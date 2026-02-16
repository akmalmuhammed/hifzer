import ayahsJson from "@/hifzer/quran/data/ayahs.full.json";
import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";
import type { Ayah, AyahId, JuzInfo, SurahInfo, VerseRef } from "@/hifzer/quran/types";

const ayahs = ayahsJson as unknown as Ayah[];

function buildJuzList(): JuzInfo[] {
  const byJuz = new Map<number, { startAyahId: number; endAyahId: number; ayahCount: number }>();
  for (const ayah of ayahs) {
    const row = byJuz.get(ayah.juzNumber);
    if (!row) {
      byJuz.set(ayah.juzNumber, { startAyahId: ayah.id, endAyahId: ayah.id, ayahCount: 1 });
      continue;
    }
    row.endAyahId = ayah.id;
    row.ayahCount += 1;
  }
  return Array.from(byJuz.entries())
    .map(([juzNumber, row]) => ({
      juzNumber,
      startAyahId: row.startAyahId,
      endAyahId: row.endAyahId,
      ayahCount: row.ayahCount,
    }))
    .sort((a, b) => a.juzNumber - b.juzNumber);
}

const juzList = buildJuzList();

export function getAyahById(ayahId: AyahId): Ayah | null {
  const id = Number(ayahId);
  if (!Number.isFinite(id) || id < 1 || id > ayahs.length) {
    return null;
  }
  // Seed data is ordered by global ayah id.
  const candidate = ayahs[id - 1];
  return candidate && candidate.id === id ? candidate : null;
}

export function getSurahInfo(surahNumber: number): SurahInfo | null {
  if (!Number.isFinite(surahNumber)) {
    return null;
  }
  const row = SURAH_INDEX.find((s) => s.surahNumber === surahNumber);
  if (!row) {
    return null;
  }
  return {
    surahNumber: row.surahNumber,
    startAyahId: row.startAyahId,
    endAyahId: row.endAyahId,
    ayahCount: row.ayahCount,
    nameArabic: row.nameArabic,
    nameTransliteration: row.nameTransliteration,
    nameEnglish: row.nameEnglish,
    revelationType: row.revelationType,
  };
}

export function listAyahsForSurah(surahNumber: number): Ayah[] {
  const surah = getSurahInfo(surahNumber);
  if (!surah) {
    return [];
  }
  return ayahs.slice(surah.startAyahId - 1, surah.endAyahId);
}

export function listJuzs(): JuzInfo[] {
  return juzList;
}

export function getJuzInfo(juzNumber: number): JuzInfo | null {
  if (!Number.isFinite(juzNumber)) {
    return null;
  }
  return juzList.find((j) => j.juzNumber === juzNumber) ?? null;
}

export function listAyahsForJuz(juzNumber: number): Ayah[] {
  const juz = getJuzInfo(juzNumber);
  if (!juz) {
    return [];
  }
  return ayahs.slice(juz.startAyahId - 1, juz.endAyahId);
}

export function ayahIdFromVerseRef(ref: VerseRef): AyahId | null {
  const surahNumber = Number(ref.surahNumber);
  const ayahNumber = Number(ref.ayahNumber);
  if (!Number.isFinite(surahNumber) || !Number.isFinite(ayahNumber) || ayahNumber < 1) {
    return null;
  }
  const surah = getSurahInfo(surahNumber);
  if (!surah || ayahNumber > surah.ayahCount) {
    return null;
  }
  return (surah.startAyahId + (ayahNumber - 1)) as AyahId;
}

export function verseRefFromAyahId(ayahId: AyahId): VerseRef | null {
  const ayah = getAyahById(ayahId);
  if (!ayah) {
    return null;
  }
  return { surahNumber: ayah.surahNumber, ayahNumber: ayah.ayahNumber };
}
