import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  BookmarkError,
  isBookmarkError,
  restoreBookmark,
  softDeleteBookmark,
  updateBookmark,
} from "@/hifzer/bookmarks/server";

type UpdatePayload = {
  name?: unknown;
  note?: unknown;
  categoryId?: unknown;
  isPinned?: unknown;
  expectedVersion?: unknown;
  restore?: unknown;
  clientMutationId?: unknown;
};

type DeletePayload = {
  expectedVersion?: unknown;
  clientMutationId?: unknown;
};

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

function handleError(error: unknown) {
  if (isBookmarkError(error)) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof BookmarkError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Bookmark id is required." }, { status: 400 });
  }

  let payload: UpdatePayload;
  try {
    payload = (await req.json()) as UpdatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const restore = asOptionalBoolean(payload.restore) === true;
  const expectedVersion = asOptionalNumber(payload.expectedVersion);
  const clientMutationId = asOptionalString(payload.clientMutationId);

  try {
    if (restore) {
      const bookmark = await restoreBookmark(userId, {
        bookmarkId: id,
        expectedVersion,
        clientMutationId,
      });
      return NextResponse.json({ ok: true, bookmark });
    }

    const bookmark = await updateBookmark(userId, {
      bookmarkId: id,
      name: payload.name === undefined ? undefined : asOptionalString(payload.name),
      note: payload.note === undefined ? undefined : asOptionalString(payload.note),
      categoryId: payload.categoryId === undefined ? undefined : asOptionalString(payload.categoryId),
      isPinned: asOptionalBoolean(payload.isPinned),
      expectedVersion,
      clientMutationId,
    });

    return NextResponse.json({ ok: true, bookmark });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Bookmark id is required." }, { status: 400 });
  }

  let payload: DeletePayload = {};
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      payload = (await req.json()) as DeletePayload;
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const bookmark = await softDeleteBookmark(userId, {
      bookmarkId: id,
      expectedVersion: asOptionalNumber(payload.expectedVersion),
      clientMutationId: asOptionalString(payload.clientMutationId),
    });
    return NextResponse.json({ ok: true, bookmark });
  } catch (error) {
    return handleError(error);
  }
}
