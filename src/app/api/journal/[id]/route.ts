import { NextResponse } from "next/server";
import {
  deletePrivateJournalEntry,
  isJournalStorageError,
  JournalStorageError,
} from "@/hifzer/journal/server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";

function handleError(error: unknown) {
  if (isJournalStorageError(error)) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof JournalStorageError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
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
    await deletePrivateJournalEntry(userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
