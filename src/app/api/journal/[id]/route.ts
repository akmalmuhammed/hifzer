import { NextResponse } from "next/server";
import {
  deletePrivateJournalEntry,
  getPrivateJournalEntry,
  isJournalStorageError,
  JournalStorageError,
} from "@/hifzer/journal/server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";

function handleError(error: unknown) {
  if (isJournalStorageError(error)) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.authoritativeEntry !== undefined
          ? { authoritativeEntry: error.authoritativeEntry }
          : {}),
      },
      { status: error.status },
    );
  }
  if (error instanceof JournalStorageError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.authoritativeEntry !== undefined
          ? { authoritativeEntry: error.authoritativeEntry }
          : {}),
      },
      { status: error.status },
    );
  }
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await resolveClerkUserIdForServer(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Journal entry id is required." }, { status: 400 });
  }

  try {
    const entry = await getPrivateJournalEntry(userId, id);
    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await resolveClerkUserIdForServer(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Journal entry id is required." }, { status: 400 });
  }

  try {
    const searchParams = new URL(req.url).searchParams;
    const expectedVersionParam = searchParams.get("expectedVersion");
    const expectedVersion = expectedVersionParam == null || expectedVersionParam === ""
      ? undefined
      : Number(expectedVersionParam);
    await deletePrivateJournalEntry(userId, id, {
      ownerId: searchParams.get("ownerId"),
      clientMutationId: searchParams.get("clientMutationId"),
      expectedVersion,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
