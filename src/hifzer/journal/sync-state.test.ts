import { describe, expect, it } from "vitest";
import type { JournalEntry } from "./local-store";
import type { JournalPendingMutation } from "./sync-queue";
import {
  findJournalEntryByIdOrOrigin,
  isHydratedJournalEntry,
  journalPendingMutationMatchesEntry,
  pendingJournalStateForEntry,
  projectPendingJournalMutations,
  resolveJournalConflictAuthority,
  withoutPendingJournalEntry,
} from "./sync-state";

const now = new Date("2026-09-05T00:00:00.000Z");

function entry(id: string, version: number, content = id): JournalEntry {
  return {
    id,
    version,
    type: "reflection",
    title: "",
    content,
    blocks: [{ id: `block_${id}`, kind: "text", content }],
    tags: [],
    pinned: false,
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  };
}

function canonicalEntry(originEntryId: string, content = "account"): JournalEntry {
  return {
    ...entry("canonical-note", 2, content),
    originEntryId,
  };
}

function updateMutation(
  id: string,
  failure: JournalPendingMutation["lastFailure"] = null,
): JournalPendingMutation {
  return {
    type: "update",
    clientMutationId: `mutation_${id}`,
    entry: entry(id, 3, "local draft"),
    expectedVersion: 2,
    queuedAt: "2026-09-05T00:00:00.000Z",
    attemptCount: 0,
    lastAttemptAt: null,
    lastFailure: failure,
  };
}

describe("journal pending-state projection", () => {
  it("distinguishes editable full entries from summary-only entries", () => {
    const fullEntry = entry("note-a", 2);

    expect(isHydratedJournalEntry(fullEntry)).toBe(true);
    expect(isHydratedJournalEntry({ ...fullEntry, blocks: undefined })).toBe(false);
    expect(isHydratedJournalEntry({ ...fullEntry, blocks: [] })).toBe(true);
  });

  it("keeps a durable full conflict copy when summaries refresh", () => {
    const authoritative = entry("server-note", 3, "full account copy");
    const mutation = updateMutation("local-note", {
      disposition: "conflict",
      code: "CLIENT_ENTRY_ID_CONFLICT",
      at: now.toISOString(),
      authoritativeEntryKnown: true,
      authoritativeEntry: authoritative,
    });
    const summary = { ...authoritative, blocks: undefined, content: "summary" };

    expect(resolveJournalConflictAuthority(mutation, summary)).toEqual({
      authoritativeEntry: authoritative,
      authoritativeEntryKnown: true,
    });
  });

  it("preserves an authoritative deletion across reload", () => {
    const mutation = updateMutation("note-a", {
      disposition: "conflict",
      code: "VERSION_CONFLICT",
      at: now.toISOString(),
      authoritativeEntryKnown: true,
      authoritativeEntry: null,
    });

    expect(resolveJournalConflictAuthority(mutation, entry("note-a", 2))).toEqual({
      authoritativeEntry: null,
      authoritativeEntryKnown: true,
    });
  });

  it("layers queued content over the remote list without removing unrelated notes", () => {
    const projected = projectPendingJournalMutations(
      [entry("note-a", 2, "remote"), entry("note-b", 1)],
      [updateMutation("note-a")],
      now,
    );

    expect(projected.find((item) => item.id === "note-a")?.content).toBe("local draft");
    expect(projected.some((item) => item.id === "note-b")).toBe(true);
  });

  it("projects a queued local alias onto its canonical account identity", () => {
    const remote = canonicalEntry("local-note", "account");
    const mutation = updateMutation("local-note");
    const attemptedPayload = structuredClone(mutation);

    const projected = projectPendingJournalMutations([remote, entry("note-b", 1)], [mutation], now);

    expect(projected).toHaveLength(2);
    expect(projected.find((item) => item.id === "canonical-note")).toMatchObject({
      id: "canonical-note",
      originEntryId: "local-note",
      content: "local draft",
    });
    expect(projected.some((item) => item.id === "local-note")).toBe(false);
    expect(findJournalEntryByIdOrOrigin(projected, "local-note")?.id).toBe("canonical-note");
    expect(mutation).toEqual(attemptedPayload);
  });

  it("uses canonical IDs before origin aliases when resolving an ambiguous identifier", () => {
    const direct = entry("local-note", 1, "direct canonical row");
    const aliased = canonicalEntry("local-note", "origin alias row");

    expect(findJournalEntryByIdOrOrigin([aliased, direct], "local-note")).toBe(direct);
  });

  it("uses active deletes as tombstones but restores a conflicting delete", () => {
    const deletion: JournalPendingMutation = {
      type: "delete",
      clientMutationId: "mutation_delete",
      entryId: "note-a",
      expectedVersion: 2,
      queuedAt: now.toISOString(),
      attemptCount: 0,
      lastAttemptAt: null,
      lastFailure: null,
    };

    expect(projectPendingJournalMutations([entry("note-a", 2)], [deletion], now)).toEqual([]);
    expect(projectPendingJournalMutations(
      [entry("note-a", 3)],
      [{
        ...deletion,
        lastFailure: { disposition: "conflict", code: "VERSION_CONFLICT", at: now.toISOString() },
      }],
      now,
    )).toHaveLength(1);
  });

  it("tombstones the canonical row for an active delete addressed to its origin", () => {
    const deletion: JournalPendingMutation = {
      type: "delete",
      clientMutationId: "mutation_delete_alias",
      entryId: "local-note",
      expectedVersion: 2,
      queuedAt: now.toISOString(),
      attemptCount: 0,
      lastAttemptAt: null,
      lastFailure: null,
    };

    expect(projectPendingJournalMutations([canonicalEntry("local-note")], [deletion], now)).toEqual([]);
  });

  it("keeps a conflicted local edit visible and marks it for resolution", () => {
    const mutation = updateMutation("note-a", {
      disposition: "conflict",
      code: "VERSION_CONFLICT",
      at: now.toISOString(),
    });
    const projected = projectPendingJournalMutations([entry("note-a", 3, "account")], [mutation], now);

    expect(projected[0]?.content).toBe("local draft");
    expect(pendingJournalStateForEntry("note-a", [mutation], now)).toBe("conflict");
    expect(withoutPendingJournalEntry([mutation], "note-a")).toEqual([]);
  });

  it("keeps pending, conflict, and review state attached after a canonical remap", () => {
    const identity = canonicalEntry("local-note");
    const queued = updateMutation("local-note");
    const conflict = updateMutation("local-note", {
      disposition: "conflict",
      code: "VERSION_CONFLICT",
      at: now.toISOString(),
    });
    const review = updateMutation("local-note", {
      disposition: "terminal",
      code: "OWNER_MISMATCH",
      at: now.toISOString(),
    });

    expect(journalPendingMutationMatchesEntry(queued, identity)).toBe(true);
    expect(pendingJournalStateForEntry(identity, [queued], now)).toBe("queued");
    expect(pendingJournalStateForEntry(identity, [conflict], now)).toBe("conflict");
    expect(pendingJournalStateForEntry(identity, [review], now)).toBe("review");
    expect(withoutPendingJournalEntry([queued], identity)).toEqual([]);
  });
});
