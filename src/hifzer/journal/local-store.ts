import { getLocalStateOwner } from "@/hifzer/local/store";
import { withJournalOwnerStorageLock } from "./storage-lock";

export const JOURNAL_ENTRY_TYPES = [
  "reflection",
  "dua",
  "repentance",
  "gratitude",
  "free",
] as const;

export type JournalEntryType = (typeof JOURNAL_ENTRY_TYPES)[number];
export type JournalDuaStatus = "ongoing" | "answered" | "accepted_differently";

export type JournalLinkedAyah = {
  ayahId: number;
  surahNumber: number;
  ayahNumber: number;
  surahNameArabic: string;
  surahNameTransliteration: string;
};

export type JournalLinkedDua = {
  moduleId: string;
  moduleLabel: string;
  stepId: string;
  title: string;
  label: string;
  arabic?: string | null;
  transliteration?: string | null;
  translation: string;
  sourceLabel?: string | null;
  sourceHref?: string | null;
};

export type JournalAyahSnapshot = JournalLinkedAyah & {
  textUthmani?: string | null;
  translation?: string | null;
};

export type JournalTextBlock = {
  id: string;
  kind: "text";
  content: string;
};

export type JournalAyahBlock = {
  id: string;
  kind: "ayah";
  title: string;
  ayah: JournalAyahSnapshot | null;
};

export type JournalDuaBlock = {
  id: string;
  kind: "dua";
  title: string;
  dua: JournalLinkedDua | null;
};

export type JournalBlock = JournalTextBlock | JournalAyahBlock | JournalDuaBlock;

export type JournalEntry = {
  id: string;
  /** Stable browser/source id returned by the account API for import/replay acknowledgement. */
  originEntryId?: string | null;
  /** Quran Foundation's remote note id; it is distinct from the browser origin id. */
  clientEntryId?: string | null;
  /** Legacy inputs may omit this; every normalized/read snapshot defaults it to 1. */
  version?: number;
  type: JournalEntryType;
  title?: string;
  content: string;
  blocks?: JournalBlock[];
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  linkedAyah?: JournalLinkedAyah | null;
  linkedDua?: JournalLinkedDua | null;
  duaStatus?: JournalDuaStatus | null;
  autoDeleteAt?: string | null;
};

const JOURNAL_STORAGE_KEY_PREFIX = "hifzer_private_journal_entries_v2:";
// This key is intentionally outside the owner-scoped prefix. Anonymous/device
// notes must neither be read as account fallback notes nor be removed by an
// account-owner transition.
const DEVICE_JOURNAL_STORAGE_KEY = "hifzer_private_journal_device_entries_v1";
const DEVICE_JOURNAL_STORAGE_LOCK_OWNER = "__device__";

export type JournalLocalStorageScope = "account" | "device";
export type JournalLocalStorageTarget =
  | { scope: "device" }
  | { scope: "account"; ownerId: string };
export type JournalAccountLocalStorageTarget = Extract<
  JournalLocalStorageTarget,
  { scope: "account" }
>;
export type JournalLocalWriteFailureReason =
  | "storage-unavailable"
  | "read-failed"
  | "write-failed"
  | "verification-failed"
  | "locking-unavailable"
  | "locking-failed"
  | "owner-mismatch"
  | "owner-check-failed"
  | "version-conflict";

export type JournalLocalWriteResult =
  | {
      ok: true;
      scope: JournalLocalStorageScope;
      entry: JournalEntry;
      entries: JournalEntry[];
    }
  | {
      ok: false;
      scope: JournalLocalStorageScope;
      reason: JournalLocalWriteFailureReason;
      entries: JournalEntry[];
    };

export type JournalLocalDeleteResult =
  | {
      ok: true;
      scope: JournalLocalStorageScope;
      entries: JournalEntry[];
    }
  | {
      ok: false;
      scope: JournalLocalStorageScope;
      reason: JournalLocalWriteFailureReason;
      entries: JournalEntry[];
    };

type JournalStorageLocation = {
  key: string;
  scope: JournalLocalStorageScope;
  ownerId?: string;
};

type JournalLocalReadResult =
  | {
      ok: true;
      entries: JournalEntry[];
    }
  | {
      ok: false;
      reason: "read-failed";
    };

type JournalEntriesWriteResult =
  | {
      ok: true;
      entries: JournalEntry[];
    }
  | {
      ok: false;
      reason: "write-failed" | "verification-failed";
    };

