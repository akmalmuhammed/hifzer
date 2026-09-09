import {
  deriveJournalContent,
  normalizeJournalEntry,
  type JournalBlock,
  type JournalEntry,
} from "./local-store";
import {
  isValidJournalEntryPayload,
  type JournalAccountStorageTarget,
  type JournalPendingMutation,
} from "./sync-queue";
import { classifyJournalMutationFailure } from "./sync-policy";
import { isHydratedJournalEntry } from "./sync-state";

export const LEGACY_JOURNAL_IMPORT_BATCH_SIZE = 200;

export type LegacyJournalImportAcknowledgement = {
  sourceEntryId: string;
  status: "created" | "already-identical" | "conflict";
  entry: JournalEntry | null;
};

export type LegacyJournalImportResult = {
  entries: JournalEntry[];
  acknowledgements: LegacyJournalImportAcknowledgement[];
};

function journalBlocksForImportComparison(blocks: JournalBlock[]): unknown[] {
  return blocks.map((block) => {
    if (block.kind === "text") {
      return { id: block.id, kind: block.kind, content: block.content };
    }
    if (block.kind === "ayah") {
      return { id: block.id, kind: block.kind, title: block.title, ayah: block.ayah };
    }
    return { id: block.id, kind: block.kind, title: block.title, dua: block.dua };
  });
}

function journalImportPayloadForComparison(entry: JournalEntry): {
  fingerprint: string;
  contentIsRepresentedByBlocks: boolean;
} {
  const normalized = normalizeJournalEntry(entry);
  const blocks = normalized.blocks ?? [];
  const quranFoundationClientEntryId = normalized.clientEntryId?.startsWith("qf-note:")
    ? normalized.clientEntryId
    : null;
  const contentWithoutTitle = deriveJournalContent("", blocks);
  const contentWithTitle = deriveJournalContent(normalized.title ?? "", blocks);
  return {
    fingerprint: JSON.stringify({
      clientEntryId: quranFoundationClientEntryId,
      type: normalized.type,
      title: normalized.title ?? "",
      blocks: journalBlocksForImportComparison(blocks),
      tags: normalized.tags,
      pinned: normalized.pinned,
      createdAt: normalized.createdAt,
      updatedAt: normalized.updatedAt,
      linkedAyah: normalized.linkedAyah ?? null,
      linkedDua: normalized.linkedDua ?? null,
      duaStatus: normalized.duaStatus ?? null,
      autoDeleteAt: normalized.autoDeleteAt ?? null,
    }),
    contentIsRepresentedByBlocks:
      normalized.content === contentWithoutTitle ||
      normalized.content === contentWithTitle,
  };
}

function journalImportPayloadsAreEquivalent(
  submitted: JournalEntry,
  authoritative: JournalEntry,
): boolean {
  try {
    const submittedPayload = journalImportPayloadForComparison(submitted);
    const authoritativePayload = journalImportPayloadForComparison(authoritative);
    return submittedPayload.contentIsRepresentedByBlocks &&
      authoritativePayload.contentIsRepresentedByBlocks &&
      submittedPayload.fingerprint === authoritativePayload.fingerprint;
  } catch {
    return false;
  }
}

export type JournalMutationTransportResult =
  | { ok: true; entry: JournalEntry | null }
  | {
      ok: false;
      status: number | null;
      code: string;
      message: string;
      retryable: boolean;
      conflict: boolean;
      authoritativeEntry: JournalEntry | null;
      authoritativeEntryKnown: boolean;
    };

export async function sendPendingJournalMutation(
  target: JournalAccountStorageTarget,
  mutation: JournalPendingMutation,
): Promise<JournalMutationTransportResult> {
  try {
    const response = mutation.type === "delete"
      ? await fetch(
          `/api/journal/${encodeURIComponent(mutation.entryId)}?${new URLSearchParams({
            ownerId: target.ownerId,
            clientMutationId: mutation.clientMutationId,
            expectedVersion: String(mutation.expectedVersion),
          }).toString()}`,
          { method: "DELETE" },
        )
      : await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...mutation.entry,
            ownerId: target.ownerId,
            clientMutationId: mutation.clientMutationId,
            mutationType: mutation.type,
            expectedVersion: mutation.type === "create" ? null : mutation.expectedVersion,
          }),
        });

    const payload = (await response.json().catch(() => null)) as {
      ok?: unknown;
      entry?: unknown;
      error?: string;
      code?: string;
      authoritativeEntry?: JournalEntry | null;
    } | null;
    if (
      response.ok &&
      mutation.type === "delete" &&
      (response.status === 204 || payload?.ok === true)
    ) {
      return { ok: true, entry: null };
    }
    if (
      response.ok &&
      isValidJournalEntryPayload(payload?.entry) &&
      isHydratedJournalEntry(payload.entry)
    ) {
      return { ok: true, entry: payload.entry };
    }
    if (response.ok) {
      return {
        ok: false,
        status: response.status,
        code: "INVALID_SUCCESS_PAYLOAD",
        message: "The account returned an incomplete save confirmation.",
        retryable: true,
        conflict: false,
        authoritativeEntry: null,
        authoritativeEntryKnown: false,
      };
    }

    const code = typeof payload?.code === "string" ? payload.code : `HTTP_${response.status}`;
    const policy = classifyJournalMutationFailure(response.status, code);
    const authoritativeEntryKnown = Boolean(
      payload && Object.prototype.hasOwnProperty.call(payload, "authoritativeEntry"),
    );
    const authoritativeEntry = authoritativeEntryKnown && (
      payload?.authoritativeEntry === null || isValidJournalEntryPayload(payload?.authoritativeEntry)
    )
      ? payload?.authoritativeEntry ?? null
      : null;
    return {
      ok: false,
      status: response.status,
      code,
      message: typeof payload?.error === "string" ? payload.error : "Could not sync this journal change.",
      retryable: policy.retryable,
      conflict: policy.conflict,
      authoritativeEntry,
      authoritativeEntryKnown:
        authoritativeEntryKnown && (
          payload?.authoritativeEntry === null || isValidJournalEntryPayload(payload?.authoritativeEntry)
        ),
    };
  } catch {
    return {
      ok: false,
      status: null,
      code: "NETWORK_ERROR",
      message: "The account journal is unreachable right now.",
      retryable: true,
      conflict: false,
      authoritativeEntry: null,
      authoritativeEntryKnown: false,
    };
  }
}

