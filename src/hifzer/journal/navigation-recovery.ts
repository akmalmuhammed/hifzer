import {
  JOURNAL_ENTRY_TYPES,
  normalizeJournalBlocks,
  normalizeJournalTags,
  type JournalBlock,
  type JournalDuaStatus,
  type JournalEntryType,
  type JournalLocalStorageTarget,
} from "./local-store";

const JOURNAL_NAVIGATION_RECOVERY_KEY_PREFIX =
  "hifzer_private_journal_navigation_recovery_v1:";
const JOURNAL_NAVIGATION_RECOVERY_VERSION = 1;
const JOURNAL_NAVIGATION_RECOVERY_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1_000;

export type JournalNavigationRecoveryDraft = {
  id: string | null;
  baseVersion: number | null;
  type: JournalEntryType;
  title: string;
  blocks: JournalBlock[];
  tags: string[];
  pinned: boolean;
  createdAt: string | null;
  duaStatus: JournalDuaStatus;
  autoDeletePreset: "" | "1" | "3" | "7" | "30";
};

export type JournalNavigationRecoverySnapshot = {
  version: typeof JOURNAL_NAVIGATION_RECOVERY_VERSION;
  capturedAt: string;
  pathname: string;
  draftRevision: number;
  lastPersistedRevision: number;
  draft: JournalNavigationRecoveryDraft;
};

function storageKey(target: JournalLocalStorageTarget): string | null {
  if (target.scope === "device") {
    return `${JOURNAL_NAVIGATION_RECOVERY_KEY_PREFIX}device`;
  }
  const ownerId = target.ownerId.trim();
  return ownerId
    ? `${JOURNAL_NAVIGATION_RECOVERY_KEY_PREFIX}account:${ownerId}`
    : null;
}

function browserStorage(): Storage | null {
  try {
    return typeof window !== "undefined" && window.sessionStorage
      ? window.sessionStorage
      : null;
  } catch {
    return null;
  }
}

function normalizeDraft(value: unknown): JournalNavigationRecoveryDraft | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const draft = value as Partial<JournalNavigationRecoveryDraft>;
  const id = draft.id === null
    ? null
    : typeof draft.id === "string" && draft.id.trim()
      ? draft.id.trim()
      : null;
  if (draft.id !== null && id === null) {
    return null;
  }
  const baseVersion = draft.baseVersion === null
    ? null
    : Number.isSafeInteger(draft.baseVersion) && Number(draft.baseVersion) >= 1
      ? Number(draft.baseVersion)
      : null;
  if (draft.baseVersion !== null && baseVersion === null) {
    return null;
  }
  const type = JOURNAL_ENTRY_TYPES.includes(draft.type as JournalEntryType)
    ? draft.type as JournalEntryType
    : null;
  if (!type || typeof draft.title !== "string" || !Array.isArray(draft.blocks)) {
    return null;
  }
  const duaStatus = draft.duaStatus === "answered" ||
      draft.duaStatus === "accepted_differently"
    ? draft.duaStatus
    : "ongoing";
  const autoDeletePreset = draft.autoDeletePreset === "1" ||
      draft.autoDeletePreset === "3" ||
      draft.autoDeletePreset === "7" ||
      draft.autoDeletePreset === "30"
    ? draft.autoDeletePreset
    : "";

  return {
    id,
    baseVersion,
    type,
    title: draft.title,
    blocks: normalizeJournalBlocks(draft.blocks),
    tags: normalizeJournalTags(Array.isArray(draft.tags) ? draft.tags : []),
    pinned: draft.pinned === true,
    createdAt: typeof draft.createdAt === "string" ? draft.createdAt : null,
    duaStatus,
    autoDeletePreset,
  };
}