export type JournalImportCleanupResult =
  | {
      ok: true;
      removedEntryIds: string[];
      retainedEntryIds: string[];
    }
  | {
      ok: false;
      reason:
        | "storage-unavailable"
        | "read-failed"
        | "write-failed"
        | "verification-failed"
        | "locking-unavailable"
        | "locking-failed"
        | "owner-mismatch"
        | "owner-check-failed";
      removedEntryIds: string[];
      retainedEntryIds: string[];
    };

function isBrowser(): boolean {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function journalStorageLocation(target?: JournalLocalStorageTarget): JournalStorageLocation {
  if (target?.scope === "device") {
    return { key: DEVICE_JOURNAL_STORAGE_KEY, scope: "device" };
  }
  if (target?.scope === "account") {
    const ownerId = target.ownerId.trim();
    if (!ownerId) {
      throw new Error("An account journal target requires an owner ID.");
    }
    return { key: `${JOURNAL_STORAGE_KEY_PREFIX}${ownerId}`, scope: "account", ownerId };
  }

  const owner = getLocalStateOwner()?.trim() || null;
  return owner
    ? { key: `${JOURNAL_STORAGE_KEY_PREFIX}${owner}`, scope: "account", ownerId: owner }
    : { key: DEVICE_JOURNAL_STORAGE_KEY, scope: "device" };
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function compareEntries(a: JournalEntry, b: JournalEntry): number {
  if (a.pinned !== b.pinned) {
    return a.pinned ? -1 : 1;
  }
  return b.updatedAt.localeCompare(a.updatedAt);
}

function normalizeLinkedAyah(entry: unknown): JournalLinkedAyah | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const linkedAyah = entry as JournalLinkedAyah;
  const ayahId = Number(linkedAyah.ayahId);
  const surahNumber = Number(linkedAyah.surahNumber);
  const ayahNumber = Number(linkedAyah.ayahNumber);
  if (!Number.isFinite(ayahId) || !Number.isFinite(surahNumber) || !Number.isFinite(ayahNumber)) {
    return null;
  }

  return {
    ayahId,
    surahNumber,
    ayahNumber,
    surahNameArabic: linkedAyah.surahNameArabic ?? "",
    surahNameTransliteration: linkedAyah.surahNameTransliteration ?? "",
  };
}

function normalizeLinkedDua(entry: unknown): JournalLinkedDua | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const linkedDua = entry as JournalLinkedDua;
  if (!linkedDua.moduleId || !linkedDua.stepId || !linkedDua.title || !linkedDua.translation) {
    return null;
  }

  return {
    moduleId: linkedDua.moduleId ?? "",
    moduleLabel: linkedDua.moduleLabel ?? "",
    stepId: linkedDua.stepId ?? "",
    title: linkedDua.title ?? "",
    label: linkedDua.label ?? "",
    arabic: linkedDua.arabic ?? null,
    transliteration: linkedDua.transliteration ?? null,
    translation: linkedDua.translation ?? "",
    sourceLabel: linkedDua.sourceLabel ?? null,
    sourceHref: linkedDua.sourceHref ?? null,
  };
}

function normalizeAyahSnapshot(entry: unknown): JournalAyahSnapshot | null {
  const linkedAyah = normalizeLinkedAyah(entry);
  if (!linkedAyah) {
    return null;
  }

  const raw = entry as JournalAyahSnapshot;
  return {
    ...linkedAyah,
    textUthmani: typeof raw.textUthmani === "string" ? raw.textUthmani : null,
    translation: typeof raw.translation === "string" ? raw.translation : null,
  };
}

export function createJournalBlockId(now: Date = new Date()): string {
  return `block_${now.getTime()}_${Math.random().toString(16).slice(2, 10)}`;
}

export function createJournalEntryId(now: Date = new Date()): string {
  return `journal_${now.getTime()}_${Math.random().toString(16).slice(2, 10)}`;
}

export function createTextBlock(content = "", now: Date = new Date()): JournalTextBlock {
  return {
    id: createJournalBlockId(now),
    kind: "text",
    content,
  };
}

export function createAyahBlock(input?: {
  title?: string;
  ayah?: JournalAyahSnapshot | null;
  now?: Date;
}): JournalAyahBlock {
  return {
    id: createJournalBlockId(input?.now),
    kind: "ayah",
    title: input?.title ?? "",
    ayah: input?.ayah ?? null,
  };
}

export function createDuaBlock(input?: {
  title?: string;
  dua?: JournalLinkedDua | null;
  now?: Date;
}): JournalDuaBlock {
  return {
    id: createJournalBlockId(input?.now),
    kind: "dua",
    title: input?.title ?? "",
    dua: input?.dua ?? null,
  };
}

