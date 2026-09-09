import { afterEach, describe, expect, it, vi } from "vitest";
import { withJournalOwnerStorageLock } from "@/hifzer/journal/storage-lock";
import { enqueuePendingJournalMutation } from "@/hifzer/journal/sync-queue";
import { getLocalStateOwner, STORAGE_KEYS, syncLocalStateOwner } from "./store";

type StorageFailurePlan = {
  get?: Set<string>;
  set?: Set<string>;
  remove?: Set<string>;
};

function createMemoryStorage(
  values: Map<string, string>,
  failures: StorageFailurePlan = {},
) {
  return {
    get length() {
      return values.size;
    },
    getItem: (key: string) => {
      if (failures.get?.has(key)) {
        throw new Error(`Blocked getItem: ${key}`);
      }
      return values.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      if (failures.set?.has(key)) {
        throw new Error(`Blocked setItem: ${key}`);
      }
      values.set(key, value);
    },
    removeItem: (key: string) => {
      if (failures.remove?.has(key)) {
        throw new Error(`Blocked removeItem: ${key}`);
      }
      values.delete(key);
    },
    clear: () => values.clear(),
    key: (index: number) => Array.from(values.keys())[index] ?? null,
  };
}

function installBrowserStorage(input: {
  localFailures?: StorageFailurePlan;
  sessionFailures?: StorageFailurePlan;
} = {}) {
  const localValues = new Map<string, string>();
  const sessionValues = new Map<string, string>();
  const localStorage = createMemoryStorage(localValues, input.localFailures);
  const sessionStorage = createMemoryStorage(sessionValues, input.sessionFailures);

  vi.stubGlobal("window", { localStorage, sessionStorage });
  installWebLocks();
  return {
    localValues,
    sessionValues,
    localFailures: input.localFailures,
    sessionFailures: input.sessionFailures,
  };
}

