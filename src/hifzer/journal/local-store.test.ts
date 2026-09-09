import { afterEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/hifzer/local/store";
import {
  clearJournalEntries,
  deleteJournalEntry,
  listJournalEntries,
  normalizeJournalEntry,
  removeAcknowledgedJournalImportSources,
  upsertJournalEntry,
  type JournalEntry,
} from "./local-store";

const DEVICE_KEY = "hifzer_private_journal_device_entries_v1";
const LEGACY_KEY = "hifzer_private_journal_entries_v1";
const accountKey = (owner: string) => `hifzer_private_journal_entries_v2:${owner}`;

function createEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: "journal-1",
    type: "reflection",
    title: "A quiet note",
    content: "Remember this.",
    blocks: [{ id: "block-1", kind: "text", content: "Remember this." }],
    tags: [],
    pinned: false,
    createdAt: "2026-09-04T12:00:00.000Z",
    updatedAt: "2026-09-04T12:00:00.000Z",
    linkedAyah: null,
    linkedDua: null,
    duaStatus: null,
    autoDeleteAt: null,
    ...overrides,
  };
}

describe("journal entry normalization", () => {
  it("preserves an explicit empty structured block collection", () => {
    const normalized = normalizeJournalEntry(createEntry({
      title: "Title only",
      content: "Title only",
      blocks: [],
    }));

    expect(normalized.blocks).toEqual([]);
  });
});

function installLocalStorage() {
  const values = new Map<string, string>();
  let writeFailure: Error | null = null;
  let ignoreJournalWrites = false;
  let ignoreJournalRemovals = false;
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (key.startsWith("hifzer_private_journal_entries_v2:") || key === DEVICE_KEY) {
        if (writeFailure) {
          throw writeFailure;
        }
        if (ignoreJournalWrites) {
          return;
        }
      }
      values.set(key, value);
    },
    removeItem: (key: string) => {
      if (ignoreJournalRemovals) {
        return;
      }
      values.delete(key);
    },
    clear: () => values.clear(),
  };

  vi.stubGlobal("window", { localStorage });
  const webLockRequest = installWebLocks();
  return {
    values,
    webLockRequest,
    reinstallWindow() {
      vi.stubGlobal("window", { localStorage });
    },
    failJournalWrites(error = new Error("quota exceeded")) {
      writeFailure = error;
    },
    ignoreJournalWrites() {
      ignoreJournalWrites = true;
    },
    ignoreJournalRemovals() {
      ignoreJournalRemovals = true;
    },
  };
}