function normalizeBlock(entry: unknown, fallbackIndex = 0): JournalBlock | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const block = entry as JournalBlock;
  const id = typeof block.id === "string" && block.id.trim().length > 0
    ? block.id
    : `legacy_block_${fallbackIndex}`;

  if (block.kind === "text") {
    return {
      id,
      kind: "text",
      content: typeof block.content === "string" ? block.content : "",
    };
  }

  if (block.kind === "ayah") {
    return {
      id,
      kind: "ayah",
      title: typeof block.title === "string" ? block.title : "",
      ayah: normalizeAyahSnapshot(block.ayah),
    };
  }

  if (block.kind === "dua") {
    return {
      id,
      kind: "dua",
      title: typeof block.title === "string" ? block.title : "",
      dua: normalizeLinkedDua(block.dua),
    };
  }

  return null;
}

export function buildLegacyJournalBlocks(input: {
  content?: string | null;
  linkedAyah?: JournalLinkedAyah | null;
  linkedDua?: JournalLinkedDua | null;
}): JournalBlock[] {
  const blocks: JournalBlock[] = [];
  const textContent = typeof input.content === "string" ? input.content : "";
  const linkedAyah = normalizeLinkedAyah(input.linkedAyah ?? null);
  const linkedDua = normalizeLinkedDua(input.linkedDua ?? null);

  if (textContent.trim().length > 0) {
    blocks.push({
      id: `legacy_block_${blocks.length}`,
      kind: "text",
      content: textContent,
    });
  }

  if (linkedAyah) {
    blocks.push({
      id: `legacy_block_${blocks.length}`,
      kind: "ayah",
      title: `${linkedAyah.surahNameTransliteration} ${linkedAyah.surahNumber}:${linkedAyah.ayahNumber}`,
      ayah: {
        ...linkedAyah,
        textUthmani: null,
        translation: null,
      },
    });
  }

  if (linkedDua) {
    blocks.push({
      id: `legacy_block_${blocks.length}`,
      kind: "dua",
      title: linkedDua.title,
      dua: linkedDua,
    });
  }

  return blocks;
}

export function normalizeJournalBlocks(
  blocks: unknown,
  fallback?: {
    content?: string | null;
    linkedAyah?: JournalLinkedAyah | null;
    linkedDua?: JournalLinkedDua | null;
  },
): JournalBlock[] {
  if (!Array.isArray(blocks)) {
    return buildLegacyJournalBlocks({
      content: fallback?.content ?? "",
      linkedAyah: fallback?.linkedAyah ?? null,
      linkedDua: fallback?.linkedDua ?? null,
    });
  }

  const normalized = blocks
    .map((block, index) => normalizeBlock(block, index))
    .filter((block): block is JournalBlock => block !== null);

  if (normalized.length === 0 && blocks.length > 0) {
    return buildLegacyJournalBlocks({
      content: fallback?.content ?? "",
      linkedAyah: fallback?.linkedAyah ?? null,
      linkedDua: fallback?.linkedDua ?? null,
    });
  }

  return normalized;
}

export function deriveJournalContent(title: string, blocks: JournalBlock[]): string {
  const parts: string[] = [];
  const trimmedTitle = title.trim();
  if (trimmedTitle) {
    parts.push(trimmedTitle);
  }

  for (const block of blocks) {
    if (block.kind === "text") {
      if (block.content.trim()) {
        parts.push(block.content.trim());
      }
      continue;
    }

    if (block.kind === "ayah" && block.ayah) {
      if (block.title.trim()) {
        parts.push(block.title.trim());
      }
      if (block.ayah.translation?.trim()) {
        parts.push(block.ayah.translation.trim());
      }
      parts.push(`${block.ayah.surahNameTransliteration} ${block.ayah.surahNumber}:${block.ayah.ayahNumber}`);
      continue;
    }

    if (block.kind === "dua" && block.dua) {
      if (block.title.trim()) {
        parts.push(block.title.trim());
      }
      if (block.dua.translation.trim()) {
        parts.push(block.dua.translation.trim());
      }
      parts.push(block.dua.title);
    }
  }

  return parts.join("\n\n").trim();
}

export function hasMeaningfulJournalBlocks(blocks: JournalBlock[]): boolean {
  return blocks.some((block) => {
    if (block.kind === "text") {
      return block.content.trim().length > 0;
    }
    if (block.kind === "ayah") {
      return Boolean(block.ayah);
    }
    return Boolean(block.dua);
  });
}

