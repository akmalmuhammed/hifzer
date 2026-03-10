import { describe, expect, it } from "vitest";
import { buildMeaningFocusWords, normalizeArabicText, scoreArabicSimilarity } from "@/hifzer/recitation/intelligence.server";

describe("recitation/intelligence", () => {
  it("normalizes Arabic text by removing tashkeel", () => {
    expect(normalizeArabicText("قُلْ هُوَ ٱللَّهُ أَحَدٌ")).toBe("قل هو ٱلله أحد");
  });

  it("scores similar ayahs higher than unrelated text", () => {
    const similar = scoreArabicSimilarity("قل هو الله احد", "الله الصمد لم يلد");
    const different = scoreArabicSimilarity("قل هو الله احد", "تبت يدا أبي لهب وتب");

    expect(similar).toBeGreaterThan(different);
  });

  it("extracts meaning focus words without common English stopwords", () => {
    const words = buildMeaningFocusWords([
      "Guide us to the straight path",
      "The path of those upon whom You have bestowed favor",
    ]);

    expect(words).toEqual(expect.arrayContaining(["path", "guide"]));
    expect(words).not.toContain("the");
  });
});
