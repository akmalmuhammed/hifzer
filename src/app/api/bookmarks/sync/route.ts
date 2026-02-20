import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  applyBookmarkSyncMutations,
  BookmarkError,
  type BookmarkSyncMutationResult,
  type BookmarkSyncMutation,
  isBookmarkError,
} from "@/hifzer/bookmarks/server";

type SyncPayload = {
  mutations?: unknown;
};

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === "object" && !Array.isArray(input);
}

function asOptionalString(input: unknown): string | null {
  return typeof input === "string" ? input : null;
}

function asOptionalNumber(input: unknown): number | undefined {
  if (input == null) {
    return undefined;
  }
  const n = Number(input);
  return Number.isFinite(n) ? Math.floor(n) : undefined;
}

function asOptionalBoolean(input: unknown): boolean | undefined {
  if (typeof input === "boolean") {
    return input;
  }
  if (typeof input === "string") {
    if (input === "1" || input === "true") {
      return true;
    }
    if (input === "0" || input === "false") {
      return false;
    }
  }
  return undefined;
}

function parseMutation(row: unknown): BookmarkSyncMutation {
  if (!isRecord(row)) {
    throw new BookmarkError("Each mutation must be an object.", 400, "invalid_mutations");
  }
  const type = asOptionalString(row.type);
  const clientMutationId = asOptionalString(row.clientMutationId);
  if (!type || !clientMutationId) {
    throw new BookmarkError("Mutation type and clientMutationId are required.", 400, "invalid_mutations");
  }

  if (type === "CREATE") {
    const data = isRecord(row.data) ? row.data : {};
    const ayahId = asOptionalNumber(data.ayahId);
    if (!ayahId) {
      throw new BookmarkError("CREATE mutation requires data.ayahId.", 400, "invalid_mutations");
    }
    return {
      type,
      clientMutationId,
      data: {
        ayahId,
        surahNumber: asOptionalNumber(data.surahNumber),
        ayahNumber: asOptionalNumber(data.ayahNumber),
        name: asOptionalString(data.name),
        note: asOptionalString(data.note),
        categoryId: data.categoryId === null ? null : asOptionalString(data.categoryId),
        isPinned: asOptionalBoolean(data.isPinned),
      },
    };
  }

  if (type === "UPDATE") {
    const bookmarkId = asOptionalString(row.bookmarkId);
    if (!bookmarkId) {
      throw new BookmarkError("UPDATE mutation requires bookmarkId.", 400, "invalid_mutations");
    }
    const data = isRecord(row.data) ? row.data : {};
    return {
      type,
      clientMutationId,
      bookmarkId,
      data: {
        name: data.name === undefined ? undefined : asOptionalString(data.name),
        note: data.note === undefined ? undefined : asOptionalString(data.note),
        categoryId: data.categoryId === undefined
          ? undefined
          : data.categoryId === null
            ? null
            : asOptionalString(data.categoryId),
        isPinned: asOptionalBoolean(data.isPinned),
        expectedVersion: asOptionalNumber(data.expectedVersion),
      },
    };
  }

  if (type === "DELETE") {
    const bookmarkId = asOptionalString(row.bookmarkId);
    if (!bookmarkId) {
      throw new BookmarkError("DELETE mutation requires bookmarkId.", 400, "invalid_mutations");
    }
    return {
      type,
      clientMutationId,
      bookmarkId,
      expectedVersion: asOptionalNumber(row.expectedVersion),
    };
  }

  if (type === "RESTORE") {
    const bookmarkId = asOptionalString(row.bookmarkId);
    if (!bookmarkId) {
      throw new BookmarkError("RESTORE mutation requires bookmarkId.", 400, "invalid_mutations");
    }
    return {
      type,
      clientMutationId,
      bookmarkId,
      expectedVersion: asOptionalNumber(row.expectedVersion),
    };
  }

  if (type === "CATEGORY_CREATE") {
    const data = isRecord(row.data) ? row.data : {};
    const name = asOptionalString(data.name);
    if (!name) {
      throw new BookmarkError("CATEGORY_CREATE mutation requires data.name.", 400, "invalid_mutations");
    }
    return {
      type,
      clientMutationId,
      data: {
        name,
        sortOrder: asOptionalNumber(data.sortOrder),
      },
    };
  }

  if (type === "CATEGORY_UPDATE") {
    const categoryId = asOptionalString(row.categoryId);
    if (!categoryId) {
      throw new BookmarkError("CATEGORY_UPDATE mutation requires categoryId.", 400, "invalid_mutations");
    }
    const data = isRecord(row.data) ? row.data : {};
    return {
      type,
      clientMutationId,
      categoryId,
      data: {
        name: data.name === undefined ? undefined : asOptionalString(data.name),
        sortOrder: asOptionalNumber(data.sortOrder),
        archivedAt: data.archivedAt === undefined ? undefined : asOptionalString(data.archivedAt),
      },
    };
  }

  if (type === "CATEGORY_DELETE") {
    const categoryId = asOptionalString(row.categoryId);
    if (!categoryId) {
      throw new BookmarkError("CATEGORY_DELETE mutation requires categoryId.", 400, "invalid_mutations");
    }
    return {
      type,
      clientMutationId,
      categoryId,
    };
  }

  throw new BookmarkError(`Unknown mutation type: ${type}`, 400, "invalid_mutations");
}

function parseRowFailure(row: unknown, error: unknown): BookmarkSyncMutationResult {
  let clientMutationId = "";
  let type: BookmarkSyncMutationResult["type"] = "UNKNOWN";

  if (isRecord(row)) {
    if (typeof row.clientMutationId === "string") {
      clientMutationId = row.clientMutationId;
    }
    if (typeof row.type === "string") {
      const normalized = row.type.trim().toUpperCase();
      if (
        normalized === "CREATE" ||
        normalized === "UPDATE" ||
        normalized === "DELETE" ||
        normalized === "RESTORE" ||
        normalized === "CATEGORY_CREATE" ||
        normalized === "CATEGORY_UPDATE" ||
        normalized === "CATEGORY_DELETE"
      ) {
        type = normalized;
      }
    }
  }

  if (isBookmarkError(error)) {
    return {
      clientMutationId,
      type,
      ok: false,
      error: error.message,
      code: error.code,
      retryable: error.status >= 500,
    };
  }
  if (error instanceof BookmarkError) {
    return {
      clientMutationId,
      type,
      ok: false,
      error: error.message,
      code: error.code,
      retryable: error.status >= 500,
    };
  }

  return {
    clientMutationId,
    type,
    ok: false,
    error: "Invalid mutation.",
    code: "invalid_mutations",
    retryable: false,
  };
}

function handleError(error: unknown) {
  if (isBookmarkError(error)) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof BookmarkError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: SyncPayload;
  try {
    payload = (await req.json()) as SyncPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rows = Array.isArray(payload.mutations) ? payload.mutations : [];
  try {
    const mutations: BookmarkSyncMutation[] = [];
    const parseFailures: BookmarkSyncMutationResult[] = [];
    for (const row of rows) {
      try {
        mutations.push(parseMutation(row));
      } catch (error) {
        parseFailures.push(parseRowFailure(row, error));
      }
    }

    const result = await applyBookmarkSyncMutations(userId, mutations);
    const mergedResults = [...parseFailures, ...result.results];
    return NextResponse.json({
      ok: mergedResults.every((r) => r.ok),
      results: mergedResults,
      state: result.state,
    });
  } catch (error) {
    return handleError(error);
  }
}
