import "server-only";

import { Prisma, type BookmarkCategory, type BookmarkEvent, type BookmarkMutationType } from "@prisma/client";
import { getAyahById, getSurahInfo } from "@/hifzer/quran/lookup";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { db, dbConfigured } from "@/lib/db";

const MAX_BOOKMARK_NAME = 120;
const MAX_BOOKMARK_NOTE = 2000;
const MAX_CATEGORY_NAME = 60;
const MAX_SYNC_MUTATIONS = 100;

type BookmarkWithCategory = Prisma.BookmarkGetPayload<{
  include: { category: true };
}>;

export type BookmarkCategorySnapshot = {
  id: string;
  name: string;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookmarkSnapshot = {
  id: string;
  ayahId: number;
  surahNumber: number;
  ayahNumber: number;
  name: string;
  note: string | null;
  categoryId: string | null;
  isPinned: boolean;
  version: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: BookmarkCategorySnapshot | null;
};

export type BookmarkStateSnapshot = {
  categories: BookmarkCategorySnapshot[];
  bookmarks: BookmarkSnapshot[];
};

export type BookmarkCreateInput = {
  ayahId: number;
  surahNumber?: number;
  ayahNumber?: number;
  name?: string | null;
  note?: string | null;
  categoryId?: string | null;
  isPinned?: boolean;
  clientMutationId?: string | null;
};

export type BookmarkUpdateInput = {
  bookmarkId: string;
  name?: string | null;
  note?: string | null;
  categoryId?: string | null;
  isPinned?: boolean;
  expectedVersion?: number;
  clientMutationId?: string | null;
};

export type BookmarkDeleteInput = {
  bookmarkId: string;
  expectedVersion?: number;
  clientMutationId?: string | null;
};

export type BookmarkRestoreInput = {
  bookmarkId: string;
  expectedVersion?: number;
  clientMutationId?: string | null;
};

export type BookmarkCategoryCreateInput = {
  name: string;
  sortOrder?: number;
  clientMutationId?: string | null;
};

export type BookmarkCategoryUpdateInput = {
  categoryId: string;
  name?: string | null;
  sortOrder?: number;
  archivedAt?: string | null;
  clientMutationId?: string | null;
};

export type BookmarkCategoryDeleteInput = {
  categoryId: string;
  clientMutationId?: string | null;
};

export type BookmarkSyncMutation =
  | {
      type: "CREATE";
      clientMutationId: string;
      data: Omit<BookmarkCreateInput, "clientMutationId">;
    }
  | {
      type: "UPDATE";
      clientMutationId: string;
      bookmarkId: string;
      data: Omit<BookmarkUpdateInput, "bookmarkId" | "clientMutationId">;
    }
  | {
      type: "DELETE";
      clientMutationId: string;
      bookmarkId: string;
      expectedVersion?: number;
    }
  | {
      type: "RESTORE";
      clientMutationId: string;
      bookmarkId: string;
      expectedVersion?: number;
    }
  | {
      type: "CATEGORY_CREATE";
      clientMutationId: string;
      data: Omit<BookmarkCategoryCreateInput, "clientMutationId">;
    }
  | {
      type: "CATEGORY_UPDATE";
      clientMutationId: string;
      categoryId: string;
      data: Omit<BookmarkCategoryUpdateInput, "categoryId" | "clientMutationId">;
    }
  | {
      type: "CATEGORY_DELETE";
      clientMutationId: string;
      categoryId: string;
    };

export type BookmarkSyncMutationResult = {
  clientMutationId: string;
  type: BookmarkSyncMutation["type"] | "UNKNOWN";
  ok: boolean;
  deduped?: boolean;
  error?: string;
  code?: string;
  retryable?: boolean;
};

export class BookmarkError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 400, code = "bookmark_error") {
    super(message);
    this.name = "BookmarkError";
    this.status = status;
    this.code = code;
  }
}

function trimOrNull(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function coerceClientMutationId(value: string | null | undefined): string | null {
  const trimmed = trimOrNull(value);
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > 128) {
    throw new BookmarkError("clientMutationId is too long.", 400, "invalid_client_mutation_id");
  }
  return trimmed;
}

