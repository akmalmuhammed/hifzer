import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { importPrivateJournalEntries, isJournalStorageError } from "@/hifzer/journal/server";
import { listJournalEntriesFromQuranFoundationNotes } from "@/hifzer/quran-foundation/user-features";
import { isQuranFoundationError } from "@/hifzer/quran-foundation/types";

export const runtime = "nodejs";
const JOURNAL_IMPORT_BATCH_SIZE = 200;

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const remoteEntries = await listJournalEntriesFromQuranFoundationNotes(userId);
    let totalLocal = 0;
    const batchStarts = remoteEntries.length > 0
      ? Array.from(
          { length: Math.ceil(remoteEntries.length / JOURNAL_IMPORT_BATCH_SIZE) },
          (_, index) => index * JOURNAL_IMPORT_BATCH_SIZE,
        )
      : [0];
    for (const batchStart of batchStarts) {
      const imported = await importPrivateJournalEntries(
        userId,
        remoteEntries.slice(batchStart, batchStart + JOURNAL_IMPORT_BATCH_SIZE),
        userId,
      );
      totalLocal = imported.entries.length;
    }
    return NextResponse.json({
      ok: true,
      result: {
        totalRemote: remoteEntries.length,
        totalLocal,
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
