import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearJournalNavigationRecovery,
  readJournalNavigationRecovery,
  writeJournalNavigationRecovery,
  type JournalNavigationRecoveryDraft,
} from "./navigation-recovery";

function installSessionStorage() {
  const values = new Map<string, string>();
  let rejectWrites = false;
  const sessionStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (!rejectWrites) {
        values.set(key, value);
      }
    },
    removeItem: (key: string) => values.delete(key),
  };
  vi.stubGlobal("window", { sessionStorage });
  return {
    values,
    rejectWrites: () => {
      rejectWrites = true;
    },
  };
}

function createDraft(overrides: Partial<JournalNavigationRecoveryDraft> = {}) {
  return {
    id: "journal-1",
    baseVersion: 2,
    type: "reflection" as const,
    title: "",
    blocks: [{ id: "block-1", kind: "text" as const, content: "" }],
    tags: [],
    pinned: false,
    createdAt: "2026-09-04T12:00:00.000Z",
    duaStatus: "ongoing" as const,
    autoDeletePreset: "" as const,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("journal navigation recovery", () => {
  it("round-trips an explicitly cleared persisted draft", () => {
    installSessionStorage();
    const now = new Date("2026-09-04T12:30:00.000Z");
    const target = { scope: "account" as const, ownerId: "user_123" };
    const draft = createDraft();

    expect(writeJournalNavigationRecovery(draft, target, { now })).not.toBeNull();
    expect(readJournalNavigationRecovery(target, now)?.draft).toEqual(draft);
  });

  it("keeps account and device recovery snapshots isolated", () => {
    installSessionStorage();
    const now = new Date("2026-09-04T12:30:00.000Z");
    const account = { scope: "account" as const, ownerId: "user_123" };
    const device = { scope: "device" as const };

    writeJournalNavigationRecovery(createDraft({ title: "Account" }), account, { now });
    writeJournalNavigationRecovery(createDraft({ id: null, baseVersion: null, title: "Device" }), device, { now });

    expect(readJournalNavigationRecovery(account, now)?.draft.title).toBe("Account");
    expect(readJournalNavigationRecovery(device, now)?.draft.title).toBe("Device");
  });

  it("only clears the exact draft that was durably saved", () => {
    installSessionStorage();
    const now = new Date("2026-09-04T12:30:00.000Z");
    const target = { scope: "device" as const };
    const newer = createDraft({ title: "Newer words" });
    writeJournalNavigationRecovery(newer, target, { now });

    expect(clearJournalNavigationRecovery(target, createDraft({ title: "Older words" }))).toBe(false);
    expect(readJournalNavigationRecovery(target, now)?.draft.title).toBe("Newer words");
    expect(clearJournalNavigationRecovery(target, newer)).toBe(true);
    expect(readJournalNavigationRecovery(target, now)).toBeNull();
  });

  it("fails closed when session storage does not verify the write", () => {
    const storage = installSessionStorage();
    storage.rejectWrites();

    expect(writeJournalNavigationRecovery(
      createDraft(),
      { scope: "device" },
      { now: new Date("2026-09-04T12:30:00.000Z") },
    )).toBeNull();
    expect(storage.values.size).toBe(0);
  });
});
