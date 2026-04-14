import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { importPrivateJournalEntries, isJournalStorageError } from "@/hifzer/journal/server";
import { listJournalEntriesFromQuranFoundationNotes } from "@/hifzer/quran-foundation/user-features";
import { isQuranFoundationError } from "@/hifzer/quran-foundation/types";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const remoteEntries = await listJournalEntriesFromQuranFoundationNotes(userId);
    const entries = await importPrivateJournalEntries(userId, remoteEntries);
    return NextResponse.json({
      ok: true,
      result: {
        totalRemote: remoteEntries.length,
        totalLocal: entries.length,
      },
    });
  } catch (error) {
    if (isQuranFoundationError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    if (isJournalStorageError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not import Quran.com notes into the journal." }, { status: 500 });
  }
}