export function findPrimaryLinkedAyah(blocks: JournalBlock[]): JournalLinkedAyah | null {
  for (const block of blocks) {
    if (block.kind === "ayah" && block.ayah) {
      return {
        ayahId: block.ayah.ayahId,
        surahNumber: block.ayah.surahNumber,
        ayahNumber: block.ayah.ayahNumber,
        surahNameArabic: block.ayah.surahNameArabic,
        surahNameTransliteration: block.ayah.surahNameTransliteration,
      };
    }
  }
  return null;
}

export function findPrimaryLinkedDua(blocks: JournalBlock[]): JournalLinkedDua | null {
  for (const block of blocks) {
    if (block.kind === "dua" && block.dua) {
      return block.dua;
    }
  }
  return null;
}

export type NormalizedJournalEntry = JournalEntry & { version: number };

export function normalizeJournalEntry(entry: JournalEntry): NormalizedJournalEntry {
  const originEntryId =
    typeof entry.originEntryId === "string" && entry.originEntryId.trim()
      ? entry.originEntryId.trim()
      : null;
  const clientEntryId =
    typeof entry.clientEntryId === "string" && entry.clientEntryId.trim()
      ? entry.clientEntryId.trim()
      : null;
  const linkedAyah = normalizeLinkedAyah(entry.linkedAyah ?? null);
  const linkedDua = normalizeLinkedDua(entry.linkedDua ?? null);
  const blocks = normalizeJournalBlocks(entry.blocks ?? null, {
    content: entry.content,
    linkedAyah,
    linkedDua,
  });
  const primaryLinkedAyah = linkedAyah ?? findPrimaryLinkedAyah(blocks);
  const primaryLinkedDua = linkedDua ?? findPrimaryLinkedDua(blocks);

  return {
    id: entry.id,
    ...(originEntryId ? { originEntryId } : {}),
    ...(clientEntryId ? { clientEntryId } : {}),
    version:
      Number.isSafeInteger(entry.version) && Number(entry.version) >= 1
        ? Number(entry.version)
        : 1,
    type: JOURNAL_ENTRY_TYPES.includes(entry.type) ? entry.type : "free",
    title: typeof entry.title === "string" ? entry.title.trim() : "",
    content:
      typeof entry.content === "string" && entry.content.trim().length > 0
        ? entry.content.trim()
        : deriveJournalContent(typeof entry.title === "string" ? entry.title : "", blocks),
    blocks,
    tags: normalizeJournalTags(Array.isArray(entry.tags) ? entry.tags : []),
    pinned: entry.pinned === true,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    linkedAyah: primaryLinkedAyah,
    linkedDua: primaryLinkedDua,
    duaStatus:
      entry.duaStatus === "ongoing" ||
      entry.duaStatus === "answered" ||
      entry.duaStatus === "accepted_differently"
        ? entry.duaStatus
        : null,
    autoDeleteAt: entry.autoDeleteAt ?? null,
  };
}

function readEntriesAtLocation(
  location: JournalStorageLocation,
  now: Date,
): JournalLocalReadResult {
  try {
    const storedEntries = window.localStorage.getItem(location.key);
    if (storedEntries === null) {
      return { ok: true, entries: [] };
    }
    const raw = safeJsonParse<JournalEntry[]>(storedEntries);
    if (!Array.isArray(raw)) {
      return { ok: false, reason: "read-failed" };
    }
    const normalized = raw
      .map(normalizeJournalEntry)
      .filter((entry) => typeof entry.id === "string" && entry.id.length > 0);
    return {
      ok: true,
      entries: pruneExpired(normalized, now).sort(compareEntries),
    };
  } catch {
    return { ok: false, reason: "read-failed" };
  }
}

function writeEntries(
  entries: JournalEntry[],
  location: JournalStorageLocation = journalStorageLocation(),
): JournalEntriesWriteResult {
  let serializedEntries: string;
  try {
    const normalizedEntries = entries.map(normalizeJournalEntry).sort(compareEntries);
    serializedEntries = JSON.stringify(normalizedEntries);
  } catch {
    return { ok: false, reason: "write-failed" };
  }

  try {
    window.localStorage.setItem(location.key, serializedEntries);
  } catch {
    return { ok: false, reason: "write-failed" };
  }

  let storedEntries: string | null;
  try {
    storedEntries = window.localStorage.getItem(location.key);
  } catch {
    return { ok: false, reason: "verification-failed" };
  }

  if (storedEntries !== serializedEntries) {
    return { ok: false, reason: "verification-failed" };
  }

  const verifiedEntries = safeJsonParse<JournalEntry[]>(storedEntries);
  if (!Array.isArray(verifiedEntries)) {
    return { ok: false, reason: "verification-failed" };
  }

  try {
    return {
      ok: true,
      entries: verifiedEntries.map(normalizeJournalEntry).sort(compareEntries),
    };
  } catch {
    return { ok: false, reason: "verification-failed" };
  }
}

