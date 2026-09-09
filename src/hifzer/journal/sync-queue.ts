import {
  JOURNAL_ENTRY_TYPES,
  normalizeJournalEntry,
  type JournalEntry,
} from "./local-store";
import { withJournalOwnerStorageLock } from "./storage-lock";

export const JOURNAL_PENDING_MUTATION_LIMIT = 100;
export const JOURNAL_PENDING_MUTATION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const JOURNAL_PENDING_MUTATION_KEY_PREFIX = "hifzer_private_journal_pending_mutations_v1:";
const MAX_CLIENT_MUTATION_ID_LENGTH = 128;
const MAX_FAILURE_CODE_LENGTH = 128;

export type JournalAccountStorageTarget = {
  scope: "account";
  ownerId: string;
};

export type JournalMutationFailureDisposition = "retryable" | "conflict" | "terminal";

export type JournalMutationFailure = {
  disposition: JournalMutationFailureDisposition;
  code: string;
  at: string;
  /**
   * Distinguishes a server-confirmed deletion (`true` + `null`) from a
   * response where no authoritative entry snapshot was available.
   */
  authoritativeEntryKnown?: boolean;
  authoritativeEntry?: JournalEntry | null;
};

export type JournalMutationFailureInput = Pick<
  JournalMutationFailure,
  "disposition" | "code"
> & {
  authoritativeEntryKnown?: boolean;
  authoritativeEntry?: JournalEntry | null;
};

type JournalPendingMutationBase = {
  clientMutationId: string;
  queuedAt: string;
  attemptCount: number;
  lastAttemptAt: string | null;
  lastFailure: JournalMutationFailure | null;
};

export type JournalPendingCreateMutation = JournalPendingMutationBase & {
  type: "create";
  /** Queue APIs normalize this snapshot so version is always present at runtime. */
  entry: JournalEntry;
};

export type JournalPendingUpdateMutation = JournalPendingMutationBase & {
  type: "update";
  /** Queue APIs normalize this snapshot so version is always present at runtime. */
  entry: JournalEntry;
  expectedVersion: number;
};

export type JournalPendingDeleteMutation = JournalPendingMutationBase & {
  type: "delete";
  entryId: string;
  expectedVersion: number;
};

export type JournalPendingMutation =
  | JournalPendingCreateMutation
  | JournalPendingUpdateMutation
  | JournalPendingDeleteMutation;

type JournalPendingMutationInputBase = {
  clientMutationId?: string;
  queuedAt?: string;
};

export type JournalPendingMutationInput =
  | (JournalPendingMutationInputBase & {
      type: "create";
      entry: JournalEntry;
    })
  | (JournalPendingMutationInputBase & {
      type: "update";
      entry: JournalEntry;
      expectedVersion: number;
    })
  | (JournalPendingMutationInputBase & {
      type: "delete";
      entryId: string;
      expectedVersion: number;
    });

export type JournalQueueFailureReason =
  | "storage-unavailable"
  | "locking-unavailable"
  | "locking-failed"
  | "owner-mismatch"
  | "owner-check-failed"
  | "invalid-target"
  | "read-failed"
  | "invalid-payload"
  | "expired-create"
  | "queue-full"
  | "write-failed"
  | "verification-failed"
  | "mutation-not-found";

export type JournalQueueSnapshot = {
  mutations: JournalPendingMutation[];
  maxAgeExceededClientMutationIds: string[];
  expiredCreateClientMutationIds: string[];
  blockedClientMutationIds: string[];
  automaticRetryMutations: JournalPendingMutation[];
  optimisticMutations: JournalPendingMutation[];
};

export type JournalQueueReadResult =
  | ({ ok: true } & JournalQueueSnapshot)
  | ({ ok: false; reason: JournalQueueFailureReason } & JournalQueueSnapshot);

export type JournalQueueMutationResult =
  | ({
      ok: true;
      mutation: JournalPendingMutation | null;
      outcome:
        | "queued"
        | "compacted"
        | "discarded-expired-create"
        | "discarded-create-delete"
        | "metadata-updated";
    } & JournalQueueSnapshot)
  | ({ ok: false; reason: JournalQueueFailureReason } & JournalQueueSnapshot);

export type JournalQueueEntryReplacementResult =
  | ({ ok: true; replacement: JournalPendingMutation } & JournalQueueSnapshot)
  | ({ ok: false; reason: JournalQueueFailureReason } & JournalQueueSnapshot);

export type JournalQueueWriteResult =
  | ({ ok: true } & JournalQueueSnapshot)
  | ({ ok: false; reason: JournalQueueFailureReason } & JournalQueueSnapshot);

