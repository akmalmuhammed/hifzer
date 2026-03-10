import { describe, expect, it } from "vitest";
import { listQuranDataSourcesSorted } from "@/hifzer/quran/source-catalog";
import { getQuranTranslationOption, getQuranTranslationProviderKey } from "@/hifzer/quran/translation-prefs";

describe("quran/source-catalog", () => {
  it("sorts sources by integration effort", () => {
    expect(listQuranDataSourcesSorted().map((source) => source.id)).toEqual([
      "tanzil",
      "quranenc",
      "king-fahd",
      "quranic-arabic-corpus",
      "quranfoundation",
    ]);
  });

  it("returns verified provenance for en.sahih", () => {
    const option = getQuranTranslationOption("en.sahih");
    expect(option?.sourceStatus).toBe("verified");
    expect(getQuranTranslationProviderKey("en.sahih")).toBe("tanzil.en.sahih");
  });

  it("marks bundled non-English translations for source review", () => {
    const option = getQuranTranslationOption("ur.junagarhi");
    expect(option?.sourceStatus).toBe("review_required");
    expect(getQuranTranslationProviderKey("ur.junagarhi")).toBe("local-bundle.ur.junagarhi");
  });
});
