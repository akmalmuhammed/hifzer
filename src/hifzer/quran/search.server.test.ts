import { describe, expect, it } from "vitest";
import { searchQuranAyahs } from "@/hifzer/quran/search.server";

describe("quran/search.server", () => {
  it("returns empty list for blank query", () => {
    expect(searchQuranAyahs({ query: "" })).toEqual([]);
    expect(searchQuranAyahs({ query: "   " })).toEqual([]);
  });

  it("finds results in translation scope", () => {
    const results = searchQuranAyahs({ query: "merciful", scope: "translation", limit: 20 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((row) => row.ayahId === 1)).toBe(true);
  });

  it("finds results in arabic scope with normalized matching", () => {
    const results = searchQuranAyahs({ query: "الرحمن", scope: "arabic", limit: 20 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((row) => row.ayahId === 1)).toBe(true);
  });
});