function safeSortOrder(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(-9999, Math.min(9999, Math.floor(n)));
}

function sanitizeName(input: string | null | undefined, fallback: string): string {
  const value = trimOrNull(input) ?? fallback;
  if (!value.length) {
    throw new BookmarkError("Name cannot be empty.", 400, "invalid_name");
  }
  if (value.length > MAX_BOOKMARK_NAME) {
    throw new BookmarkError(`Name cannot exceed ${MAX_BOOKMARK_NAME} characters.`, 400, "invalid_name");
  }
  return value;
}

function sanitizeNote(input: string | null | undefined): string | null {
  const value = trimOrNull(input);
  if (!value) {
    return null;
  }
  if (value.length > MAX_BOOKMARK_NOTE) {
    throw new BookmarkError(`Note cannot exceed ${MAX_BOOKMARK_NOTE} characters.`, 400, "invalid_note");
  }
  return value;
}

function sanitizeCategoryName(input: string | null | undefined): string {
  const value = trimOrNull(input);
  if (!value) {
    throw new BookmarkError("Category name is required.", 400, "invalid_category_name");
  }
  if (value.length > MAX_CATEGORY_NAME) {
    throw new BookmarkError(`Category name cannot exceed ${MAX_CATEGORY_NAME} characters.`, 400, "invalid_category_name");
  }
  return value;
}

function toCategorySnapshot(row: BookmarkCategory): BookmarkCategorySnapshot {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toBookmarkSnapshot(row: BookmarkWithCategory): BookmarkSnapshot {
  return {
    id: row.id,
    ayahId: row.ayahId,
    surahNumber: row.surahNumber,
    ayahNumber: row.ayahNumber,
    name: row.name,
    note: row.note,
    categoryId: row.categoryId,
    isPinned: row.isPinned,
    version: row.version,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    category: row.category ? toCategorySnapshot(row.category) : null,
  };
}

function defaultBookmarkName(surahNumber: number, ayahNumber: number): string {
  const surah = getSurahInfo(surahNumber);
  if (surah) {
    return `${surah.nameTransliteration} ${surahNumber}:${ayahNumber}`;
  }
  return `Surah ${surahNumber}:${ayahNumber}`;
}

function isDuplicateClientMutationError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }
  if (error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.some((t) => String(t).includes("BookmarkEvent_userId_clientMutationId_key"));
  }
  return String(target ?? "").includes("BookmarkEvent_userId_clientMutationId_key");
}

function ensureVersionMatch(actual: number, expected: number | undefined) {
  if (expected == null) {
    return;
  }
  if (!Number.isFinite(expected) || Math.floor(expected) < 1) {
    throw new BookmarkError("expectedVersion must be a positive integer.", 400, "invalid_version");
  }
  if (Math.floor(expected) !== actual) {
    throw new BookmarkError("Bookmark version conflict. Please refresh and retry.", 409, "version_conflict");
  }
}

async function requireProfile(clerkUserId: string) {
  if (!dbConfigured()) {
    throw new BookmarkError("Database not configured.", 503, "db_unavailable");
  }
  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    throw new BookmarkError("Database not configured.", 503, "db_unavailable");
  }
  return profile;
}

async function findCategoryForUser(userId: string, categoryId: string | null | undefined) {
  const trimmed = trimOrNull(categoryId);
  if (!trimmed) {
    return null;
  }
  const row = await db().bookmarkCategory.findFirst({
    where: {
      id: trimmed,
      userId,
      archivedAt: null,
    },
  });
  if (!row) {
    throw new BookmarkError("Category not found.", 404, "category_not_found");
  }
  return row;
}

function resolveAyahRef(input: { ayahId: number; surahNumber?: number; ayahNumber?: number }) {
  const ayahId = Math.floor(Number(input.ayahId));
  if (!Number.isFinite(ayahId) || ayahId < 1) {
    throw new BookmarkError("ayahId must be a positive integer.", 400, "invalid_ayah");
  }
  const ayah = getAyahById(ayahId);
  if (!ayah) {
    throw new BookmarkError("Ayah not found.", 404, "ayah_not_found");
  }
  if (input.surahNumber != null && Number(input.surahNumber) !== ayah.surahNumber) {
    throw new BookmarkError("surahNumber does not match ayahId.", 400, "invalid_ayah");
  }
  if (input.ayahNumber != null && Number(input.ayahNumber) !== ayah.ayahNumber) {
    throw new BookmarkError("ayahNumber does not match ayahId.", 400, "invalid_ayah");
  }
  return {
    ayahId: ayah.id,
    surahNumber: ayah.surahNumber,
    ayahNumber: ayah.ayahNumber,
  };
}

