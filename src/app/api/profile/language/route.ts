import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isSupportedQuranTranslationId } from "@/hifzer/quran/translation-prefs";
import { saveLanguagePrefs } from "@/hifzer/profile/server";

type Payload = {
  quranTranslationId?: unknown;
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof payload.quranTranslationId !== "string" || !isSupportedQuranTranslationId(payload.quranTranslationId)) {
    return NextResponse.json({ error: "Invalid quranTranslationId." }, { status: 400 });
  }

  const profile = await saveLanguagePrefs({
    clerkUserId: userId,
    quranTranslationId: payload.quranTranslationId,
  });
  return NextResponse.json({ ok: true, profile });
}