function installWebLocks() {
  const lockTails = new Map<string, Promise<void>>();
  const request = vi.fn((
    name: string,
    _options: { mode: "exclusive" },
    operation: () => unknown,
  ) => {
    const prior = lockTails.get(name) ?? Promise.resolve();
    const result = prior.then(operation);
    lockTails.set(name, result.then(() => undefined, () => undefined));
    return result;
  });
  vi.stubGlobal("navigator", { locks: { request } });
  return request;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("local/store account scoping", () => {
  it("preserves user-scoped state while identity is unresolved", async () => {
    const { localValues, sessionValues } = installBrowserStorage();
    localValues.set(STORAGE_KEYS.localStateOwner, "user_old");
    localValues.set(STORAGE_KEYS.bookmarks, "saved-bookmarks");
    localValues.set("hifzer_private_journal_entries_v2:user_old", "saved-journal");
    localValues.set("hifzer_private_journal_pending_mutations_v1:user_old", "saved-queue");
    sessionValues.set("hifzer.dashboard.summary.v1", "saved-summary");

    await syncLocalStateOwner({ status: "unresolved" });
    await syncLocalStateOwner(undefined);
    await syncLocalStateOwner(null);

    expect(localValues.get(STORAGE_KEYS.localStateOwner)).toBe("user_old");
    expect(localValues.get(STORAGE_KEYS.bookmarks)).toBe("saved-bookmarks");
    expect(localValues.get("hifzer_private_journal_entries_v2:user_old")).toBe("saved-journal");
    expect(localValues.get("hifzer_private_journal_pending_mutations_v1:user_old")).toBe("saved-queue");
    expect(sessionValues.get("hifzer.dashboard.summary.v1")).toBe("saved-summary");
  });

  it("clears user-scoped state after a confirmed sign-out", async () => {
    const { localValues, sessionValues } = installBrowserStorage();
    localValues.set(STORAGE_KEYS.localStateOwner, "user_old");
    localValues.set(STORAGE_KEYS.bookmarks, "saved-bookmarks");
    localValues.set("hifzer_private_journal_entries_v2:user_old", "saved-journal");
    localValues.set("hifzer_private_journal_pending_mutations_v1:user_old", "saved-queue");
    localValues.set("hifzer_private_journal_device_entries_v1", "device-journal");
    localValues.set(STORAGE_KEYS.cutoverApplied, "1");
    localValues.set("unrelated", "keep-me");
    sessionValues.set("hifzer.dashboard.summary.v1", "saved-summary");

    await syncLocalStateOwner({ status: "signed-out" });

    expect(localValues.has(STORAGE_KEYS.localStateOwner)).toBe(false);
    expect(localValues.has(STORAGE_KEYS.bookmarks)).toBe(false);
    expect(localValues.has("hifzer_private_journal_entries_v2:user_old")).toBe(false);
    expect(localValues.has("hifzer_private_journal_pending_mutations_v1:user_old")).toBe(false);
    expect(localValues.get("hifzer_private_journal_device_entries_v1")).toBe("device-journal");
    expect(sessionValues.has("hifzer.dashboard.summary.v1")).toBe(false);
    expect(localValues.get(STORAGE_KEYS.cutoverApplied)).toBe("1");
    expect(localValues.get("unrelated")).toBe("keep-me");
  });

  it("preserves device state when signed-out identity is already established", async () => {
    const { localValues, sessionValues } = installBrowserStorage();
    localValues.set(STORAGE_KEYS.bookmarks, "device-bookmarks");
    localValues.set("hifzer_private_journal_device_entries_v1", "device-journal");
    sessionValues.set("hifzer.dashboard.summary.v1", "device-summary");

    await syncLocalStateOwner({ status: "signed-out" });
    await syncLocalStateOwner({ status: "signed-out" });

    expect(localValues.get(STORAGE_KEYS.bookmarks)).toBe("device-bookmarks");
    expect(localValues.get("hifzer_private_journal_device_entries_v1")).toBe("device-journal");
    expect(sessionValues.get("hifzer.dashboard.summary.v1")).toBe("device-summary");
  });

  it("keeps user-scoped state when the confirmed account is unchanged", async () => {
    const { localValues } = installBrowserStorage();
    localValues.set(STORAGE_KEYS.localStateOwner, "user_same");
    localValues.set(STORAGE_KEYS.bookmarks, "saved-bookmarks");

    await syncLocalStateOwner({ status: "signed-in", clerkUserId: "user_same" });

    expect(localValues.get(STORAGE_KEYS.localStateOwner)).toBe("user_same");
    expect(localValues.get(STORAGE_KEYS.bookmarks)).toBe("saved-bookmarks");
  });

  it("accepts a confirmed Clerk user ID from existing callers", async () => {
    const { localValues } = installBrowserStorage();
    localValues.set(STORAGE_KEYS.bookmarks, "local-bookmarks");

    await syncLocalStateOwner("user_new");

    expect(localValues.get(STORAGE_KEYS.localStateOwner)).toBe("user_new");
    expect(localValues.get(STORAGE_KEYS.bookmarks)).toBe("local-bookmarks");
  });

  it("clears user-scoped onboarding state when the signed-in account changes", async () => {
    const { localValues } = installBrowserStorage();
    localValues.set(STORAGE_KEYS.localStateOwner, "user_old");
    localValues.set(STORAGE_KEYS.onboardingAssessment, "{}");
    localValues.set(STORAGE_KEYS.dashboardFirstRunGuide, "dismissed");
    localValues.set(STORAGE_KEYS.hifzCursorAyahId, "42");
    localValues.set("hifzer_private_journal_entries_v2:user_old", "old-journal");
    localValues.set("hifzer_private_journal_pending_mutations_v1:user_old", "old-queue");
    localValues.set("hifzer_private_journal_device_entries_v1", "device-journal");
    localValues.set(STORAGE_KEYS.cutoverApplied, "1");

    await syncLocalStateOwner({ status: "signed-in", clerkUserId: "user_new" });

    expect(localValues.get(STORAGE_KEYS.localStateOwner)).toBe("user_new");
    expect(localValues.has(STORAGE_KEYS.onboardingAssessment)).toBe(false);
    expect(localValues.has(STORAGE_KEYS.dashboardFirstRunGuide)).toBe(false);
    expect(localValues.has(STORAGE_KEYS.hifzCursorAyahId)).toBe(false);
    expect(localValues.has("hifzer_private_journal_entries_v2:user_old")).toBe(false);
    expect(localValues.has("hifzer_private_journal_pending_mutations_v1:user_old")).toBe(false);
    expect(localValues.get("hifzer_private_journal_device_entries_v1")).toBe("device-journal");
    expect(localValues.get(STORAGE_KEYS.cutoverApplied)).toBe("1");
  });

  it("does not throw when access to localStorage is blocked", async () => {
    const blockedWindow = Object.defineProperty({}, "localStorage", {
      get() {
        throw new Error("localStorage is blocked");
      },
    });
    vi.stubGlobal("window", blockedWindow);

    expect(getLocalStateOwner()).toBeNull();
    expect(await syncLocalStateOwner({ status: "signed-in", clerkUserId: "user_new" })).toBe(false);
  });

  it("does not change state when the current owner cannot be read", async () => {
    const localFailures: StorageFailurePlan = {
      get: new Set([STORAGE_KEYS.localStateOwner]),
    };
    const { localValues } = installBrowserStorage({ localFailures });
    localValues.set(STORAGE_KEYS.localStateOwner, "user_old");
    localValues.set(STORAGE_KEYS.bookmarks, "saved-bookmarks");

    expect(await syncLocalStateOwner({ status: "signed-in", clerkUserId: "user_new" })).toBe(false);

    expect(localValues.get(STORAGE_KEYS.localStateOwner)).toBe("user_old");
    expect(localValues.get(STORAGE_KEYS.bookmarks)).toBe("saved-bookmarks");
  });

  it("keeps the departing owner marker until failed local cleanup can be retried", async () => {
    const localFailures: StorageFailurePlan = {
      remove: new Set([STORAGE_KEYS.bookmarks]),
    };
    const { localValues } = installBrowserStorage({ localFailures });
    localValues.set(STORAGE_KEYS.localStateOwner, "user_old");
    localValues.set(STORAGE_KEYS.bookmarks, "saved-bookmarks");

    expect(await syncLocalStateOwner({ status: "signed-in", clerkUserId: "user_new" })).toBe(false);

    expect(localValues.get(STORAGE_KEYS.localStateOwner)).toBe("user_old");
    expect(localValues.get(STORAGE_KEYS.bookmarks)).toBe("saved-bookmarks");

    localFailures.remove?.clear();
    expect(await syncLocalStateOwner({ status: "signed-in", clerkUserId: "user_new" })).toBe(true);

    expect(localValues.get(STORAGE_KEYS.localStateOwner)).toBe("user_new");
    expect(localValues.has(STORAGE_KEYS.bookmarks)).toBe(false);
  });

  it("keeps the owner marker when session cleanup fails during sign-out", async () => {
    const sessionFailures: StorageFailurePlan = {
      remove: new Set(["hifzer.dashboard.summary.v1"]),
    };
    const { localValues, sessionValues } = installBrowserStorage({ sessionFailures });
    localValues.set(STORAGE_KEYS.localStateOwner, "user_old");
    localValues.set(STORAGE_KEYS.bookmarks, "saved-bookmarks");
    sessionValues.set("hifzer.dashboard.summary.v1", "saved-summary");

    expect(await syncLocalStateOwner({ status: "signed-out" })).toBe(false);

    expect(localValues.get(STORAGE_KEYS.localStateOwner)).toBe("user_old");
    expect(localValues.has(STORAGE_KEYS.bookmarks)).toBe(false);
    expect(sessionValues.get("hifzer.dashboard.summary.v1")).toBe("saved-summary");

    sessionFailures.remove?.clear();
    expect(await syncLocalStateOwner({ status: "signed-out" })).toBe(true);

    expect(localValues.has(STORAGE_KEYS.localStateOwner)).toBe(false);
    expect(sessionValues.has("hifzer.dashboard.summary.v1")).toBe(false);
  });

  it("fails owner reconciliation closed when cross-tab locking is unavailable", async () => {
    const { localValues } = installBrowserStorage();
    localValues.set(STORAGE_KEYS.localStateOwner, "user_old");
    localValues.set(STORAGE_KEYS.bookmarks, "saved-bookmarks");
    localValues.set("hifzer_private_journal_pending_mutations_v1:user_old", "saved-queue");
    vi.stubGlobal("navigator", {});

    expect(await syncLocalStateOwner({ status: "signed-out" })).toBe(false);
    expect(localValues.get(STORAGE_KEYS.localStateOwner)).toBe("user_old");
    expect(localValues.get(STORAGE_KEYS.bookmarks)).toBe("saved-bookmarks");
    expect(localValues.get("hifzer_private_journal_pending_mutations_v1:user_old"))
      .toBe("saved-queue");
  });

  it("waits for an in-flight old-owner write and rejects stale writes after sign-out", async () => {
    const { localValues } = installBrowserStorage();
    const queueKey = "hifzer_private_journal_pending_mutations_v1:user_old";
    localValues.set(STORAGE_KEYS.localStateOwner, "user_old");
    localValues.set("hifzer_private_journal_device_entries_v1", "device-journal");

    let releaseWrite: () => void = () => undefined;
    let announceWriteStarted: () => void = () => undefined;
    const writeCanFinish = new Promise<void>((resolve) => {
      releaseWrite = resolve;
    });
    const writeStarted = new Promise<void>((resolve) => {
      announceWriteStarted = resolve;
    });
    const inFlightWrite = withJournalOwnerStorageLock("user_old", async () => {
      announceWriteStarted();
      await writeCanFinish;
      localValues.set(queueKey, "in-flight-write");
    });
    await writeStarted;

    const signOut = syncLocalStateOwner({ status: "signed-out" });
    expect(localValues.get(STORAGE_KEYS.localStateOwner)).toBe("user_old");
    releaseWrite();
    expect((await inFlightWrite).ok).toBe(true);
    expect(await signOut).toBe(true);
    expect(localValues.has(queueKey)).toBe(false);
    expect(localValues.has(STORAGE_KEYS.localStateOwner)).toBe(false);
    expect(localValues.get("hifzer_private_journal_device_entries_v1")).toBe("device-journal");

    const staleWrite = await enqueuePendingJournalMutation(
      { scope: "account", ownerId: "user_old" },
      {
        type: "create",
        clientMutationId: "stale-after-signout",
        entry: {
          id: "stale-note",
          type: "reflection",
          title: "Stale note",
          content: "Must not return after sign-out.",
          blocks: [{ id: "block-1", kind: "text", content: "Must not return after sign-out." }],
          tags: [],
          pinned: false,
          createdAt: "2026-09-04T12:00:00.000Z",
          updatedAt: "2026-09-04T12:00:00.000Z",
          linkedAyah: null,
          linkedDua: null,
          duaStatus: null,
          autoDeleteAt: null,
        },
      },
    );
    expect(staleWrite).toMatchObject({ ok: false, reason: "owner-mismatch" });
    expect(localValues.has(queueKey)).toBe(false);
  });
});
