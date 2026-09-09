import { describe, expect, it } from "vitest";
import { resolveJournalAutoDeleteAt } from "./draft-policy";

describe("journal draft policy", () => {
  const now = new Date("2026-09-05T12:00:00.000Z");

  it("keeps an existing repentance deadline anchored to its creation time", () => {
    expect(resolveJournalAutoDeleteAt({
      createdAt: "2026-09-04T12:00:00.000Z",
      preset: "7",
      now,
    })).toBe("2026-09-11T12:00:00.000Z");
  });

  it("anchors a new or invalidly dated draft to the current time", () => {
    expect(resolveJournalAutoDeleteAt({ createdAt: null, preset: "3", now }))
      .toBe("2026-09-08T12:00:00.000Z");
    expect(resolveJournalAutoDeleteAt({ createdAt: "not-a-date", preset: "1", now }))
      .toBe("2026-09-06T12:00:00.000Z");
  });

  it("returns no deadline for the keep-it option", () => {
    expect(resolveJournalAutoDeleteAt({
      createdAt: "2026-09-04T12:00:00.000Z",
      preset: "",
      now,
    })).toBeNull();
  });
});
