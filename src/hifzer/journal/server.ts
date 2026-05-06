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
  deleteJournalEntryNoteFromQuranFoundation,
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
  clientEntryId: string | null;
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
  | "clientEntryId"
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

export class JournalStorageError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 400, code = "journal_error") {
    super(message);
    this.name = "JournalStorageError";
    this.status = status;
    this.code = code;
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

    if (blocks.length >= MAX_BLOCKS) {
      break;
    }
  }

  if (blocks.length === 0) {
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
  if (blocks.length === 0) {
    return Prisma.DbNull;
  }

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
  tags: string[];
  blocks: JournalBlock[];
}): boolean {
  return Boolean(input.tags.length > 0 || hasMeaningfulJournalBlocks(input.blocks));
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
    content: row.content,
    linkedAyah: legacyLinkedAyah,
    linkedDua: legacyLinkedDua,
  });

  return {
    id: row.id,
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

async function pruneExpiredEntries(clerkUserId: string, userId: string, now: Date) {
  const expiredRows = await db().privateJournalEntry.findMany({
    where: {
      userId,
      autoDeleteAt: {
        lte: now,
      },
    },
    select: {
      clientEntryId: true,
    },
  });

  await Promise.allSettled(
    expiredRows.map((row) =>
      deleteJournalEntryNoteFromQuranFoundation({
        clerkUserId,
        clientEntryId: row.clientEntryId,
      }),
    ),
  );

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
      clientEntryId: true,
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
    const row = await db().privateJournalEntry.findFirst({
      where: {
        id: entryId.trim(),
        userId: profile.id,
      },
    });

    if (!row) {
      throw new JournalStorageError("Journal entry not found.", 404, "NOT_FOUND");
    }

    return toSnapshot(row as JournalEntryRow);
  });
}

