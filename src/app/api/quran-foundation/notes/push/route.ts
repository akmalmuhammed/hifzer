import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isJournalStorageError, syncPrivateJournalEntriesToQuranFoundation } from "@/hifzer/journal/server";
import { isQuranFoundationError } from "@/hifzer/quran-foundation/types";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncPrivateJournalEntriesToQuranFoundation(userId);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (isQuranFoundationError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    if (isJournalStorageError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not sync local journal notes to Quran.com." }, { status: 500 });
  }
}