function clearJournalEntriesUnlocked(target?: JournalLocalStorageTarget): boolean {
  if (!isBrowser()) {
    return false;
  }

  let location: JournalStorageLocation;
  try {
    location = journalStorageLocation(target);
  } catch {
    return false;
  }

  // The unscoped legacy key may contain recovery data for a different or
  // unknown owner. It is removed only by the selective import cleanup after
  // explicit server acknowledgement, never by a broad scoped clear.
  const keys = [location.key];
  try {
    for (const key of keys) {
      window.localStorage.removeItem(key);
    }
    return keys.every((key) => window.localStorage.getItem(key) === null);
  } catch {
    return false;
  }
}

export async function clearJournalEntries(target?: JournalLocalStorageTarget): Promise<boolean> {
  if (!isBrowser()) {
    return false;
  }
  let location: JournalStorageLocation;
  try {
    location = journalStorageLocation(target);
  } catch {
    return false;
  }
  if (location.scope === "device") {
    const locked = await withJournalOwnerStorageLock(
      DEVICE_JOURNAL_STORAGE_LOCK_OWNER,
      () => clearJournalEntriesUnlocked({ scope: "device" }),
    );
    return locked.ok ? locked.value : false;
  }
  const ownerId = location.ownerId;
  if (!ownerId) {
    return false;
  }
  const lockedTarget: JournalAccountLocalStorageTarget = { scope: "account", ownerId };
  const locked = await withJournalOwnerStorageLock(
    ownerId,
    () => clearJournalEntriesUnlocked(lockedTarget),
    { requireActiveOwner: true },
  );
  return locked.ok ? locked.value : false;
}

function journalEntryPayloadFingerprint(entry: JournalEntry): string {
  return JSON.stringify(normalizeJournalEntry(entry));
}

/**
 * Removes only server-acknowledged import sources whose current normalized
 * local payload is still the exact snapshot that was submitted. The fresh
 * read and verified writes run synchronously inside the same per-owner Web
 * Lock used by the account journal queue, so another current app tab cannot
 * interleave a journal storage mutation between them.
 */
