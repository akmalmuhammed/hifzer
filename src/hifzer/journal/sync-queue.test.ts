import { afterEach, describe, expect, it, vi } from "vitest";
import type { JournalEntry } from "./local-store";
import {
  JOURNAL_PENDING_MUTATION_LIMIT,
  JOURNAL_PENDING_MUTATION_MAX_AGE_MS,
  clearPendingJournalMutationFailure,
  enqueuePendingJournalMutation,
  isValidJournalEntryPayload,
  listPendingJournalMutations,
  markPendingJournalMutationAttempt,
  markPendingJournalMutationFailure,
  purgeExpiredPendingJournalCreates,
  removePendingJournalMutation,
  replacePendingJournalEntryMutationsAtomically,
  replacePendingJournalMutations,
  type JournalAccountStorageTarget,
  type JournalPendingMutation,
} from "./sync-queue";

const accountTarget = (ownerId: string): JournalAccountStorageTarget => ({ scope: "account", ownerId });
const queueKey = (ownerId: string) => `hifzer_private_journal_pending_mutations_v1:${ownerId}`;

function createEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: "local-entry-1",
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

function installLocalStorage() {
  const values = new Map<string, string>();
  values.set("hifzer_local_state_owner_v1", "user_a");
  const lockRequests: string[] = [];
  const lockTails = new Map<string, Promise<void>>();
  let writeFailure: Error | null = null;
  let ignoreQueueWrites = false;
  let queueWriteCount = 0;
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (key.startsWith("hifzer_private_journal_pending_mutations_v1:")) {
        queueWriteCount += 1;
        if (writeFailure) {
          throw writeFailure;
        }
        if (ignoreQueueWrites) {
          return;
        }
      }
      values.set(key, value);
    },
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
  vi.stubGlobal("window", { localStorage });
  vi.stubGlobal("navigator", {
    onLine: true,
    locks: {
      request: (name: string, _options: LockOptions, callback: () => unknown) => {
        lockRequests.push(name);
        const prior = lockTails.get(name) ?? Promise.resolve();
        const result = prior.then(callback);
        lockTails.set(name, result.then(() => undefined, () => undefined));
        return result;
      },
    },
  });
  return {
    values,
    lockRequests,
    reinstallWindow() {
      vi.stubGlobal("window", { localStorage });
    },
    failWrites() {
      writeFailure = new Error("quota exceeded");
    },
    ignoreWrites() {
      ignoreQueueWrites = true;
    },
    queueWriteCount() {
      return queueWriteCount;
    },
    resetQueueWriteCount() {
      queueWriteCount = 0;
    },
  };
}

