import { describe, expect, it } from "vitest";
import { buildQuranResumeAction, resolveNextAction } from "./next-action";

const BASE = {
  openHifzSessions: 0,
  dueHifzReviews: 0,
  quranCursorAyahId: 42,
  quranCursorRef: "2:35",
  currentSurahName: "Al-Baqarah",
};

describe("resolveNextAction", () => {
  it("resumes an interrupted Hifz session before other work", () => {
    expect(resolveNextAction({ ...BASE, openHifzSessions: 1, dueHifzReviews: 12 })).toMatchObject({
      kind: "resume_hifz",
      reason: "open_hifz_session",
      href: "/hifz",
    });
  });

  it("puts due review ahead of reading when no session is open", () => {
    expect(resolveNextAction({ ...BASE, dueHifzReviews: 3 })).toMatchObject({
      kind: "review_hifz",
      reason: "hifz_review_due",
      actionLabel: "Start review",
    });
  });

  it("resumes the exact Qur'an cursor when review is clear", () => {
    expect(resolveNextAction(BASE)).toMatchObject({
      kind: "continue_quran",
      reason: "reading_place_available",
      href: "/quran/read?view=compact&cursor=42",
    });
  });

  it("offers a calm first-reading fallback", () => {
    expect(buildQuranResumeAction({
      quranCursorAyahId: 1,
      quranCursorRef: "1:1",
      currentSurahName: "Al-Fatihah",
    })).toMatchObject({
      kind: "begin_quran",
      reason: "first_reading",
    });
  });
});