async function createEvent(input: {
  userId: string;
  bookmarkId?: string | null;
  mutationType: BookmarkMutationType;
  clientMutationId: string | null;
  payloadJson?: Prisma.InputJsonValue | null;
}) {
  const clientMutationId = input.clientMutationId ?? `srv_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return db().bookmarkEvent.create({
    data: {
      userId: input.userId,
      bookmarkId: input.bookmarkId ?? null,
      mutationType: input.mutationType,
      clientMutationId,
      payloadJson: input.payloadJson ?? undefined,
    },
  });
}

async function checkMutationAlreadyApplied(userId: string, clientMutationId: string | null): Promise<BookmarkEvent | null> {
  if (!clientMutationId) {
    return null;
  }
  return db().bookmarkEvent.findUnique({
    where: {
      userId_clientMutationId: {
        userId,
        clientMutationId,
      },
    },
  });
}

async function getBookmarkRowForUser(userId: string, bookmarkId: string) {
  const row = await db().bookmark.findFirst({
    where: { id: bookmarkId, userId },
    include: { category: true },
  });
  if (!row) {
    throw new BookmarkError("Bookmark not found.", 404, "bookmark_not_found");
  }
  return row;
}

export function isBookmarkError(error: unknown): error is BookmarkError {
  return error instanceof BookmarkError;
}

export async function listBookmarks(clerkUserId: string, opts?: {
  includeDeleted?: boolean;
  includeArchivedCategories?: boolean;
  search?: string | null;
  categoryId?: string | null;
}): Promise<BookmarkStateSnapshot> {
  const profile = await requireProfile(clerkUserId);
  const includeDeleted = opts?.includeDeleted === true;
  const includeArchivedCategories = opts?.includeArchivedCategories === true;
  const search = trimOrNull(opts?.search ?? null);
  const categoryId = trimOrNull(opts?.categoryId ?? null);

  const where = {
    userId: profile.id,
    deletedAt: includeDeleted ? undefined : null,
    categoryId: categoryId ?? undefined,
    OR: search
      ? [
          { name: { contains: search, mode: "insensitive" as const } },
          { note: { contains: search, mode: "insensitive" as const } },
        ]
      : undefined,
  };

  const [categories, bookmarks] = await Promise.all([
    db().bookmarkCategory.findMany({
      where: {
        userId: profile.id,
        archivedAt: includeArchivedCategories ? undefined : null,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db().bookmark.findMany({
      where,
      include: { category: true },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return {
    categories: categories.map(toCategorySnapshot),
    bookmarks: bookmarks.map(toBookmarkSnapshot),
  };
}

export async function createBookmark(clerkUserId: string, input: BookmarkCreateInput): Promise<BookmarkSnapshot> {
  const profile = await requireProfile(clerkUserId);
  const dedupeId = coerceClientMutationId(input.clientMutationId ?? null);
  const alreadyApplied = await checkMutationAlreadyApplied(profile.id, dedupeId);
  if (alreadyApplied?.bookmarkId) {
    const existing = await getBookmarkRowForUser(profile.id, alreadyApplied.bookmarkId);
    return toBookmarkSnapshot(existing);
  }

  const target = resolveAyahRef({
    ayahId: input.ayahId,
    surahNumber: input.surahNumber,
    ayahNumber: input.ayahNumber,
  });
  const category = await findCategoryForUser(profile.id, input.categoryId ?? null);
  const name = sanitizeName(input.name, defaultBookmarkName(target.surahNumber, target.ayahNumber));
  const note = sanitizeNote(input.note);

  try {
    const created = await db().$transaction(async (tx) => {
      const bookmark = await tx.bookmark.create({
        data: {
          userId: profile.id,
          ayahId: target.ayahId,
          surahNumber: target.surahNumber,
          ayahNumber: target.ayahNumber,
          name,
          note,
          categoryId: category?.id ?? null,
          isPinned: Boolean(input.isPinned),
        },
        include: { category: true },
      });

      await tx.bookmarkEvent.create({
        data: {
          userId: profile.id,
          bookmarkId: bookmark.id,
          mutationType: "CREATE",
          clientMutationId: dedupeId ?? `srv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          payloadJson: {
            ayahId: target.ayahId,
            surahNumber: target.surahNumber,
            ayahNumber: target.ayahNumber,
          },
        },
      });
      return bookmark;
    });
    return toBookmarkSnapshot(created);
  } catch (error) {
    if (isDuplicateClientMutationError(error) && dedupeId) {
      const event = await checkMutationAlreadyApplied(profile.id, dedupeId);
      if (event?.bookmarkId) {
        const row = await getBookmarkRowForUser(profile.id, event.bookmarkId);
        return toBookmarkSnapshot(row);
      }
    }
    throw error;
  }
}

