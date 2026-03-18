import "server-only";

import {
  JOURNAL_ENTRY_TYPES,
  normalizeJournalTags,
  type JournalDuaStatus,
  type JournalEntry,
  type JournalEntryType,
  type JournalLinkedAyah,
} from "@/hifzer/journal/local-store";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { db, dbConfigured } from "@/lib/db";

const MAX_CONTENT_LENGTH = 12000;
const MAX_SURAH_NAME_LENGTH = 120;
const MAX_IMPORT_ENTRIES = 200;
const DUA_STATUSES = ["ongoing", "answered", "accepted_differently"] satisfies readonly JournalDuaStatus[];

type JournalUpsertInput = {
  id?: string | null;
  type?: JournalEntryType | string | null;
  content?: string | null;
  tags?: string[] | null;
  pinned?: boolean | null;
  createdAt?: string | null;
  linkedAyah?: JournalLinkedAyah | null;
  duaStatus?: JournalDuaStatus | string | null;
  autoDeleteAt?: string | null;
};

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

function hasMeaningfulContent(input: { content: string; tags: string[]; linkedAyah: JournalLinkedAyah | null }): boolean {
  return Boolean(input.content.trim().length > 0 || input.tags.length > 0 || input.linkedAyah);
}

function toSnapshot(row: {
  id: string;
  type: JournalEntryType;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  linkedAyahId: number | null;
  linkedSurahNumber: number | null;
  linkedAyahNumber: number | null;
  linkedSurahNameArabic: string | null;
  linkedSurahNameTransliteration: string | null;
  duaStatus: JournalDuaStatus | null;
  autoDeleteAt: Date | null;
}): JournalEntry {
  return {
    id: row.id,
    type: row.type,
    content: row.content,
    tags: row.tags,
    pinned: row.pinned,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    linkedAyah:
      row.linkedAyahId && row.linkedSurahNumber && row.linkedAyahNumber
        ? {
            ayahId: row.linkedAyahId,
            surahNumber: row.linkedSurahNumber,
            ayahNumber: row.linkedAyahNumber,
            surahNameArabic: row.linkedSurahNameArabic ?? "",
            surahNameTransliteration: row.linkedSurahNameTransliteration ?? "",
          }
        : null,
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

async function pruneExpiredEntries(userId: string, now: Date) {
  await db().privateJournalEntry.deleteMany({
    where: {
      userId,
      autoDeleteAt: {
        lte: now,
      },
    },
  });
}

async function listEntriesForUserId(userId: string, now: Date): Promise<JournalEntry[]> {
  await pruneExpiredEntries(userId, now);

  const rows = await db().privateJournalEntry.findMany({
    where: { userId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  return rows.map((row) => toSnapshot(row));
}

export async function listPrivateJournalEntries(clerkUserId: string, now: Date = new Date()): Promise<JournalEntry[]> {
  const profile = await requireProfile(clerkUserId);
  return withJournalSchemaGuard(() => listEntriesForUserId(profile.id, now));
}

export async function savePrivateJournalEntry(
  clerkUserId: string,
  input: JournalUpsertInput,
  now: Date = new Date(),
): Promise<JournalEntry> {
  const profile = await requireProfile(clerkUserId);

  return withJournalSchemaGuard(async () => {
    await pruneExpiredEntries(profile.id, now);

    const existing =
      typeof input.id === "string" && input.id.trim()
        ? await db().privateJournalEntry.findFirst({
            where: { id: input.id.trim(), userId: profile.id },
          })
        : null;

    const type = normalizeEntryType(input.type, existing?.type ?? "reflection");
    const content = sanitizeOptionalText(input.content, MAX_CONTENT_LENGTH) ?? "";
    const tags = normalizeJournalTags(Array.isArray(input.tags) ? input.tags : existing?.tags ?? []);
    const linkedAyah = sanitizeLinkedAyah(input.linkedAyah ?? null);
    if (!hasMeaningfulContent({ content, tags, linkedAyah })) {
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
            content,
            tags,
            pinned,
            linkedAyahId: linkedAyah?.ayahId ?? null,
            linkedSurahNumber: linkedAyah?.surahNumber ?? null,
            linkedAyahNumber: linkedAyah?.ayahNumber ?? null,
            linkedSurahNameArabic: linkedAyah?.surahNameArabic ?? null,
            linkedSurahNameTransliteration: linkedAyah?.surahNameTransliteration ?? null,
            duaStatus,
            autoDeleteAt,
          },
        })
      : await db().privateJournalEntry.create({
          data: {
            userId: profile.id,
            type,
            content,
            tags,
            pinned,
            linkedAyahId: linkedAyah?.ayahId ?? null,
            linkedSurahNumber: linkedAyah?.surahNumber ?? null,
            linkedAyahNumber: linkedAyah?.ayahNumber ?? null,
            linkedSurahNameArabic: linkedAyah?.surahNameArabic ?? null,
            linkedSurahNameTransliteration: linkedAyah?.surahNameTransliteration ?? null,
            duaStatus,
            autoDeleteAt,
            createdAt,
          },
        });

    return toSnapshot(row);
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
      select: { id: true },
    });

    if (!existing) {
      throw new JournalStorageError("Journal entry not found.", 404, "NOT_FOUND");
    }

    await db().privateJournalEntry.delete({
      where: { id: existing.id },
    });
  });
}

export async function importPrivateJournalEntries(
  clerkUserId: string,
  entries: JournalEntry[],
  now: Date = new Date(),
): Promise<JournalEntry[]> {
  const profile = await requireProfile(clerkUserId);

  return withJournalSchemaGuard(async () => {
    await pruneExpiredEntries(profile.id, now);

    const sanitized = entries
      .slice(0, MAX_IMPORT_ENTRIES)
      .map((entry) => {
        const type = normalizeEntryType(entry.type, "reflection");
        const content = sanitizeOptionalText(entry.content, MAX_CONTENT_LENGTH) ?? "";
        const tags = normalizeJournalTags(entry.tags);
        const linkedAyah = sanitizeLinkedAyah(entry.linkedAyah ?? null);
        if (!hasMeaningfulContent({ content, tags, linkedAyah })) {
          return null;
        }

        const createdAt = parseIsoDate(entry.createdAt) ?? now;
        const updatedAt = parseIsoDate(entry.updatedAt) ?? createdAt;
        const autoDeleteAt = type === "repentance" ? parseIsoDate(entry.autoDeleteAt ?? null) : null;
        if (autoDeleteAt && autoDeleteAt.getTime() <= now.getTime()) {
          return null;
        }

        return {
          clientEntryId: typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : null,
          type,
          content,
          tags,
          pinned: entry.pinned === true,
          linkedAyah,
          duaStatus: type === "dua" ? normalizeDuaStatus(entry.duaStatus) : null,
          autoDeleteAt,
          createdAt,
          updatedAt,
        };
      })
      .filter((entry) => entry !== null);

    if (sanitized.length === 0) {
      return listEntriesForUserId(profile.id, now);
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
        content: entry.content,
        tags: entry.tags,
        pinned,
        linkedAyahId: entry.linkedAyah?.ayahId ?? null,
        linkedSurahNumber: entry.linkedAyah?.surahNumber ?? null,
        linkedAyahNumber: entry.linkedAyah?.ayahNumber ?? null,
        linkedSurahNameArabic: entry.linkedAyah?.surahNameArabic ?? null,
        linkedSurahNameTransliteration: entry.linkedAyah?.surahNameTransliteration ?? null,
        duaStatus: entry.duaStatus,
        autoDeleteAt: entry.autoDeleteAt,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
    });

    await db().privateJournalEntry.createMany({
      data,
      skipDuplicates: true,
    });

    return listEntriesForUserId(profile.id, now);
  });
}
