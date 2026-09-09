import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Qur'an completion content policy", () => {
  it("does not use devotional ranking or locked-status language", () => {
    const source = readFileSync(new URL("./quran-completion-progress.tsx", import.meta.url), "utf8");
    for (const prohibited of ["Khatmah rank", "unlock rank", "Maqam Al-", "Ahl Al-Qur'an Path", "Talib Al-Qur'an"]) {
      expect(source).not.toContain(prohibited);
    }
    expect(source).toContain("Private reading history");
    expect(source).toContain("not a measure of devotion or spiritual standing");
  });
});
