import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { startTodaySession } from "@/hifzer/engine/server";
import { QURAN_TRANSLATION_COOKIE } from "@/hifzer/quran/translation-prefs";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cookieStore = await cookies();
  const preferredTranslationId = cookieStore.get(QURAN_TRANSLATION_COOKIE)?.value;

  try {
    const result = await startTodaySession(userId, { preferredTranslationId });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "Database not configured.") {
      return NextResponse.json({ error: "onboarding_required" }, { status: 403 });
    }
    Sentry.captureException(error, {
      tags: { route: "/api/session/start", method: "POST" },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to start session." }, { status: 500 });
  }
}
