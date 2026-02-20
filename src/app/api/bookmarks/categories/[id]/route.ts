import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  BookmarkError,
  deleteBookmarkCategory,
  isBookmarkError,
  updateBookmarkCategory,
} from "@/hifzer/bookmarks/server";

type UpdatePayload = {
  name?: unknown;
  sortOrder?: unknown;
  archivedAt?: unknown;
  clientMutationId?: unknown;
};

type DeletePayload = {
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
    return NextResponse.json({ error: "Category id is required." }, { status: 400 });
  }

  let payload: UpdatePayload;
  try {
    payload = (await req.json()) as UpdatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const category = await updateBookmarkCategory(userId, {
      categoryId: id,
      name: payload.name === undefined ? undefined : asOptionalString(payload.name),
      sortOrder: asOptionalNumber(payload.sortOrder),
      archivedAt: payload.archivedAt === undefined ? undefined : asOptionalString(payload.archivedAt),
      clientMutationId: asOptionalString(payload.clientMutationId),
    });
    return NextResponse.json({ ok: true, category });
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
    return NextResponse.json({ error: "Category id is required." }, { status: 400 });
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
    const category = await deleteBookmarkCategory(userId, {
      categoryId: id,
      clientMutationId: asOptionalString(payload.clientMutationId),
    });
    return NextResponse.json({ ok: true, category });
  } catch (error) {
    return handleError(error);
  }
}
