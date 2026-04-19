import { NextResponse } from "next/server";
import {
  JournalStorageError,
  importPrivateJournalEntries,
  isJournalStorageError,
} from "@/hifzer/journal/server";
import type { JournalEntry } from "@/hifzer/journal/local-store";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";

type ImportPayload = {
  entries?: unknown;
};

function handleError(error: unknown) {
  if (isJournalStorageError(error)) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof JournalStorageError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}

export async function POST(req: Request) {
  const userId = await resolveClerkUserIdForServer(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: ImportPayload;
  try {
    payload = (await req.json()) as ImportPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(payload.entries)) {
    return NextResponse.json({ error: "entries must be an array." }, { status: 400 });
  }

  try {
    const entries = await importPrivateJournalEntries(userId, payload.entries as JournalEntry[]);
    return NextResponse.json({ ok: true, entries });
  } catch (error) {
    return handleError(error);
  }
}