export async function removeAcknowledgedJournalImportSources(
  target: JournalAccountLocalStorageTarget,
  submittedEntries: readonly JournalEntry[],
  acknowledgedSourceEntryIds: readonly string[],
): Promise<JournalImportCleanupResult> {
  if (!isBrowser()) {
    return {
      ok: false,
      reason: "storage-unavailable",
      removedEntryIds: [],
      retainedEntryIds: acknowledgedSourceEntryIds.slice(),
    };
  }

  let location: JournalStorageLocation;
  try {
    location = journalStorageLocation(target);
  } catch {
    return {
      ok: false,
      reason: "read-failed",
      removedEntryIds: [],
      retainedEntryIds: acknowledgedSourceEntryIds.slice(),
    };
  }

  const submittedFingerprints = new Map<string, string>();
  try {
    for (const entry of submittedEntries) {
      if (typeof entry.id !== "string" || !entry.id.trim()) {
        continue;
      }
      submittedFingerprints.set(entry.id, journalEntryPayloadFingerprint(entry));
    }
  } catch {
    return {
      ok: false,
      reason: "read-failed",
      removedEntryIds: [],
      retainedEntryIds: acknowledgedSourceEntryIds.slice(),
    };
  }

  const acknowledgedIds = new Set(
    acknowledgedSourceEntryIds.filter((entryId) => submittedFingerprints.has(entryId)),
  );
  const locked = await withJournalOwnerStorageLock<JournalImportCleanupResult>(target.ownerId, (): JournalImportCleanupResult => {
    // Do not rewrite the old unscoped v1 key. Tabs running an older deployed
    // build never acquire this lock, so no read/compare/write sequence can
    // safely remove part of that key without risking a concurrent old-client
    // write. It remains a recovery copy.
    const locations: JournalStorageLocation[] = [location];
    const reads: Array<{
      location: JournalStorageLocation;
      entries: Array<{ raw: unknown; normalized: JournalEntry | null }>;
    }> = [];

    for (const currentLocation of locations) {
      let storedEntries: string | null;
      try {
        storedEntries = window.localStorage.getItem(currentLocation.key);
      } catch {
        return {
          ok: false,
          reason: "read-failed" as const,
          removedEntryIds: [],
          retainedEntryIds: [...acknowledgedIds],
        };
      }
      if (storedEntries === null) {
        reads.push({ location: currentLocation, entries: [] });
        continue;
      }
      const rawEntries = safeJsonParse<unknown[]>(storedEntries);
      if (!Array.isArray(rawEntries)) {
        return {
          ok: false,
          reason: "read-failed" as const,
          removedEntryIds: [],
          retainedEntryIds: [...acknowledgedIds],
        };
      }
      try {
        reads.push({
          location: currentLocation,
          entries: rawEntries.map((raw) => {
            try {
              const normalized = normalizeJournalEntry(raw as JournalEntry);
              return {
                raw,
                normalized:
                  typeof normalized.id === "string" && normalized.id.trim()
                    ? normalized
                    : null,
              };
            } catch {
              return { raw, normalized: null };
            }
          }),
        });
      } catch {
        return {
          ok: false,
          reason: "read-failed" as const,
          removedEntryIds: [],
          retainedEntryIds: [...acknowledgedIds],
        };
      }
    }

    const removedEntryIds = new Set<string>();
    const retainedEntryIds = new Set<string>();
    for (const read of reads) {
      const nextEntries = read.entries.filter(({ normalized: entry }) => {
        if (!entry) {
          return true;
        }
        if (!acknowledgedIds.has(entry.id)) {
          return true;
        }
        const submittedFingerprint = submittedFingerprints.get(entry.id);
        if (
          !submittedFingerprint ||
          journalEntryPayloadFingerprint(entry) !== submittedFingerprint
        ) {
          retainedEntryIds.add(entry.id);
          return true;
        }
        removedEntryIds.add(entry.id);
        return false;
      });

      if (nextEntries.length === read.entries.length) {
        continue;
      }
      let serializedEntries: string;
      try {
        serializedEntries = JSON.stringify(nextEntries.map(({ raw }) => raw));
        window.localStorage.setItem(read.location.key, serializedEntries);
      } catch {
        return {
          ok: false,
          reason: "write-failed" as const,
          removedEntryIds: [...removedEntryIds],
          retainedEntryIds: [...new Set([...acknowledgedIds, ...retainedEntryIds])]
            .filter((entryId) => !removedEntryIds.has(entryId)),
        };
      }
      try {
        if (window.localStorage.getItem(read.location.key) !== serializedEntries) {
          return {
            ok: false,
            reason: "verification-failed" as const,
            removedEntryIds: [...removedEntryIds],
            retainedEntryIds: [...new Set([...acknowledgedIds, ...retainedEntryIds])]
              .filter((entryId) => !removedEntryIds.has(entryId)),
          };
        }
      } catch {
        return {
          ok: false,
          reason: "verification-failed" as const,
          removedEntryIds: [...removedEntryIds],
          retainedEntryIds: [...new Set([...acknowledgedIds, ...retainedEntryIds])]
            .filter((entryId) => !removedEntryIds.has(entryId)),
        };
      }
    }

    return {
      ok: true,
      removedEntryIds: [...removedEntryIds],
      retainedEntryIds: [...retainedEntryIds],
    };
  }, { requireActiveOwner: true });

  if (!locked.ok) {
    return {
      ok: false,
      reason: locked.reason,
      removedEntryIds: [],
      retainedEntryIds: [...acknowledgedIds],
    };
  }
  return locked.value;
}

function pruneExpired(entries: JournalEntry[], now: Date): JournalEntry[] {
  return entries.filter((entry) => {
    if (!entry.autoDeleteAt) {
      return true;
    }
    const expiresAt = new Date(entry.autoDeleteAt);
    if (Number.isNaN(expiresAt.getTime())) {
      return true;
    }
    return expiresAt.getTime() > now.getTime();
  });
}

export function listJournalEntries(
  now: Date = new Date(),
  target?: JournalLocalStorageTarget,
): JournalEntry[] {
  if (!isBrowser()) {
    return [];
  }

  let location: JournalStorageLocation;
  try {
    location = journalStorageLocation(target);
  } catch {
    return [];
  }

  const result = readEntriesAtLocation(location, now);
  if (!result.ok) {
    return [];
  }
  return result.entries;
}

