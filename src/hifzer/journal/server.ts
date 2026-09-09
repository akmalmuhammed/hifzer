import "server-only";

import {
  JOURNAL_ENTRY_TYPES,
  buildLegacyJournalBlocks,
  deriveJournalContent,
  findPrimaryLinkedAyah,
  findPrimaryLinkedDua,
  hasMeaningfulJournalBlocks,
  normalizeJournalTags,
  type JournalBlock,
  type JournalDuaStatus,
  type JournalEntry,
  type JournalEntryType,
  type JournalLinkedAyah,
  type JournalLinkedDua,
} from "@/hifzer/journal/local-store";
import { Prisma } from "@prisma/client";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import {
  syncJournalEntryNoteToQuranFoundation,
} from "@/hifzer/quran-foundation/user-features";
import { db, dbConfigured } from "@/lib/db";

const MAX_CONTENT_LENGTH = 12000;
const MAX_ENTRY_TITLE_LENGTH = 120;
const MAX_SURAH_NAME_LENGTH = 120;
const MAX_DUA_TEXT_LENGTH = 6000;
const MAX_DUA_META_LENGTH = 160;
const MAX_BLOCKS = 40;
const MAX_BLOCK_TITLE_LENGTH = 120;
const MAX_IMPORT_ENTRIES = 200;
const QURAN_FOUNDATION_NOTE_CLIENT_ID_PREFIX = "qf-note:";
const DUA_STATUSES = ["ongoing", "answered", "accepted_differently"] satisfies readonly JournalDuaStatus[];
const JOURNAL_DUA_MODULE_IDS = [
  "laylat-al-qadr",
  "repentance",
  "anxiety-distress",
  "istikhara-decisions",
  "healing-shifa",
  "grief-loss",
  "family-home",
  "wealth",
  "ruqyah",
  "beautiful-names",
] as const;

type JournalUpsertInput = {
  id?: string | null;
  ownerId?: string | null;
  expectedVersion?: number | null;
  clientMutationId?: string | null;
  mutationType?: string | null;
  type?: JournalEntryType | string | null;
  title?: string | null;
  content?: string | null;
  blocks?: JournalBlock[] | null;
  tags?: string[] | null;
  pinned?: boolean | null;
  createdAt?: string | null;
  linkedAyah?: JournalLinkedAyah | null;
  linkedDua?: JournalLinkedDua | null;
  duaStatus?: JournalDuaStatus | string | null;
  autoDeleteAt?: string | null;
};

type JournalEntryRow = {
  id: string;
  originEntryId: string | null;
  clientEntryId: string | null;
  version: number;
  type: JournalEntryType;
  title: string | null;
  content: string;
  blocksJson: unknown;
  tags: string[];
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  linkedAyahId: number | null;
  linkedSurahNumber: number | null;
  linkedAyahNumber: number | null;
  linkedSurahNameArabic: string | null;
  linkedSurahNameTransliteration: string | null;
  linkedDuaJson: unknown;
  duaStatus: JournalDuaStatus | null;
  autoDeleteAt: Date | null;
};

type JournalEntrySummaryRow = Pick<
  JournalEntryRow,
  | "id"
  | "originEntryId"
  | "clientEntryId"
  | "version"
  | "type"
  | "title"
  | "content"
  | "tags"
  | "pinned"
  | "createdAt"
  | "updatedAt"
  | "linkedAyahId"
  | "linkedSurahNumber"
  | "linkedAyahNumber"
  | "linkedSurahNameArabic"
  | "linkedSurahNameTransliteration"
  | "linkedDuaJson"
  | "duaStatus"
  | "autoDeleteAt"
>;

export type JournalImportAcknowledgement = {
  sourceEntryId: string;
  status: "created" | "already-identical" | "conflict";
  /** The authoritative account copy, when one exists. */
  entry: JournalEntry | null;
};

export type JournalImportResult = {
  entries: JournalEntry[];
  acknowledgements: JournalImportAcknowledgement[];
};

export class JournalStorageError extends Error {
  readonly status: number;
  readonly code: string;
  readonly authoritativeEntry?: JournalEntry | null;

  constructor(
    message: string,
    status = 400,
    code = "journal_error",
    authoritativeEntry?: JournalEntry | null,
  ) {
    super(message);
    this.name = "JournalStorageError";
    this.status = status;
    this.code = code;
    this.authoritativeEntry = authoritativeEntry;
  }
}

export function isJournalStorageError(error: unknown): error is JournalStorageError {
  return error instanceof JournalStorageError;
}

function looksLikeMissingJournalSchema(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("PrivateJournalEntry") ||
    message.includes("P2021") ||
    message.includes("P2022") ||
    /relation .* does not exist/i.test(message) ||
    /column .* does not exist/i.test(message)
  );
}

function sanitizeOptionalText(value: string | null | undefined, maxLength: number): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim().replace(/\r\n/g, "\n");
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, maxLength);
}

function normalizeQuranFoundationNoteClientId(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.startsWith(QURAN_FOUNDATION_NOTE_CLIENT_ID_PREFIX) &&
    trimmed.length > QURAN_FOUNDATION_NOTE_CLIENT_ID_PREFIX.length
    ? trimmed
    : null;
}

function normalizeClientMutationId(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > 128) {
    throw new JournalStorageError("clientMutationId is too long.", 400, "INVALID_CLIENT_MUTATION_ID");
  }
  return trimmed;
}

function normalizeExpectedVersion(value: number | null | undefined): number | undefined {
  if (value == null) {
    return undefined;
  }
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new JournalStorageError("expectedVersion must be a positive integer.", 400, "INVALID_VERSION");
  }
  return value;
}

function normalizeSaveMutationKind(value: string | null | undefined): "CREATE" | "UPDATE" | undefined {
  if (value == null || !value.trim()) {
    return undefined;
  }
  const normalized = value.trim().toUpperCase();
  if (normalized === "CREATE" || normalized === "UPDATE") {
    return normalized;
  }
  throw new JournalStorageError("mutationType must be create or update.", 400, "INVALID_MUTATION_TYPE");
}

function enforceOwnerMatch(clerkUserId: string, ownerId: string | null | undefined): void {
  if (ownerId == null) {
    return;
  }
  if (ownerId.trim() !== clerkUserId) {
    throw new JournalStorageError(
      "This journal change belongs to a different signed-in account.",
      409,
      "OWNER_MISMATCH",
    );
  }
}

