import { describe, expect, it } from "vitest";
import type { JournalEntry } from "@/hifzer/journal/local-store";
import { resolveJournalRemoteNoteBody } from "./user-features";

function createEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: "journal-1",
    version: 2,
    type: "reflection",
    title: "",
    content: "",
    blocks: [{ id: "body", kind: "text", content: "" }],
    tags: [],
    pinned: false,
    createdAt: "2026-09-05T00:00:00.000Z",
    updatedAt: "2026-09-05T00:01:00.000Z",
    linkedAyah: null,
    linkedDua: null,
    duaStatus: null,
    autoDeleteAt: null,
    ...overrides,
  };
}

describe("Quran.com journal note representation", () => {
  it("replaces a cleared linked note with an explicit non-sensitive marker", () => {
    expect(resolveJournalRemoteNoteBody(createEntry(), "qf-note:remote-1"))
      .toBe("Cleared in Hifzer.");
  });

  it("does not create a remote note for a never-linked empty entry", () => {
    expect(resolveJournalRemoteNoteBody(createEntry(), null)).toBeNull();
  });

  it("represents short non-empty edits instead of leaving stale remote text", () => {
    expect(resolveJournalRemoteNoteBody(createEntry({ content: "A" }), "qf-note:remote-1"))
      .toBe("Hifzer: A");
  });
});