export async function updateBookmark(clerkUserId: string, input: BookmarkUpdateInput): Promise<BookmarkSnapshot> {
  const profile = await requireProfile(clerkUserId);
  const dedupeId = coerceClientMutationId(input.clientMutationId ?? null);
  const alreadyApplied = await checkMutationAlreadyApplied(profile.id, dedupeId);
  if (alreadyApplied?.bookmarkId) {
    const existing = await getBookmarkRowForUser(profile.id, alreadyApplied.bookmarkId);
    return toBookmarkSnapshot(existing);
  }

  const bookmark = await getBookmarkRowForUser(profile.id, input.bookmarkId);
  if (bookmark.deletedAt) {
    throw new BookmarkError("Cannot update a deleted bookmark.", 409, "bookmark_deleted");
  }
  ensureVersionMatch(bookmark.version, input.expectedVersion);

  const category = input.categoryId !== undefined
    ? await findCategoryForUser(profile.id, input.categoryId)
    : undefined;

  const data: Prisma.BookmarkUncheckedUpdateInput = {
    version: { increment: 1 },
  };

  if (input.name !== undefined) {
    data.name = sanitizeName(input.name, bookmark.name);
  }
  if (input.note !== undefined) {
    data.note = sanitizeNote(input.note);
  }
  if (input.isPinned !== undefined) {
    data.isPinned = Boolean(input.isPinned);
  }
  if (input.categoryId !== undefined) {
    data.categoryId = category?.id ?? null;
  }

  try {
    const updated = await db().$transaction(async (tx) => {
      const row = await tx.bookmark.update({
        where: { id: bookmark.id },
        data,
        include: { category: true },
      });
      await tx.bookmarkEvent.create({
        data: {
          userId: profile.id,
          bookmarkId: row.id,
          mutationType: "UPDATE",
          clientMutationId: dedupeId ?? `srv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          payloadJson: {
            changedName: input.name !== undefined,
            changedNote: input.note !== undefined,
            changedPinned: input.isPinned !== undefined,
            changedCategory: input.categoryId !== undefined,
          },
        },
      });
      return row;
    });
    return toBookmarkSnapshot(updated);
  } catch (error) {
    if (isDuplicateClientMutationError(error) && dedupeId) {
      const event = await checkMutationAlreadyApplied(profile.id, dedupeId);
      if (event?.bookmarkId) {
        const row = await getBookmarkRowForUser(profile.id, event.bookmarkId);
        return toBookmarkSnapshot(row);
      }
    }
    throw error;
  }
}

export async function softDeleteBookmark(clerkUserId: string, input: BookmarkDeleteInput): Promise<BookmarkSnapshot> {
  const profile = await requireProfile(clerkUserId);
  const dedupeId = coerceClientMutationId(input.clientMutationId ?? null);
  const alreadyApplied = await checkMutationAlreadyApplied(profile.id, dedupeId);
  if (alreadyApplied?.bookmarkId) {
    const existing = await getBookmarkRowForUser(profile.id, alreadyApplied.bookmarkId);
    return toBookmarkSnapshot(existing);
  }

  const bookmark = await getBookmarkRowForUser(profile.id, input.bookmarkId);
  ensureVersionMatch(bookmark.version, input.expectedVersion);

  try {
    const deleted = await db().$transaction(async (tx) => {
      const row = await tx.bookmark.update({
        where: { id: bookmark.id },
        data: {
          deletedAt: new Date(),
          version: { increment: 1 },
        },
        include: { category: true },
      });
      await tx.bookmarkEvent.create({
        data: {
          userId: profile.id,
          bookmarkId: row.id,
          mutationType: "DELETE",
          clientMutationId: dedupeId ?? `srv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        },
      });
      return row;
    });
    return toBookmarkSnapshot(deleted);
  } catch (error) {
    if (isDuplicateClientMutationError(error) && dedupeId) {
      const event = await checkMutationAlreadyApplied(profile.id, dedupeId);
      if (event?.bookmarkId) {
        const row = await getBookmarkRowForUser(profile.id, event.bookmarkId);
        return toBookmarkSnapshot(row);
      }
    }
    throw error;
  }
}