function enforceExplicitOwnerMatch(
  clerkUserId: string,
  ownerId: string | null | undefined,
): void {
  if (typeof ownerId !== "string" || !ownerId.trim()) {
    throw new JournalStorageError(
      "Journal import owner is required.",
      400,
      "MISSING_OWNER",
    );
  }
  enforceOwnerMatch(clerkUserId, ownerId);
}

function parseIsoDate(value: string | null | undefined): Date | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function normalizeEntryType(value: string | null | undefined, fallback: JournalEntryType = "reflection"): JournalEntryType {
  if (typeof value === "string" && JOURNAL_ENTRY_TYPES.includes(value as JournalEntryType)) {
    return value as JournalEntryType;
  }
  return fallback;
}

function normalizeDuaStatus(value: string | null | undefined): JournalDuaStatus {
  if (typeof value === "string" && DUA_STATUSES.includes(value as JournalDuaStatus)) {
    return value as JournalDuaStatus;
  }
  return "ongoing";
}

function sanitizeLinkedAyah(value: JournalLinkedAyah | null | undefined): JournalLinkedAyah | null {
  if (!value) {
    return null;
  }

  const ayahId = Number(value.ayahId);
  const surahNumber = Number(value.surahNumber);
  const ayahNumber = Number(value.ayahNumber);
  if (!Number.isFinite(ayahId) || !Number.isFinite(surahNumber) || !Number.isFinite(ayahNumber)) {
    return null;
  }

  return {
    ayahId: Math.max(1, Math.floor(ayahId)),
    surahNumber: Math.max(1, Math.floor(surahNumber)),
    ayahNumber: Math.max(1, Math.floor(ayahNumber)),
    surahNameArabic: sanitizeOptionalText(value.surahNameArabic, MAX_SURAH_NAME_LENGTH) ?? "",
    surahNameTransliteration: sanitizeOptionalText(value.surahNameTransliteration, MAX_SURAH_NAME_LENGTH) ?? "",
  };
}

function sanitizeLinkedDua(value: JournalLinkedDua | null | undefined): JournalLinkedDua | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const moduleId = sanitizeOptionalText(value.moduleId, MAX_DUA_META_LENGTH);
  const stepId = sanitizeOptionalText(value.stepId, MAX_DUA_META_LENGTH);
  const title = sanitizeOptionalText(value.title, MAX_DUA_META_LENGTH);
  const label = sanitizeOptionalText(value.label, MAX_DUA_META_LENGTH) ?? "Dua";
  const translation = sanitizeOptionalText(value.translation, MAX_DUA_TEXT_LENGTH);
  if (
    !moduleId ||
    !JOURNAL_DUA_MODULE_IDS.includes(moduleId as (typeof JOURNAL_DUA_MODULE_IDS)[number]) ||
    !stepId ||
    !title ||
    !translation
  ) {
    return null;
  }

  return {
    moduleId,
    moduleLabel: sanitizeOptionalText(value.moduleLabel, MAX_DUA_META_LENGTH) ?? "Dua",
    stepId,
    title,
    label,
    arabic: sanitizeOptionalText(value.arabic ?? null, MAX_DUA_TEXT_LENGTH),
    transliteration: sanitizeOptionalText(value.transliteration ?? null, MAX_DUA_TEXT_LENGTH),
    translation,
    sourceLabel: sanitizeOptionalText(value.sourceLabel ?? null, MAX_DUA_META_LENGTH),
    sourceHref: sanitizeOptionalText(value.sourceHref ?? null, 500),
  };
}

function sanitizeBlockId(value: unknown, index: number): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, 80);
  }
  return `block_${index + 1}`;
}

function sanitizeJournalBlocks(
  value: unknown,
  fallback?: {
    content?: string | null;
    linkedAyah?: JournalLinkedAyah | null;
    linkedDua?: JournalLinkedDua | null;
  },
): JournalBlock[] {
  if (!Array.isArray(value)) {
    return buildLegacyJournalBlocks({
      content: fallback?.content ?? "",
      linkedAyah: fallback?.linkedAyah ?? null,
      linkedDua: fallback?.linkedDua ?? null,
    });
  }

  const blocks: JournalBlock[] = [];

  for (const [index, rawBlock] of value.entries()) {
    if (blocks.length >= MAX_BLOCKS) {
      break;
    }
    if (!rawBlock || typeof rawBlock !== "object") {
      continue;
    }

    const block = rawBlock as Record<string, unknown>;
    const id = sanitizeBlockId(block.id, index);
    const kind = block.kind;

    if (kind === "text") {
      blocks.push({
        id,
        kind: "text",
        content: sanitizeOptionalText(typeof block.content === "string" ? block.content : "", MAX_CONTENT_LENGTH) ?? "",
      });
      continue;
    }

    if (kind === "ayah") {
      const ayah = sanitizeLinkedAyah(block.ayah as JournalLinkedAyah | null | undefined);
      const rawAyah = block.ayah as Record<string, unknown> | null | undefined;
      blocks.push({
        id,
        kind: "ayah",
        title: sanitizeOptionalText(typeof block.title === "string" ? block.title : "", MAX_BLOCK_TITLE_LENGTH) ?? "",
        ayah:
          ayah
            ? {
                ...ayah,
                textUthmani: sanitizeOptionalText(typeof rawAyah?.textUthmani === "string" ? rawAyah.textUthmani : null, MAX_DUA_TEXT_LENGTH),
                translation: sanitizeOptionalText(typeof rawAyah?.translation === "string" ? rawAyah.translation : null, MAX_DUA_TEXT_LENGTH),
              }
            : null,
      });
      continue;
    }

    if (kind === "dua") {
      blocks.push({
        id,
        kind: "dua",
        title: sanitizeOptionalText(typeof block.title === "string" ? block.title : "", MAX_BLOCK_TITLE_LENGTH) ?? "",
        dua: sanitizeLinkedDua(block.dua as JournalLinkedDua | null | undefined),
      });
    }
  }

  if (blocks.length === 0 && value.length > 0) {
    return buildLegacyJournalBlocks({
      content: fallback?.content ?? "",
      linkedAyah: fallback?.linkedAyah ?? null,
      linkedDua: fallback?.linkedDua ?? null,
    });
  }

  return blocks;
}

function parseLinkedDuaJson(value: unknown): JournalLinkedDua | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return sanitizeLinkedDua(value as JournalLinkedDua);
}

