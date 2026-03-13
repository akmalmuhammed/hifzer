import { describe, expect, it } from "vitest";
import { summarizeHifzSurahProgress, summarizeQuranSurahProgress } from "@/hifzer/progress/surah-progress.server";
import { getSurahInfo } from "@/hifzer/quran/lookup.server";

describe("surah progress summaries", () => {
  it("derives Quran completion counts and current surah percentage", () => {
    const alFatiha = getSurahInfo(1);
    const aliImran = getSurahInfo(3);
    if (!alFatiha || !aliImran) {
      throw new Error("Missing surah fixtures.");
    }

    const items = summarizeQuranSurahProgress({
      events: [
        ...Array.from({ length: alFatiha.ayahCount }, (_, index) => ({
          ayahId: alFatiha.startAyahId + index,
          surahNumber: 1,
          localDate: "2026-03-01",
          lastSeenAt: new Date(`2026-03-01T00:00:${String(index).padStart(2, "0")}Z`),
        })),
        {
          ayahId: alFatiha.endAyahId,
          surahNumber: 1,
          localDate: "2026-03-08",
          lastSeenAt: new Date("2026-03-08T00:00:00Z"),
        },
      ],
      quranActiveSurahNumber: 3,
      quranCursorAyahId: aliImran.startAyahId + 99,
    });

    const current = items.find((item) => item.surahNumber === 3);
    const completed = items.find((item) => item.surahNumber === 1);

    expect(current?.isCurrent).toBe(true);
    expect(current?.completionPct).toBe(Math.round((100 / aliImran.ayahCount) * 100));
    expect(completed?.isCompleted).toBe(true);
    expect(completed?.completionCount).toBe(2);
  });

  it("derives Hifz current progress from cursor and completed surahs from touched ayahs", () => {
    const alFatiha = getSurahInfo(1);
    const alBaqarah = getSurahInfo(2);
    if (!alFatiha || !alBaqarah) {
      throw new Error("Missing surah fixtures.");
    }

    const fatihaAyahs = Array.from({ length: alFatiha.ayahCount }, (_, index) => ({
      ayahId: alFatiha.startAyahId + index,
      surahNumber: 1,
      createdAt: new Date(`2026-03-01T00:00:${String(index).padStart(2, "0")}Z`),
    }));

    const items = summarizeHifzSurahProgress({
      events: fatihaAyahs,
      activeSurahNumber: 2,
      cursorAyahId: alBaqarah.startAyahId + 4,
    });

    const current = items.find((item) => item.surahNumber === 2);
    const completed = items.find((item) => item.surahNumber === 1);

    expect(current?.isCurrent).toBe(true);
    expect(current?.completedAyahCount).toBe(4);
    expect(current?.completionPct).toBe(Math.round((4 / alBaqarah.ayahCount) * 100));
    expect(completed?.isCompleted).toBe(true);
    expect(completed?.completionCount).toBe(1);
  });
});