export async function restoreBookmark(clerkUserId: string, input: BookmarkRestoreInput): Promise<BookmarkSnapshot> {
  const profile = await requireProfile(clerkUserId);
  const dedupeId = coerceClientMutationId(input.clientMutationId ?? null);
  const alreadyApplied = await checkMutationAlreadyApplied(profile.id, dedupeId);
  if (alreadyApplied?.bookmarkId) {
    const existing = await getBookmarkRowForUser(profile.id, alreadyApplied.bookmarkId);
    return toBookmarkSnapshot(existing);
  }

  const bookmark = await getBookmarkRowForUser(profile.id, input.bookmarkId);
  ensureVersionMatch(bookmark.version, input.expectedVersion);

  try {
    const restored = await db().$transaction(async (tx) => {
      const row = await tx.bookmark.update({
        where: { id: bookmark.id },
        data: {
          deletedAt: null,
          version: { increment: 1 },
        },
        include: { category: true },
      });
      await tx.bookmarkEvent.create({
        data: {
          userId: profile.id,
          bookmarkId: row.id,
          mutationType: "RESTORE",
          clientMutationId: dedupeId ?? `srv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        },
      });
      return row;
    });
    return toBookmarkSnapshot(restored);
  } catch (error) {
    if (isDuplicateClientMutationError(error) && dedupeId) {
      const event = await checkMutationAlreadyApplied(profile.id, dedupeId);
      if (event?.bookmarkId) {
        const row = await getBookmarkRowForUser(profile.id, event.bookmarkId);
        return toBookmarkSnapshot(row);
      }
    }
    throw error;
  }
}

export async function createBookmarkCategory(
  clerkUserId: string,
  input: BookmarkCategoryCreateInput,
): Promise<BookmarkCategorySnapshot> {
  const profile = await requireProfile(clerkUserId);
  const dedupeId = coerceClientMutationId(input.clientMutationId ?? null);
  const alreadyApplied = await checkMutationAlreadyApplied(profile.id, dedupeId);
  if (alreadyApplied) {
    const createdId = (alreadyApplied.payloadJson as Record<string, unknown> | null)?.categoryId;
    if (typeof createdId === "string") {
      const existing = await db().bookmarkCategory.findFirst({
        where: { id: createdId, userId: profile.id },
      });
      if (existing) {
        return toCategorySnapshot(existing);
      }
    }
  }

  const name = sanitizeCategoryName(input.name);
  const sortOrder = safeSortOrder(input.sortOrder ?? 0);

  try {
    const category = await db().$transaction(async (tx) => {
      const row = await tx.bookmarkCategory.create({
        data: {
          userId: profile.id,
          name,
          sortOrder,
        },
      });
      await tx.bookmarkEvent.create({
        data: {
          userId: profile.id,
          mutationType: "CATEGORY_CREATE",
          clientMutationId: dedupeId ?? `srv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          payloadJson: { categoryId: row.id },
        },
      });
      return row;
    });
    return toCategorySnapshot(category);
  } catch (error) {
    if (isDuplicateClientMutationError(error) && dedupeId) {
      const event = await checkMutationAlreadyApplied(profile.id, dedupeId);
      const categoryId = (event?.payloadJson as Record<string, unknown> | null)?.categoryId;
      if (typeof categoryId === "string") {
        const row = await db().bookmarkCategory.findFirst({
          where: { id: categoryId, userId: profile.id },
        });
        if (row) {
          return toCategorySnapshot(row);
        }
      }
    }
    throw error;
  }
}

