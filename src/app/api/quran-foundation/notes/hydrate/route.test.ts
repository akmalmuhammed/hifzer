import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  importPrivateJournalEntries: vi.fn(),
  listJournalEntriesFromQuranFoundationNotes: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/hifzer/journal/server", () => ({
  importPrivateJournalEntries: mocks.importPrivateJournalEntries,
  isJournalStorageError: () => false,
}));

vi.mock("@/hifzer/quran-foundation/user-features", () => ({
  listJournalEntriesFromQuranFoundationNotes:
    mocks.listJournalEntriesFromQuranFoundationNotes,
}));

vi.mock("@/hifzer/quran-foundation/types", () => ({
  isQuranFoundationError: () => false,
}));

import { POST } from "./route";

describe("Quran Foundation journal hydration route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "clerk-a" });
  });

  it("imports 201 remote notes in bounded batches and reports the final total", async () => {
    const remoteEntries = Array.from({ length: 201 }, (_, index) => ({
      id: `qf-note:${index}`,
      clientEntryId: `qf-note:${index}`,
      type: "reflection" as const,
      title: `Remote note ${index}`,
      content: `Body ${index}`,
      tags: [],
      pinned: false,
      createdAt: "2026-09-05T00:00:00.000Z",
      updatedAt: "2026-09-05T00:00:00.000Z",
    }));
    mocks.listJournalEntriesFromQuranFoundationNotes.mockResolvedValue(remoteEntries);
    mocks.importPrivateJournalEntries
      .mockResolvedValueOnce({ entries: remoteEntries.slice(0, 200), acknowledgements: [] })
      .mockResolvedValueOnce({ entries: remoteEntries, acknowledgements: [] });

    const response = await POST();

    expect(response.status).toBe(200);
    expect(mocks.importPrivateJournalEntries).toHaveBeenCalledTimes(2);
    expect(mocks.importPrivateJournalEntries.mock.calls.map((call) => call[1].length))
      .toEqual([200, 1]);
    expect(mocks.importPrivateJournalEntries).toHaveBeenNthCalledWith(
      1,
      "clerk-a",
      remoteEntries.slice(0, 200),
      "clerk-a",
    );
    expect(mocks.importPrivateJournalEntries).toHaveBeenNthCalledWith(
      2,
      "clerk-a",
      remoteEntries.slice(200),
      "clerk-a",
    );
    await expect(response.json()).resolves.toEqual({
      ok: true,
      result: {
        totalRemote: 201,
        totalLocal: 201,
      },
    });
  });
});