function upsertJournalEntryUnlocked(
  entry: JournalEntry,
  now: Date = new Date(),
  target?: JournalLocalStorageTarget,
  expectedVersion?: number | null,
): JournalLocalWriteResult {
  if (!isBrowser()) {
    return {
      ok: false,
      scope: "device",
      reason: "storage-unavailable",
      entries: [],
    };
  }

  let location: JournalStorageLocation;
  try {
    location = journalStorageLocation(target);
  } catch {
    return {
      ok: false,
      scope: "device",
      reason: "read-failed",
      entries: [],
    };
  }

  const readResult = readEntriesAtLocation(location, now);
  if (!readResult.ok) {
    return {
      ok: false,
      scope: location.scope,
      reason: readResult.reason,
      entries: [],
    };
  }

  const existing = readResult.entries.find((item) => item.id === entry.id) ?? null;
  if (
    (expectedVersion === null && existing) ||
    (typeof expectedVersion === "number" && existing?.version !== expectedVersion)
  ) {
    return {
      ok: false,
      scope: location.scope,
      reason: "version-conflict",
      entries: readResult.entries,
    };
  }

  const current = readResult.entries.filter((item) => item.id !== entry.id);
  const normalized = normalizeJournalEntry({
    ...entry,
    version:
      typeof expectedVersion === "number"
        ? expectedVersion + 1
        : expectedVersion === null
          ? 1
          : entry.version,
    title: entry.title?.trim() ?? "",
    createdAt: entry.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
  });

  current.push(normalized);
  const writeResult = writeEntries(current, location);
  if (!writeResult.ok) {
    return {
      ok: false,
      scope: location.scope,
      reason: writeResult.reason,
      entries: readResult.entries,
    };
  }

  const verifiedEntry = writeResult.entries.find((item) => item.id === normalized.id);
  if (!verifiedEntry) {
    return {
      ok: false,
      scope: location.scope,
      reason: "verification-failed",
      entries: readResult.entries,
    };
  }

  return {
    ok: true,
    scope: location.scope,
    entry: verifiedEntry,
    entries: writeResult.entries,
  };
}

export async function upsertJournalEntry(
  entry: JournalEntry,
  now: Date = new Date(),
  target?: JournalLocalStorageTarget,
  expectedVersion: number | null | undefined =
    Number.isSafeInteger(entry.version) && Number(entry.version) >= 1
      ? Number(entry.version) === 1
        ? null
        : Number(entry.version) - 1
      : undefined,
): Promise<JournalLocalWriteResult> {
  if (!isBrowser()) {
    return upsertJournalEntryUnlocked(entry, now, target, expectedVersion);
  }
  let location: JournalStorageLocation;
  try {
    location = journalStorageLocation(target);
  } catch {
    return upsertJournalEntryUnlocked(entry, now, target, expectedVersion);
  }
  if (location.scope === "device") {
    const locked = await withJournalOwnerStorageLock(
      DEVICE_JOURNAL_STORAGE_LOCK_OWNER,
      () => upsertJournalEntryUnlocked(entry, now, { scope: "device" }, expectedVersion),
    );
    if (!locked.ok) {
      return {
        ok: false,
        scope: "device",
        reason: locked.reason,
        entries: [],
      };
    }
    return locked.value;
  }
  const ownerId = location.ownerId;
  if (!ownerId) {
    return {
      ok: false,
      scope: "account",
      reason: "locking-unavailable",
      entries: [],
    };
  }
  const lockedTarget: JournalAccountLocalStorageTarget = { scope: "account", ownerId };
  const locked = await withJournalOwnerStorageLock(
    ownerId,
    () => upsertJournalEntryUnlocked(entry, now, lockedTarget, expectedVersion),
    { requireActiveOwner: true },
  );
  if (!locked.ok) {
    return {
      ok: false,
      scope: "account",
      reason: locked.reason,
      entries: [],
    };
  }
  return locked.value;
}

function deleteJournalEntryUnlocked(
  entryId: string,
  now: Date = new Date(),
  target?: JournalLocalStorageTarget,
  expectedVersion?: number,
): JournalLocalDeleteResult {
  if (!isBrowser()) {
    return {
      ok: false,
      scope: "device",
      reason: "storage-unavailable",
      entries: [],
    };
  }

  let location: JournalStorageLocation;
  try {
    location = journalStorageLocation(target);
  } catch {
    return {
      ok: false,
      scope: "device",
      reason: "read-failed",
      entries: [],
    };
  }

  const readResult = readEntriesAtLocation(location, now);
  if (!readResult.ok) {
    return {
      ok: false,
      scope: location.scope,
      reason: readResult.reason,
      entries: [],
    };
  }

  const existing = readResult.entries.find((entry) => entry.id === entryId) ?? null;
  if (expectedVersion !== undefined && existing?.version !== expectedVersion) {
    return {
      ok: false,
      scope: location.scope,
      reason: "version-conflict",
      entries: readResult.entries,
    };
  }

  const next = readResult.entries.filter((entry) => entry.id !== entryId);
  const writeResult = writeEntries(next, location);
  if (!writeResult.ok || writeResult.entries.some((entry) => entry.id === entryId)) {
    return {
      ok: false,
      scope: location.scope,
      reason: writeResult.ok ? "verification-failed" : writeResult.reason,
      entries: readResult.entries,
    };
  }

  return {
    ok: true,
    scope: location.scope,
    entries: writeResult.entries,
  };
}