function toLinkedDuaJsonValue(value: JournalLinkedDua | null): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (!value) {
    return Prisma.DbNull;
  }
  return {
    moduleId: value.moduleId,
    moduleLabel: value.moduleLabel,
    stepId: value.stepId,
    title: value.title,
    label: value.label,
    arabic: value.arabic ?? null,
    transliteration: value.transliteration ?? null,
    translation: value.translation,
    sourceLabel: value.sourceLabel ?? null,
    sourceHref: value.sourceHref ?? null,
  };
}

function toBlocksJsonValue(blocks: JournalBlock[]): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return blocks.map((block) => {
    if (block.kind === "text") {
      return {
        id: block.id,
        kind: "text",
        content: block.content,
      };
    }

    if (block.kind === "ayah") {
      return {
        id: block.id,
        kind: "ayah",
        title: block.title,
        ayah: block.ayah
          ? {
              ayahId: block.ayah.ayahId,
              surahNumber: block.ayah.surahNumber,
              ayahNumber: block.ayah.ayahNumber,
              surahNameArabic: block.ayah.surahNameArabic,
              surahNameTransliteration: block.ayah.surahNameTransliteration,
              textUthmani: block.ayah.textUthmani ?? null,
              translation: block.ayah.translation ?? null,
            }
          : null,
      };
    }

    return {
      id: block.id,
      kind: "dua",
      title: block.title,
      dua: block.dua
        ? {
            moduleId: block.dua.moduleId,
            moduleLabel: block.dua.moduleLabel,
            stepId: block.dua.stepId,
            title: block.dua.title,
            label: block.dua.label,
            arabic: block.dua.arabic ?? null,
            transliteration: block.dua.transliteration ?? null,
            translation: block.dua.translation,
            sourceLabel: block.dua.sourceLabel ?? null,
            sourceHref: block.dua.sourceHref ?? null,
          }
        : null,
    };
  });
}

function stripLegacyTitleFromContent(title: string | null, content: string): string {
  const normalizedTitle = title?.trim() ?? "";
  if (!normalizedTitle || content === "") {
    return content;
  }
  if (content === normalizedTitle) {
    return "";
  }
  for (const separator of ["\n\n", "\r\n\r\n"]) {
    const prefix = `${normalizedTitle}${separator}`;
    if (content.startsWith(prefix)) {
      return content.slice(prefix.length);
    }
  }
  return content;
}

function replaceJournalTextBlocks(blocks: JournalBlock[], content: string): JournalBlock[] {
  let replacedText = false;
  const nextBlocks: JournalBlock[] = [];

  for (const block of blocks) {
    if (block.kind !== "text") {
      nextBlocks.push(block);
      continue;
    }
    if (!replacedText) {
      nextBlocks.push({ ...block, content });
      replacedText = true;
    }
  }

  if (!replacedText) {
    const existingIds = new Set(blocks.map((block) => block.id));
    let suffix = 1;
    let id = "block_text_1";
    while (existingIds.has(id)) {
      suffix += 1;
      id = `block_text_${suffix}`;
    }
    nextBlocks.unshift({ id, kind: "text", content });
  }

  return nextBlocks;
}

function parseBlocksJson(
  value: unknown,
  legacy: {
    content: string;
    linkedAyah: JournalLinkedAyah | null;
    linkedDua: JournalLinkedDua | null;
  },
): JournalBlock[] {
  return sanitizeJournalBlocks(value, legacy);
}

function hasMeaningfulContent(input: {
  title: string;
  tags: string[];
  blocks: JournalBlock[];
}): boolean {
  return Boolean(
    input.title.trim().length > 0 ||
    input.tags.length > 0 ||
    hasMeaningfulJournalBlocks(input.blocks),
  );
}

function toSnapshot(row: JournalEntryRow): JournalEntry {
  const legacyLinkedAyah =
    row.linkedAyahId && row.linkedSurahNumber && row.linkedAyahNumber
      ? {
          ayahId: row.linkedAyahId,
          surahNumber: row.linkedSurahNumber,
          ayahNumber: row.linkedAyahNumber,
          surahNameArabic: row.linkedSurahNameArabic ?? "",
          surahNameTransliteration: row.linkedSurahNameTransliteration ?? "",
        }
      : null;
  const legacyLinkedDua = parseLinkedDuaJson(row.linkedDuaJson);
  const blocks = parseBlocksJson(row.blocksJson, {
    content: stripLegacyTitleFromContent(row.title, row.content),
    linkedAyah: legacyLinkedAyah,
    linkedDua: legacyLinkedDua,
  });

  return {
    id: row.id,
    originEntryId: row.originEntryId,
    clientEntryId: row.clientEntryId,
    version: row.version,
    type: row.type,
    title: row.title ?? "",
    content: deriveJournalContent(row.title ?? "", blocks) || row.content,
    blocks,
    tags: row.tags,
    pinned: row.pinned,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    linkedAyah: legacyLinkedAyah ?? findPrimaryLinkedAyah(blocks),
    linkedDua: legacyLinkedDua ?? findPrimaryLinkedDua(blocks),
    duaStatus: row.duaStatus ?? null,
    autoDeleteAt: row.autoDeleteAt ? row.autoDeleteAt.toISOString() : null,
  };
}

function toSummarySnapshot(row: JournalEntrySummaryRow): JournalEntry {
  const linkedAyah =
    row.linkedAyahId && row.linkedSurahNumber && row.linkedAyahNumber
      ? {
          ayahId: row.linkedAyahId,
          surahNumber: row.linkedSurahNumber,
          ayahNumber: row.linkedAyahNumber,
          surahNameArabic: row.linkedSurahNameArabic ?? "",
          surahNameTransliteration: row.linkedSurahNameTransliteration ?? "",
        }
      : null;
  const linkedDua = parseLinkedDuaJson(row.linkedDuaJson);

  return {
    id: row.id,
    originEntryId: row.originEntryId,
    clientEntryId: row.clientEntryId,
    version: row.version,
    type: row.type,
    title: row.title ?? "",
    content: row.content,
    tags: row.tags,
    pinned: row.pinned,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    linkedAyah,
    linkedDua,
    duaStatus: row.duaStatus ?? null,
    autoDeleteAt: row.autoDeleteAt ? row.autoDeleteAt.toISOString() : null,
  };
}

async function withJournalSchemaGuard<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (looksLikeMissingJournalSchema(error)) {
      throw new JournalStorageError("Journal storage is not ready yet.", 503, "SCHEMA_NOT_READY");
    }
    throw error;
  }
}