function createStoredMutation(index: number): JournalPendingMutation {
  return {
    type: "create",
    clientMutationId: `mutation-${index}`,
    queuedAt: new Date(Date.UTC(2026, 8, 4, 12, 0, index)).toISOString(),
    attemptCount: 0,
    lastAttemptAt: null,
    lastFailure: null,
    entry: {
      ...createEntry({ id: `entry-${index}` }),
      version: 1,
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("journal pending mutation queue", () => {
  it("exports the structural journal entry validator used for response safety", () => {
    expect(isValidJournalEntryPayload(createEntry())).toBe(true);
    expect(isValidJournalEntryPayload({ ...createEntry(), tags: [42] })).toBe(false);
    expect(isValidJournalEntryPayload({ ...createEntry(), id: " " })).toBe(false);
  });

  it("requires an explicit account target and never writes a device queue", async () => {
    const storage = installLocalStorage();
    const result = await enqueuePendingJournalMutation(
      { scope: "device" } as unknown as JournalAccountStorageTarget,
      { type: "create", entry: createEntry() },
    );

    expect(result).toMatchObject({ ok: false, reason: "invalid-target" });
    expect([...storage.values.keys()].filter((key) => key.startsWith(
      "hifzer_private_journal_pending_mutations_v1:",
    ))).toEqual([]);
  });

  it("fails closed without Web Locks instead of claiming cross-tab durability", async () => {
    const storage = installLocalStorage();
    storage.values.set("hifzer_local_state_owner_v1", "user_without_locks");
    vi.stubGlobal("navigator", { onLine: true });

    const result = await enqueuePendingJournalMutation(
      accountTarget("user_without_locks"),
      { type: "create", entry: createEntry() },
    );

    expect(result).toMatchObject({ ok: false, reason: "locking-unavailable" });
    expect(storage.values.has(queueKey("user_without_locks"))).toBe(false);
  });

  it("fails closed when the browser rejects lock acquisition", async () => {
    const storage = installLocalStorage();
    storage.values.set("hifzer_local_state_owner_v1", "user_rejected_lock");
    vi.stubGlobal("navigator", {
      onLine: true,
      locks: {
        request: () => Promise.reject(new Error("lock service failed")),
      },
    });

    const result = await enqueuePendingJournalMutation(
      accountTarget("user_rejected_lock"),
      { type: "create", entry: createEntry() },
    );

    expect(result).toMatchObject({ ok: false, reason: "locking-failed" });
    expect(storage.values.has(queueKey("user_rejected_lock"))).toBe(false);
  });

  it("serializes concurrent writers for the same owner and preserves both writes", async () => {
    const storage = installLocalStorage();
    storage.values.set("hifzer_local_state_owner_v1", "shared_owner");
    const target = accountTarget("shared_owner");

    const firstWrite = enqueuePendingJournalMutation(target, {
      type: "create",
      clientMutationId: "tab-a",
      entry: createEntry({ id: "entry-a" }),
    });
    const secondWrite = enqueuePendingJournalMutation(target, {
      type: "create",
      clientMutationId: "tab-b",
      entry: createEntry({ id: "entry-b" }),
    });
    const [first, second] = await Promise.all([firstWrite, secondWrite]);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(storage.lockRequests).toEqual([
      "hifzer:private-journal-storage:shared_owner",
      "hifzer:private-journal-storage:shared_owner",
    ]);
    expect(listPendingJournalMutations(target).mutations.map((item) => item.clientMutationId))
      .toEqual(["tab-a", "tab-b"]);
  });

  it("persists a create with a stable mutation ID and defaults legacy entry versions to one", async () => {
    installLocalStorage();
    const target = accountTarget("user_a");
    const now = new Date("2026-09-04T12:30:00.000Z");
    const first = await enqueuePendingJournalMutation(
      target,
      {
        type: "create",
        clientMutationId: "stable-create-id",
        entry: createEntry(),
      },
      now,
    );

    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    expect(first.mutation).toMatchObject({
      type: "create",
      clientMutationId: "stable-create-id",
      queuedAt: now.toISOString(),
      attemptCount: 0,
      lastAttemptAt: null,
      lastFailure: null,
      entry: { id: "local-entry-1", version: 1 },
    });

    const duplicate = await enqueuePendingJournalMutation(
      target,
      {
        type: "create",
        clientMutationId: "stable-create-id",
        entry: createEntry({ content: "A duplicate retry payload" }),
      },
      new Date("2026-09-04T12:31:00.000Z"),
    );
    expect(duplicate.ok).toBe(true);
    expect(duplicate.mutations).toHaveLength(1);
    expect(duplicate.mutations[0]?.queuedAt).toBe(now.toISOString());
    expect(duplicate.mutations[0]?.type === "create" && duplicate.mutations[0].entry.content).toBe("Remember this.");
  });

  it("isolates queues by the server-resolved account owner", async () => {
    const storage = installLocalStorage();
    const now = new Date("2026-09-04T12:30:00.000Z");
    expect((await enqueuePendingJournalMutation(
      accountTarget("user_a"),
      { type: "create", clientMutationId: "a", entry: createEntry({ id: "a" }) },
      now,
    )).ok).toBe(true);
    storage.values.set("hifzer_local_state_owner_v1", "user_b");
    expect((await enqueuePendingJournalMutation(
      accountTarget("user_b"),
      { type: "create", clientMutationId: "b", entry: createEntry({ id: "b" }) },
      now,
    )).ok).toBe(true);

    expect(listPendingJournalMutations(accountTarget("user_a"), now).mutations.map((item) => item.clientMutationId)).toEqual(["a"]);
    expect(listPendingJournalMutations(accountTarget("user_b"), now).mutations.map((item) => item.clientMutationId)).toEqual(["b"]);
  });

  it("requires positive expected versions for updates and deletes", async () => {
    installLocalStorage();
    const target = accountTarget("user_a");

    expect(await enqueuePendingJournalMutation(target, {
      type: "update",
      entry: createEntry(),
      expectedVersion: 0,
    })).toMatchObject({ ok: false, reason: "invalid-payload" });
    expect(await enqueuePendingJournalMutation(target, {
      type: "delete",
      entryId: "local-entry-1",
      expectedVersion: -1,
    })).toMatchObject({ ok: false, reason: "invalid-payload" });
    expect(listPendingJournalMutations(target).mutations).toEqual([]);
  });

  it("compacts unattempted create and update operations into the original create slot", async () => {
    installLocalStorage();
    const target = accountTarget("user_a");
    const firstAt = new Date("2026-09-04T12:30:00.000Z");
    expect((await enqueuePendingJournalMutation(target, {
      type: "create",
      clientMutationId: "original-create-id",
      entry: createEntry(),
    }, firstAt)).ok).toBe(true);

    const result = await enqueuePendingJournalMutation(target, {
      type: "update",
      clientMutationId: "superseded-update-id",
      entry: createEntry({ content: "Latest content", version: 1 }),
      expectedVersion: 1,
    }, new Date("2026-09-04T12:31:00.000Z"));

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.outcome).toBe("compacted");
    expect(result.mutations).toHaveLength(1);
    expect(result.mutation).toMatchObject({
      type: "create",
      clientMutationId: "original-create-id",
      queuedAt: firstAt.toISOString(),
      entry: { content: "Latest content" },
    });
  });

  it("drops an unattempted create followed by delete", async () => {
    installLocalStorage();
    const target = accountTarget("user_a");
    expect((await enqueuePendingJournalMutation(target, {
      type: "create",
      clientMutationId: "local-create",
      entry: createEntry(),
    })).ok).toBe(true);

    const result = await enqueuePendingJournalMutation(target, {
      type: "delete",
      clientMutationId: "local-delete",
      entryId: "local-entry-1",
      expectedVersion: 1,
    });

    expect(result).toMatchObject({
      ok: true,
      mutation: null,
      outcome: "discarded-create-delete",
      mutations: [],
    });
  });

  it("compacts update chains while preserving the original expected version", async () => {
    installLocalStorage();
    const target = accountTarget("user_a");
    expect((await enqueuePendingJournalMutation(target, {
      type: "update",
      clientMutationId: "original-update",
      entry: createEntry({ id: "server-entry", content: "First edit", version: 3 }),
      expectedVersion: 3,
    })).ok).toBe(true);

    const latestUpdate = await enqueuePendingJournalMutation(target, {
      type: "update",
      clientMutationId: "later-update",
      entry: createEntry({ id: "server-entry", content: "Latest edit", version: 4 }),
      expectedVersion: 4,
    });
    expect(latestUpdate.ok).toBe(true);
    if (!latestUpdate.ok) {
      return;
    }
    expect(latestUpdate.mutation).toMatchObject({
      type: "update",
      clientMutationId: "original-update",
      expectedVersion: 3,
      entry: { content: "Latest edit" },
    });

    const deleted = await enqueuePendingJournalMutation(target, {
      type: "delete",
      clientMutationId: "later-delete",
      entryId: "server-entry",
      expectedVersion: 4,
    });
    expect(deleted.ok).toBe(true);
    if (!deleted.ok) {
      return;
    }
    expect(deleted.mutation).toMatchObject({
      type: "delete",
      clientMutationId: "original-update",
      expectedVersion: 3,
      entryId: "server-entry",
    });
    expect(deleted.mutations).toHaveLength(1);
  });

  it("never compacts an already-attempted mutation after an ambiguous response", async () => {
    installLocalStorage();
    const target = accountTarget("user_a");
    expect((await enqueuePendingJournalMutation(target, {
      type: "create",
      clientMutationId: "possibly-applied-create",
      entry: createEntry(),
    })).ok).toBe(true);
    expect((await markPendingJournalMutationAttempt(target, "possibly-applied-create")).ok).toBe(true);

    const result = await enqueuePendingJournalMutation(target, {
      type: "update",
      clientMutationId: "follow-up-update",
      entry: createEntry({ content: "Edit after the uncertain response" }),
      expectedVersion: 1,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.outcome).toBe("queued");
    expect(result.mutations.map((mutation) => mutation.clientMutationId)).toEqual([
      "possibly-applied-create",
      "follow-up-update",
    ]);
    expect(result.mutations[0]?.attemptCount).toBe(1);

    const deletion = await enqueuePendingJournalMutation(target, {
      type: "delete",
      clientMutationId: "follow-up-delete",
      entryId: "local-entry-1",
      expectedVersion: 1,
    });
    expect(deletion.ok).toBe(true);
    expect(deletion.mutations).toHaveLength(2);
    expect(deletion.mutations[0]).toMatchObject({
      type: "create",
      clientMutationId: "possibly-applied-create",
      attemptCount: 1,
    });
    expect(deletion.mutations[1]).toMatchObject({
      type: "delete",
      clientMutationId: "follow-up-update",
      expectedVersion: 1,
    });
  });

  it("discards already-expired creates and can durably purge creates that expire while queued", async () => {
    installLocalStorage();
    const target = accountTarget("user_a");
    const now = new Date("2026-09-04T12:30:00.000Z");
    const alreadyExpired = await enqueuePendingJournalMutation(target, {
      type: "create",
      clientMutationId: "expired-before-queue",
      entry: createEntry({
        type: "repentance",
        autoDeleteAt: "2026-09-04T12:29:59.000Z",
      }),
    }, now);
    expect(alreadyExpired).toMatchObject({
      ok: true,
      mutation: null,
      outcome: "discarded-expired-create",
      mutations: [],
    });

    expect((await enqueuePendingJournalMutation(target, {
      type: "create",
      clientMutationId: "expires-later",
      entry: createEntry({
        type: "repentance",
        autoDeleteAt: "2026-09-04T12:30:01.000Z",
      }),
    }, now)).ok).toBe(true);
    const afterExpiry = new Date("2026-09-04T12:30:02.000Z");
    const beforePurge = listPendingJournalMutations(target, afterExpiry);
    expect(beforePurge.expiredCreateClientMutationIds).toEqual(["expires-later"]);
    expect(beforePurge.automaticRetryMutations).toEqual([]);

    const purged = await purgeExpiredPendingJournalCreates(target, afterExpiry);
    expect(purged.ok).toBe(true);
    expect(purged.mutations).toEqual([]);
    expect(listPendingJournalMutations(target, afterExpiry).mutations).toEqual([]);
  });

  it("durably records retry attempts and conflict metadata across reloads", async () => {
    const storage = installLocalStorage();
    const target = accountTarget("user_a");
    const queuedAt = new Date("2026-09-04T12:30:00.000Z");
    const attemptAt = new Date("2026-09-04T12:31:00.000Z");
    const failedAt = new Date("2026-09-04T12:31:01.000Z");
    expect((await enqueuePendingJournalMutation(target, {
      type: "update",
      clientMutationId: "conflicting-update",
      entry: createEntry({ version: 4 }),
      expectedVersion: 4,
    }, queuedAt)).ok).toBe(true);
    expect((await markPendingJournalMutationAttempt(target, "conflicting-update", attemptAt)).ok).toBe(true);
    expect((await markPendingJournalMutationFailure(target, "conflicting-update", {
      disposition: "conflict",
      code: "VERSION_CONFLICT",
    }, failedAt)).ok).toBe(true);

    vi.unstubAllGlobals();
    storage.reinstallWindow();
    const result = listPendingJournalMutations(target, failedAt);

    expect(result.ok).toBe(true);
    expect(result.mutations[0]).toMatchObject({
      attemptCount: 1,
      lastAttemptAt: attemptAt.toISOString(),
      lastFailure: {
        disposition: "conflict",
        code: "VERSION_CONFLICT",
        at: failedAt.toISOString(),
      },
    });
    expect(result.blockedClientMutationIds).toEqual(["conflicting-update"]);
    expect(result.automaticRetryMutations).toEqual([]);
    expect(result.optimisticMutations).toEqual([]);
  });

  it("persists an authoritative conflict entry across reloads", async () => {
    const storage = installLocalStorage();
    const target = accountTarget("user_a");
    const now = new Date("2026-09-04T12:30:00.000Z");
    expect((await enqueuePendingJournalMutation(target, {
      type: "update",
      clientMutationId: "conflicting-update",
      entry: createEntry({ id: "server-entry", version: 3 }),
      expectedVersion: 3,
    }, now)).ok).toBe(true);

    expect((await markPendingJournalMutationFailure(target, "conflicting-update", {
      disposition: "conflict",
      code: "VERSION_CONFLICT",
      authoritativeEntryKnown: true,
      authoritativeEntry: createEntry({
        id: "server-entry",
        content: "The account copy",
        version: undefined,
      }),
    }, now)).ok).toBe(true);

    vi.unstubAllGlobals();
    storage.reinstallWindow();
    const reloaded = listPendingJournalMutations(target, now);
    expect(reloaded.ok).toBe(true);
    expect(reloaded.mutations[0]?.lastFailure).toMatchObject({
      disposition: "conflict",
      code: "VERSION_CONFLICT",
      authoritativeEntryKnown: true,
      authoritativeEntry: {
        id: "server-entry",
        content: "The account copy",
        version: 1,
      },
    });
  });

  it("persists a known authoritative deletion across reloads", async () => {
    const storage = installLocalStorage();
    const target = accountTarget("user_a");
    const now = new Date("2026-09-04T12:30:00.000Z");
    expect((await enqueuePendingJournalMutation(target, {
      type: "delete",
      clientMutationId: "conflicting-delete",
      entryId: "server-entry",
      expectedVersion: 3,
    }, now)).ok).toBe(true);

    expect((await markPendingJournalMutationFailure(target, "conflicting-delete", {
      disposition: "conflict",
      code: "VERSION_CONFLICT",
      authoritativeEntryKnown: true,
      authoritativeEntry: null,
    }, now)).ok).toBe(true);

    vi.unstubAllGlobals();
    storage.reinstallWindow();
    expect(listPendingJournalMutations(target, now).mutations[0]?.lastFailure).toMatchObject({
      authoritativeEntryKnown: true,
      authoritativeEntry: null,
    });
  });

  it("rejects ambiguous or invalid authoritative failure payloads", async () => {
    installLocalStorage();
    const target = accountTarget("user_a");
    const now = new Date("2026-09-04T12:30:00.000Z");
    expect((await enqueuePendingJournalMutation(target, {
      type: "update",
      clientMutationId: "conflicting-update",
      entry: createEntry({ id: "server-entry", version: 3 }),
      expectedVersion: 3,
    }, now)).ok).toBe(true);

    expect(await markPendingJournalMutationFailure(target, "conflicting-update", {
      disposition: "conflict",
      code: "VERSION_CONFLICT",
      authoritativeEntry: createEntry({ id: "server-entry" }),
    }, now)).toMatchObject({ ok: false, reason: "invalid-payload" });
    expect(await markPendingJournalMutationFailure(target, "conflicting-update", {
      disposition: "conflict",
      code: "VERSION_CONFLICT",
      authoritativeEntryKnown: true,
    }, now)).toMatchObject({ ok: false, reason: "invalid-payload" });
    expect(await markPendingJournalMutationFailure(target, "conflicting-update", {
      disposition: "conflict",
      code: "VERSION_CONFLICT",
      authoritativeEntryKnown: true,
      authoritativeEntry: {
        ...createEntry({ id: "server-entry" }),
        tags: [42],
      } as unknown as JournalEntry,
    }, now)).toMatchObject({ ok: false, reason: "invalid-payload" });

    expect(listPendingJournalMutations(target, now).mutations[0]?.lastFailure).toBeNull();
  });

  it("allows an explicit conflict resolution to clear the failure before retry", async () => {
    installLocalStorage();
    const target = accountTarget("user_a");
    const now = new Date("2026-09-04T12:30:00.000Z");
    const queued = await enqueuePendingJournalMutation(target, {
      type: "delete",
      clientMutationId: "delete-1",
      entryId: "server-entry-1",
      expectedVersion: 2,
    }, now);
    expect(queued.ok).toBe(true);
    expect((await markPendingJournalMutationFailure(target, "delete-1", {
      disposition: "conflict",
      code: "VERSION_CONFLICT",
    }, now)).ok).toBe(true);

    const cleared = await clearPendingJournalMutationFailure(target, "delete-1", now);
    expect(cleared.ok).toBe(true);
    if (!cleared.ok) {
      return;
    }
    expect(cleared.mutation?.lastFailure).toBeNull();
    expect(cleared.automaticRetryMutations.map((item) => item.clientMutationId)).toEqual(["delete-1"]);
  });

  it("flags over-age mutations without pruning or automatically applying them", async () => {
    installLocalStorage();
    const target = accountTarget("user_a");
    const now = new Date("2026-09-04T12:30:00.000Z");
    const queuedAt = new Date(now.getTime() - JOURNAL_PENDING_MUTATION_MAX_AGE_MS - 1);
    expect((await enqueuePendingJournalMutation(target, {
      type: "create",
      clientMutationId: "old-create",
      queuedAt: queuedAt.toISOString(),
      entry: createEntry(),
    }, now)).ok).toBe(true);

    const result = listPendingJournalMutations(target, now);
    expect(result.mutations.map((item) => item.clientMutationId)).toEqual(["old-create"]);
    expect(result.maxAgeExceededClientMutationIds).toEqual(["old-create"]);
    expect(result.automaticRetryMutations).toEqual([]);
    expect(result.optimisticMutations).toEqual([]);
  });

  it("rejects the 101st mutation and retains all one hundred existing mutations", async () => {
    installLocalStorage();
    const target = accountTarget("user_a");
    const fullQueue = Array.from({ length: JOURNAL_PENDING_MUTATION_LIMIT }, (_, index) => createStoredMutation(index));
    expect((await replacePendingJournalMutations(target, fullQueue)).ok).toBe(true);

    const overflow = await enqueuePendingJournalMutation(target, {
      type: "create",
      clientMutationId: "mutation-overflow",
      entry: createEntry({ id: "entry-overflow" }),
    });

    expect(overflow).toMatchObject({ ok: false, reason: "queue-full" });
    expect(overflow.mutations).toHaveLength(JOURNAL_PENDING_MUTATION_LIMIT);
    expect(listPendingJournalMutations(target).mutations).toHaveLength(JOURNAL_PENDING_MUTATION_LIMIT);
  });

  it("atomically replaces every mutation for one entry with one verified fresh mutation", async () => {
    const storage = installLocalStorage();
    const target = accountTarget("user_a");
    const now = new Date("2026-09-04T12:30:00.000Z");
    expect((await enqueuePendingJournalMutation(target, {
      type: "create",
      clientMutationId: "possibly-applied-create",
      entry: createEntry(),
    }, now)).ok).toBe(true);
    expect((await markPendingJournalMutationAttempt(target, "possibly-applied-create", now)).ok).toBe(true);
    expect((await enqueuePendingJournalMutation(target, {
      type: "update",
      clientMutationId: "follow-up-update",
      entry: createEntry({ content: "Latest local copy" }),
      expectedVersion: 1,
    }, now)).ok).toBe(true);
    expect((await enqueuePendingJournalMutation(target, {
      type: "delete",
      clientMutationId: "unrelated-delete",
      entryId: "another-entry",
      expectedVersion: 2,
    }, now)).ok).toBe(true);
    storage.resetQueueWriteCount();

    const result = await replacePendingJournalEntryMutationsAtomically(
      target,
      "local-entry-1",
      {
        type: "create",
        clientMutationId: "fresh-recovery-create",
        entry: createEntry({ id: "new-local-entry", content: "Latest local copy" }),
      },
      now,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(storage.queueWriteCount()).toBe(1);
    expect(result.replacement).toMatchObject({
      type: "create",
      clientMutationId: "fresh-recovery-create",
      attemptCount: 0,
      lastAttemptAt: null,
      lastFailure: null,
      entry: { id: "new-local-entry", content: "Latest local copy", version: 1 },
    });
    expect(result.mutations.map((mutation) => mutation.clientMutationId)).toEqual([
      "fresh-recovery-create",
      "unrelated-delete",
    ]);
    expect(listPendingJournalMutations(target, now).mutations).toEqual(result.mutations);
  });

  it("rejects invalid, expired, reused-ID, and overflowing atomic replacements without changing the queue", async () => {
    const storage = installLocalStorage();
    const target = accountTarget("user_a");
    const now = new Date("2026-09-04T12:30:00.000Z");
    const fullQueue = Array.from(
      { length: JOURNAL_PENDING_MUTATION_LIMIT },
      (_, index) => createStoredMutation(index),
    );
    expect((await replacePendingJournalMutations(target, fullQueue)).ok).toBe(true);
    const original = storage.values.get(queueKey("user_a"));

    expect(await replacePendingJournalEntryMutationsAtomically(target, "", {
      type: "delete",
      clientMutationId: "fresh-delete",
      entryId: "entry-0",
      expectedVersion: 1,
    }, now)).toMatchObject({ ok: false, reason: "invalid-payload" });
    expect(await replacePendingJournalEntryMutationsAtomically(target, "entry-0", {
      type: "create",
      clientMutationId: "fresh-expired-create",
      entry: createEntry({
        id: "fresh-entry",
        autoDeleteAt: "2026-09-04T12:29:59.000Z",
      }),
    }, now)).toMatchObject({ ok: false, reason: "expired-create" });
    expect(await replacePendingJournalEntryMutationsAtomically(target, "entry-0", {
      type: "delete",
      clientMutationId: "mutation-1",
      entryId: "entry-0",
      expectedVersion: 1,
    }, now)).toMatchObject({ ok: false, reason: "invalid-payload" });
    expect(await replacePendingJournalEntryMutationsAtomically(target, "entry-not-present", {
      type: "delete",
      clientMutationId: "fresh-overflow",
      entryId: "entry-not-present",
      expectedVersion: 1,
    }, now)).toMatchObject({ ok: false, reason: "queue-full" });

    expect(storage.values.get(queueKey("user_a"))).toBe(original);
    expect(listPendingJournalMutations(target, now).mutations).toEqual(fullQueue);
  });

  it("retains the durable old queue when an atomic replacement write or verification fails", async () => {
    const target = accountTarget("user_a");
    const failedStorage = installLocalStorage();
    const originalQueue = [createStoredMutation(0), createStoredMutation(1)];
    expect((await replacePendingJournalMutations(target, originalQueue)).ok).toBe(true);
    const originalRaw = failedStorage.values.get(queueKey("user_a"));
    failedStorage.failWrites();

    const writeFailed = await replacePendingJournalEntryMutationsAtomically(target, "entry-0", {
      type: "delete",
      clientMutationId: "replacement-delete",
      entryId: "entry-0",
      expectedVersion: 1,
    });
    expect(writeFailed).toMatchObject({ ok: false, reason: "write-failed" });
    expect(writeFailed.mutations).toEqual(originalQueue);
    expect(failedStorage.values.get(queueKey("user_a"))).toBe(originalRaw);

    vi.unstubAllGlobals();
    const ignoredStorage = installLocalStorage();
    expect((await replacePendingJournalMutations(target, originalQueue)).ok).toBe(true);
    const ignoredOriginalRaw = ignoredStorage.values.get(queueKey("user_a"));
    ignoredStorage.ignoreWrites();

    const verificationFailed = await replacePendingJournalEntryMutationsAtomically(target, "entry-0", {
      type: "delete",
      clientMutationId: "replacement-delete",
      entryId: "entry-0",
      expectedVersion: 1,
    });
    expect(verificationFailed).toMatchObject({ ok: false, reason: "verification-failed" });
    expect(verificationFailed.mutations).toEqual(originalQueue);
    expect(ignoredStorage.values.get(queueKey("user_a"))).toBe(ignoredOriginalRaw);
  });

  it("rejects an oversized replacement instead of silently slicing it", async () => {
    installLocalStorage();
    const target = accountTarget("user_a");
    const overflow = Array.from({ length: JOURNAL_PENDING_MUTATION_LIMIT + 1 }, (_, index) => createStoredMutation(index));

    expect(await replacePendingJournalMutations(target, overflow)).toMatchObject({
      ok: false,
      reason: "queue-full",
    });
    expect(listPendingJournalMutations(target).mutations).toEqual([]);
  });

  it("does not overwrite malformed stored queue data", async () => {
    const storage = installLocalStorage();
    const target = accountTarget("user_a");
    storage.values.set(queueKey("user_a"), "{not-json");

    const result = await enqueuePendingJournalMutation(target, {
      type: "create",
      entry: createEntry(),
    });

    expect(result).toMatchObject({ ok: false, reason: "invalid-payload" });
    expect(storage.values.get(queueKey("user_a"))).toBe("{not-json");
  });

  it("reports write and read-back verification failures without claiming durability", async () => {
    const target = accountTarget("user_a");
    const failedStorage = installLocalStorage();
    failedStorage.failWrites();
    expect(await enqueuePendingJournalMutation(target, {
      type: "create",
      entry: createEntry(),
    })).toMatchObject({ ok: false, reason: "write-failed" });

    vi.unstubAllGlobals();
    const ignoredStorage = installLocalStorage();
    ignoredStorage.ignoreWrites();
    expect(await enqueuePendingJournalMutation(target, {
      type: "create",
      entry: createEntry(),
    })).toMatchObject({ ok: false, reason: "verification-failed" });
    expect(ignoredStorage.values.has(queueKey("user_a"))).toBe(false);
  });

  it("removes only the acknowledged mutation and verifies the resulting queue", async () => {
    installLocalStorage();
    const target = accountTarget("user_a");
    expect((await enqueuePendingJournalMutation(target, {
      type: "create",
      clientMutationId: "first",
      entry: createEntry({ id: "first" }),
    })).ok).toBe(true);
    expect((await enqueuePendingJournalMutation(target, {
      type: "delete",
      clientMutationId: "second",
      entryId: "server-entry",
      expectedVersion: 1,
    })).ok).toBe(true);

    const result = await removePendingJournalMutation(target, "first");
    expect(result.ok).toBe(true);
    expect(result.mutations.map((item) => item.clientMutationId)).toEqual(["second"]);
  });
});
