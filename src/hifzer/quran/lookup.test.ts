import { describe, expect, it } from "vitest";
import {
  ayahIdFromVerseRef,
  filterAyahs,
  getJuzInfo,
  getSurahInfo,
  listAllAyahs,
  listAyahsForSurah,
  listJuzs,
  listSurahs,
  resolveCompactCursorAyah,
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

  it("filters by surah only", () => {
    const out = filterAyahs({ surahNumber: 1 });
    expect(out).toHaveLength(7);
    expect(out[0]?.id).toBe(1);
    expect(out[6]?.id).toBe(7);
  });

  it("filters by juz only", () => {
    const juz1 = getJuzInfo(1);
    const out = filterAyahs({ juzNumber: 1 });
    expect(out).toHaveLength(juz1?.ayahCount ?? 0);
    expect(out[0]?.id).toBe(juz1?.startAyahId);
    expect(out[out.length - 1]?.id).toBe(juz1?.endAyahId);
  });

  it("filters by global ayah id only", () => {
    const out = filterAyahs({ ayahId: 255 });
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe(255);
  });

  it("intersects surah + juz filters", () => {
    const out = filterAyahs({ surahNumber: 1, juzNumber: 1 });
    expect(out).toHaveLength(7);
    expect(out.every((ayah) => ayah.surahNumber === 1 && ayah.juzNumber === 1)).toBe(true);
  });

  it("returns empty when surah + juz intersection has no match", () => {
    const out = filterAyahs({ surahNumber: 114, juzNumber: 1 });
    expect(out).toHaveLength(0);
  });

  it("intersects ayah id with other filters", () => {
    const all = listAllAyahs();
    const target = all[255];
    expect(target).toBeTruthy();

    const matched = filterAyahs({
      surahNumber: target!.surahNumber,
      juzNumber: target!.juzNumber,
      ayahId: target!.id,
    });
    expect(matched).toHaveLength(1);
    expect(matched[0]?.id).toBe(target!.id);

    const noMatch = filterAyahs({
      surahNumber: target!.surahNumber + 1,
      ayahId: target!.id,
    });
    expect(noMatch).toHaveLength(0);
  });

  it("resolves compact cursor for first, middle, and last item", () => {
    const ayahs = filterAyahs({ surahNumber: 1 });
    const first = resolveCompactCursorAyah(ayahs, ayahs[0]?.id);
    expect(first.index).toBe(0);
    expect(first.prevAyahId).toBeNull();
    expect(first.nextAyahId).toBe(ayahs[1]?.id ?? null);

    const middle = resolveCompactCursorAyah(ayahs, ayahs[3]?.id);
    expect(middle.index).toBe(3);
    expect(middle.prevAyahId).toBe(ayahs[2]?.id ?? null);
    expect(middle.nextAyahId).toBe(ayahs[4]?.id ?? null);

    const last = resolveCompactCursorAyah(ayahs, ayahs[ayahs.length - 1]?.id);
    expect(last.index).toBe(ayahs.length - 1);
    expect(last.prevAyahId).toBe(ayahs[ayahs.length - 2]?.id ?? null);
    expect(last.nextAyahId).toBeNull();
  });

  it("resets compact cursor to first when cursor is outside filtered set", () => {
    const ayahs = filterAyahs({ surahNumber: 1 });
    const out = resolveCompactCursorAyah(ayahs, 9999);
    expect(out.current?.id).toBe(ayahs[0]?.id);
    expect(out.index).toBe(0);
  });
});