async function requireProfile(clerkUserId: string) {
  if (!dbConfigured()) {
    throw new JournalStorageError("Database not configured.", 503, "DB_UNAVAILABLE");
  }

  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    throw new JournalStorageError("Profile is unavailable.", 503, "PROFILE_UNAVAILABLE");
  }
  return profile;
}

async function pruneExpiredEntries(_clerkUserId: string, userId: string, now: Date) {
  await db().privateJournalEntry.deleteMany({
    where: {
      userId,
      autoDeleteAt: {
        lte: now,
      },
    },
  });
}

async function listEntriesForUserId(clerkUserId: string, userId: string, now: Date): Promise<JournalEntry[]> {
  await pruneExpiredEntries(clerkUserId, userId, now);

  const rows = await db().privateJournalEntry.findMany({
    where: { userId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  return rows.map((row) => toSnapshot(row as JournalEntryRow));
}

async function listEntrySummariesForUserId(clerkUserId: string, userId: string, now: Date): Promise<JournalEntry[]> {
  await pruneExpiredEntries(clerkUserId, userId, now);

  const rows = await db().privateJournalEntry.findMany({
    where: { userId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      originEntryId: true,
      clientEntryId: true,
      version: true,
      type: true,
      title: true,
      content: true,
      tags: true,
      pinned: true,
      createdAt: true,
      updatedAt: true,
      linkedAyahId: true,
      linkedSurahNumber: true,
      linkedAyahNumber: true,
      linkedSurahNameArabic: true,
      linkedSurahNameTransliteration: true,
      linkedDuaJson: true,
      duaStatus: true,
      autoDeleteAt: true,
    },
  });

  return rows.map((row) => toSummarySnapshot(row as JournalEntrySummaryRow));
}

export async function listPrivateJournalEntries(
  clerkUserId: string,
  now: Date = new Date(),
  input?: { summary?: boolean },
): Promise<JournalEntry[]> {
  const profile = await requireProfile(clerkUserId);
  return withJournalSchemaGuard(() =>
    input?.summary
      ? listEntrySummariesForUserId(clerkUserId, profile.id, now)
      : listEntriesForUserId(clerkUserId, profile.id, now),
  );
}

export async function getPrivateJournalEntry(clerkUserId: string, entryId: string, now: Date = new Date()): Promise<JournalEntry> {
  const profile = await requireProfile(clerkUserId);

  return withJournalSchemaGuard(async () => {
    await pruneExpiredEntries(clerkUserId, profile.id, now);
    const row = await findJournalEntryRow(profile.id, entryId);

    if (!row) {
      throw new JournalStorageError("Journal entry not found.", 404, "NOT_FOUND");
    }

    return toSnapshot(row as JournalEntryRow);
  });
}

type JournalMutationKind = "CREATE" | "UPDATE" | "DELETE";

type JournalMutationRecord = {
  journalEntryId: string | null;
  targetEntryKey: string | null;
  mutationType: JournalMutationKind;
  resultVersion: number | null;
};

function isDuplicateJournalMutationError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  const fields = Array.isArray(target) ? target.map(String).join(" ") : String(target ?? "");
  return fields.includes("PrivateJournalMutation_userId_clientMutationId_key") ||
    (fields.includes("userId") && fields.includes("clientMutationId"));
}

function isDuplicateOriginEntryError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  const fields = Array.isArray(target) ? target.map(String).join(" ") : String(target ?? "");
  return fields.includes("PrivateJournalEntry_userId_originEntryId_key") ||
    (fields.includes("userId") && fields.includes("originEntryId"));
}

async function findJournalEntryRow(userId: string, entryId: string): Promise<JournalEntryRow | null> {
  const trimmedId = entryId.trim();
  if (!trimmedId) {
    return null;
  }
  const exactRow = await db().privateJournalEntry.findFirst({
    where: { id: trimmedId, userId },
  });
  if (exactRow) {
    return exactRow as JournalEntryRow;
  }
  const originRow = await db().privateJournalEntry.findFirst({
    where: { originEntryId: trimmedId, userId },
  });
  return originRow ? (originRow as JournalEntryRow) : null;
}

async function findAppliedJournalMutation(
  userId: string,
  clientMutationId: string | null,
): Promise<JournalMutationRecord | null> {
  if (!clientMutationId) {
    return null;
  }
  const mutation = await db().privateJournalMutation.findUnique({
    where: {
      userId_clientMutationId: {
        userId,
        clientMutationId,
      },
    },
    select: {
      journalEntryId: true,
      targetEntryKey: true,
      mutationType: true,
      resultVersion: true,
    },
  });
  return mutation as JournalMutationRecord | null;
}

function ensureMutationKind(mutation: JournalMutationRecord, expected: JournalMutationKind): void {
  if (mutation.mutationType !== expected) {
    throw new JournalStorageError(
      "clientMutationId was already used for a different journal change.",
      409,
      "MUTATION_ID_REUSED",
    );
  }
}

function ensureMutationTarget(mutation: JournalMutationRecord, targetEntryKey: string | null): void {
  if (mutation.targetEntryKey !== null && mutation.targetEntryKey !== targetEntryKey) {
    throw new JournalStorageError(
      "clientMutationId was already used for a different journal entry.",
      409,
      "MUTATION_ID_REUSED",
    );
  }
}

function ensureSaveMutationKind(mutation: JournalMutationRecord): void {
  if (mutation.mutationType !== "CREATE" && mutation.mutationType !== "UPDATE") {
    throw new JournalStorageError(
      "clientMutationId was already used for a different journal change.",
      409,
      "MUTATION_ID_REUSED",
    );
  }
}

function throwVersionConflict(row: JournalEntryRow): never {
  throw new JournalStorageError(
    "This journal entry changed on another device. Review the account copy before saving again.",
    409,
    "VERSION_CONFLICT",
    toSnapshot(row),
  );
}

function throwMissingVersionConflict(): never {
  throw new JournalStorageError(
    "This journal entry no longer exists in the account copy.",
    409,
    "VERSION_CONFLICT",
    null,
  );
}

export async function savePrivateJournalEntry(
  clerkUserId: string,
  input: JournalUpsertInput,
  now: Date = new Date(),
): Promise<JournalEntry> {
  enforceOwnerMatch(clerkUserId, input.ownerId);
  const profile = await requireProfile(clerkUserId);

  return withJournalSchemaGuard(async () => {
    await pruneExpiredEntries(clerkUserId, profile.id, now);

    const requestedId = typeof input.id === "string" && input.id.trim() ? input.id.trim() : null;
    const existing = requestedId ? await findJournalEntryRow(profile.id, requestedId) : null;
    const expectedVersion = normalizeExpectedVersion(input.expectedVersion);
    const clientMutationId = normalizeClientMutationId(input.clientMutationId);
    const requestedMutationType = normalizeSaveMutationKind(input.mutationType);
    const mutationType: JournalMutationKind = requestedMutationType ?? (
      existing || (requestedId !== null && clientMutationId === null) ? "UPDATE" : "CREATE"
    );

    const alreadyApplied = await findAppliedJournalMutation(profile.id, clientMutationId);
    if (alreadyApplied) {
      if (requestedMutationType) {
        ensureMutationKind(alreadyApplied, requestedMutationType);
      } else {
        ensureSaveMutationKind(alreadyApplied);
      }
      ensureMutationTarget(alreadyApplied, requestedId);
      if (alreadyApplied.journalEntryId) {
        const appliedEntry = await findJournalEntryRow(profile.id, alreadyApplied.journalEntryId);
        if (appliedEntry) {
          return toSnapshot(appliedEntry);
        }
      }
      throwMissingVersionConflict();
    }
    if (requestedMutationType === "CREATE" && !requestedId) {
      throw new JournalStorageError(
        "Queued journal creates require a stable entry id.",
        400,
        "MISSING_CLIENT_ENTRY_ID",
      );
    }
    if (!existing && (mutationType === "UPDATE" || (requestedId && expectedVersion !== undefined))) {
      throwMissingVersionConflict();
    }
    if (mutationType === "UPDATE" && expectedVersion === undefined) {
      throw new JournalStorageError(
        "Journal updates require the version that was edited.",
        400,
        "MISSING_EXPECTED_VERSION",
      );
    }
    if (mutationType === "CREATE" && existing) {
      throw new JournalStorageError(
        "This journal entry id is already in use.",
        409,
        "CLIENT_ENTRY_ID_CONFLICT",
        toSnapshot(existing),
      );
    }
    if (existing && expectedVersion !== undefined && existing.version !== expectedVersion) {
      throwVersionConflict(existing);
    }

    const type = normalizeEntryType(input.type, existing?.type ?? "reflection");
    const title =
      input.title === undefined
        ? sanitizeOptionalText(existing?.title ?? null, MAX_ENTRY_TITLE_LENGTH) ?? ""
        : sanitizeOptionalText(input.title, MAX_ENTRY_TITLE_LENGTH) ?? "";
    const existingLegacyLinkedAyah =
      existing?.linkedAyahId && existing.linkedSurahNumber && existing.linkedAyahNumber
        ? {
            ayahId: existing.linkedAyahId,
            surahNumber: existing.linkedSurahNumber,
            ayahNumber: existing.linkedAyahNumber,
            surahNameArabic: existing.linkedSurahNameArabic ?? "",
            surahNameTransliteration: existing.linkedSurahNameTransliteration ?? "",
          }
        : null;
    const existingLegacyLinkedDua = parseLinkedDuaJson(existing?.linkedDuaJson);
    const legacyLinkedAyah = input.linkedAyah === undefined
      ? existingLegacyLinkedAyah
      : sanitizeLinkedAyah(input.linkedAyah);
    const legacyLinkedDua = input.linkedDua === undefined
      ? existingLegacyLinkedDua
      : sanitizeLinkedDua(input.linkedDua);
    const fallbackContent =
      input.content === undefined
        ? existing
          ? stripLegacyTitleFromContent(existing.title, existing.content)
          : ""
        : sanitizeOptionalText(input.content, MAX_CONTENT_LENGTH) ?? "";
    const existingBlocks = existing
      ? sanitizeJournalBlocks(existing.blocksJson, {
          content: stripLegacyTitleFromContent(existing.title, existing.content),
          linkedAyah: existingLegacyLinkedAyah,
          linkedDua: existingLegacyLinkedDua,
        })
      : [];
    const blocks = Array.isArray(input.blocks)
      ? sanitizeJournalBlocks(input.blocks, {
          content: fallbackContent,
          linkedAyah: legacyLinkedAyah,
          linkedDua: legacyLinkedDua,
        })
      : existing && input.content !== undefined
        ? replaceJournalTextBlocks(existingBlocks, fallbackContent)
        : existing
          ? existingBlocks
          : sanitizeJournalBlocks(null, {
              content: fallbackContent,
              linkedAyah: legacyLinkedAyah,
              linkedDua: legacyLinkedDua,
            });
    const content = deriveJournalContent(title, blocks).slice(0, MAX_CONTENT_LENGTH);
    const tags = normalizeJournalTags(Array.isArray(input.tags) ? input.tags : existing?.tags ?? []);
    const primaryLinkedAyah = findPrimaryLinkedAyah(blocks);
    const primaryLinkedDua = findPrimaryLinkedDua(blocks);

    if (!existing && !hasMeaningfulContent({ title, tags, blocks })) {
      throw new JournalStorageError("Write something first before saving.", 400, "EMPTY_ENTRY");
    }

    const pinned = Boolean(input.pinned ?? existing?.pinned ?? false);
    if (pinned && !existing?.pinned) {
      const pinnedCount = await db().privateJournalEntry.count({
        where: {
          userId: profile.id,
          pinned: true,
        },
      });
      if (pinnedCount >= 10) {
        throw new JournalStorageError("Keep at most 10 pinned entries so the top stays useful.", 400, "PIN_LIMIT");
      }
    }

    const duaStatus = type === "dua"
      ? input.duaStatus === undefined && existing?.type === "dua"
        ? existing.duaStatus ?? "ongoing"
        : normalizeDuaStatus(input.duaStatus)
      : null;
    const autoDeleteAt = type === "repentance"
      ? input.autoDeleteAt === undefined && existing?.type === "repentance"
        ? existing.autoDeleteAt
        : parseIsoDate(input.autoDeleteAt)
      : null;
    const createdAt = existing?.createdAt ?? parseIsoDate(input.createdAt) ?? now;
    if (mutationType === "CREATE" && autoDeleteAt && autoDeleteAt.getTime() <= now.getTime()) {
      throw new JournalStorageError(
        "This private entry expired before it could be synced.",
        410,
        "ENTRY_EXPIRED",
      );
    }

    const mutationData = {
      type,
      title: title || null,
      content,
      blocksJson: toBlocksJsonValue(blocks),
      tags,
      pinned,
      linkedAyahId: primaryLinkedAyah?.ayahId ?? null,
      linkedSurahNumber: primaryLinkedAyah?.surahNumber ?? null,
      linkedAyahNumber: primaryLinkedAyah?.ayahNumber ?? null,
      linkedSurahNameArabic: primaryLinkedAyah?.surahNameArabic ?? null,
      linkedSurahNameTransliteration: primaryLinkedAyah?.surahNameTransliteration ?? null,
      linkedDuaJson: toLinkedDuaJsonValue(primaryLinkedDua),
      duaStatus,
      autoDeleteAt,
    };

    let row: JournalEntryRow;
    try {
      row = await db().$transaction(async (tx) => {
        let changed: JournalEntryRow;
        if (existing) {
          const updated = await tx.privateJournalEntry.updateMany({
            where: {
              id: existing.id,
              userId: profile.id,
              version: expectedVersion,
            },
            data: {
              ...mutationData,
              version: { increment: 1 },
            },
          });
          if (updated.count !== 1) {
            const authoritative = await tx.privateJournalEntry.findFirst({
              where: { id: existing.id, userId: profile.id },
            });
            if (authoritative) {
              throwVersionConflict(authoritative as JournalEntryRow);
            }
            if (expectedVersion !== undefined) {
              throwMissingVersionConflict();
            }
            throw new JournalStorageError("Journal entry not found.", 404, "NOT_FOUND");
          }
          const updatedRow = await tx.privateJournalEntry.findFirst({
            where: { id: existing.id, userId: profile.id },
          });
          if (!updatedRow) {
            throw new JournalStorageError("Journal entry not found.", 404, "NOT_FOUND");
          }
          changed = updatedRow as JournalEntryRow;
        } else {
          const created = await tx.privateJournalEntry.create({
            data: {
              ...mutationData,
              userId: profile.id,
              originEntryId: requestedId,
              clientEntryId: null,
              createdAt,
            },
          });
          changed = created as JournalEntryRow;
        }

        if (clientMutationId) {
          await tx.privateJournalMutation.create({
            data: {
              userId: profile.id,
              journalEntryId: changed.id,
              targetEntryKey: requestedId,
              mutationType,
              clientMutationId,
              resultVersion: changed.version,
            },
          });
        }
        return changed;
      });
    } catch (error) {
      if (
        clientMutationId &&
        (isDuplicateJournalMutationError(error) ||
          (isJournalStorageError(error) && error.code === "VERSION_CONFLICT"))
      ) {
        const applied = await findAppliedJournalMutation(profile.id, clientMutationId);
        if (applied) {
          if (requestedMutationType) {
            ensureMutationKind(applied, requestedMutationType);
          } else {
            ensureSaveMutationKind(applied);
          }
          ensureMutationTarget(applied, requestedId);
          if (applied.journalEntryId) {
            const appliedEntry = await findJournalEntryRow(profile.id, applied.journalEntryId);
            if (appliedEntry) {
              return toSnapshot(appliedEntry);
            }
          }
        }
      }
      if (!existing && requestedId && isDuplicateOriginEntryError(error)) {
        if (clientMutationId) {
          const applied = await findAppliedJournalMutation(profile.id, clientMutationId);
          if (applied) {
            if (requestedMutationType) {
              ensureMutationKind(applied, requestedMutationType);
            } else {
              ensureSaveMutationKind(applied);
            }
            ensureMutationTarget(applied, requestedId);
            if (applied.journalEntryId) {
              const appliedEntry = await findJournalEntryRow(profile.id, applied.journalEntryId);
              if (appliedEntry) {
                return toSnapshot(appliedEntry);
              }
            }
          }
        }
        const appliedEntry = await findJournalEntryRow(profile.id, requestedId);
        throw new JournalStorageError(
          "This journal entry id is already in use.",
          409,
          "CLIENT_ENTRY_ID_CONFLICT",
          appliedEntry ? toSnapshot(appliedEntry) : null,
        );
      }
      throw error;
    }

    return toSnapshot(row);
  });
}

export async function deletePrivateJournalEntry(
  clerkUserId: string,
  entryId: string,
  input?: {
    ownerId?: string | null;
    expectedVersion?: number | null;
    clientMutationId?: string | null;
  },
): Promise<void> {
  enforceOwnerMatch(clerkUserId, input?.ownerId);
  const profile = await requireProfile(clerkUserId);

  return withJournalSchemaGuard(async () => {
    const trimmedId = entryId.trim();
    if (!trimmedId) {
      throw new JournalStorageError("Journal entry id is required.", 400, "MISSING_ID");
    }

    const expectedVersion = normalizeExpectedVersion(input?.expectedVersion);
    const clientMutationId = normalizeClientMutationId(input?.clientMutationId);
    const alreadyApplied = await findAppliedJournalMutation(profile.id, clientMutationId);
    if (alreadyApplied) {
      ensureMutationKind(alreadyApplied, "DELETE");
      ensureMutationTarget(alreadyApplied, trimmedId);
      return;
    }

    const existing = await findJournalEntryRow(profile.id, trimmedId);

    // Legacy, non-idempotent callers retain the not-found response. Queued
    // deletes always carry a mutation id, so an already-absent target is a
    // successful terminal state that we record below for safe replay.
    if (!existing && !clientMutationId) {
      throw new JournalStorageError("Journal entry not found.", 404, "NOT_FOUND");
    }
    if (expectedVersion === undefined) {
      throw new JournalStorageError(
        "Journal deletions require the version being removed.",
        400,
        "MISSING_EXPECTED_VERSION",
      );
    }

    if (existing && expectedVersion !== undefined && existing.version !== expectedVersion) {
      throwVersionConflict(existing);
    }

    try {
      await db().$transaction(async (tx) => {
        if (clientMutationId) {
          await tx.privateJournalMutation.create({
            data: {
              userId: profile.id,
              // A delete acknowledgement outlives the row and is keyed by
              // targetEntryKey. Keeping this null also lets a concurrent
              // delete win between our lookup and transaction without an FK
              // failure when we record the idempotent success.
              journalEntryId: null,
              targetEntryKey: trimmedId,
              mutationType: "DELETE",
              clientMutationId,
              resultVersion: existing
                ? existing.version + 1
                : expectedVersion !== undefined
                  ? expectedVersion + 1
                  : null,
            },
          });
        }

        if (!existing) {
          return;
        }

        const deleted = await tx.privateJournalEntry.deleteMany({
          where: {
            id: existing.id,
            userId: profile.id,
            version: expectedVersion,
          },
        });
        if (deleted.count !== 1) {
          const authoritative = await tx.privateJournalEntry.findFirst({
            where: { id: existing.id, userId: profile.id },
          });
          if (authoritative) {
            throwVersionConflict(authoritative as JournalEntryRow);
          }
          // Another delete won the race. The requested end state is already
          // true, and any mutation record created above can commit as the
          // durable acknowledgement for this queued operation.
          return;
        }
      });
    } catch (error) {
      if (clientMutationId && isDuplicateJournalMutationError(error)) {
        const applied = await findAppliedJournalMutation(profile.id, clientMutationId);
        if (applied) {
          ensureMutationKind(applied, "DELETE");
          ensureMutationTarget(applied, trimmedId);
          return;
        }
      }
      throw error;
    }

  });
}

export async function syncPrivateJournalEntriesToQuranFoundation(
  clerkUserId: string,
  now: Date = new Date(),
): Promise<{ total: number; synced: number; skipped: number; failed: number }> {
  const profile = await requireProfile(clerkUserId);

  return withJournalSchemaGuard(async () => {
    await pruneExpiredEntries(clerkUserId, profile.id, now);

    const rows = await db().privateJournalEntry.findMany({
      where: { userId: profile.id },
      orderBy: [{ updatedAt: "desc" }],
    });

    let synced = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of rows as JournalEntryRow[]) {
      try {
        const remoteNoteId = await syncJournalEntryNoteToQuranFoundation({
          clerkUserId,
          journalEntryId: row.id,
          clientEntryId: row.clientEntryId,
          entry: toSnapshot(row),
        });
        if (remoteNoteId) {
          synced += 1;
        } else {
          skipped += 1;
        }
      } catch {
        failed += 1;
      }
    }

    return {
      total: rows.length,
      synced,
      skipped,
      failed,
    };
  });
}

