import { describe, expect, it } from "vitest";
import { buildTodayQueue, missedDaysSince, modeForMissedDays } from "@/hifzer/srs/queue";

describe("srs/queue", () => {
  it("computes missed days from local dates", () => {
    expect(missedDaysSince("2026-02-16", "2026-02-16")).toBe(0);
    expect(missedDaysSince("2026-02-15", "2026-02-16")).toBe(0);
    expect(missedDaysSince("2026-02-14", "2026-02-16")).toBe(1);
    expect(missedDaysSince("2026-02-13", "2026-02-16")).toBe(2);
    expect(missedDaysSince("2026-02-12", "2026-02-16")).toBe(3);
  });

  it("maps missed days to modes", () => {
    expect(modeForMissedDays(0)).toBe("NORMAL");
    expect(modeForMissedDays(1)).toBe("NORMAL");
    expect(modeForMissedDays(2)).toBe("CONSOLIDATION");
    expect(modeForMissedDays(3)).toBe("CATCH_UP");
    expect(modeForMissedDays(10)).toBe("CATCH_UP");
  });

  it("clamps new range to the active surah end", () => {
    const now = new Date(Date.UTC(2026, 1, 16, 12, 0, 0));
    const q = buildTodayQueue(
      {
        activeSurahNumber: 114,
        cursorAyahId: 6234,
        lastCompletedLocalDate: "2026-02-16",
      },
      [],
      now,
    );

    expect(q.newStartAyahId).toBe(6234);
    expect(q.newEndAyahId).toBe(6236);
  });

  it("returns null new range when cursor is past the surah end", () => {
    const now = new Date(Date.UTC(2026, 1, 16, 12, 0, 0));
    const q = buildTodayQueue(
      {
        activeSurahNumber: 114,
        cursorAyahId: 6237,
        lastCompletedLocalDate: "2026-02-16",
      },
      [],
      now,
    );

    expect(q.newStartAyahId).toBe(null);
    expect(q.newEndAyahId).toBe(null);
  });
});

