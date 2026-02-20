import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  BookmarkError,
  createBookmarkCategory,
  isBookmarkError,
  listBookmarks,
} from "@/hifzer/bookmarks/server";

type CreatePayload = {
  name?: unknown;
  sortOrder?: unknown;
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

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const state = await listBookmarks(userId, {
      includeDeleted: false,
      includeArchivedCategories: true,
    });
    return NextResponse.json({ ok: true, categories: state.categories });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreatePayload;
  try {
    payload = (await req.json()) as CreatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const category = await createBookmarkCategory(userId, {
      name: asOptionalString(payload.name) ?? "",
      sortOrder: asOptionalNumber(payload.sortOrder),
      clientMutationId: asOptionalString(payload.clientMutationId),
    });
    return NextResponse.json({ ok: true, category });
  } catch (error) {
    return handleError(error);
  }
}
