import { describe, expect, it } from "vitest";
import { ayahIdsByDate, distinctQuranAyahs } from "./read-progress.logic";

describe("Qur'an read-progress logic", () => {
  it("deduplicates ayahs across mixed browse sources", () => {
    const rows = [
      { ayahId: 1, surahNumber: 1, localDate: "2026-03-10", source: "READER_VIEW" as const },
      { ayahId: 1, surahNumber: 1, localDate: "2026-03-10", source: "AUDIO_PLAY" as const },
      { ayahId: 2, surahNumber: 1, localDate: "2026-03-10", source: "BACKFILL" as const },
    ];

    expect(distinctQuranAyahs(rows)).toEqual([
      { ayahId: 1, surahNumber: 1 },
      { ayahId: 2, surahNumber: 1 },
    ]);
  });

  it("groups daily ayah sets by source without mixing reader and audio lanes", () => {
    const rows = [
      { ayahId: 1, surahNumber: 1, localDate: "2026-03-10", source: "READER_VIEW" as const },
      { ayahId: 2, surahNumber: 1, localDate: "2026-03-10", source: "AUDIO_PLAY" as const },
      { ayahId: 3, surahNumber: 1, localDate: "2026-03-11", source: "AUDIO_PLAY" as const },
      { ayahId: 4, surahNumber: 1, localDate: "2026-03-11", source: "BACKFILL" as const },
    ];

    const audioOnly = ayahIdsByDate(rows, { sources: ["AUDIO_PLAY"] });
    const readerOnly = ayahIdsByDate(rows, { sources: ["READER_VIEW", "BACKFILL"] });

    expect(Array.from(audioOnly.get("2026-03-10") ?? [])).toEqual([2]);
    expect(Array.from(audioOnly.get("2026-03-11") ?? [])).toEqual([3]);
    expect(Array.from(readerOnly.get("2026-03-10") ?? [])).toEqual([1]);
    expect(Array.from(readerOnly.get("2026-03-11") ?? [])).toEqual([4]);
  });
});