type QueueReadInternalResult =
  | { ok: true; mutations: JournalPendingMutation[] }
  | { ok: false; reason: JournalQueueFailureReason };

function emptySnapshot(): JournalQueueSnapshot {
  return {
    mutations: [],
    maxAgeExceededClientMutationIds: [],
    expiredCreateClientMutationIds: [],
    blockedClientMutationIds: [],
    automaticRetryMutations: [],
    optimisticMutations: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isBrowserStorageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

function isPositiveVersion(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 1;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function isNullableString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}

function isValidLinkedAyah(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (!isRecord(value)) {
    return false;
  }
  return (
    Number.isFinite(value.ayahId) &&
    Number.isFinite(value.surahNumber) &&
    Number.isFinite(value.ayahNumber) &&
    typeof value.surahNameArabic === "string" &&
    typeof value.surahNameTransliteration === "string"
  );
}

function isValidLinkedDua(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.moduleId === "string" &&
    value.moduleId.length > 0 &&
    typeof value.moduleLabel === "string" &&
    typeof value.stepId === "string" &&
    value.stepId.length > 0 &&
    typeof value.title === "string" &&
    value.title.length > 0 &&
    typeof value.label === "string" &&
    isNullableString(value.arabic) &&
    isNullableString(value.transliteration) &&
    typeof value.translation === "string" &&
    value.translation.length > 0 &&
    isNullableString(value.sourceLabel) &&
    isNullableString(value.sourceHref)
  );
}

function isValidJournalBlock(value: unknown): boolean {
  if (!isRecord(value) || typeof value.id !== "string" || value.id.trim().length === 0) {
    return false;
  }
  if (value.kind === "text") {
    return typeof value.content === "string";
  }
  if (value.kind === "ayah") {
    return typeof value.title === "string" && isValidLinkedAyah(value.ayah) && (
      value.ayah === null ||
      value.ayah === undefined ||
      (isRecord(value.ayah) &&
        isNullableString(value.ayah.textUthmani) &&
        isNullableString(value.ayah.translation))
    );
  }
  if (value.kind === "dua") {
    return typeof value.title === "string" && isValidLinkedDua(value.dua);
  }
  return false;
}

export function isValidJournalEntryPayload(value: unknown): value is JournalEntry {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    (value.originEntryId === undefined || value.originEntryId === null || typeof value.originEntryId === "string") &&
    (value.clientEntryId === undefined || value.clientEntryId === null || typeof value.clientEntryId === "string") &&
    (value.version === undefined || isPositiveVersion(value.version)) &&
    typeof value.type === "string" &&
    JOURNAL_ENTRY_TYPES.includes(value.type as JournalEntry["type"]) &&
    (value.title === undefined || typeof value.title === "string") &&
    typeof value.content === "string" &&
    (value.blocks === undefined || (Array.isArray(value.blocks) && value.blocks.every(isValidJournalBlock))) &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === "string") &&
    typeof value.pinned === "boolean" &&
    isValidIsoDate(value.createdAt) &&
    isValidIsoDate(value.updatedAt) &&
    isValidLinkedAyah(value.linkedAyah) &&
    isValidLinkedDua(value.linkedDua) &&
    (value.duaStatus === undefined ||
      value.duaStatus === null ||
      value.duaStatus === "ongoing" ||
      value.duaStatus === "answered" ||
      value.duaStatus === "accepted_differently") &&
    (value.autoDeleteAt === undefined || value.autoDeleteAt === null || isValidIsoDate(value.autoDeleteAt))
  );
}

function normalizeClientMutationId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_CLIENT_MUTATION_ID_LENGTH) {
    return null;
  }
  return normalized;
}

function normalizeFailure(value: unknown): JournalMutationFailure | null | undefined {
  if (value === null || value === undefined) {
    return null;
  }
  if (!isRecord(value)) {
    return undefined;
  }
  if (
    value.disposition !== "retryable" &&
    value.disposition !== "conflict" &&
    value.disposition !== "terminal"
  ) {
    return undefined;
  }
  if (
    typeof value.code !== "string" ||
    value.code.trim().length === 0 ||
    value.code.trim().length > MAX_FAILURE_CODE_LENGTH ||
    !isValidIsoDate(value.at)
  ) {
    return undefined;
  }

  const authoritativeEntryKnown = value.authoritativeEntryKnown ?? false;
  if (typeof authoritativeEntryKnown !== "boolean") {
    return undefined;
  }

  let authoritativeEntry: JournalEntry | null = null;
  if (authoritativeEntryKnown) {
    if (!("authoritativeEntry" in value)) {
      return undefined;
    }
    if (value.authoritativeEntry !== null) {
      if (!isValidJournalEntryPayload(value.authoritativeEntry)) {
        return undefined;
      }
      authoritativeEntry = normalizeJournalEntry(value.authoritativeEntry);
    }
  } else if (value.authoritativeEntry !== undefined && value.authoritativeEntry !== null) {
    // A snapshot without the explicit known flag is ambiguous and unsafe to
    // interpret as the server's current value.
    return undefined;
  }

  return {
    disposition: value.disposition,
    code: value.code.trim(),
    at: value.at,
    authoritativeEntryKnown,
    authoritativeEntry,
  };
}

