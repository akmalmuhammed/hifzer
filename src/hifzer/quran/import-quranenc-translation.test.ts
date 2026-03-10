import { describe, expect, it } from "vitest";
import { parseQuranEncRows } from "../../../scripts/import-quranenc-translation.mjs";

describe("scripts/import-quranenc-translation", () => {
  it("parses JSON rows with verse keys", () => {
    const rows = parseQuranEncRows(JSON.stringify([
      { verse_key: "1:1", text: "In the Name of Allah" },
      { verse_key: "1:2", translation: "All praise is due to Allah" },
    ]));

    expect(rows).toEqual([
      { surahNumber: 1, ayahNumber: 1, text: "In the Name of Allah" },
      { surahNumber: 1, ayahNumber: 2, text: "All praise is due to Allah" },
    ]);
  });

  it("parses delimited rows with explicit surah and ayah columns", () => {
    const rows = parseQuranEncRows([
      "surah|ayah|translation",
      "2|255|Allah - there is no deity except Him",
      "2|256|There shall be no compulsion in religion",
    ].join("\n"));

    expect(rows).toEqual([
      { surahNumber: 2, ayahNumber: 255, text: "Allah - there is no deity except Him" },
      { surahNumber: 2, ayahNumber: 256, text: "There shall be no compulsion in religion" },
    ]);
  });

  it("rejects JSON payloads without a usable row array", () => {
    expect(() => parseQuranEncRows(JSON.stringify({ hello: "world" }))).toThrow(
      /does not contain an array/i,
    );
  });
});
