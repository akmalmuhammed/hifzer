import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { syncBookmarkCollectionsForExistingBookmarks } from "@/hifzer/quran-foundation/bookmarks";
import { isQuranFoundationError } from "@/hifzer/quran-foundation/types";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncBookmarkCollectionsForExistingBookmarks(userId);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (isQuranFoundationError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not sync bookmark collections to Quran.com." }, { status: 500 });
  }
}
