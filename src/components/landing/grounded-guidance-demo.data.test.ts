import { describe, expect, it } from "vitest";
import { getAyahById, ayahIdFromVerseRef } from "@/hifzer/quran/lookup.server";
import { getSahihTranslationByAyahId } from "@/hifzer/quran/translation.server";
import { LANDING_GUIDANCE_DEMO } from "./grounded-guidance-demo.data";

type DemoVerse = {
  verseKey: string;
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  translation: { text: string } | null;
};

function expectStoredVerseToMatchLocalQuranData(verse: DemoVerse) {
  const ayahId = ayahIdFromVerseRef({
    surahNumber: verse.surahNumber,
    ayahNumber: verse.ayahNumber,
  });

  if (ayahId == null) {
    throw new Error(`Expected ${verse.verseKey} to resolve to a local ayah id.`);
  }

  const ayah = getAyahById(ayahId);

  expect(`${verse.surahNumber}:${verse.ayahNumber}`).toBe(verse.verseKey);
  expect(ayah?.textUthmani).toBe(verse.arabicText);
  expect(getSahihTranslationByAyahId(ayahId)).toBe(verse.translation?.text);
}

describe("landing grounded guidance demo data", () => {
  it("stores a verified explain-this-ayah sample", () => {
    expectStoredVerseToMatchLocalQuranData(LANDING_GUIDANCE_DEMO.currentAyah);
    expect(LANDING_GUIDANCE_DEMO.explain.summary).toContain("patience");
    expect(LANDING_GUIDANCE_DEMO.explain.summary).toContain("prayer");
  });

  it("stores verified ayah matches for the predefined patience prompt", () => {
    expect(LANDING_GUIDANCE_DEMO.promptOptions).toContain(LANDING_GUIDANCE_DEMO.assistant.prompt);
    expect(LANDING_GUIDANCE_DEMO.assistant.matches.length).toBeGreaterThanOrEqual(2);

    for (const match of LANDING_GUIDANCE_DEMO.assistant.matches) {
      expectStoredVerseToMatchLocalQuranData(match);
      expect(match.sources.map((source) => source.kind)).toContain("quran");
    }
  });
});