export async function updateBookmarkCategory(
  clerkUserId: string,
  input: BookmarkCategoryUpdateInput,
): Promise<BookmarkCategorySnapshot> {
  const profile = await requireProfile(clerkUserId);
  const dedupeId = coerceClientMutationId(input.clientMutationId ?? null);
  const alreadyApplied = await checkMutationAlreadyApplied(profile.id, dedupeId);
  if (alreadyApplied) {
    const categoryId = (alreadyApplied.payloadJson as Record<string, unknown> | null)?.categoryId;
    if (typeof categoryId === "string") {
      const existing = await db().bookmarkCategory.findFirst({
        where: { id: categoryId, userId: profile.id },
      });
      if (existing) {
        return toCategorySnapshot(existing);
      }
    }
  }

  const existing = await db().bookmarkCategory.findFirst({
    where: {
      id: input.categoryId,
      userId: profile.id,
    },
  });
  if (!existing) {
    throw new BookmarkError("Category not found.", 404, "category_not_found");
  }

  const data: Prisma.BookmarkCategoryUpdateInput = {};
  if (input.name !== undefined) {
    data.name = sanitizeCategoryName(input.name);
  }
  if (input.sortOrder !== undefined) {
    data.sortOrder = safeSortOrder(input.sortOrder);
  }
  if (input.archivedAt !== undefined) {
    data.archivedAt = input.archivedAt ? new Date(input.archivedAt) : null;
  }

  try {
    const updated = await db().$transaction(async (tx) => {
      const row = await tx.bookmarkCategory.update({
        where: { id: existing.id },
        data,
      });
      await tx.bookmarkEvent.create({
        data: {
          userId: profile.id,
          mutationType: "CATEGORY_UPDATE",
          clientMutationId: dedupeId ?? `srv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          payloadJson: { categoryId: row.id },
        },
      });
      return row;
    });
    return toCategorySnapshot(updated);
  } catch (error) {
    if (isDuplicateClientMutationError(error) && dedupeId) {
      const row = await db().bookmarkCategory.findFirst({
        where: { id: existing.id, userId: profile.id },
      });
      if (row) {
        return toCategorySnapshot(row);
      }
    }
    throw error;
  }
}

export async function deleteBookmarkCategory(
  clerkUserId: string,
  input: BookmarkCategoryDeleteInput,
): Promise<BookmarkCategorySnapshot> {
  const profile = await requireProfile(clerkUserId);
  const dedupeId = coerceClientMutationId(input.clientMutationId ?? null);
  const alreadyApplied = await checkMutationAlreadyApplied(profile.id, dedupeId);
  if (alreadyApplied) {
    const categoryId = (alreadyApplied.payloadJson as Record<string, unknown> | null)?.categoryId;
    if (typeof categoryId === "string") {
      const existing = await db().bookmarkCategory.findFirst({
        where: { id: categoryId, userId: profile.id },
      });
      if (existing) {
        return toCategorySnapshot(existing);
      }
    }
  }

  const existing = await db().bookmarkCategory.findFirst({
    where: {
      id: input.categoryId,
      userId: profile.id,
    },
  });
  if (!existing) {
    throw new BookmarkError("Category not found.", 404, "category_not_found");
  }

  try {
    const archived = await db().$transaction(async (tx) => {
      await tx.bookmark.updateMany({
        where: {
          userId: profile.id,
          categoryId: existing.id,
        },
        data: {
          categoryId: null,
          version: { increment: 1 },
        },
      });

      const row = await tx.bookmarkCategory.update({
        where: { id: existing.id },
        data: {
          archivedAt: new Date(),
        },
      });

      await tx.bookmarkEvent.create({
        data: {
          userId: profile.id,
          mutationType: "CATEGORY_DELETE",
          clientMutationId: dedupeId ?? `srv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          payloadJson: { categoryId: row.id },
        },
      });
      return row;
    });
    return toCategorySnapshot(archived);
  } catch (error) {
    if (isDuplicateClientMutationError(error) && dedupeId) {
      const row = await db().bookmarkCategory.findFirst({
        where: { id: existing.id, userId: profile.id },
      });
      if (row) {
        return toCategorySnapshot(row);
      }
    }
    throw error;
  }
}

