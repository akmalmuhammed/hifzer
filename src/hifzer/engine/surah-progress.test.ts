import { describe, expect, it } from "vitest";
import { nextStartPointIfSurahCompleted } from "@/hifzer/engine/surah-progress";

describe("engine/surah-progress", () => {
  it("keeps the current surah while the cursor is still inside it", () => {
    expect(nextStartPointIfSurahCompleted({
      activeSurahNumber: 1,
      cursorAyahId: 7,
    })).toBeNull();
  });

  it("advances to the next surah once the cursor passes the end ayah", () => {
    expect(nextStartPointIfSurahCompleted({
      activeSurahNumber: 1,
      cursorAyahId: 8,
    })).toEqual({
      activeSurahNumber: 2,
      cursorAyahId: 8,
    });
  });

  it("stops advancing after the final surah", () => {
    expect(nextStartPointIfSurahCompleted({
      activeSurahNumber: 114,
      cursorAyahId: 6237,
    })).toBeNull();
  });
});
