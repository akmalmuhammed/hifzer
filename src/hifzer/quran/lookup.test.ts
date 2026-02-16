import { describe, expect, it } from "vitest";
import {
  ayahIdFromVerseRef,
  getJuzInfo,
  getSurahInfo,
  listAyahsForSurah,
  listJuzs,
  listSurahs,
  verseRefFromAyahId,
} from "@/hifzer/quran/lookup.server";

describe("quran/lookup", () => {
  it("maps surah+ayah to global ayahId and back", () => {
    const id = ayahIdFromVerseRef({ surahNumber: 1, ayahNumber: 1 });
    expect(id).toBe(1);

    const ref = verseRefFromAyahId(1);
    expect(ref).toEqual({ surahNumber: 1, ayahNumber: 1 });
  });

  it("has correct boundaries for Surah 1 and Surah 114", () => {
    const fatiha = getSurahInfo(1);
    expect(fatiha?.startAyahId).toBe(1);
    expect(fatiha?.endAyahId).toBe(7);
    expect(fatiha?.ayahCount).toBe(7);

    const nas = getSurahInfo(114);
    expect(nas?.startAyahId).toBe(6231);
    expect(nas?.endAyahId).toBe(6236);
    expect(nas?.ayahCount).toBe(6);
  });

  it("maps the last ayah correctly", () => {
    const id = ayahIdFromVerseRef({ surahNumber: 114, ayahNumber: 6 });
    expect(id).toBe(6236);
    expect(verseRefFromAyahId(6236)).toEqual({ surahNumber: 114, ayahNumber: 6 });
  });

  it("covers all surahs and the full global ayah range contiguously", () => {
    const surahs = listSurahs();
    expect(surahs).toHaveLength(114);

    let expectedStart = 1;
    let totalAyahs = 0;

    for (const surah of surahs) {
      expect(surah.startAyahId).toBe(expectedStart);
      expect(surah.endAyahId - surah.startAyahId + 1).toBe(surah.ayahCount);

      const ayahs = listAyahsForSurah(surah.surahNumber);
      expect(ayahs).toHaveLength(surah.ayahCount);
      expect(ayahs[0]?.id).toBe(surah.startAyahId);
      expect(ayahs[ayahs.length - 1]?.id).toBe(surah.endAyahId);

      expectedStart = surah.endAyahId + 1;
      totalAyahs += surah.ayahCount;
    }

    expect(totalAyahs).toBe(6236);
    expect(expectedStart).toBe(6237);
  });

  it("maps ayahId to verseRef and back for the full canonical range", () => {
    for (let ayahId = 1; ayahId <= 6236; ayahId += 1) {
      const ref = verseRefFromAyahId(ayahId);
      expect(ref).toBeTruthy();
      const roundTrip = ayahIdFromVerseRef({ surahNumber: ref!.surahNumber, ayahNumber: ref!.ayahNumber });
      expect(roundTrip).toBe(ayahId);
    }
  });

  it("builds all 30 juz boundaries over the full ayah range", () => {
    const juzs = listJuzs();
    expect(juzs).toHaveLength(30);
    expect(juzs[0]?.juzNumber).toBe(1);
    expect(juzs[29]?.juzNumber).toBe(30);

    const first = getJuzInfo(1);
    const last = getJuzInfo(30);
    expect(first?.startAyahId).toBe(1);
    expect(last?.endAyahId).toBe(6236);

    let expectedStart = 1;
    for (const juz of juzs) {
      expect(juz.startAyahId).toBe(expectedStart);
      expect(juz.endAyahId - juz.startAyahId + 1).toBe(juz.ayahCount);
      expectedStart = juz.endAyahId + 1;
    }
    expect(expectedStart).toBe(6237);
  });
});
