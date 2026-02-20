import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  BookmarkError,
  createBookmark,
  isBookmarkError,
  listBookmarks,
} from "@/hifzer/bookmarks/server";

type CreatePayload = {
  ayahId?: unknown;
  surahNumber?: unknown;
  ayahNumber?: unknown;
  name?: unknown;
  note?: unknown;
  categoryId?: unknown;
  isPinned?: unknown;
  clientMutationId?: unknown;
};

function asBoolean(input: string | null): boolean {
  return input === "1" || input === "true";
}

function asOptionalString(input: unknown): string | null {
  return typeof input === "string" ? input : null;
}

function asOptionalNumber(input: unknown): number | undefined {
  if (input == null) {
    return undefined;
  }
  const n = Number(input);
  return Number.isFinite(n) ? n : undefined;
}

function asOptionalBoolean(input: unknown): boolean | undefined {
  if (typeof input === "boolean") {
    return input;
  }
  if (typeof input === "string") {
    if (input === "true" || input === "1") {
      return true;
    }
    if (input === "false" || input === "0") {
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

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const state = await listBookmarks(userId, {
      includeDeleted: asBoolean(url.searchParams.get("includeDeleted")),
      includeArchivedCategories: asBoolean(url.searchParams.get("includeArchivedCategories")),
      search: url.searchParams.get("search"),
      categoryId: url.searchParams.get("categoryId"),
    });
    return NextResponse.json({ ok: true, state });
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

  const ayahId = asOptionalNumber(payload.ayahId);
  if (!ayahId) {
    return NextResponse.json({ error: "ayahId is required." }, { status: 400 });
  }

  try {
    const bookmark = await createBookmark(userId, {
      ayahId,
      surahNumber: asOptionalNumber(payload.surahNumber),
      ayahNumber: asOptionalNumber(payload.ayahNumber),
      name: asOptionalString(payload.name),
      note: asOptionalString(payload.note),
      categoryId: asOptionalString(payload.categoryId),
      isPinned: asOptionalBoolean(payload.isPinned),
      clientMutationId: asOptionalString(payload.clientMutationId),
    });
    return NextResponse.json({ ok: true, bookmark });
  } catch (error) {
    return handleError(error);
  }
}