export async function importLegacyJournalEntries(
  ownerId: string,
  legacyEntries: JournalEntry[],
): Promise<LegacyJournalImportResult> {
  const sourceEntryIds = legacyEntries.map((entry) =>
    typeof entry.id === "string" ? entry.id.trim() : "",
  );
  if (
    sourceEntryIds.some((sourceEntryId, index) =>
      !sourceEntryId || sourceEntryId !== legacyEntries[index]?.id) ||
    new Set(sourceEntryIds).size !== sourceEntryIds.length
  ) {
    throw new Error("Every journal note in an import must have a unique stable source id.");
  }
  let importedEntries: JournalEntry[] = [];
  const acknowledgements: LegacyJournalImportAcknowledgement[] = [];
  for (
    let index = 0;
    index < legacyEntries.length;
    index += LEGACY_JOURNAL_IMPORT_BATCH_SIZE
  ) {
    const batch = legacyEntries.slice(index, index + LEGACY_JOURNAL_IMPORT_BATCH_SIZE);
    const response = await fetch("/api/journal/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId, entries: batch }),
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      entries?: unknown;
      acknowledgements?: unknown;
    } | null;
    if (!response.ok) {
      throw new Error(payload?.error ?? "Could not import old local notes.");
    }
    if (
      !Array.isArray(payload?.entries) ||
      !payload.entries.every(isValidJournalEntryPayload)
    ) {
      throw new Error("The account returned an incomplete journal import confirmation.");
    }
    importedEntries = payload.entries;

    if (!Array.isArray(payload.acknowledgements)) {
      throw new Error("The account did not confirm every journal note in this import batch.");
    }
    const batchSourceIds = batch.map((entry) => entry.id);
    const parsedAcknowledgements = payload.acknowledgements.flatMap((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return [];
      }
      const acknowledgement = value as Record<string, unknown>;
      const sourceEntryId = acknowledgement.sourceEntryId;
      const status = acknowledgement.status;
      const authoritativeEntry = acknowledgement.entry;
      if (
        typeof sourceEntryId !== "string" ||
        (status !== "created" && status !== "already-identical" && status !== "conflict") ||
        (
          authoritativeEntry !== null &&
          (!isValidJournalEntryPayload(authoritativeEntry) || !isHydratedJournalEntry(authoritativeEntry))
        ) ||
        (
          status !== "conflict" &&
          (
            !isValidJournalEntryPayload(authoritativeEntry) ||
            !isHydratedJournalEntry(authoritativeEntry) ||
            authoritativeEntry.originEntryId !== sourceEntryId
          )
        )
      ) {
        return [];
      }
      return [{
        sourceEntryId,
        status,
        entry: authoritativeEntry as JournalEntry | null,
      } satisfies LegacyJournalImportAcknowledgement];
    });
    if (
      parsedAcknowledgements.length !== batch.length ||
      parsedAcknowledgements.some((acknowledgement) =>
        !batchSourceIds.includes(acknowledgement.sourceEntryId)) ||
      batchSourceIds.some((sourceEntryId) =>
        parsedAcknowledgements.filter((acknowledgement) =>
          acknowledgement.sourceEntryId === sourceEntryId).length !==
        batchSourceIds.filter((candidate) => candidate === sourceEntryId).length)
    ) {
      throw new Error("The account did not confirm every journal note in this import batch.");
    }
    const remainingSourcesById = new Map<string, JournalEntry[]>();
    for (const source of batch) {
      const sameIdSources = remainingSourcesById.get(source.id) ?? [];
      sameIdSources.push(source);
      remainingSourcesById.set(source.id, sameIdSources);
    }
    acknowledgements.push(...parsedAcknowledgements.map((acknowledgement) => {
      const sameIdSources = remainingSourcesById.get(acknowledgement.sourceEntryId) ?? [];
      const source = sameIdSources.shift();
      if (
        acknowledgement.status !== "conflict" &&
        (
          !source ||
          !acknowledgement.entry ||
          !journalImportPayloadsAreEquivalent(source, acknowledgement.entry)
        )
      ) {
        return {
          ...acknowledgement,
          status: "conflict" as const,
        };
      }
      return acknowledgement;
    }));
  }
  const submittedBySourceId = new Map(
    legacyEntries.map((entry) => [entry.id, entry] as const),
  );
  const finalAcknowledgements = acknowledgements.map((acknowledgement) => {
    if (acknowledgement.status === "conflict") {
      return acknowledgement;
    }
    const submitted = submittedBySourceId.get(acknowledgement.sourceEntryId);
    const finalAccountEntry = importedEntries.find((entry) =>
      entry.originEntryId === acknowledgement.sourceEntryId);
    if (
      !submitted ||
      !finalAccountEntry ||
      !isHydratedJournalEntry(finalAccountEntry) ||
      !journalImportPayloadsAreEquivalent(submitted, finalAccountEntry)
    ) {
      return { ...acknowledgement, status: "conflict" as const };
    }
    return {
      ...acknowledgement,
      entry: finalAccountEntry,
    };
  });
  return { entries: importedEntries, acknowledgements: finalAcknowledgements };
}
