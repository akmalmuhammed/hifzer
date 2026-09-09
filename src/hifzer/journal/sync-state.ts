import type { JournalEntry } from "./local-store";
import {
  hasJournalPendingMutationExceededMaxAge,
  type JournalPendingMutation,
} from "./sync-queue";

export type JournalPendingState = "queued" | "conflict" | "review";

export type JournalEntryIdentity = Pick<JournalEntry, "id" | "originEntryId">;
export type JournalEntryIdentityTarget = string | JournalEntryIdentity;

/** Summary list responses intentionally omit blocks and must never be edited directly. */
export function isHydratedJournalEntry(entry: JournalEntry): boolean {
  return Array.isArray(entry.blocks);
}

export type JournalConflictAuthority = {
  authoritativeEntry: JournalEntry | null;
  authoritativeEntryKnown: boolean;
};

/** Keeps a full conflict response from being downgraded by a later summary refresh. */
export function resolveJournalConflictAuthority(
  mutation: JournalPendingMutation,
  remoteSummary: JournalEntry | null,
  previous?: JournalConflictAuthority,
): JournalConflictAuthority {
  const failure = mutation.lastFailure;
  if (failure?.authoritativeEntryKnown === true) {
    return {
      authoritativeEntry: failure.authoritativeEntry ?? null,
      authoritativeEntryKnown: true,
    };
  }
  if (
    previous?.authoritativeEntryKnown === true &&
    (previous.authoritativeEntry === null || isHydratedJournalEntry(previous.authoritativeEntry))
  ) {
    return previous;
  }
  return {
    authoritativeEntry: remoteSummary,
    authoritativeEntryKnown: remoteSummary !== null,
  };
}

export function journalPendingMutationEntryId(mutation: JournalPendingMutation): string {
  return mutation.type === "delete" ? mutation.entryId : mutation.entry.id;
}

function journalEntryIdentityIds(target: JournalEntryIdentityTarget): string[] {
  if (typeof target === "string") {
    return target.trim() ? [target.trim()] : [];
  }

  const entryId = target.id.trim();
  const ids = entryId ? [entryId] : [];
  const originEntryId = target.originEntryId?.trim();
  if (originEntryId && originEntryId !== entryId) {
    ids.push(originEntryId);
  }
  return ids;
}

/** Matches a server row by canonical ID first, then by its stable client origin. */
export function findJournalEntryByIdOrOrigin(
  entries: JournalEntry[],
  entryId: string,
): JournalEntry | undefined {
  const normalizedEntryId = entryId.trim();
  if (!normalizedEntryId) {
    return undefined;
  }
  return entries.find((entry) => entry.id === normalizedEntryId) ??
    entries.find((entry) => entry.originEntryId === normalizedEntryId);
}

export function journalEntryMatchesId(entry: JournalEntryIdentity, entryId: string): boolean {
  const normalizedEntryId = entryId.trim();
  return Boolean(
    normalizedEntryId &&
    (entry.id === normalizedEntryId || entry.originEntryId === normalizedEntryId),
  );
}

export function journalPendingMutationMatchesEntry(
  mutation: JournalPendingMutation,
  target: JournalEntryIdentityTarget,
): boolean {
  const mutationEntryId = journalPendingMutationEntryId(mutation);
  return journalEntryIdentityIds(target).includes(mutationEntryId);
}

export function pendingJournalStateForEntry(
  target: JournalEntryIdentityTarget,
  mutations: JournalPendingMutation[],
  now: Date = new Date(),
): JournalPendingState | null {
  const matching = mutations.filter((mutation) =>
    journalPendingMutationMatchesEntry(mutation, target));
  if (matching.some((mutation) => mutation.lastFailure?.disposition === "conflict")) {
    return "conflict";
  }
  if (
    matching.some(
      (mutation) =>
        mutation.lastFailure?.disposition === "terminal" ||
        hasJournalPendingMutationExceededMaxAge(mutation, now),
    )
  ) {
    return "review";
  }
  return matching.length > 0 ? "queued" : null;
}

/**
 * Projects the durable owner-scoped outbox over the server read model. Content
 * mutations stay visible even when blocked so a private draft never disappears.
 * A blocked/expired delete is not projected because the server still owns the
 * authoritative copy and destructive intent must be confirmed again.
 */
export function projectPendingJournalMutations(
  baseEntries: JournalEntry[],
  mutations: JournalPendingMutation[],
  now: Date = new Date(),
): JournalEntry[] {
  const byId = new Map(baseEntries.map((entry) => [entry.id, entry]));

  for (const mutation of mutations) {
    const mutationEntryId = journalPendingMutationEntryId(mutation);
    const matchedEntry = findJournalEntryByIdOrOrigin([...byId.values()], mutationEntryId);
    const projectedEntryId = matchedEntry?.id ?? mutationEntryId;

    if (mutation.type === "delete") {
      const blocked = mutation.lastFailure?.disposition === "conflict" ||
        mutation.lastFailure?.disposition === "terminal" ||
        hasJournalPendingMutationExceededMaxAge(mutation, now);
      if (!blocked) {
        byId.delete(projectedEntryId);
      }
      continue;
    }

    if (!matchedEntry) {
      byId.set(mutation.entry.id, mutation.entry);
      continue;
    }

    // The durable mutation stays byte-for-byte addressed to its original local
    // ID. Only the read model is reconciled onto the canonical server identity.
    const projectedEntry: JournalEntry = {
      ...matchedEntry,
      ...mutation.entry,
      id: matchedEntry.id,
    };
    const originEntryId = matchedEntry.originEntryId ??
      mutation.entry.originEntryId ??
      (matchedEntry.id !== mutationEntryId ? mutationEntryId : matchedEntry.originEntryId);
    if (originEntryId !== undefined) {
      projectedEntry.originEntryId = originEntryId;
    }
    const clientEntryId = matchedEntry.clientEntryId ??
      mutation.entry.clientEntryId ??
      matchedEntry.clientEntryId;
    if (clientEntryId !== undefined) {
      projectedEntry.clientEntryId = clientEntryId;
    }
    byId.set(matchedEntry.id, projectedEntry);
  }

  return [...byId.values()].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function withoutPendingJournalEntry(
  mutations: JournalPendingMutation[],
  target: JournalEntryIdentityTarget,
): JournalPendingMutation[] {
  return mutations.filter((mutation) => !journalPendingMutationMatchesEntry(mutation, target));
}