function installWebLocks() {
  const request = vi.fn(async (
    _name: string,
    _options: { mode: "exclusive" },
    operation: () => unknown,
  ) => operation());
  vi.stubGlobal("navigator", { locks: { request } });
  return request;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("journal local persistence", () => {
  it("writes to a device-only scope and verifies the saved entry when no account owner exists", async () => {
    const storage = installLocalStorage();
    const now = new Date("2026-09-04T12:30:00.000Z");

    const result = await upsertJournalEntry(createEntry(), now);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.scope).toBe("device");
    expect(result.entry.id).toBe("journal-1");
    expect(result.entry.version).toBe(1);
    expect(result.entry.updatedAt).toBe(now.toISOString());
    expect(storage.values.has(DEVICE_KEY)).toBe(true);
    expect(listJournalEntries(now)).toEqual(result.entries);
    expect(storage.webLockRequest).toHaveBeenCalledWith(
      "hifzer:private-journal-storage:__device__",
      { mode: "exclusive" },
      expect.any(Function),
    );
  });

  it("reads a verified device note after a fresh browser binding with no owner", async () => {
    const storage = installLocalStorage();
    const now = new Date("2026-09-04T12:30:00.000Z");
    const saved = await upsertJournalEntry(createEntry({ id: "reload-note" }), now);
    expect(saved.ok).toBe(true);

    vi.unstubAllGlobals();
    storage.reinstallWindow();

    expect(listJournalEntries(now).map((entry) => entry.id)).toEqual(["reload-note"]);
  });

  it("normalizes a missing or invalid legacy version to one", () => {
    const storage = installLocalStorage();
    const now = new Date("2026-09-04T12:30:00.000Z");
    storage.values.set(DEVICE_KEY, JSON.stringify([
      createEntry({ id: "missing-version" }),
      createEntry({ id: "invalid-version", version: 0 }),
    ]));

    expect(listJournalEntries(now).map((entry) => [entry.id, entry.version])).toEqual([
      ["missing-version", 1],
      ["invalid-version", 1],
    ]);
  });

  it("keeps account-bound fallback notes separate from device-only notes", async () => {
    const storage = installLocalStorage();
    const now = new Date("2026-09-04T12:30:00.000Z");
    const deviceResult = await upsertJournalEntry(createEntry({ id: "device-note" }), now);
    expect(deviceResult.ok).toBe(true);

    storage.values.set(STORAGE_KEYS.localStateOwner, "user_123");
    expect(listJournalEntries(now)).toEqual([]);

    const accountResult = await upsertJournalEntry(createEntry({ id: "account-note" }), now);
    expect(accountResult.ok).toBe(true);
    if (!accountResult.ok) {
      return;
    }
    expect(accountResult.scope).toBe("account");
    expect(accountResult.entries.map((entry) => entry.id)).toEqual(["account-note"]);
    expect(storage.values.has(accountKey("user_123"))).toBe(true);

    storage.values.delete(STORAGE_KEYS.localStateOwner);
    expect(listJournalEntries(now).map((entry) => entry.id)).toEqual(["device-note"]);
  });

  it("isolates account fallback notes across account switches", async () => {
    const storage = installLocalStorage();
    const now = new Date("2026-09-04T12:30:00.000Z");

    storage.values.set(STORAGE_KEYS.localStateOwner, "user_a");
    expect((await upsertJournalEntry(createEntry({ id: "note-a" }), now)).ok).toBe(true);

    storage.values.set(STORAGE_KEYS.localStateOwner, "user_b");
    expect(listJournalEntries(now)).toEqual([]);
    expect((await upsertJournalEntry(createEntry({ id: "note-b" }), now)).ok).toBe(true);

    storage.values.set(STORAGE_KEYS.localStateOwner, "user_a");
    expect(listJournalEntries(now).map((entry) => entry.id)).toEqual(["note-a"]);

    storage.values.set(STORAGE_KEYS.localStateOwner, "user_b");
    expect(listJournalEntries(now).map((entry) => entry.id)).toEqual(["note-b"]);
  });

  it("rejects an explicit account target that is not the durable active owner", async () => {
    const storage = installLocalStorage();
    const now = new Date("2026-09-04T12:30:00.000Z");
    storage.values.set(STORAGE_KEYS.localStateOwner, "user_a");
    expect((await upsertJournalEntry(createEntry({ id: "note-a" }), now)).ok).toBe(true);

    const userBTarget = { scope: "account", ownerId: "user_b" } as const;
    expect(listJournalEntries(now, userBTarget)).toEqual([]);
    expect(await upsertJournalEntry(createEntry({ id: "note-b" }), now, userBTarget))
      .toMatchObject({ ok: false, reason: "owner-mismatch" });

    expect(listJournalEntries(now, userBTarget)).toEqual([]);
    expect(listJournalEntries(now).map((entry) => entry.id)).toEqual(["note-a"]);
    expect(storage.webLockRequest).toHaveBeenCalledWith(
      "hifzer:private-journal-storage:user_b",
      { mode: "exclusive" },
      expect.any(Function),
    );
  });

  it("fails closed when the durable owner changes while a write waits for the lock", async () => {
    const storage = installLocalStorage();
    const now = new Date("2026-09-04T12:30:00.000Z");
    storage.values.set(STORAGE_KEYS.localStateOwner, "user_a");
    vi.stubGlobal("navigator", {
      locks: {
        request: vi.fn(async (
          _name: string,
          _options: { mode: "exclusive" },
          operation: () => unknown,
        ) => {
          storage.values.set(STORAGE_KEYS.localStateOwner, "user_b");
          return operation();
        }),
      },
    });

    const result = await upsertJournalEntry(createEntry({ id: "owner-race" }), now);

    expect(result).toMatchObject({ ok: false, scope: "account", reason: "owner-mismatch" });
    expect(storage.values.has(accountKey("user_a"))).toBe(false);
    expect(storage.values.has(accountKey("user_b"))).toBe(false);
  });

  it("fails an account write closed when cross-tab locking is unavailable", async () => {
    const storage = installLocalStorage();
    storage.values.set(STORAGE_KEYS.localStateOwner, "user_a");
    vi.stubGlobal("navigator", {});

    const result = await upsertJournalEntry(
      createEntry({ id: "must-not-write" }),
      new Date("2026-09-04T12:30:00.000Z"),
    );

    expect(result).toMatchObject({
      ok: false,
      scope: "account",
      reason: "locking-unavailable",
    });
    expect(storage.values.has(accountKey("user_a"))).toBe(false);
  });

  it("reports a write failure without replacing the previously verified copy", async () => {
    const storage = installLocalStorage();
    const firstNow = new Date("2026-09-04T12:30:00.000Z");
    const firstResult = await upsertJournalEntry(createEntry(), firstNow);
    expect(firstResult.ok).toBe(true);

    storage.failJournalWrites();
    const failedResult = await upsertJournalEntry(
      createEntry({ content: "A changed draft", blocks: [{ id: "block-1", kind: "text", content: "A changed draft" }] }),
      new Date("2026-09-04T12:31:00.000Z"),
    );

    expect(failedResult).toMatchObject({ ok: false, reason: "write-failed" });
    expect(listJournalEntries(firstNow)[0]?.content).toBe("Remember this.");
  });

  it("rejects stale same-version saves and deletes after another tab wins", async () => {
    installLocalStorage();
    const target = { scope: "device" } as const;
    const createdAt = new Date("2026-09-04T12:30:00.000Z");
    const winningAt = new Date("2026-09-04T12:31:00.000Z");
    const staleAt = new Date("2026-09-04T12:32:00.000Z");
    const created = await upsertJournalEntry(
      createEntry({ version: 1 }),
      createdAt,
      target,
      null,
    );
    expect(created.ok).toBe(true);

    const winningSave = await upsertJournalEntry(
      createEntry({
        version: 2,
        content: "Winning tab edit",
        blocks: [{ id: "block-1", kind: "text", content: "Winning tab edit" }],
      }),
      winningAt,
      target,
      1,
    );
    expect(winningSave.ok).toBe(true);

    const staleSave = await upsertJournalEntry(
      createEntry({
        version: 2,
        content: "Stale tab edit",
        blocks: [{ id: "block-1", kind: "text", content: "Stale tab edit" }],
      }),
      staleAt,
      target,
      1,
    );
    expect(staleSave).toMatchObject({ ok: false, reason: "version-conflict" });

    const staleDelete = await deleteJournalEntry("journal-1", staleAt, target, 1);
    expect(staleDelete).toMatchObject({ ok: false, reason: "version-conflict" });
    expect(listJournalEntries(staleAt, target)).toMatchObject([{
      id: "journal-1",
      version: 2,
      content: "Winning tab edit",
    }]);
  });

  it("does not report success when the storage read-back does not match the write", async () => {
    const storage = installLocalStorage();
    storage.ignoreJournalWrites();

    const result = await upsertJournalEntry(createEntry(), new Date("2026-09-04T12:30:00.000Z"));

    expect(result).toMatchObject({ ok: false, reason: "verification-failed" });
    expect(storage.values.has(DEVICE_KEY)).toBe(false);
  });

  it("does not overwrite malformed stored journal data with a new note", async () => {
    const storage = installLocalStorage();
    storage.values.set(DEVICE_KEY, "{not valid json");

    const result = await upsertJournalEntry(createEntry(), new Date("2026-09-04T12:30:00.000Z"));

    expect(result).toMatchObject({ ok: false, reason: "read-failed" });
    expect(storage.values.get(DEVICE_KEY)).toBe("{not valid json");
  });

  it("does not overwrite a non-array journal payload with a new note", async () => {
    const storage = installLocalStorage();
    storage.values.set(DEVICE_KEY, JSON.stringify({ id: "unexpected-object" }));

    const result = await upsertJournalEntry(createEntry(), new Date("2026-09-04T12:30:00.000Z"));

    expect(result).toMatchObject({ ok: false, reason: "read-failed" });
    expect(storage.values.get(DEVICE_KEY)).toBe(JSON.stringify({ id: "unexpected-object" }));
  });

  it("keeps a note visible when a local delete cannot be verified", async () => {
    const storage = installLocalStorage();
    const now = new Date("2026-09-04T12:30:00.000Z");
    expect((await upsertJournalEntry(createEntry(), now)).ok).toBe(true);
    storage.failJournalWrites();

    const result = await deleteJournalEntry("journal-1", now);

    expect(result).toMatchObject({ ok: false, reason: "write-failed" });
    expect(listJournalEntries(now).map((entry) => entry.id)).toEqual(["journal-1"]);
  });

  it("clears only the selected recovery store and preserves the unscoped legacy store", async () => {
    const storage = installLocalStorage();
    const target = { scope: "account", ownerId: "user_a" } as const;
    storage.values.set(STORAGE_KEYS.localStateOwner, "user_a");
    storage.values.set(accountKey("user_a"), JSON.stringify([createEntry()]));
    storage.values.set(LEGACY_KEY, JSON.stringify([createEntry({ id: "legacy-note" })]));

    expect(await clearJournalEntries(target)).toBe(true);
    expect(storage.values.has(accountKey("user_a"))).toBe(false);
    expect(storage.values.has(LEGACY_KEY)).toBe(true);
  });

  it("does not report cleanup success when storage ignores removal", async () => {
    const storage = installLocalStorage();
    storage.values.set(DEVICE_KEY, JSON.stringify([createEntry()]));
    storage.values.set(LEGACY_KEY, JSON.stringify([createEntry({ id: "legacy-note" })]));
    storage.ignoreJournalRemovals();

    expect(await clearJournalEntries({ scope: "device" })).toBe(false);
    expect(storage.values.has(DEVICE_KEY)).toBe(true);
    expect(storage.values.has(LEGACY_KEY)).toBe(true);
  });

  it("removes only unchanged acknowledged snapshots from the owner-scoped store", async () => {
    const storage = installLocalStorage();
    const requestLock = installWebLocks();
    const target = { scope: "account", ownerId: "user_a" } as const;
    storage.values.set(STORAGE_KEYS.localStateOwner, "user_a");
    const submitted = createEntry({ id: "submitted-note" });
    const addedByAnotherTab = createEntry({
      id: "new-note",
      content: "Added while the request was in flight",
      blocks: [{ id: "new-block", kind: "text", content: "Added while the request was in flight" }],
    });
    const unacknowledgedLegacy = createEntry({ id: "legacy-only" });
    storage.values.set(accountKey("user_a"), JSON.stringify([submitted, addedByAnotherTab]));
    storage.values.set(LEGACY_KEY, JSON.stringify([submitted, unacknowledgedLegacy]));

    const result = await removeAcknowledgedJournalImportSources(
      target,
      [submitted],
      [submitted.id],
    );

    expect(result).toEqual({
      ok: true,
      removedEntryIds: [submitted.id],
      retainedEntryIds: [],
    });
    expect(JSON.parse(storage.values.get(accountKey("user_a")) ?? "[]"))
      .toEqual([addedByAnotherTab]);
    expect(JSON.parse(storage.values.get(LEGACY_KEY) ?? "[]"))
      .toEqual([submitted, unacknowledgedLegacy]);
    expect(requestLock).toHaveBeenCalledWith(
      "hifzer:private-journal-storage:user_a",
      { mode: "exclusive" },
      expect.any(Function),
    );
  });

  it("retains a source that changed after its submitted import snapshot", async () => {
    const storage = installLocalStorage();
    installWebLocks();
    const target = { scope: "account", ownerId: "user_a" } as const;
    storage.values.set(STORAGE_KEYS.localStateOwner, "user_a");
    const submitted = createEntry({ id: "changed-note" });
    const changed = createEntry({
      id: submitted.id,
      content: "A newer edit from another tab",
      blocks: [{ id: "changed-block", kind: "text", content: "A newer edit from another tab" }],
      updatedAt: "2026-09-04T12:05:00.000Z",
    });
    storage.values.set(accountKey("user_a"), JSON.stringify([changed]));

    const result = await removeAcknowledgedJournalImportSources(
      target,
      [submitted],
      [submitted.id],
    );

    expect(result).toEqual({
      ok: true,
      removedEntryIds: [],
      retainedEntryIds: [submitted.id],
    });
    expect(JSON.parse(storage.values.get(accountKey("user_a")) ?? "[]"))
      .toEqual([changed]);
  });

  it("uses stable fallback block ids so an unchanged blockless legacy source can be removed", async () => {
    const storage = installLocalStorage();
    const target = { scope: "account", ownerId: "user_a" } as const;
    storage.values.set(STORAGE_KEYS.localStateOwner, "user_a");
    const rawLegacyEntry = createEntry({ id: "blockless-note", blocks: undefined });
    storage.values.set(accountKey("user_a"), JSON.stringify([rawLegacyEntry]));
    const submitted = listJournalEntries(new Date("2026-09-04T12:30:00.000Z"), target);

    const result = await removeAcknowledgedJournalImportSources(
      target,
      submitted,
      [rawLegacyEntry.id],
    );

    expect(result).toEqual({
      ok: true,
      removedEntryIds: [rawLegacyEntry.id],
      retainedEntryIds: [],
    });
    expect(JSON.parse(storage.values.get(accountKey("user_a")) ?? "[]")).toEqual([]);
  });

  it("fails closed when cross-tab locking is unavailable", async () => {
    const storage = installLocalStorage();
    vi.stubGlobal("navigator", {});
    const target = { scope: "account", ownerId: "user_a" } as const;
    const submitted = createEntry({ id: "locked-note" });
    storage.values.set(accountKey("user_a"), JSON.stringify([submitted]));

    const result = await removeAcknowledgedJournalImportSources(
      target,
      [submitted],
      [submitted.id],
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "locking-unavailable",
      retainedEntryIds: [submitted.id],
    });
    expect(JSON.parse(storage.values.get(accountKey("user_a")) ?? "[]"))
      .toEqual([submitted]);
  });

  it("reports storage as unavailable outside the browser", async () => {
    const result = await upsertJournalEntry(createEntry(), new Date("2026-09-04T12:30:00.000Z"));

    expect(result).toMatchObject({
      ok: false,
      scope: "device",
      reason: "storage-unavailable",
    });
  });
});