export async function deleteJournalEntry(
  entryId: string,
  now: Date = new Date(),
  target?: JournalLocalStorageTarget,
  expectedVersion?: number,
): Promise<JournalLocalDeleteResult> {
  if (!isBrowser()) {
    return deleteJournalEntryUnlocked(entryId, now, target, expectedVersion);
  }
  let location: JournalStorageLocation;
  try {
    location = journalStorageLocation(target);
  } catch {
    return deleteJournalEntryUnlocked(entryId, now, target, expectedVersion);
  }
  if (location.scope === "device") {
    const locked = await withJournalOwnerStorageLock(
      DEVICE_JOURNAL_STORAGE_LOCK_OWNER,
      () => deleteJournalEntryUnlocked(entryId, now, { scope: "device" }, expectedVersion),
    );
    if (!locked.ok) {
      return {
        ok: false,
        scope: "device",
        reason: locked.reason,
        entries: [],
      };
    }
    return locked.value;
  }
  const ownerId = location.ownerId;
  if (!ownerId) {
    return {
      ok: false,
      scope: "account",
      reason: "locking-unavailable",
      entries: [],
    };
  }
  const lockedTarget: JournalAccountLocalStorageTarget = { scope: "account", ownerId };
  const locked = await withJournalOwnerStorageLock(
    ownerId,
    () => deleteJournalEntryUnlocked(entryId, now, lockedTarget, expectedVersion),
    { requireActiveOwner: true },
  );
  if (!locked.ok) {
    return {
      ok: false,
      scope: "account",
      reason: locked.reason,
      entries: [],
    };
  }
  return locked.value;
}

export function normalizeJournalTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    const cleaned = tag
      .trim()
      .replace(/^#+/, "")
      .replace(/\s+/g, "-")
      .toLowerCase();
    if (!cleaned || cleaned.length > 32 || seen.has(cleaned)) {
      continue;
    }
    seen.add(cleaned);
    out.push(cleaned);
    if (out.length >= 5) {
      break;
    }
  }
  return out;
}

export function formatJournalTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatJournalHijri(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Hijri date unavailable";
  }
  try {
    return new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "Hijri date unavailable";
  }
}

export function describeJournalMoment(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Quiet moment";
  }
  const hour = date.getHours();
  const part =
    hour < 5 ? "Late night"
    : hour < 12 ? "Morning"
    : hour < 17 ? "Afternoon"
    : hour < 20 ? "Evening"
    : "Night";
  return date.getDay() === 5 ? `Jumu'ah ${part.toLowerCase()}` : part;
}

export function formatAutoDeleteCountdown(entry: JournalEntry, now: Date = new Date()): string | null {
  if (!entry.autoDeleteAt) {
    return null;
  }
  const expiresAt = new Date(entry.autoDeleteAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return null;
  }
  const remainingMs = expiresAt.getTime() - now.getTime();
  if (remainingMs <= 0) {
    return "Releasing now";
  }
  const totalHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h left` : `${days}d left`;
  }
  if (hours > 0) {
    return `${hours}h left`;
  }
  const minutes = Math.max(1, Math.floor(remainingMs / (1000 * 60)));
  return `${minutes}m left`;
}

export function buildLinkedAyahHref(linkedAyah: JournalLinkedAyah): string {
  return `/quran/read?view=compact&surah=${linkedAyah.surahNumber}&cursor=${linkedAyah.ayahId}`;
}

export function buildLinkedDuaHref(linkedDua: JournalLinkedDua): string {
  return `/dua/${linkedDua.moduleId}`;
}

export function privacyStatusLabel(entry: JournalEntry): string {
  if (entry.autoDeleteAt) {
    return "Local only - auto-delete scheduled";
  }
  if (entry.type === "repentance") {
    return "Local only - repentance";
  }
  return "Local only";
}