function normalizeStoredMutation(value: unknown): JournalPendingMutation | null {
  if (!isRecord(value)) {
    return null;
  }
  const clientMutationId = normalizeClientMutationId(value.clientMutationId);
  const lastFailure = normalizeFailure(value.lastFailure);
  if (
    !clientMutationId ||
    !isValidIsoDate(value.queuedAt) ||
    !isNonNegativeInteger(value.attemptCount) ||
    !(value.lastAttemptAt === null || isValidIsoDate(value.lastAttemptAt)) ||
    lastFailure === undefined
  ) {
    return null;
  }

  const base: JournalPendingMutationBase = {
    clientMutationId,
    queuedAt: value.queuedAt,
    attemptCount: value.attemptCount,
    lastAttemptAt: value.lastAttemptAt,
    lastFailure,
  };

  if (value.type === "create" && isValidJournalEntryPayload(value.entry)) {
    return {
      ...base,
      type: "create",
      entry: normalizeJournalEntry(value.entry),
    };
  }
  if (
    value.type === "update" &&
    isValidJournalEntryPayload(value.entry) &&
    isPositiveVersion(value.expectedVersion)
  ) {
    return {
      ...base,
      type: "update",
      entry: normalizeJournalEntry(value.entry),
      expectedVersion: value.expectedVersion,
    };
  }
  if (
    value.type === "delete" &&
    typeof value.entryId === "string" &&
    value.entryId.trim().length > 0 &&
    isPositiveVersion(value.expectedVersion)
  ) {
    return {
      ...base,
      type: "delete",
      entryId: value.entryId.trim(),
      expectedVersion: value.expectedVersion,
    };
  }
  return null;
}

function normalizeTarget(target: JournalAccountStorageTarget): string | null {
  if (!target || target.scope !== "account" || typeof target.ownerId !== "string") {
    return null;
  }
  const ownerId = target.ownerId.trim();
  return ownerId.length > 0 ? ownerId : null;
}

function queueKey(target: JournalAccountStorageTarget): string | null {
  const ownerId = normalizeTarget(target);
  return ownerId ? `${JOURNAL_PENDING_MUTATION_KEY_PREFIX}${ownerId}` : null;
}

