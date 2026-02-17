import { describe, expect, it } from "vitest";
import { buildTranslationByAyahId, parseTanzilTranslationRows } from "../../../scripts/generate-sahih-translation.mjs";

describe("quran/translation generator", () => {
  it("parses verse rows and ignores comment footer lines", () => {
    const raw = [
      "1|1|In the name of Allah, the Entirely Merciful, the Especially Merciful.",
      "1|2|[All] praise is [due] to Allah, Lord of the worlds -",
      "",
      "# --------------------------------------------------------------------",
      "#  Quran Translation",
      "#  Name: Saheeh International",
    ].join("\n");

    const rows = parseTanzilTranslationRows(raw);
    expect(rows).toEqual([
      {
        surahNumber: 1,
        ayahNumber: 1,
        text: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
      },
      {
        surahNumber: 1,
        ayahNumber: 2,
        text: "[All] praise is [due] to Allah, Lord of the worlds -",
      },
    ]);
  });

  it("builds ayah-id-indexed translation array", () => {
    const ayahs = [
      { id: 1, surahNumber: 1, ayahNumber: 1 },
      { id: 2, surahNumber: 1, ayahNumber: 2 },
    ];
    const rows = [
      { surahNumber: 1, ayahNumber: 1, text: "A" },
      { surahNumber: 1, ayahNumber: 2, text: "B" },
    ];
    expect(buildTranslationByAyahId(rows, ayahs)).toEqual(["A", "B"]);
  });

  it("fails when translation row count is incorrect", () => {
    const ayahs = [
      { id: 1, surahNumber: 1, ayahNumber: 1 },
      { id: 2, surahNumber: 1, ayahNumber: 2 },
    ];
    const rows = [{ surahNumber: 1, ayahNumber: 1, text: "A" }];
    expect(() => buildTranslationByAyahId(rows, ayahs)).toThrow(/Expected 2 translation rows/);
  });

  it("fails on rows that do not map to local ayah seed", () => {
    const ayahs = [
      { id: 1, surahNumber: 1, ayahNumber: 1 },
      { id: 2, surahNumber: 1, ayahNumber: 2 },
    ];
    const rows = [
      { surahNumber: 1, ayahNumber: 1, text: "A" },
      { surahNumber: 99, ayahNumber: 99, text: "B" },
    ];
    expect(() => buildTranslationByAyahId(rows, ayahs)).toThrow(/does not map to local ayah seed/);
  });
});
