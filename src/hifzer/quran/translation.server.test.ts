import { describe, expect, it } from "vitest";
import translationsByAyahId from "@/hifzer/quran/data/translations/en.sahih.by-ayah-id.json";
import { getSahihTranslationByAyahId, listSahihTranslationsForAyahIds } from "@/hifzer/quran/translation.server";

describe("quran/translation.server", () => {
  it("bundles a full 6236-row translation dataset with no gaps", () => {
    const data = translationsByAyahId as unknown as string[];
    expect(data).toHaveLength(6236);
    for (let idx = 0; idx < data.length; idx += 1) {
      expect(typeof data[idx]).toBe("string");
      expect(data[idx]?.trim().length).toBeGreaterThan(0);
    }
  });

  it("looks up first and last ayah translation", () => {
    const first = getSahihTranslationByAyahId(1);
    const last = getSahihTranslationByAyahId(6236);
    expect(first).toBe("In the name of Allah, the Entirely Merciful, the Especially Merciful.");
    expect(last).toBe('From among the jinn and mankind."');
  });

  it("returns null for out-of-range ayah ids", () => {
    expect(getSahihTranslationByAyahId(0)).toBeNull();
    expect(getSahihTranslationByAyahId(6237)).toBeNull();
  });

  it("returns translation map for requested ayah IDs", () => {
    const result = listSahihTranslationsForAyahIds([1, 2, 6236, 7000, 1]);
    expect(result[1]).toBe("In the name of Allah, the Entirely Merciful, the Especially Merciful.");
    expect(result[2]).toBe("[All] praise is [due] to Allah, Lord of the worlds -");
    expect(result[6236]).toBe('From among the jinn and mankind."');
    expect(result[7000]).toBeUndefined();
    expect(Object.keys(result)).toHaveLength(3);
  });
});