function parseSnapshot(raw: string | null, now: Date): JournalNavigationRecoverySnapshot | null {
  if (!raw) {
    return null;
  }
  try {
    const value = JSON.parse(raw) as Partial<JournalNavigationRecoverySnapshot>;
    const capturedAt = typeof value.capturedAt === "string"
      ? new Date(value.capturedAt)
      : null;
    const draft = normalizeDraft(value.draft);
    const pathname = typeof value.pathname === "string" && value.pathname.startsWith("/")
      ? value.pathname
      : null;
    const draftRevision = Number.isSafeInteger(value.draftRevision) &&
        Number(value.draftRevision) >= 0
      ? Number(value.draftRevision)
      : null;
    const lastPersistedRevision = Number.isSafeInteger(value.lastPersistedRevision) &&
        Number(value.lastPersistedRevision) >= -1
      ? Number(value.lastPersistedRevision)
      : null;
    if (
      value.version !== JOURNAL_NAVIGATION_RECOVERY_VERSION ||
      !capturedAt ||
      Number.isNaN(capturedAt.getTime()) ||
      now.getTime() - capturedAt.getTime() > JOURNAL_NAVIGATION_RECOVERY_MAX_AGE_MS ||
      capturedAt.getTime() - now.getTime() > 60_000 ||
      !pathname ||
      draftRevision === null ||
      lastPersistedRevision === null ||
      !draft
    ) {
      return null;
    }
    return {
      version: JOURNAL_NAVIGATION_RECOVERY_VERSION,
      capturedAt: capturedAt.toISOString(),
      pathname,
      draftRevision,
      lastPersistedRevision,
      draft,
    };
  } catch {
    return null;
  }
}

function draftsMatch(
  left: JournalNavigationRecoveryDraft,
  right: JournalNavigationRecoveryDraft,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function readJournalNavigationRecovery(
  target: JournalLocalStorageTarget,
  now: Date = new Date(),
): JournalNavigationRecoverySnapshot | null {
  const storage = browserStorage();
  const key = storageKey(target);
  if (!storage || !key) {
    return null;
  }
  try {
    const raw = storage.getItem(key);
    const snapshot = parseSnapshot(raw, now);
    if (!snapshot && raw !== null) {
      storage.removeItem(key);
    }
    return snapshot;
  } catch {
    return null;
  }
}

export function writeJournalNavigationRecovery(
  draft: JournalNavigationRecoveryDraft,
  target: JournalLocalStorageTarget,
  options?: {
    now?: Date;
    pathname?: string;
    draftRevision?: number;
    lastPersistedRevision?: number;
  },
): JournalNavigationRecoverySnapshot | null {
  const storage = browserStorage();
  const key = storageKey(target);
  const normalizedDraft = normalizeDraft(draft);
  if (!storage || !key || !normalizedDraft) {
    return null;
  }
  const now = options?.now ?? new Date();
  const snapshot: JournalNavigationRecoverySnapshot = {
    version: JOURNAL_NAVIGATION_RECOVERY_VERSION,
    capturedAt: now.toISOString(),
    pathname: options?.pathname?.startsWith("/") ? options.pathname : "/journal",
    draftRevision:
      Number.isSafeInteger(options?.draftRevision) && Number(options?.draftRevision) >= 0
        ? Number(options?.draftRevision)
        : 0,
    lastPersistedRevision:
      Number.isSafeInteger(options?.lastPersistedRevision) &&
        Number(options?.lastPersistedRevision) >= -1
        ? Number(options?.lastPersistedRevision)
        : -1,
    draft: normalizedDraft,
  };
  const serialized = JSON.stringify(snapshot);
  try {
    storage.setItem(key, serialized);
    return storage.getItem(key) === serialized ? snapshot : null;
  } catch {
    return null;
  }
}

export function clearJournalNavigationRecovery(
  target: JournalLocalStorageTarget,
  expectedDraft?: JournalNavigationRecoveryDraft,
  now: Date = new Date(),
): boolean {
  const storage = browserStorage();
  const key = storageKey(target);
  if (!storage || !key) {
    return false;
  }
  try {
    if (expectedDraft) {
      const snapshot = parseSnapshot(storage.getItem(key), now);
      const normalizedExpected = normalizeDraft(expectedDraft);
      if (!snapshot || !normalizedExpected || !draftsMatch(snapshot.draft, normalizedExpected)) {
        return false;
      }
    }
    storage.removeItem(key);
    return storage.getItem(key) === null;
  } catch {
    return false;
  }
}