export async function savePrivateJournalEntry(
  clerkUserId: string,
  input: JournalUpsertInput,
  now: Date = new Date(),
): Promise<JournalEntry> {
  const profile = await requireProfile(clerkUserId);

  return withJournalSchemaGuard(async () => {
    await pruneExpiredEntries(clerkUserId, profile.id, now);

    const existing =
      typeof input.id === "string" && input.id.trim()
        ? await db().privateJournalEntry.findFirst({
            where: { id: input.id.trim(), userId: profile.id },
          })
        : null;

    const type = normalizeEntryType(input.type, existing?.type ?? "reflection");
    const title = sanitizeOptionalText(input.title, MAX_ENTRY_TITLE_LENGTH) ?? sanitizeOptionalText(existing?.title ?? null, MAX_ENTRY_TITLE_LENGTH) ?? "";
    const legacyLinkedAyah = sanitizeLinkedAyah(input.linkedAyah ?? null);
    const legacyLinkedDua = sanitizeLinkedDua(input.linkedDua ?? null);
    const fallbackContent = sanitizeOptionalText(input.content, MAX_CONTENT_LENGTH) ?? existing?.content ?? "";
    const blocks = sanitizeJournalBlocks(
      input.blocks ?? existing?.blocksJson ?? null,
      {
        content: fallbackContent,
        linkedAyah: legacyLinkedAyah ??
          (existing?.linkedAyahId && existing.linkedSurahNumber && existing.linkedAyahNumber
            ? {
                ayahId: existing.linkedAyahId,
                surahNumber: existing.linkedSurahNumber,
                ayahNumber: existing.linkedAyahNumber,
                surahNameArabic: existing.linkedSurahNameArabic ?? "",
                surahNameTransliteration: existing.linkedSurahNameTransliteration ?? "",
              }
            : null),
        linkedDua: legacyLinkedDua ?? parseLinkedDuaJson(existing?.linkedDuaJson),
      },
    );
    const content = deriveJournalContent(title, blocks).slice(0, MAX_CONTENT_LENGTH);
    const tags = normalizeJournalTags(Array.isArray(input.tags) ? input.tags : existing?.tags ?? []);
    const primaryLinkedAyah = findPrimaryLinkedAyah(blocks);
    const primaryLinkedDua = findPrimaryLinkedDua(blocks);

    if (!hasMeaningfulContent({ tags, blocks })) {
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

    const duaStatus = type === "dua" ? normalizeDuaStatus(input.duaStatus) : null;
    const autoDeleteAt = type === "repentance" ? parseIsoDate(input.autoDeleteAt) : null;
    const createdAt = existing?.createdAt ?? parseIsoDate(input.createdAt) ?? now;

    const row = existing
      ? await db().privateJournalEntry.update({
          where: { id: existing.id },
          data: {
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
          },
        })
      : await db().privateJournalEntry.create({
          data: {
            userId: profile.id,
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
            createdAt,
          },
        });

    const snapshot = toSnapshot(row as JournalEntryRow);

    try {
      await syncJournalEntryNoteToQuranFoundation({
        clerkUserId,
        journalEntryId: row.id,
        clientEntryId: (row as JournalEntryRow).clientEntryId,
        entry: snapshot,
      });
    } catch {
      // Keep local journal saves reliable even if Quran.com note sync is unavailable.
    }

    return snapshot;
  });
}

export async function deletePrivateJournalEntry(clerkUserId: string, entryId: string): Promise<void> {
  const profile = await requireProfile(clerkUserId);

  return withJournalSchemaGuard(async () => {
    const trimmedId = entryId.trim();
    if (!trimmedId) {
      throw new JournalStorageError("Journal entry id is required.", 400, "MISSING_ID");
    }

    const existing = await db().privateJournalEntry.findFirst({
      where: {
        id: trimmedId,
        userId: profile.id,
      },
      select: { id: true, clientEntryId: true },
    });

    if (!existing) {
      throw new JournalStorageError("Journal entry not found.", 404, "NOT_FOUND");
    }

    await db().privateJournalEntry.delete({
      where: { id: existing.id },
    });

    try {
      await deleteJournalEntryNoteFromQuranFoundation({
        clerkUserId,
        clientEntryId: existing.clientEntryId,
      });
    } catch {
      // Deleting locally should still succeed even if the remote note cleanup fails.
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

export async function importPrivateJournalEntries(
  clerkUserId: string,
  entries: JournalEntry[],
  now: Date = new Date(),
): Promise<JournalEntry[]> {
  const profile = await requireProfile(clerkUserId);

  return withJournalSchemaGuard(async () => {
    await pruneExpiredEntries(clerkUserId, profile.id, now);

    const sanitized = entries
      .slice(0, MAX_IMPORT_ENTRIES)
      .map((entry) => {
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
        const tags = normalizeJournalTags(entry.tags);
        if (!hasMeaningfulContent({ tags, blocks })) {
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
          clientEntryId: typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : null,
          type,
          title,
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

    if (sanitized.length === 0) {
      return listEntriesForUserId(clerkUserId, profile.id, now);
    }

    const pinnedCount = await db().privateJournalEntry.count({
      where: {
        userId: profile.id,
        pinned: true,
      },
    });

    let remainingPinnedSlots = Math.max(0, 10 - pinnedCount);
    const data = sanitized.map((entry) => {
      const pinned = entry.pinned && remainingPinnedSlots > 0;
      if (pinned) {
        remainingPinnedSlots -= 1;
      }

      return {
        userId: profile.id,
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
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
    });

    const createManyData = data.filter((entry) => !entry.clientEntryId);
    if (createManyData.length > 0) {
      await db().privateJournalEntry.createMany({
        data: createManyData,
        skipDuplicates: true,
      });
    }

    for (const entry of data.filter((item) => Boolean(item.clientEntryId))) {
      await db().privateJournalEntry.upsert({
        where: {
          userId_clientEntryId: {
            userId: profile.id,
            clientEntryId: entry.clientEntryId!,
          },
        },
        create: entry,
        update: {
          type: entry.type,
          title: entry.title,
          content: entry.content,
          blocksJson: entry.blocksJson,
          tags: entry.tags,
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
        },
      });
    }

    return listEntriesForUserId(clerkUserId, profile.id, now);
  });
}