type SanitizedJournalImport = {
  sourceIndex: number;
  sourceEntryId: string;
  clientEntryId: string | null;
  type: JournalEntryType;
  title: string;
  sourceContent: string;
  content: string;
  blocks: JournalBlock[];
  tags: string[];
  pinned: boolean;
  linkedAyah: JournalLinkedAyah | null;
  linkedDua: JournalLinkedDua | null;
  duaStatus: JournalDuaStatus | null;
  autoDeleteAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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

function journalImportMatchesAuthoritativeRow(
  candidate: SanitizedJournalImport & { pinned: boolean },
  row: JournalEntryRow,
): boolean {
  const snapshot = toSnapshot(row);
  const contentWithoutTitle = deriveJournalContent("", candidate.blocks);
  const sourceContentIsRepresented =
    candidate.sourceContent === candidate.content ||
    candidate.sourceContent === contentWithoutTitle;
  return (
    row.originEntryId === candidate.sourceEntryId &&
    row.clientEntryId === candidate.clientEntryId &&
    snapshot.type === candidate.type &&
    (snapshot.title ?? "") === candidate.title &&
    sourceContentIsRepresented &&
    snapshot.content === candidate.content &&
    JSON.stringify(journalBlocksForImportComparison(snapshot.blocks ?? [])) ===
      JSON.stringify(journalBlocksForImportComparison(candidate.blocks)) &&
    JSON.stringify(snapshot.tags) === JSON.stringify(candidate.tags) &&
    snapshot.pinned === candidate.pinned &&
    JSON.stringify(snapshot.linkedAyah ?? null) === JSON.stringify(candidate.linkedAyah) &&
    JSON.stringify(snapshot.linkedDua ?? null) === JSON.stringify(candidate.linkedDua) &&
    (snapshot.duaStatus ?? null) === candidate.duaStatus &&
    (snapshot.autoDeleteAt ?? null) === (candidate.autoDeleteAt?.toISOString() ?? null) &&
    snapshot.createdAt === candidate.createdAt.toISOString() &&
    snapshot.updatedAt === candidate.updatedAt.toISOString()
  );
}

async function findExistingJournalImportRow(
  userId: string,
  candidate: Pick<SanitizedJournalImport, "sourceEntryId" | "clientEntryId">,
): Promise<JournalEntryRow | null> {
  const byOrigin = await db().privateJournalEntry.findFirst({
    where: {
      userId,
      originEntryId: candidate.sourceEntryId,
    },
  });
  if (byOrigin || !candidate.clientEntryId) {
    return byOrigin ? (byOrigin as JournalEntryRow) : null;
  }

  const byQuranFoundationId = await db().privateJournalEntry.findFirst({
    where: {
      userId,
      clientEntryId: candidate.clientEntryId,
    },
  });
  return byQuranFoundationId ? (byQuranFoundationId as JournalEntryRow) : null;
}

export async function importPrivateJournalEntries(
  clerkUserId: string,
  entries: JournalEntry[],
  ownerId: string | null | undefined,
  now: Date = new Date(),
): Promise<JournalImportResult> {
  // Check the account intent before profile hydration or any other write. A
  // delayed browser request from account A must never import into account B.
  enforceExplicitOwnerMatch(clerkUserId, ownerId);
  if (entries.length > MAX_IMPORT_ENTRIES) {
    throw new JournalStorageError(
      `Journal imports are limited to ${MAX_IMPORT_ENTRIES} entries per request.`,
      400,
      "IMPORT_LIMIT_EXCEEDED",
    );
  }
  const sourceEntryIds = entries.map((entry) =>
    typeof entry.id === "string" ? entry.id.trim() : "",
  );
  if (
    sourceEntryIds.some((sourceEntryId) => !sourceEntryId) ||
    new Set(sourceEntryIds).size !== sourceEntryIds.length
  ) {
    throw new JournalStorageError(
      "Every imported journal entry must have a unique stable source id.",
      400,
      "INVALID_IMPORT_SOURCE_ID",
    );
  }
  const profile = await requireProfile(clerkUserId);

  return withJournalSchemaGuard(async () => {
    await pruneExpiredEntries(clerkUserId, profile.id, now);

    const sanitized = entries
      .map((entry, sourceIndex): SanitizedJournalImport | null => {
        const sourceEntryId = typeof entry.id === "string" ? entry.id.trim() : "";
        if (!sourceEntryId) {
          return null;
        }
        const type = normalizeEntryType(entry.type, "reflection");
        const title = sanitizeOptionalText(entry.title ?? null, MAX_ENTRY_TITLE_LENGTH) ?? "";
        const linkedAyah = sanitizeLinkedAyah(entry.linkedAyah ?? null);
        const linkedDua = sanitizeLinkedDua(entry.linkedDua ?? null);
        const blocks = sanitizeJournalBlocks(entry.blocks ?? null, {
          content: entry.content,
          linkedAyah,
          linkedDua,
        });
        const content = deriveJournalContent(title, blocks).slice(0, MAX_CONTENT_LENGTH);
        const sourceContent =
          typeof entry.content === "string" && entry.content.trim()
            ? entry.content.trim()
            : content;
        const tags = normalizeJournalTags(entry.tags);
        if (!hasMeaningfulContent({ title, tags, blocks })) {
          return null;
        }

        const primaryLinkedAyah = findPrimaryLinkedAyah(blocks);
        const primaryLinkedDua = findPrimaryLinkedDua(blocks);
        const createdAt = parseIsoDate(entry.createdAt) ?? now;
        const updatedAt = parseIsoDate(entry.updatedAt) ?? createdAt;
        const autoDeleteAt = type === "repentance" ? parseIsoDate(entry.autoDeleteAt ?? null) : null;
        if (autoDeleteAt && autoDeleteAt.getTime() <= now.getTime()) {
          return null;
        }

        return {
          sourceIndex,
          sourceEntryId,
          clientEntryId: normalizeQuranFoundationNoteClientId(entry.clientEntryId),
          type,
          title,
          sourceContent,
          content,
          blocks,
          tags,
          pinned: entry.pinned === true,
          linkedAyah: primaryLinkedAyah,
          linkedDua: primaryLinkedDua,
          duaStatus: type === "dua" ? normalizeDuaStatus(entry.duaStatus) : null,
          autoDeleteAt,
          createdAt,
          updatedAt,
        };
      })
      .filter((entry) => entry !== null);

    const acknowledgements: JournalImportAcknowledgement[] = entries.map((entry) => ({
      sourceEntryId: typeof entry.id === "string" ? entry.id.trim() : "",
      status: "conflict",
      entry: null,
    }));

    const existingRows = await Promise.all(
      sanitized.map((entry) => findExistingJournalImportRow(profile.id, entry)),
    );

    const pinnedCount = await db().privateJournalEntry.count({
      where: {
        userId: profile.id,
        pinned: true,
      },
    });

    let remainingPinnedSlots = Math.max(0, 10 - pinnedCount);
    const data = sanitized.map((entry, index) => {
      const existing = existingRows[index];
      const pinned = existing
        ? entry.pinned
        : entry.pinned && remainingPinnedSlots > 0;
      if (!existing && pinned) {
        remainingPinnedSlots -= 1;
      }

      return {
        ...entry,
        userId: profile.id,
        originEntryId: entry.sourceEntryId,
        clientEntryId: entry.clientEntryId,
        type: entry.type,
        title: entry.title || null,
        content: entry.content,
        blocksJson: toBlocksJsonValue(entry.blocks),
        tags: entry.tags,
        pinned,
        linkedAyahId: entry.linkedAyah?.ayahId ?? null,
        linkedSurahNumber: entry.linkedAyah?.surahNumber ?? null,
        linkedAyahNumber: entry.linkedAyah?.ayahNumber ?? null,
        linkedSurahNameArabic: entry.linkedAyah?.surahNameArabic ?? null,
        linkedSurahNameTransliteration: entry.linkedAyah?.surahNameTransliteration ?? null,
        linkedDuaJson: toLinkedDuaJsonValue(entry.linkedDua),
        duaStatus: entry.duaStatus,
        autoDeleteAt: entry.autoDeleteAt,
      };
    });

    if (data.length > 0) {
      await db().privateJournalEntry.createMany({
        data: data.map((entry) => ({
          userId: entry.userId,
          originEntryId: entry.originEntryId,
          clientEntryId: entry.clientEntryId,
          type: entry.type,
          title: entry.title,
          content: entry.content,
          blocksJson: entry.blocksJson,
          tags: entry.tags,
          pinned: entry.pinned,
          linkedAyahId: entry.linkedAyahId,
          linkedSurahNumber: entry.linkedSurahNumber,
          linkedAyahNumber: entry.linkedAyahNumber,
          linkedSurahNameArabic: entry.linkedSurahNameArabic,
          linkedSurahNameTransliteration: entry.linkedSurahNameTransliteration,
          linkedDuaJson: entry.linkedDuaJson,
          duaStatus: entry.duaStatus,
          autoDeleteAt: entry.autoDeleteAt,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        })),
        skipDuplicates: true,
      });
    }

    // Rows imported from Quran Foundation before originEntryId existed already
    // have a qf-note:* clientEntryId. Attach the source alias without touching
    // their journal content, so a retry is both acknowledged and create-only.
    for (const [index, entry] of data.entries()) {
      if (!entry.clientEntryId) {
        continue;
      }
      try {
        await db().privateJournalEntry.updateMany({
          where: {
            userId: profile.id,
            clientEntryId: entry.clientEntryId,
            originEntryId: null,
          },
          data: {
            originEntryId: entry.sourceEntryId,
            // Prisma's @updatedAt would otherwise mutate an existing row just
            // because its stable browser-source alias was attached. Preserve
            // the authoritative timestamp; equivalence remains conservative
            // if it already differs from the submitted source timestamp.
            updatedAt: existingRows[index]?.updatedAt ?? entry.updatedAt,
          },
        });
      } catch (error) {
        if (!isDuplicateOriginEntryError(error)) {
          throw error;
        }
        const acknowledged = await db().privateJournalEntry.findFirst({
          where: {
            userId: profile.id,
            originEntryId: entry.sourceEntryId,
          },
        });
        if (!acknowledged) {
          throw error;
        }
      }
    }

    for (const [index, entry] of data.entries()) {
      const authoritativeRow = await db().privateJournalEntry.findFirst({
        where: {
          userId: profile.id,
          originEntryId: entry.sourceEntryId,
        },
      });
      const authoritative = authoritativeRow
        ? (authoritativeRow as JournalEntryRow)
        : null;
      const authoritativeSnapshot = authoritative ? toSnapshot(authoritative) : null;
      acknowledgements[entry.sourceIndex] = {
        sourceEntryId: entry.sourceEntryId,
        status: authoritative && journalImportMatchesAuthoritativeRow(
          { ...entry, title: entry.title ?? "" },
          authoritative,
        )
          ? existingRows[index]
            ? "already-identical"
            : "created"
          : "conflict",
        entry: authoritativeSnapshot,
      };
    }

    return {
      entries: await listEntriesForUserId(clerkUserId, profile.id, now),
      acknowledgements,
    };
  });
}
