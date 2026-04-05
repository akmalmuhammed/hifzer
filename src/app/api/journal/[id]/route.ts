import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  deletePrivateJournalEntry,
  isJournalStorageError,
  JournalStorageError,
} from "@/hifzer/journal/server";

function handleError(error: unknown) {
  if (isJournalStorageError(error)) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof JournalStorageError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
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