export function createJournalClientMutationId(now: Date = new Date()): string {
  let randomPart = "";
  try {
    randomPart = globalThis.crypto?.randomUUID?.().replace(/-/g, "") ?? "";
  } catch {
    randomPart = "";
  }
  if (!randomPart) {
    randomPart = `${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
  }
  return `journal_mut_${now.getTime()}_${randomPart}`.slice(0, MAX_CLIENT_MUTATION_ID_LENGTH);
}

export function hasJournalPendingMutationExceededMaxAge(
  mutation: JournalPendingMutation,
  now: Date = new Date(),
): boolean {
  return now.getTime() - Date.parse(mutation.queuedAt) > JOURNAL_PENDING_MUTATION_MAX_AGE_MS;
}

export function isJournalPendingMutationBlocked(mutation: JournalPendingMutation): boolean {
  return mutation.lastFailure?.disposition === "conflict" || mutation.lastFailure?.disposition === "terminal";
}

export function isExpiredPendingJournalCreate(
  mutation: JournalPendingMutation,
  now: Date = new Date(),
): boolean {
  return (
    mutation.type === "create" &&
    typeof mutation.entry.autoDeleteAt === "string" &&
    Date.parse(mutation.entry.autoDeleteAt) <= now.getTime()
  );
}

export function shouldAutomaticallyRetryJournalMutation(
  mutation: JournalPendingMutation,
  now: Date = new Date(),
): boolean {
  return (
    !hasJournalPendingMutationExceededMaxAge(mutation, now) &&
    !isExpiredPendingJournalCreate(mutation, now) &&
    !isJournalPendingMutationBlocked(mutation)
  );
}

export function shouldApplyJournalMutationOptimistically(
  mutation: JournalPendingMutation,
  now: Date = new Date(),
): boolean {
  return (
    !hasJournalPendingMutationExceededMaxAge(mutation, now) &&
    !isExpiredPendingJournalCreate(mutation, now) &&
    !isJournalPendingMutationBlocked(mutation)
  );
}

function buildSnapshot(mutations: JournalPendingMutation[], now: Date): JournalQueueSnapshot {
  const maxAgeExceededClientMutationIds = mutations
    .filter((mutation) => hasJournalPendingMutationExceededMaxAge(mutation, now))
    .map((mutation) => mutation.clientMutationId);
  const expiredCreateClientMutationIds = mutations
    .filter((mutation) => isExpiredPendingJournalCreate(mutation, now))
    .map((mutation) => mutation.clientMutationId);
  const blockedClientMutationIds = mutations
    .filter(isJournalPendingMutationBlocked)
    .map((mutation) => mutation.clientMutationId);
  return {
    mutations,
    maxAgeExceededClientMutationIds,
    expiredCreateClientMutationIds,
    blockedClientMutationIds,
    automaticRetryMutations: mutations.filter((mutation) =>
      shouldAutomaticallyRetryJournalMutation(mutation, now)),
    optimisticMutations: mutations.filter((mutation) =>
      shouldApplyJournalMutationOptimistically(mutation, now)),
  };
}

function readQueue(target: JournalAccountStorageTarget): QueueReadInternalResult {
  if (!isBrowserStorageAvailable()) {
    return { ok: false, reason: "storage-unavailable" };
  }
  const key = queueKey(target);
  if (!key) {
    return { ok: false, reason: "invalid-target" };
  }

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return { ok: false, reason: "read-failed" };
  }
  if (raw === null) {
    return { ok: true, mutations: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "invalid-payload" };
  }
  if (!Array.isArray(parsed) || parsed.length > JOURNAL_PENDING_MUTATION_LIMIT) {
    return { ok: false, reason: "invalid-payload" };
  }

  const mutations: JournalPendingMutation[] = [];
  const seen = new Set<string>();
  for (const value of parsed) {
    const mutation = normalizeStoredMutation(value);
    if (!mutation || seen.has(mutation.clientMutationId)) {
      return { ok: false, reason: "invalid-payload" };
    }
    seen.add(mutation.clientMutationId);
    mutations.push(mutation);
  }
  return { ok: true, mutations };
}

function writeQueue(
  target: JournalAccountStorageTarget,
  mutations: JournalPendingMutation[],
): QueueReadInternalResult {
  if (!isBrowserStorageAvailable()) {
    return { ok: false, reason: "storage-unavailable" };
  }
  const key = queueKey(target);
  if (!key) {
    return { ok: false, reason: "invalid-target" };
  }
  if (mutations.length > JOURNAL_PENDING_MUTATION_LIMIT) {
    return { ok: false, reason: "queue-full" };
  }

  const normalized: JournalPendingMutation[] = [];
  const seen = new Set<string>();
  for (const value of mutations) {
    const mutation = normalizeStoredMutation(value);
    if (!mutation || seen.has(mutation.clientMutationId)) {
      return { ok: false, reason: "invalid-payload" };
    }
    seen.add(mutation.clientMutationId);
    normalized.push(mutation);
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(normalized);
  } catch {
    return { ok: false, reason: "write-failed" };
  }
  try {
    window.localStorage.setItem(key, serialized);
  } catch {
    return { ok: false, reason: "write-failed" };
  }

  let readBack: string | null;
  try {
    readBack = window.localStorage.getItem(key);
  } catch {
    return { ok: false, reason: "verification-failed" };
  }
  if (readBack !== serialized) {
    return { ok: false, reason: "verification-failed" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readBack);
  } catch {
    return { ok: false, reason: "verification-failed" };
  }
  if (!Array.isArray(parsed)) {
    return { ok: false, reason: "verification-failed" };
  }
  const verified: JournalPendingMutation[] = [];
  for (const value of parsed) {
    const mutation = normalizeStoredMutation(value);
    if (!mutation) {
      return { ok: false, reason: "verification-failed" };
    }
    verified.push(mutation);
  }
  return { ok: true, mutations: verified };
}

function normalizeInput(input: JournalPendingMutationInput, now: Date): JournalPendingMutation | null {
  if (!isRecord(input)) {
    return null;
  }
  const clientMutationId = input.clientMutationId === undefined
    ? createJournalClientMutationId(now)
    : normalizeClientMutationId(input.clientMutationId);
  const queuedAt = input.queuedAt ?? now.toISOString();
  if (!clientMutationId || !isValidIsoDate(queuedAt)) {
    return null;
  }
  const base: JournalPendingMutationBase = {
    clientMutationId,
    queuedAt,
    attemptCount: 0,
    lastAttemptAt: null,
    lastFailure: null,
  };

  if (input.type === "create" && isValidJournalEntryPayload(input.entry)) {
    return { ...base, type: "create", entry: normalizeJournalEntry(input.entry) };
  }
  if (
    input.type === "update" &&
    isValidJournalEntryPayload(input.entry) &&
    isPositiveVersion(input.expectedVersion)
  ) {
    return {
      ...base,
      type: "update",
      entry: normalizeJournalEntry(input.entry),
      expectedVersion: input.expectedVersion,
    };
  }
  if (
    input.type === "delete" &&
    typeof input.entryId === "string" &&
    input.entryId.trim().length > 0 &&
    isPositiveVersion(input.expectedVersion)
  ) {
    return {
      ...base,
      type: "delete",
      entryId: input.entryId.trim(),
      expectedVersion: input.expectedVersion,
    };
  }
  return null;
}

function journalMutationEntryId(mutation: JournalPendingMutation): string {
  return (mutation.type === "delete" ? mutation.entryId : mutation.entry.id).trim();
}

type JournalCompactionResult = {
  mutations: JournalPendingMutation[];
  mutation: JournalPendingMutation | null;
  outcome: "compacted" | "discarded-create-delete";
};

function compactUnattemptedMutation(
  current: JournalPendingMutation[],
  incoming: JournalPendingMutation,
): JournalCompactionResult | null {
  const entryId = journalMutationEntryId(incoming);
  let priorIndex = -1;
  for (let index = current.length - 1; index >= 0; index -= 1) {
    if (journalMutationEntryId(current[index]) === entryId) {
      priorIndex = index;
      break;
    }
  }
  if (priorIndex < 0) {
    return null;
  }

  const prior = current[priorIndex];
  // Once a request may have reached the server, its mutation ID and payload are
  // immutable. A later operation must remain separately replayable so an
  // ambiguous response cannot erase or rewrite an already-applied mutation.
  if (prior.attemptCount !== 0 || prior.lastAttemptAt !== null || prior.lastFailure !== null) {
    return null;
  }

  let compacted: JournalPendingMutation | null = null;
  if (prior.type === "create" && incoming.type === "update") {
    compacted = {
      ...prior,
      entry: incoming.entry,
    };
  } else if (prior.type === "create" && incoming.type === "delete") {
    const mutations = current.filter((_, index) => index !== priorIndex);
    return { mutations, mutation: null, outcome: "discarded-create-delete" };
  } else if (prior.type === "update" && incoming.type === "update") {
    compacted = {
      ...prior,
      entry: incoming.entry,
      expectedVersion: prior.expectedVersion,
    };
  } else if (prior.type === "update" && incoming.type === "delete") {
    compacted = {
      ...prior,
      type: "delete",
      entryId,
      expectedVersion: prior.expectedVersion,
    };
  }

  if (!compacted) {
    return null;
  }
  const mutations = [...current];
  mutations[priorIndex] = compacted;
  return { mutations, mutation: compacted, outcome: "compacted" };
}

export function listPendingJournalMutations(
  target: JournalAccountStorageTarget,
  now: Date = new Date(),
): JournalQueueReadResult {
  const result = readQueue(target);
  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason,
      ...buildSnapshot([], now),
    };
  }
  return { ok: true, ...buildSnapshot(result.mutations, now) };
}

async function withQueueMutationLock<TResult>(
  target: JournalAccountStorageTarget,
  operation: () => TResult,
  onFailure: (reason: JournalQueueFailureReason) => TResult,
): Promise<TResult> {
  const ownerId = normalizeTarget(target);
  if (!ownerId) {
    return onFailure("invalid-target");
  }
  if (!isBrowserStorageAvailable()) {
    return onFailure("storage-unavailable");
  }

  const locked = await withJournalOwnerStorageLock(
    ownerId,
    operation,
    { requireActiveOwner: true },
  );
  return locked.ok ? locked.value : onFailure(locked.reason);
}

function snapshotAfterLockFailure(
  target: JournalAccountStorageTarget,
  now: Date,
): JournalQueueSnapshot {
  const current = readQueue(target);
  return buildSnapshot(current.ok ? current.mutations : [], now);
}

function enqueuePendingJournalMutationUnlocked(
  target: JournalAccountStorageTarget,
  input: JournalPendingMutationInput,
  now: Date,
): JournalQueueMutationResult {
  const current = readQueue(target);
  if (!current.ok) {
    return { ok: false, reason: current.reason, ...buildSnapshot([], now) };
  }
  const mutation = normalizeInput(input, now);
  if (!mutation) {
    return { ok: false, reason: "invalid-payload", ...buildSnapshot(current.mutations, now) };
  }

  const existing = current.mutations.find((item) => item.clientMutationId === mutation.clientMutationId);
  if (existing) {
    return {
      ok: true,
      mutation: existing,
      outcome: "queued",
      ...buildSnapshot(current.mutations, now),
    };
  }
  if (isExpiredPendingJournalCreate(mutation, now)) {
    return {
      ok: true,
      mutation: null,
      outcome: "discarded-expired-create",
      ...buildSnapshot(current.mutations, now),
    };
  }

  const compaction = compactUnattemptedMutation(current.mutations, mutation);
  if (compaction) {
    const written = writeQueue(target, compaction.mutations);
    if (!written.ok) {
      return { ok: false, reason: written.reason, ...buildSnapshot(current.mutations, now) };
    }
    const verifiedMutation = compaction.mutation
      ? written.mutations.find((item) => item.clientMutationId === compaction.mutation?.clientMutationId) ?? null
      : null;
    if (compaction.mutation && !verifiedMutation) {
      return { ok: false, reason: "verification-failed", ...buildSnapshot(current.mutations, now) };
    }
    return {
      ok: true,
      mutation: verifiedMutation,
      outcome: compaction.outcome,
      ...buildSnapshot(written.mutations, now),
    };
  }
  if (current.mutations.length >= JOURNAL_PENDING_MUTATION_LIMIT) {
    return { ok: false, reason: "queue-full", ...buildSnapshot(current.mutations, now) };
  }

  const written = writeQueue(target, [...current.mutations, mutation]);
  if (!written.ok) {
    return { ok: false, reason: written.reason, ...buildSnapshot(current.mutations, now) };
  }
  const verifiedMutation = written.mutations.find((item) => item.clientMutationId === mutation.clientMutationId);
  if (!verifiedMutation) {
    return { ok: false, reason: "verification-failed", ...buildSnapshot(current.mutations, now) };
  }
  return {
    ok: true,
    mutation: verifiedMutation,
    outcome: "queued",
    ...buildSnapshot(written.mutations, now),
  };
}

export function enqueuePendingJournalMutation(
  target: JournalAccountStorageTarget,
  input: JournalPendingMutationInput,
  now: Date = new Date(),
): Promise<JournalQueueMutationResult> {
  return withQueueMutationLock(
    target,
    () => enqueuePendingJournalMutationUnlocked(target, input, now),
    (reason) => ({ ok: false, reason, ...snapshotAfterLockFailure(target, now) }),
  );
}

/**
 * Replaces every queued operation for `entryId` with one fresh mutation. The
 * complete next queue is committed with one localStorage `setItem`, avoiding
 * the data-loss window created by removing an old mutation before enqueueing
 * its replacement.
 */
function replacePendingJournalEntryMutationsAtomicallyUnlocked(
  target: JournalAccountStorageTarget,
  entryId: string,
  replacementInput: JournalPendingMutationInput,
  now: Date,
): JournalQueueEntryReplacementResult {
  const current = readQueue(target);
  if (!current.ok) {
    return { ok: false, reason: current.reason, ...buildSnapshot([], now) };
  }

  const normalizedEntryId = typeof entryId === "string" ? entryId.trim() : "";
  const replacement = normalizeInput(replacementInput, now);
  if (!normalizedEntryId || !replacement) {
    return { ok: false, reason: "invalid-payload", ...buildSnapshot(current.mutations, now) };
  }
  if (isExpiredPendingJournalCreate(replacement, now)) {
    return { ok: false, reason: "expired-create", ...buildSnapshot(current.mutations, now) };
  }

  // A replacement must use a fresh mutation ID. Reusing even an operation
  // being replaced could replay a different payload under an idempotency key
  // that the server has already observed.
  if (current.mutations.some((mutation) => mutation.clientMutationId === replacement.clientMutationId)) {
    return { ok: false, reason: "invalid-payload", ...buildSnapshot(current.mutations, now) };
  }

  const next: JournalPendingMutation[] = [];
  let replacementIndex = -1;
  for (const mutation of current.mutations) {
    if (journalMutationEntryId(mutation) === normalizedEntryId) {
      if (replacementIndex < 0) {
        replacementIndex = next.length;
      }
      continue;
    }
    next.push(mutation);
  }
  if (replacementIndex < 0) {
    replacementIndex = next.length;
  }
  next.splice(replacementIndex, 0, replacement);

  if (next.length > JOURNAL_PENDING_MUTATION_LIMIT) {
    return { ok: false, reason: "queue-full", ...buildSnapshot(current.mutations, now) };
  }

  const written = writeQueue(target, next);
  if (!written.ok) {
    return { ok: false, reason: written.reason, ...buildSnapshot(current.mutations, now) };
  }

  const verifiedReplacements = written.mutations.filter(
    (mutation) => mutation.clientMutationId === replacement.clientMutationId,
  );
  const replacementEntryId = journalMutationEntryId(replacement);
  const unexpectedReplacedEntry = written.mutations.some(
    (mutation) =>
      journalMutationEntryId(mutation) === normalizedEntryId &&
      mutation.clientMutationId !== replacement.clientMutationId,
  );
  if (
    verifiedReplacements.length !== 1 ||
    unexpectedReplacedEntry ||
    (replacementEntryId !== normalizedEntryId &&
      written.mutations.some((mutation) => journalMutationEntryId(mutation) === normalizedEntryId))
  ) {
    return { ok: false, reason: "verification-failed", ...buildSnapshot(current.mutations, now) };
  }

  return {
    ok: true,
    replacement: verifiedReplacements[0],
    ...buildSnapshot(written.mutations, now),
  };
}

export function replacePendingJournalEntryMutationsAtomically(
  target: JournalAccountStorageTarget,
  entryId: string,
  replacementInput: JournalPendingMutationInput,
  now: Date = new Date(),
): Promise<JournalQueueEntryReplacementResult> {
  return withQueueMutationLock(
    target,
    () => replacePendingJournalEntryMutationsAtomicallyUnlocked(
      target,
      entryId,
      replacementInput,
      now,
    ),
    (reason) => ({ ok: false, reason, ...snapshotAfterLockFailure(target, now) }),
  );
}

function removePendingJournalMutationUnlocked(
  target: JournalAccountStorageTarget,
  clientMutationId: string,
  now: Date,
): JournalQueueWriteResult {
  const current = readQueue(target);
  if (!current.ok) {
    return { ok: false, reason: current.reason, ...buildSnapshot([], now) };
  }
  const normalizedId = normalizeClientMutationId(clientMutationId);
  if (!normalizedId) {
    return { ok: false, reason: "invalid-payload", ...buildSnapshot(current.mutations, now) };
  }
  const next = current.mutations.filter((mutation) => mutation.clientMutationId !== normalizedId);
  if (next.length === current.mutations.length) {
    return { ok: true, ...buildSnapshot(current.mutations, now) };
  }
  const written = writeQueue(target, next);
  if (!written.ok) {
    return { ok: false, reason: written.reason, ...buildSnapshot(current.mutations, now) };
  }
  if (written.mutations.some((mutation) => mutation.clientMutationId === normalizedId)) {
    return { ok: false, reason: "verification-failed", ...buildSnapshot(current.mutations, now) };
  }
  return { ok: true, ...buildSnapshot(written.mutations, now) };
}

export function removePendingJournalMutation(
  target: JournalAccountStorageTarget,
  clientMutationId: string,
  now: Date = new Date(),
): Promise<JournalQueueWriteResult> {
  return withQueueMutationLock(
    target,
    () => removePendingJournalMutationUnlocked(target, clientMutationId, now),
    (reason) => ({ ok: false, reason, ...snapshotAfterLockFailure(target, now) }),
  );
}

/**
 * Removes creates whose local auto-delete deadline has elapsed. Call this
 * before a flush so a time-limited private note is never uploaded after expiry.
 */
function purgeExpiredPendingJournalCreatesUnlocked(
  target: JournalAccountStorageTarget,
  now: Date,
): JournalQueueWriteResult {
  const current = readQueue(target);
  if (!current.ok) {
    return { ok: false, reason: current.reason, ...buildSnapshot([], now) };
  }
  const next = current.mutations.filter((mutation) => !isExpiredPendingJournalCreate(mutation, now));
  if (next.length === current.mutations.length) {
    return { ok: true, ...buildSnapshot(current.mutations, now) };
  }
  const written = writeQueue(target, next);
  if (!written.ok) {
    return { ok: false, reason: written.reason, ...buildSnapshot(current.mutations, now) };
  }
  if (written.mutations.some((mutation) => isExpiredPendingJournalCreate(mutation, now))) {
    return { ok: false, reason: "verification-failed", ...buildSnapshot(current.mutations, now) };
  }
  return { ok: true, ...buildSnapshot(written.mutations, now) };
}

export function purgeExpiredPendingJournalCreates(
  target: JournalAccountStorageTarget,
  now: Date = new Date(),
): Promise<JournalQueueWriteResult> {
  return withQueueMutationLock(
    target,
    () => purgeExpiredPendingJournalCreatesUnlocked(target, now),
    (reason) => ({ ok: false, reason, ...snapshotAfterLockFailure(target, now) }),
  );
}

function replacePendingJournalMutationsUnlocked(
  target: JournalAccountStorageTarget,
  mutations: JournalPendingMutation[],
  now: Date,
): JournalQueueWriteResult {
  if (!Array.isArray(mutations)) {
    return { ok: false, reason: "invalid-payload", ...buildSnapshot([], now) };
  }
  const current = readQueue(target);
  if (!current.ok) {
    return { ok: false, reason: current.reason, ...buildSnapshot([], now) };
  }
  if (mutations.length > JOURNAL_PENDING_MUTATION_LIMIT) {
    return { ok: false, reason: "queue-full", ...buildSnapshot(current.mutations, now) };
  }
  const written = writeQueue(target, mutations);
  if (!written.ok) {
    return { ok: false, reason: written.reason, ...buildSnapshot(current.mutations, now) };
  }
  return { ok: true, ...buildSnapshot(written.mutations, now) };
}

export function replacePendingJournalMutations(
  target: JournalAccountStorageTarget,
  mutations: JournalPendingMutation[],
  now: Date = new Date(),
): Promise<JournalQueueWriteResult> {
  return withQueueMutationLock(
    target,
    () => replacePendingJournalMutationsUnlocked(target, mutations, now),
    (reason) => ({ ok: false, reason, ...snapshotAfterLockFailure(target, now) }),
  );
}

function updatePendingMutationUnlocked(
  target: JournalAccountStorageTarget,
  clientMutationId: string,
  update: (mutation: JournalPendingMutation) => JournalPendingMutation,
  now: Date,
): JournalQueueMutationResult {
  const current = readQueue(target);
  if (!current.ok) {
    return { ok: false, reason: current.reason, ...buildSnapshot([], now) };
  }
  const normalizedId = normalizeClientMutationId(clientMutationId);
  if (!normalizedId) {
    return { ok: false, reason: "invalid-payload", ...buildSnapshot(current.mutations, now) };
  }
  const index = current.mutations.findIndex((mutation) => mutation.clientMutationId === normalizedId);
  if (index < 0) {
    return { ok: false, reason: "mutation-not-found", ...buildSnapshot(current.mutations, now) };
  }
  const next = [...current.mutations];
  next[index] = update(next[index]);
  const written = writeQueue(target, next);
  if (!written.ok) {
    return { ok: false, reason: written.reason, ...buildSnapshot(current.mutations, now) };
  }
  const mutation = written.mutations.find((item) => item.clientMutationId === normalizedId);
  if (!mutation) {
    return { ok: false, reason: "verification-failed", ...buildSnapshot(current.mutations, now) };
  }
  return {
    ok: true,
    mutation,
    outcome: "metadata-updated",
    ...buildSnapshot(written.mutations, now),
  };
}

export function markPendingJournalMutationAttempt(
  target: JournalAccountStorageTarget,
  clientMutationId: string,
  now: Date = new Date(),
): Promise<JournalQueueMutationResult> {
  return withQueueMutationLock(
    target,
    () => updatePendingMutationUnlocked(
      target,
      clientMutationId,
      (mutation) => ({
        ...mutation,
        attemptCount: mutation.attemptCount + 1,
        lastAttemptAt: now.toISOString(),
      }),
      now,
    ),
    (reason) => ({ ok: false, reason, ...snapshotAfterLockFailure(target, now) }),
  );
}

export async function markPendingJournalMutationFailure(
  target: JournalAccountStorageTarget,
  clientMutationId: string,
  failure: JournalMutationFailureInput,
  now: Date = new Date(),
): Promise<JournalQueueMutationResult> {
  const normalizedFailure = normalizeFailure(
    isRecord(failure) ? { ...failure, at: now.toISOString() } : failure,
  );
  if (!normalizedFailure) {
    return { ok: false, reason: "invalid-payload", ...emptySnapshot() };
  }
  return withQueueMutationLock(
    target,
    () => updatePendingMutationUnlocked(
      target,
      clientMutationId,
      (mutation) => ({
        ...mutation,
        lastFailure: normalizedFailure,
      }),
      now,
    ),
    (reason) => ({ ok: false, reason, ...snapshotAfterLockFailure(target, now) }),
  );
}

export function clearPendingJournalMutationFailure(
  target: JournalAccountStorageTarget,
  clientMutationId: string,
  now: Date = new Date(),
): Promise<JournalQueueMutationResult> {
  return withQueueMutationLock(
    target,
    () => updatePendingMutationUnlocked(
      target,
      clientMutationId,
      (mutation) => ({ ...mutation, lastFailure: null }),
      now,
    ),
    (reason) => ({ ok: false, reason, ...snapshotAfterLockFailure(target, now) }),
  );
}
