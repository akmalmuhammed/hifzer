import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class MockJournalStorageError extends Error {
    readonly status: number;
    readonly code: string;
    readonly authoritativeEntry?: unknown;

    constructor(message: string, status: number, code: string, authoritativeEntry?: unknown) {
      super(message);
      this.status = status;
      this.code = code;
      this.authoritativeEntry = authoritativeEntry;
    }
  }

  return {
    MockJournalStorageError,
    resolveClerkUserIdForServer: vi.fn(),
    listPrivateJournalEntries: vi.fn(),
    savePrivateJournalEntry: vi.fn(),
    getPrivateJournalEntry: vi.fn(),
    deletePrivateJournalEntry: vi.fn(),
    importPrivateJournalEntries: vi.fn(),
  };
});

vi.mock("@/hifzer/testing/request-auth", () => ({
  resolveClerkUserIdForServer: mocks.resolveClerkUserIdForServer,
}));

vi.mock("@/hifzer/journal/server", () => ({
  JournalStorageError: mocks.MockJournalStorageError,
  isJournalStorageError: (error: unknown) => error instanceof mocks.MockJournalStorageError,
  listPrivateJournalEntries: mocks.listPrivateJournalEntries,
  savePrivateJournalEntry: mocks.savePrivateJournalEntry,
  getPrivateJournalEntry: mocks.getPrivateJournalEntry,
  deletePrivateJournalEntry: mocks.deletePrivateJournalEntry,
  importPrivateJournalEntries: mocks.importPrivateJournalEntries,
}));

import { POST as saveJournalEntry } from "@/app/api/journal/route";
import { DELETE as deleteJournalEntry } from "@/app/api/journal/[id]/route";
import { POST as importJournalEntries } from "@/app/api/journal/import/route";

describe("journal mutation routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveClerkUserIdForServer.mockResolvedValue("clerk-a");
  });

  it("forwards version, mutation, stable entry, and owner fields on save", async () => {
    mocks.savePrivateJournalEntry.mockResolvedValue({ id: "server-1", version: 2 });
    const request = new Request("https://hifzer.test/api/journal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "local-1",
        ownerId: "clerk-a",
        mutationType: "update",
        expectedVersion: 1,
        clientMutationId: "mutation-1",
        content: "Private content",
      }),
    });

    const response = await saveJournalEntry(request);

    expect(response.status).toBe(200);
    expect(mocks.savePrivateJournalEntry).toHaveBeenCalledWith("clerk-a", expect.objectContaining({
      id: "local-1",
      ownerId: "clerk-a",
      mutationType: "update",
      expectedVersion: 1,
      clientMutationId: "mutation-1",
      content: "Private content",
      title: undefined,
      blocks: undefined,
      linkedAyah: undefined,
      linkedDua: undefined,
      duaStatus: undefined,
      autoDeleteAt: undefined,
    }));
  });

  it("forwards explicit empty text without turning omitted text into a clear", async () => {
    mocks.savePrivateJournalEntry.mockResolvedValue({ id: "server-1", version: 2 });
    const request = new Request("https://hifzer.test/api/journal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "server-1",
        expectedVersion: 1,
        title: "",
      }),
    });

    const response = await saveJournalEntry(request);

    expect(response.status).toBe(200);
    expect(mocks.savePrivateJournalEntry).toHaveBeenCalledWith("clerk-a", expect.objectContaining({
      title: "",
      content: undefined,
    }));
  });

  it("serializes the authoritative owner-scoped entry for a version conflict", async () => {
    const authoritativeEntry = { id: "server-1", version: 4, content: "Account copy" };
    mocks.savePrivateJournalEntry.mockRejectedValue(new mocks.MockJournalStorageError(
      "Changed elsewhere",
      409,
      "VERSION_CONFLICT",
      authoritativeEntry,
    ));
    const request = new Request("https://hifzer.test/api/journal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "server-1", expectedVersion: 3, content: "Local copy" }),
    });

    const response = await saveJournalEntry(request);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Changed elsewhere",
      code: "VERSION_CONFLICT",
      authoritativeEntry,
    });
  });

  it("forwards owner, version, and mutation id from a delete request", async () => {
    mocks.deletePrivateJournalEntry.mockResolvedValue(undefined);
    const request = new Request(
      "https://hifzer.test/api/journal/local-1?ownerId=clerk-a&expectedVersion=7&clientMutationId=delete-1",
      { method: "DELETE" },
    );

    const response = await deleteJournalEntry(request, { params: Promise.resolve({ id: "local-1" }) });

    expect(response.status).toBe(200);
    expect(mocks.deletePrivateJournalEntry).toHaveBeenCalledWith("clerk-a", "local-1", {
      ownerId: "clerk-a",
      expectedVersion: 7,
      clientMutationId: "delete-1",
    });
  });

  it("forwards import owner intent and serializes an authenticated-owner mismatch", async () => {
    mocks.importPrivateJournalEntries.mockRejectedValue(new mocks.MockJournalStorageError(
      "This journal change belongs to a different signed-in account.",
      409,
      "OWNER_MISMATCH",
    ));
    const entries = [{ id: "legacy-a", content: "Private" }];
    const request = new Request("https://hifzer.test/api/journal/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ownerId: "clerk-stale", entries }),
    });

    const response = await importJournalEntries(request);

    expect(mocks.importPrivateJournalEntries).toHaveBeenCalledWith(
      "clerk-a",
      entries,
      "clerk-stale",
    );
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "This journal change belongs to a different signed-in account.",
      code: "OWNER_MISMATCH",
    });
  });

  it("serializes explicit per-source import acknowledgements", async () => {
    const entries = [{ id: "server-1", originEntryId: "legacy-a", content: "Private" }];
    const acknowledgements = [{
      sourceEntryId: "legacy-a",
      status: "created",
      entry: entries[0],
    }];
    mocks.importPrivateJournalEntries.mockResolvedValue({ entries, acknowledgements });
    const request = new Request("https://hifzer.test/api/journal/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ownerId: "clerk-a",
        entries: [{ id: "legacy-a", content: "Private" }],
      }),
    });

    const response = await importJournalEntries(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      entries,
      acknowledgements,
    });
  });
});
