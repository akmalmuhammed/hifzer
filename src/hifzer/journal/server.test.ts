import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: vi.fn(),
  dbConfigured: vi.fn(() => true),
  getOrCreateUserProfile: vi.fn(),
  syncJournalEntryNoteToQuranFoundation: vi.fn(),
  deleteJournalEntryNoteFromQuranFoundation: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: mocks.db,
  dbConfigured: mocks.dbConfigured,
}));

vi.mock("@/hifzer/profile/server", () => ({
  getOrCreateUserProfile: mocks.getOrCreateUserProfile,
}));

vi.mock("@/hifzer/quran-foundation/user-features", () => ({
  syncJournalEntryNoteToQuranFoundation: mocks.syncJournalEntryNoteToQuranFoundation,
  deleteJournalEntryNoteFromQuranFoundation: mocks.deleteJournalEntryNoteFromQuranFoundation,
}));

import {
  deletePrivateJournalEntry,
  importPrivateJournalEntries,
  JournalStorageError,
  savePrivateJournalEntry,
} from "@/hifzer/journal/server";

type TestJournalRow = {
  id: string;
  userId: string;
  originEntryId: string | null;
  clientEntryId: string | null;
  version: number;
  type: "reflection" | "dua" | "repentance" | "gratitude" | "free";
  title: string | null;
  content: string;
  blocksJson: unknown;
  tags: string[];
  pinned: boolean;
  linkedAyahId: number | null;
  linkedSurahNumber: number | null;
  linkedAyahNumber: number | null;
  linkedSurahNameArabic: string | null;
  linkedSurahNameTransliteration: string | null;
  linkedDuaJson: unknown;
  duaStatus: "ongoing" | "answered" | "accepted_differently" | null;
  autoDeleteAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type TestMutationRow = {
  userId: string;
  journalEntryId: string | null;
  targetEntryKey: string | null;
  mutationType: "CREATE" | "UPDATE" | "DELETE";
  clientMutationId: string;
  resultVersion: number | null;
};

function makeDatabase(now: Date) {
  const entries = new Map<string, TestJournalRow>();
  const mutations = new Map<string, TestMutationRow>();
  let nextId = 0;

  function mutationKey(userId: string, clientMutationId: string) {
    return `${userId}:${clientMutationId}`;
  }

  const privateJournalEntry = {
    findMany: vi.fn(async (): Promise<TestJournalRow[]> => []),
    count: vi.fn(async () => 0),
    findFirst: vi.fn(async (args: {
      where: {
        id?: string;
        originEntryId?: string | null;
        clientEntryId?: string;
        userId: string;
      };
    }) => {
      for (const row of entries.values()) {
        if (row.userId !== args.where.userId) {
          continue;
        }
        if (args.where.id !== undefined && row.id === args.where.id) {
          return row;
        }
        if (args.where.originEntryId !== undefined && row.originEntryId === args.where.originEntryId) {
          return row;
        }
        if (args.where.clientEntryId !== undefined && row.clientEntryId === args.where.clientEntryId) {
          return row;
        }
      }
      return null;
    }),
    create: vi.fn(async (args: { data: Omit<TestJournalRow, "id" | "version" | "updatedAt"> }) => {
      const row: TestJournalRow = {
        ...args.data,
        id: `server-${++nextId}`,
        version: 1,
        updatedAt: now,
      };
      entries.set(row.id, row);
      return row;
    }),
    createMany: vi.fn(async (args: {
      data: Array<Omit<TestJournalRow, "id" | "version">>;
      skipDuplicates: boolean;
    }) => {
      let count = 0;
      for (const data of args.data) {
        const duplicate = [...entries.values()].some((row) =>
          row.userId === data.userId && (
            (data.originEntryId !== null && row.originEntryId === data.originEntryId) ||
            (data.clientEntryId !== null && row.clientEntryId === data.clientEntryId)
          ));
        if (duplicate && args.skipDuplicates) {
          continue;
        }
        const row: TestJournalRow = {
          ...data,
          id: `server-${++nextId}`,
          version: 1,
        };
        entries.set(row.id, row);
        count += 1;
      }
      return { count };
    }),
    updateMany: vi.fn(async (args: {
      where: {
        id?: string;
        userId: string;
        version?: number;
        originEntryId?: string | null;
        clientEntryId?: string;
      };
      data: Partial<Omit<TestJournalRow, "version">> & { version?: { increment: number } };
    }) => {
      const row = args.where.id
        ? entries.get(args.where.id)
        : [...entries.values()].find((candidate) =>
            candidate.userId === args.where.userId &&
            (args.where.clientEntryId === undefined || candidate.clientEntryId === args.where.clientEntryId) &&
            (args.where.originEntryId === undefined || candidate.originEntryId === args.where.originEntryId));
      if (!row || row.userId !== args.where.userId ||
        (args.where.version !== undefined && row.version !== args.where.version) ||
        (args.where.clientEntryId !== undefined && row.clientEntryId !== args.where.clientEntryId) ||
        (args.where.originEntryId !== undefined && row.originEntryId !== args.where.originEntryId)) {
        return { count: 0 };
      }
      const { version, ...data } = args.data;
      Object.assign(row, data, { updatedAt: data.updatedAt ?? now });
      if (version && typeof version === "object") {
        row.version += version.increment;
      }
      return { count: 1 };
    }),
    deleteMany: vi.fn(async (args: {
      where: { id?: string; userId: string; version?: number; autoDeleteAt?: unknown };
    }) => {
      if (args.where.autoDeleteAt) {
        return { count: 0 };
      }
      const row = args.where.id ? entries.get(args.where.id) : null;
      if (!row || row.userId !== args.where.userId ||
        (args.where.version !== undefined && row.version !== args.where.version)) {
        return { count: 0 };
      }
      entries.delete(row.id);
      for (const mutation of mutations.values()) {
        if (mutation.journalEntryId === row.id) {
          mutation.journalEntryId = null;
        }
      }
      return { count: 1 };
    }),
  };

  const privateJournalMutation = {
    findUnique: vi.fn(async (args: {
      where: { userId_clientMutationId: { userId: string; clientMutationId: string } };
    }) => {
      const key = args.where.userId_clientMutationId;
      return mutations.get(mutationKey(key.userId, key.clientMutationId)) ?? null;
    }),
    create: vi.fn(async (args: { data: TestMutationRow }) => {
      const key = mutationKey(args.data.userId, args.data.clientMutationId);
      if (mutations.has(key)) {
        throw new Error("duplicate mutation in test database");
      }
      mutations.set(key, { ...args.data });
      return args.data;
    }),
  };

  const client = {
    privateJournalEntry,
    privateJournalMutation,
    $transaction: vi.fn(async <T>(callback: (tx: {
      privateJournalEntry: typeof privateJournalEntry;
      privateJournalMutation: typeof privateJournalMutation;
    }) => Promise<T>) => callback({ privateJournalEntry, privateJournalMutation })),
  };

  return { client, entries, mutations, privateJournalEntry };
}

describe("private journal mutation durability", () => {
  const now = new Date("2026-09-05T00:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dbConfigured.mockReturnValue(true);
    mocks.getOrCreateUserProfile.mockResolvedValue({ id: "profile-a" });
    mocks.syncJournalEntryNoteToQuranFoundation.mockResolvedValue(null);
    mocks.deleteJournalEntryNoteFromQuranFoundation.mockResolvedValue(undefined);
  });

  it("creates once for a stable client id and replays the same mutation id", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);

    const input = {
      id: "local-entry-1",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "mutation-create-1",
      content: "A private reflection",
    };
    const created = await savePrivateJournalEntry("clerk-a", input, now);
    const replayed = await savePrivateJournalEntry("clerk-a", input, now);

    expect(created).toMatchObject({ id: "server-1", version: 1 });
    expect(replayed).toMatchObject({ id: "server-1", version: 1 });
    expect(database.entries.get("server-1")).toMatchObject({
      originEntryId: "local-entry-1",
      clientEntryId: null,
    });
    expect(database.privateJournalEntry.create).toHaveBeenCalledTimes(1);
    expect(database.mutations.size).toBe(1);
  });

  it("replays an inferred idempotent create before applying update version guards", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);

    const input = {
      id: "inferred-local-entry-1",
      ownerId: "clerk-a",
      clientMutationId: "inferred-mutation-create-1",
      content: "An inferred private reflection",
    };
    const created = await savePrivateJournalEntry("clerk-a", input, now);
    const replayed = await savePrivateJournalEntry("clerk-a", input, now);

    expect(created).toMatchObject({ id: "server-1", version: 1 });
    expect(replayed).toMatchObject({ id: "server-1", version: 1 });
    expect(database.privateJournalEntry.create).toHaveBeenCalledTimes(1);
    expect(database.privateJournalEntry.updateMany).not.toHaveBeenCalled();
  });

  it("increments versions and returns the owner-scoped authoritative entry on stale update", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const created = await savePrivateJournalEntry("clerk-a", {
      id: "local-entry-2",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "mutation-create-2",
      content: "First copy",
    }, now);

    const updated = await savePrivateJournalEntry("clerk-a", {
      id: created.id,
      ownerId: "clerk-a",
      mutationType: "update",
      expectedVersion: 1,
      clientMutationId: "mutation-update-1",
      content: "Second copy",
    }, now);
    expect(updated.version).toBe(2);
    expect(database.privateJournalEntry.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: created.id, userId: "profile-a", version: 1 },
    }));

    await expect(savePrivateJournalEntry("clerk-a", {
      id: created.id,
      ownerId: "clerk-a",
      mutationType: "update",
      expectedVersion: 1,
      clientMutationId: "mutation-update-stale",
      content: "Stale copy",
    }, now)).rejects.toMatchObject({
      status: 409,
      code: "VERSION_CONFLICT",
      authoritativeEntry: { id: created.id, version: 2 },
    });
  });

  it("clears only the title on an existing account-backed note", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const created = await savePrivateJournalEntry("clerk-a", {
      id: "clear-title-entry",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-before-clear-title",
      title: "Original title",
      content: "Body remains",
      blocks: [{ id: "body", kind: "text", content: "Body remains" }],
    }, now);

    const updated = await savePrivateJournalEntry("clerk-a", {
      id: created.id,
      ownerId: "clerk-a",
      mutationType: "update",
      expectedVersion: created.version,
      clientMutationId: "clear-existing-title",
      title: "",
    }, now);

    expect(updated).toMatchObject({
      id: created.id,
      version: 2,
      title: "",
      content: "Body remains",
      blocks: [{ id: "body", kind: "text", content: "Body remains" }],
    });
    expect(database.entries.get(created.id)).toMatchObject({
      title: null,
      content: "Body remains",
      version: 2,
    });
  });

  it("preserves an omitted title while replacing legacy content without blocks", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const created = await savePrivateJournalEntry("clerk-a", {
      id: "content-only-entry",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-before-content-only-update",
      title: "Keep this title",
      content: "Original body",
      blocks: [{ id: "original", kind: "text", content: "Original body" }],
    }, now);

    const updated = await savePrivateJournalEntry("clerk-a", {
      id: created.id,
      ownerId: "clerk-a",
      mutationType: "update",
      expectedVersion: created.version,
      clientMutationId: "content-only-update",
      content: "Replacement body",
    }, now);

    expect(updated).toMatchObject({
      id: created.id,
      version: 2,
      title: "Keep this title",
      content: "Keep this title\n\nReplacement body",
      blocks: [{ kind: "text", content: "Replacement body" }],
    });
    expect(database.entries.get(created.id)).toMatchObject({
      title: "Keep this title",
      content: "Keep this title\n\nReplacement body",
      version: 2,
    });
  });

  it("clears only the text body while retaining the title", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const created = await savePrivateJournalEntry("clerk-a", {
      id: "clear-body-entry",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-before-clear-body",
      title: "Retained title",
      blocks: [{ id: "body", kind: "text", content: "Original body" }],
    }, now);

    const updated = await savePrivateJournalEntry("clerk-a", {
      id: created.id,
      ownerId: "clerk-a",
      mutationType: "update",
      expectedVersion: created.version,
      clientMutationId: "clear-body-only",
      content: "",
    }, now);

    expect(updated).toMatchObject({
      title: "Retained title",
      content: "Retained title",
      blocks: [{ id: "body", kind: "text", content: "" }],
    });
    expect(database.entries.get(created.id)?.blocksJson).toEqual([
      { id: "body", kind: "text", content: "" },
    ]);
  });

  it("stores title-only creates with an explicit empty block collection", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);

    const created = await savePrivateJournalEntry("clerk-a", {
      id: "title-only-entry",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-title-only",
      title: "Title is the whole note",
    }, now);

    expect(created).toMatchObject({
      title: "Title is the whole note",
      content: "Title is the whole note",
      blocks: [],
    });
    expect(database.entries.get(created.id)?.blocksJson).toEqual([]);
  });

  it("does not duplicate a legacy title when reconstructing missing blocks", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const created = await savePrivateJournalEntry("clerk-a", {
      id: "legacy-title-prefix",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-before-legacy-title-prefix",
      title: "Legacy title",
      content: "Legacy body",
    }, now);
    const stored = database.entries.get(created.id)!;
    stored.blocksJson = null;
    stored.content = "Legacy title\n\nLegacy body";

    const updated = await savePrivateJournalEntry("clerk-a", {
      id: created.id,
      ownerId: "clerk-a",
      mutationType: "update",
      expectedVersion: created.version,
      clientMutationId: "update-legacy-title-prefix",
      title: "Updated title",
    }, now);

    expect(updated).toMatchObject({
      title: "Updated title",
      content: "Updated title\n\nLegacy body",
      blocks: [{ kind: "text", content: "Legacy body" }],
    });
  });

  it("preserves structured blocks and dua metadata on a content-only update", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const ayah = {
      ayahId: 1,
      surahNumber: 1,
      ayahNumber: 1,
      surahNameArabic: "Al-Fatihah",
      surahNameTransliteration: "Al-Fatihah",
      textUthmani: "Arabic",
      translation: "In the name of Allah",
    };
    const created = await savePrivateJournalEntry("clerk-a", {
      id: "structured-partial-entry",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-structured-partial",
      type: "dua",
      title: "Morning dua",
      blocks: [
        { id: "text-primary", kind: "text", content: "First body" },
        { id: "ayah-card", kind: "ayah", title: "Keep this label", ayah },
        { id: "text-extra", kind: "text", content: "Second body" },
      ],
      duaStatus: "answered",
    }, now);

    const updated = await savePrivateJournalEntry("clerk-a", {
      id: created.id,
      ownerId: "clerk-a",
      mutationType: "update",
      expectedVersion: created.version,
      clientMutationId: "update-structured-content-only",
      content: "Replacement body",
    }, now);

    expect(updated.duaStatus).toBe("answered");
    expect(updated.blocks).toEqual([
      { id: "text-primary", kind: "text", content: "Replacement body" },
      { id: "ayah-card", kind: "ayah", title: "Keep this label", ayah },
    ]);
  });

  it("preserves an omitted repentance deadline on partial updates", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const deadline = "2026-09-12T00:00:00.000Z";
    const created = await savePrivateJournalEntry("clerk-a", {
      id: "repentance-partial-entry",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-repentance-partial",
      type: "repentance",
      content: "A private note",
      autoDeleteAt: deadline,
    }, now);

    const updated = await savePrivateJournalEntry("clerk-a", {
      id: created.id,
      ownerId: "clerk-a",
      mutationType: "update",
      expectedVersion: created.version,
      clientMutationId: "update-repentance-title-only",
      title: "A new title",
    }, now);

    expect(updated.autoDeleteAt).toBe(deadline);
    expect(database.entries.get(created.id)?.autoDeleteAt?.toISOString()).toBe(deadline);
  });

  it("allows clearing every editable field on an existing account-backed note", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const created = await savePrivateJournalEntry("clerk-a", {
      id: "clear-all-entry",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-before-clear-all",
      title: "Original title",
      content: "Original body",
      blocks: [{ id: "body", kind: "text", content: "Original body" }],
      tags: ["original"],
    }, now);

    const updated = await savePrivateJournalEntry("clerk-a", {
      id: created.id,
      ownerId: "clerk-a",
      mutationType: "update",
      expectedVersion: created.version,
      clientMutationId: "clear-existing-note",
      title: "",
      content: "",
      blocks: [{ id: "empty", kind: "text", content: "" }],
      tags: [],
    }, now);

    expect(updated).toMatchObject({
      id: created.id,
      version: 2,
      title: "",
      content: "",
      blocks: [{ id: "empty", kind: "text", content: "" }],
      tags: [],
    });
    expect(database.entries.get(created.id)).toMatchObject({
      title: null,
      content: "",
      blocksJson: [{ id: "empty", kind: "text", content: "" }],
      tags: [],
      version: 2,
    });
    expect(database.entries.size).toBe(1);
  });

  it("still rejects a fully empty create", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);

    await expect(savePrivateJournalEntry("clerk-a", {
      id: "empty-create-entry",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-empty-note",
      title: "",
      content: "",
      blocks: [{ id: "empty", kind: "text", content: "" }],
      tags: [],
    }, now)).rejects.toMatchObject({
      status: 400,
      code: "EMPTY_ENTRY",
    });
    expect(database.privateJournalEntry.create).not.toHaveBeenCalled();
    expect(database.entries.size).toBe(0);
    expect(database.mutations.size).toBe(0);
  });

  it("prefers a canonical id over another row's matching origin alias", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const aliasRow = await savePrivateJournalEntry("clerk-a", {
      id: "canonical-id",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-alias-row",
      content: "Alias row",
    }, now);
    const canonicalCandidate = await savePrivateJournalEntry("clerk-a", {
      id: "different-origin",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-canonical-row",
      content: "Canonical row",
    }, now);
    const canonicalRow = database.entries.get(canonicalCandidate.id)!;
    database.entries.delete(canonicalCandidate.id);
    canonicalRow.id = "canonical-id";
    database.entries.set(canonicalRow.id, canonicalRow);

    const updated = await savePrivateJournalEntry("clerk-a", {
      id: "canonical-id",
      ownerId: "clerk-a",
      mutationType: "update",
      expectedVersion: 1,
      clientMutationId: "update-canonical-row",
      content: "Canonical row updated",
    }, now);

    expect(updated).toMatchObject({ id: "canonical-id", originEntryId: "different-origin", version: 2 });
    expect(database.entries.get(aliasRow.id)).toMatchObject({ content: "Alias row", version: 1 });
  });

  it("treats an explicitly versioned missing update as a conflict instead of a create", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);

    await expect(savePrivateJournalEntry("clerk-a", {
      id: "missing-entry",
      ownerId: "clerk-a",
      mutationType: "update",
      expectedVersion: 3,
      clientMutationId: "mutation-missing-update",
      content: "Unsynced text",
    }, now)).rejects.toMatchObject({
      status: 409,
      code: "VERSION_CONFLICT",
      authoritativeEntry: null,
    });
    expect(database.privateJournalEntry.create).not.toHaveBeenCalled();
  });

  it("rejects explicit queued updates that omit compare-and-swap versioning", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const created = await savePrivateJournalEntry("clerk-a", {
      id: "version-required-update",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-before-version-required-update",
      content: "Original",
    }, now);

    await expect(savePrivateJournalEntry("clerk-a", {
      id: created.id,
      ownerId: "clerk-a",
      mutationType: "update",
      clientMutationId: "update-without-version",
      content: "Must not overwrite",
    }, now)).rejects.toMatchObject({
      status: 400,
      code: "MISSING_EXPECTED_VERSION",
    });
    expect(database.entries.get(created.id)).toMatchObject({ version: 1, content: "Original" });
  });

  it("requires compare-and-swap versioning for inferred idempotent updates", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const created = await savePrivateJournalEntry("clerk-a", {
      id: "inferred-version-required-update",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-before-inferred-version-required-update",
      content: "Original inferred copy",
    }, now);

    await expect(savePrivateJournalEntry("clerk-a", {
      id: created.id,
      ownerId: "clerk-a",
      clientMutationId: "inferred-update-without-version",
      content: "Must not overwrite inferred copy",
    }, now)).rejects.toMatchObject({
      status: 400,
      code: "MISSING_EXPECTED_VERSION",
    });
    expect(database.entries.get(created.id)).toMatchObject({
      version: 1,
      content: "Original inferred copy",
    });
  });

  it("requires compare-and-swap versioning for mutation-less updates", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const created = await savePrivateJournalEntry("clerk-a", {
      id: "legacy-version-required-update",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-before-legacy-version-required-update",
      content: "Newer account copy",
    }, now);

    await expect(savePrivateJournalEntry("clerk-a", {
      id: created.id,
      ownerId: "clerk-a",
      content: "Stale mutation-less copy",
    }, now)).rejects.toMatchObject({
      status: 400,
      code: "MISSING_EXPECTED_VERSION",
    });
    expect(database.entries.get(created.id)).toMatchObject({
      version: 1,
      content: "Newer account copy",
    });
  });

  it("does not recreate a deleted note from a stale mutation-less update", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const created = await savePrivateJournalEntry("clerk-a", {
      id: "legacy-update-after-delete",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-before-legacy-update-after-delete",
      content: "Delete this account copy",
    }, now);
    await deletePrivateJournalEntry("clerk-a", created.id, {
      ownerId: "clerk-a",
      expectedVersion: created.version,
      clientMutationId: "delete-before-legacy-update-replay",
    });

    await expect(savePrivateJournalEntry("clerk-a", {
      id: created.id,
      ownerId: "clerk-a",
      content: "Stale open-tab copy",
    }, now)).rejects.toMatchObject({
      status: 409,
      code: "VERSION_CONFLICT",
      authoritativeEntry: null,
    });
    expect(database.privateJournalEntry.create).toHaveBeenCalledTimes(1);
    expect(database.entries.size).toBe(0);
  });

  it("returns a null authoritative entry when a row disappears during update CAS", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const created = await savePrivateJournalEntry("clerk-a", {
      id: "cas-disappears",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-before-cas-disappears",
      content: "Original",
    }, now);
    database.privateJournalEntry.updateMany.mockImplementationOnce(async () => {
      database.entries.delete(created.id);
      return { count: 0 };
    });

    await expect(savePrivateJournalEntry("clerk-a", {
      id: created.id,
      ownerId: "clerk-a",
      mutationType: "update",
      expectedVersion: 1,
      clientMutationId: "update-after-delete",
      content: "Local draft",
    }, now)).rejects.toMatchObject({
      status: 409,
      code: "VERSION_CONFLICT",
      authoritativeEntry: null,
    });
  });

  it("rejects a different create mutation for an existing origin entry id", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    await savePrivateJournalEntry("clerk-a", {
      id: "stable-entry",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "first-create",
      content: "Original",
    }, now);

    await expect(savePrivateJournalEntry("clerk-a", {
      id: "stable-entry",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "different-create",
      content: "Replacement",
    }, now)).rejects.toMatchObject({
      status: 409,
      code: "CLIENT_ENTRY_ID_CONFLICT",
      authoritativeEntry: { id: "server-1", version: 1 },
    });
  });

  it("rejects expired queued creates and mismatched owners before writing", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);

    await expect(savePrivateJournalEntry("clerk-a", {
      id: "expired-entry",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "expired-create",
      type: "repentance",
      content: "Expired",
      autoDeleteAt: "2026-09-04T23:59:59.000Z",
    }, now)).rejects.toMatchObject({ status: 410, code: "ENTRY_EXPIRED" });

    await expect(savePrivateJournalEntry("clerk-b", {
      id: "wrong-owner",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "wrong-owner-create",
      content: "Must not write",
    }, now)).rejects.toBeInstanceOf(JournalStorageError);
    await expect(savePrivateJournalEntry("clerk-b", {
      id: "wrong-owner",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "wrong-owner-create-2",
      content: "Must not write",
    }, now)).rejects.toMatchObject({ status: 409, code: "OWNER_MISMATCH" });
    expect(database.privateJournalEntry.create).not.toHaveBeenCalled();
  });

  it("deduplicates delete before entry lookup and guards mutation target reuse", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const created = await savePrivateJournalEntry("clerk-a", {
      id: "delete-alias",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-before-delete",
      content: "Delete me",
    }, now);

    await deletePrivateJournalEntry("clerk-a", "delete-alias", {
      ownerId: "clerk-a",
      expectedVersion: created.version,
      clientMutationId: "delete-once",
    });
    expect(database.privateJournalEntry.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: created.id, userId: "profile-a", version: 1 },
    }));
    const lookupsAfterDelete = database.privateJournalEntry.findFirst.mock.calls.length;
    await deletePrivateJournalEntry("clerk-a", "delete-alias", {
      ownerId: "clerk-a",
      expectedVersion: created.version,
      clientMutationId: "delete-once",
    });
    expect(database.privateJournalEntry.findFirst).toHaveBeenCalledTimes(lookupsAfterDelete);

    await expect(deletePrivateJournalEntry("clerk-a", "delete-alias", {
      ownerId: "clerk-a",
      expectedVersion: created.version,
      clientMutationId: "delete-after-already-absent",
    })).resolves.toBeUndefined();
    expect(database.mutations.get("profile-a:delete-after-already-absent")).toMatchObject({
      journalEntryId: null,
      targetEntryKey: "delete-alias",
      mutationType: "DELETE",
      resultVersion: 2,
    });

    await expect(deletePrivateJournalEntry("clerk-a", "different-entry", {
      ownerId: "clerk-a",
      expectedVersion: created.version,
      clientMutationId: "delete-once",
    })).rejects.toMatchObject({ status: 409, code: "MUTATION_ID_REUSED" });
  });

  it("rejects idempotent deletes that omit compare-and-swap versioning", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const created = await savePrivateJournalEntry("clerk-a", {
      id: "version-required-delete",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-before-version-required-delete",
      content: "Keep me",
    }, now);

    await expect(deletePrivateJournalEntry("clerk-a", created.id, {
      ownerId: "clerk-a",
      clientMutationId: "delete-without-version",
    })).rejects.toMatchObject({
      status: 400,
      code: "MISSING_EXPECTED_VERSION",
    });
    expect(database.entries.has(created.id)).toBe(true);
  });

  it("rejects mutation-less deletes that omit compare-and-swap versioning", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const created = await savePrivateJournalEntry("clerk-a", {
      id: "legacy-version-required-delete",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-before-legacy-version-required-delete",
      content: "Keep the newer copy",
    }, now);

    await expect(deletePrivateJournalEntry("clerk-a", created.id, {
      ownerId: "clerk-a",
    })).rejects.toMatchObject({
      status: 400,
      code: "MISSING_EXPECTED_VERSION",
    });
    expect(database.entries.has(created.id)).toBe(true);
  });

  it("reports an account deletion when a completed save replay has lost its row", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const input = {
      id: "save-then-delete",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-before-replay-deletion",
      content: "Original",
    };
    const created = await savePrivateJournalEntry("clerk-a", input, now);
    await deletePrivateJournalEntry("clerk-a", created.id, {
      ownerId: "clerk-a",
      expectedVersion: created.version,
      clientMutationId: "delete-before-save-replay",
    });

    await expect(savePrivateJournalEntry("clerk-a", input, now)).rejects.toMatchObject({
      status: 409,
      code: "VERSION_CONFLICT",
      authoritativeEntry: null,
    });
  });

  it("commits an idempotent delete acknowledgement when the row disappears during CAS", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const created = await savePrivateJournalEntry("clerk-a", {
      id: "delete-cas-alias",
      ownerId: "clerk-a",
      mutationType: "create",
      clientMutationId: "create-before-delete-cas",
      content: "Delete concurrently",
    }, now);

    database.privateJournalEntry.deleteMany.mockImplementationOnce(async () => {
      database.entries.delete(created.id);
      return { count: 0 };
    });

    await expect(deletePrivateJournalEntry("clerk-a", "delete-cas-alias", {
      ownerId: "clerk-a",
      expectedVersion: created.version,
      clientMutationId: "delete-cas-winner-was-elsewhere",
    })).resolves.toBeUndefined();
    expect(database.mutations.get("profile-a:delete-cas-winner-was-elsewhere")).toMatchObject({
      journalEntryId: null,
      targetEntryKey: "delete-cas-alias",
      mutationType: "DELETE",
    });
  });

  it("records a missing versioned delete while missing updates remain null-authority conflicts", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);

    await expect(deletePrivateJournalEntry("clerk-a", "already-missing", {
      ownerId: "clerk-a",
      expectedVersion: 5,
      clientMutationId: "delete-known-missing",
    })).resolves.toBeUndefined();
    expect(database.mutations.get("profile-a:delete-known-missing")).toMatchObject({
      journalEntryId: null,
      targetEntryKey: "already-missing",
      resultVersion: 6,
    });

    await expect(savePrivateJournalEntry("clerk-a", {
      id: "already-missing",
      ownerId: "clerk-a",
      mutationType: "update",
      expectedVersion: 5,
      clientMutationId: "update-known-missing",
      content: "Do not silently recreate",
    }, now)).rejects.toMatchObject({
      status: 409,
      code: "VERSION_CONFLICT",
      authoritativeEntry: null,
    });
  });

  it("rejects stale-owner imports before profile hydration or writes", async () => {
    const legacyEntry = {
      id: "legacy-owner-race",
      type: "reflection" as const,
      title: "Private",
      content: "Must stay with account A",
      tags: [],
      pinned: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await expect(importPrivateJournalEntries(
      "clerk-b",
      [legacyEntry],
      "clerk-a",
      now,
    )).rejects.toMatchObject({ status: 409, code: "OWNER_MISMATCH" });
    await expect(importPrivateJournalEntries(
      "clerk-b",
      [legacyEntry],
      null,
      now,
    )).rejects.toMatchObject({ status: 400, code: "MISSING_OWNER" });
    expect(mocks.getOrCreateUserProfile).not.toHaveBeenCalled();
    expect(mocks.db).not.toHaveBeenCalled();
  });

  it("imports stable legacy ids create-only so stale retries preserve newer account edits", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    const legacyEntry = {
      id: "legacy-stable-id",
      clientEntryId: "legacy-stable-id",
      type: "reflection" as const,
      title: "Device title",
      content: "Device copy",
      blocks: [{ id: "legacy-block", kind: "text" as const, content: "Device copy" }],
      tags: ["legacy"],
      pinned: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const firstImport = await importPrivateJournalEntries("clerk-a", [legacyEntry], "clerk-a", now);
    expect(firstImport.acknowledgements).toMatchObject([{
      sourceEntryId: legacyEntry.id,
      status: "created",
    }]);
    const accountRow = [...database.entries.values()][0];
    expect(accountRow).toMatchObject({
      originEntryId: "legacy-stable-id",
      clientEntryId: null,
      content: "Device title\n\nDevice copy",
      version: 1,
    });

    const identicalRetry = await importPrivateJournalEntries(
      "clerk-a",
      [legacyEntry],
      "clerk-a",
      new Date("2026-09-05T00:05:00.000Z"),
    );
    expect(identicalRetry.acknowledgements).toMatchObject([{
      sourceEntryId: legacyEntry.id,
      status: "already-identical",
    }]);

    accountRow.title = "Edited on another device";
    accountRow.content = "Newer account copy";
    accountRow.blocksJson = [{ id: "account-edit", kind: "text", content: "Newer account copy" }];
    accountRow.version = 4;
    accountRow.updatedAt = new Date("2026-09-05T00:10:00.000Z");

    const retry = await importPrivateJournalEntries("clerk-a", [{
      ...legacyEntry,
      title: "Stale retry",
      content: "Stale device copy",
    }], "clerk-a", new Date("2026-09-05T00:20:00.000Z"));

    expect(database.entries.size).toBe(1);
    expect(database.entries.get(accountRow.id)).toMatchObject({
      title: "Edited on another device",
      content: "Newer account copy",
      version: 4,
      updatedAt: new Date("2026-09-05T00:10:00.000Z"),
    });
    expect(retry.acknowledgements).toMatchObject([{
      sourceEntryId: legacyEntry.id,
      status: "conflict",
      entry: {
        id: accountRow.id,
        title: "Edited on another device",
      },
    }]);
  });

  it("imports title-only notes and returns their stable source acknowledgement", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    database.privateJournalEntry.findMany.mockImplementation(async (rawArgs?: unknown) => {
      const args = rawArgs as { where?: { autoDeleteAt?: unknown } } | undefined;
      return args?.where?.autoDeleteAt ? [] : [...database.entries.values()];
    });

    const imported = await importPrivateJournalEntries("clerk-a", [{
      id: "title-only-note",
      type: "reflection",
      title: "A title is meaningful",
      content: "",
      blocks: [{ id: "blank", kind: "text", content: "" }],
      tags: [],
      pinned: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }], "clerk-a", now);

    expect(database.entries.size).toBe(1);
    expect(imported.entries[0]).toMatchObject({
      originEntryId: "title-only-note",
      clientEntryId: null,
      title: "A title is meaningful",
    });
    expect(imported.acknowledgements).toMatchObject([{
      sourceEntryId: "title-only-note",
      status: "created",
    }]);
  });

  it("acknowledges an origin row even when its source id collides with another canonical id", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    database.privateJournalEntry.findMany.mockImplementation(async (rawArgs?: unknown) => {
      const args = rawArgs as { where?: { autoDeleteAt?: unknown } } | undefined;
      return args?.where?.autoDeleteAt ? [] : [...database.entries.values()];
    });
    const base = {
      type: "reflection" as const,
      tags: [],
      pinned: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await importPrivateJournalEntries("clerk-a", [{
      ...base,
      id: "unrelated-origin",
      title: "Existing row",
      content: "Existing content",
    }], "clerk-a", now);
    expect([...database.entries.values()][0]?.id).toBe("server-1");

    const imported = await importPrivateJournalEntries("clerk-a", [{
      ...base,
      id: "server-1",
      title: "Colliding source",
      content: "Must get its own origin row",
    }], "clerk-a", now);

    expect(database.entries.size).toBe(2);
    expect(imported.acknowledgements).toMatchObject([{
      sourceEntryId: "server-1",
      status: "created",
      entry: {
        id: "server-2",
        originEntryId: "server-1",
        title: "Colliding source",
      },
    }]);
  });

  it("preserves a Quran Foundation note id and attaches an origin-only acknowledgement without stale overwrite", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    database.privateJournalEntry.findMany.mockImplementation(async (rawArgs?: unknown) => {
      const args = rawArgs as { where?: { autoDeleteAt?: unknown } } | undefined;
      return args?.where?.autoDeleteAt ? [] : [...database.entries.values()];
    });
    const source = {
      id: "qf-note:remote-42",
      clientEntryId: "qf-note:remote-42",
      type: "reflection" as const,
      title: "Remote note",
      content: "Original remote body",
      tags: [],
      pinned: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await importPrivateJournalEntries("clerk-a", [source], "clerk-a", now);
    const accountRow = [...database.entries.values()][0];
    expect(accountRow).toMatchObject({
      originEntryId: source.id,
      clientEntryId: source.clientEntryId,
    });

    // Simulate a qf-note:* row that predates originEntryId. A retry may attach
    // the acknowledgement alias, but must never replay stale note content.
    accountRow.originEntryId = null;
    accountRow.title = "Edited account title";
    accountRow.content = "Edited account body";
    accountRow.blocksJson = [{ id: "account-edit", kind: "text", content: "Edited account body" }];
    accountRow.version = 3;
    accountRow.updatedAt = new Date("2026-09-05T00:10:00.000Z");

    const acknowledged = await importPrivateJournalEntries("clerk-a", [{
      ...source,
      title: "Stale remote title",
      content: "Stale remote body",
    }], "clerk-a", new Date("2026-09-05T00:20:00.000Z"));

    expect(database.entries.size).toBe(1);
    expect(accountRow).toMatchObject({
      originEntryId: source.id,
      clientEntryId: source.clientEntryId,
      title: "Edited account title",
      content: "Edited account body",
      version: 3,
      updatedAt: new Date("2026-09-05T00:10:00.000Z"),
    });
    expect(acknowledged.entries[0]).toMatchObject({
      id: accountRow.id,
      originEntryId: source.id,
      clientEntryId: source.clientEntryId,
      title: "Edited account title",
      version: 3,
    });
    expect(acknowledged.acknowledgements).toMatchObject([{
      sourceEntryId: source.id,
      status: "conflict",
      entry: {
        id: accountRow.id,
        title: "Edited account title",
      },
    }]);
  });

  it("attaches a Quran Foundation origin alias without changing an identical row timestamp", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    database.privateJournalEntry.findMany.mockImplementation(async (rawArgs?: unknown) => {
      const args = rawArgs as { where?: { autoDeleteAt?: unknown } } | undefined;
      return args?.where?.autoDeleteAt ? [] : [...database.entries.values()];
    });
    const source = {
      id: "qf-note:remote-identical",
      clientEntryId: "qf-note:remote-identical",
      type: "reflection" as const,
      title: "Remote note",
      content: "Unchanged remote body",
      blocks: [{
        id: "qf-note:remote-identical:text",
        kind: "text" as const,
        content: "Unchanged remote body",
      }],
      tags: [],
      pinned: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await importPrivateJournalEntries("clerk-a", [source], "clerk-a", now);
    const accountRow = [...database.entries.values()][0];
    accountRow.originEntryId = null;

    const retried = await importPrivateJournalEntries(
      "clerk-a",
      [source],
      "clerk-a",
      new Date("2026-09-05T00:20:00.000Z"),
    );

    expect(accountRow.originEntryId).toBe(source.id);
    expect(accountRow.updatedAt.toISOString()).toBe(source.updatedAt);
    expect(database.privateJournalEntry.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({
      data: {
        originEntryId: source.id,
        updatedAt: new Date(source.updatedAt),
      },
    }));
    expect(retried.acknowledgements).toMatchObject([{
      sourceEntryId: source.id,
      status: "already-identical",
    }]);
  });

  it("rejects oversized import batches instead of silently dropping their tail", async () => {
    const entries = Array.from({ length: 201 }, (_, index) => ({
      id: `legacy-${index}`,
      type: "reflection" as const,
      title: `Note ${index}`,
      content: "",
      tags: [],
      pinned: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }));

    await expect(importPrivateJournalEntries(
      "clerk-a",
      entries,
      "clerk-a",
      now,
    )).rejects.toMatchObject({ status: 400, code: "IMPORT_LIMIT_EXCEEDED" });
    expect(mocks.getOrCreateUserProfile).not.toHaveBeenCalled();
    expect(mocks.db).not.toHaveBeenCalled();
  });

  it("caps imported text blocks and reports the transformed source as a conflict", async () => {
    const database = makeDatabase(now);
    mocks.db.mockReturnValue(database.client);
    database.privateJournalEntry.findMany.mockImplementation(async (rawArgs?: unknown) => {
      const args = rawArgs as { where?: { autoDeleteAt?: unknown } } | undefined;
      return args?.where?.autoDeleteAt ? [] : [...database.entries.values()];
    });
    const blocks = Array.from({ length: 41 }, (_, index) => ({
      id: `block-${index}`,
      kind: "text" as const,
      content: `Block ${index}`,
    }));

    const imported = await importPrivateJournalEntries("clerk-a", [{
      id: "too-many-blocks",
      type: "reflection",
      title: "Long structured note",
      content: blocks.map((block) => block.content).join("\n\n"),
      blocks,
      tags: [],
      pinned: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }], "clerk-a", now);

    const stored = [...database.entries.values()][0];
    expect(stored.blocksJson).toHaveLength(40);
    expect(imported.acknowledgements).toMatchObject([{
      sourceEntryId: "too-many-blocks",
      status: "conflict",
    }]);
  });

  it("rejects duplicate import source ids before any database write", async () => {
    const duplicate = {
      id: "duplicate-source",
      type: "reflection" as const,
      title: "First",
      content: "A",
      tags: [],
      pinned: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await expect(importPrivateJournalEntries(
      "clerk-a",
      [duplicate, { ...duplicate, title: "Second", content: "B" }],
      "clerk-a",
      now,
    )).rejects.toMatchObject({ status: 400, code: "INVALID_IMPORT_SOURCE_ID" });
    expect(mocks.getOrCreateUserProfile).not.toHaveBeenCalled();
    expect(mocks.db).not.toHaveBeenCalled();
  });
});