export async function applyBookmarkSyncMutations(
  clerkUserId: string,
  mutations: BookmarkSyncMutation[],
): Promise<{ results: BookmarkSyncMutationResult[]; state: BookmarkStateSnapshot }> {
  const profile = await requireProfile(clerkUserId);
  if (!Array.isArray(mutations)) {
    throw new BookmarkError("mutations must be an array.", 400, "invalid_mutations");
  }
  if (mutations.length > MAX_SYNC_MUTATIONS) {
    throw new BookmarkError(`Maximum ${MAX_SYNC_MUTATIONS} mutations per sync request.`, 400, "too_many_mutations");
  }

  const results: BookmarkSyncMutationResult[] = [];

  for (const mutation of mutations) {
    const clientMutationId = trimOrNull(mutation.clientMutationId);
    if (!clientMutationId) {
      results.push({
        clientMutationId: "",
        type: mutation.type,
        ok: false,
        error: "Missing clientMutationId.",
        code: "invalid_mutations",
        retryable: false,
      });
      continue;
    }

    const existingEvent = await checkMutationAlreadyApplied(profile.id, clientMutationId);
    if (existingEvent) {
      results.push({
        clientMutationId,
        type: mutation.type,
        ok: true,
        deduped: true,
      });
      continue;
    }

    try {
      if (mutation.type === "CREATE") {
        await createBookmark(clerkUserId, {
          ...mutation.data,
          clientMutationId,
        });
      } else if (mutation.type === "UPDATE") {
        await updateBookmark(clerkUserId, {
          ...mutation.data,
          bookmarkId: mutation.bookmarkId,
          clientMutationId,
        });
      } else if (mutation.type === "DELETE") {
        await softDeleteBookmark(clerkUserId, {
          bookmarkId: mutation.bookmarkId,
          expectedVersion: mutation.expectedVersion,
          clientMutationId,
        });
      } else if (mutation.type === "RESTORE") {
        await restoreBookmark(clerkUserId, {
          bookmarkId: mutation.bookmarkId,
          expectedVersion: mutation.expectedVersion,
          clientMutationId,
        });
      } else if (mutation.type === "CATEGORY_CREATE") {
        await createBookmarkCategory(clerkUserId, {
          ...mutation.data,
          clientMutationId,
        });
      } else if (mutation.type === "CATEGORY_UPDATE") {
        await updateBookmarkCategory(clerkUserId, {
          ...mutation.data,
          categoryId: mutation.categoryId,
          clientMutationId,
        });
      } else if (mutation.type === "CATEGORY_DELETE") {
        await deleteBookmarkCategory(clerkUserId, {
          categoryId: mutation.categoryId,
          clientMutationId,
        });
      }
      results.push({
        clientMutationId,
        type: mutation.type,
        ok: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown sync mutation error.";
      results.push({
        clientMutationId,
        type: mutation.type,
        ok: false,
        error: message,
        code: isBookmarkError(error) ? error.code : "sync_mutation_error",
        retryable: isBookmarkError(error) ? error.status >= 500 : true,
      });
    }
  }

  const state = await listBookmarks(clerkUserId, {
    includeDeleted: true,
    includeArchivedCategories: true,
  });

  return { results, state };
}

export async function logBookmarkAccess(clerkUserId: string, bookmarkId: string) {
  const profile = await requireProfile(clerkUserId);
  const bookmark = await db().bookmark.findFirst({
    where: {
      id: bookmarkId,
      userId: profile.id,
    },
  });
  if (!bookmark) {
    throw new BookmarkError("Bookmark not found.", 404, "bookmark_not_found");
  }
  await createEvent({
    userId: profile.id,
    bookmarkId: bookmark.id,
    mutationType: "UPDATE",
    clientMutationId: null,
    payloadJson: { action: "open" },
  });
}
