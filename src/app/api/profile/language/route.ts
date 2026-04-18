import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { buildQuranTranslationCookieValue, isSupportedQuranTranslationId } from "@/hifzer/quran/translation-prefs";
import { saveLanguagePrefs } from "@/hifzer/profile/server";
import { ensureCoreSchemaCompatibility, getCoreSchemaCapabilities } from "@/lib/db-compat";
import { dbConfigured } from "@/lib/db";

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
  const quranTranslationId = payload.quranTranslationId;

  function withTranslationCookie(response: NextResponse): NextResponse {
    response.headers.append("set-cookie", buildQuranTranslationCookieValue(quranTranslationId));
    return response;
  }

  if (!dbConfigured()) {
    return NextResponse.json({
      error: "Persistence unavailable: database is not configured. Language changes cannot be saved.",
    }, { status: 503 });
  }

  let capabilities = await getCoreSchemaCapabilities({ refresh: true });
  if (!capabilities.hasQuranLaneColumns) {
    try {
      await ensureCoreSchemaCompatibility();
    } catch {
      // If patching fails (permissions/managed DB restrictions), fall through and
      // return a clear persistence error below.
    }
    capabilities = await getCoreSchemaCapabilities({ refresh: true });
  }

  if (!capabilities.hasQuranLaneColumns) {
    return NextResponse.json({
      error:
        "Persistence unavailable: profile translation columns are missing in the configured database schema. " +
        "Run DB migrations (or enable runtime schema patching) and retry.",
    }, { status: 503 });
  }

  const profile = await saveLanguagePrefs({
    clerkUserId: userId,
    quranTranslationId,
  });

  if (!profile) {
    return NextResponse.json({
      error: "Persistence unavailable: language preference was not saved.",
    }, { status: 503 });
  }

  if (profile.quranTranslationId !== quranTranslationId) {
    return NextResponse.json({
      error: "Persistence unavailable: saved translation does not match the requested value.",
    }, { status: 503 });
  }

  return withTranslationCookie(NextResponse.json({ ok: true, profile }));
}
