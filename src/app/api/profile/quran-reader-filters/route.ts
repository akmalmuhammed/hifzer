import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { saveQuranReaderFilterPrefs, type QuranReaderView } from "@/hifzer/quran/reader-filter-prefs.server";
import { ensureCoreSchemaCompatibility, getCoreSchemaCapabilities } from "@/lib/db-compat";
import { dbConfigured } from "@/lib/db";

type Payload = {
  view?: unknown;
  surahNumber?: unknown;
  ayahId?: unknown;
  showPhonetic?: unknown;
  showTranslation?: unknown;
  showTafsir?: unknown;
  tafsirId?: unknown;
};

function parseNullableInt(value: unknown, min: number, max: number, label: string): number | null {
  if (value == null || value === "") {
    return null;
  }
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be between ${min} and ${max}.`);
  }
  return parsed;
}

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

  if (payload.view !== "list" && payload.view !== "compact") {
    return NextResponse.json({ error: "view must be 'list' or 'compact'." }, { status: 400 });
  }
  if (typeof payload.showPhonetic !== "boolean") {
    return NextResponse.json({ error: "showPhonetic must be boolean." }, { status: 400 });
  }
  if (typeof payload.showTranslation !== "boolean") {
    return NextResponse.json({ error: "showTranslation must be boolean." }, { status: 400 });
  }
  if (typeof payload.showTafsir !== "boolean") {
    return NextResponse.json({ error: "showTafsir must be boolean." }, { status: 400 });
  }

  let surahNumber: number | null;
  let ayahId: number | null;
  let tafsirId: number | null;
  try {
    surahNumber = parseNullableInt(payload.surahNumber, 1, 114, "surahNumber");
    ayahId = parseNullableInt(payload.ayahId, 1, 6236, "ayahId");
    tafsirId = parseNullableInt(payload.tafsirId, 1, Number.MAX_SAFE_INTEGER, "tafsirId");
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Invalid reader filter payload.",
    }, { status: 400 });
  }

  if (!dbConfigured()) {
    return NextResponse.json({
      error: "Persistence unavailable: database is not configured. Reader filters cannot be saved.",
    }, { status: 503 });
  }

  let capabilities = await getCoreSchemaCapabilities({ refresh: true });
  if (!capabilities.hasQuranReaderFilterTable) {
    try {
      await ensureCoreSchemaCompatibility();
    } catch {
      // Continue and report the missing schema below.
    }
    capabilities = await getCoreSchemaCapabilities({ refresh: true });
  }

  if (!capabilities.hasQuranReaderFilterTable) {
    return NextResponse.json({
      error:
        "Persistence unavailable: reader filter storage is missing in the configured database schema. " +
        "Run DB migrations (or enable runtime schema patching) and retry.",
    }, { status: 503 });
  }

  const prefs = await saveQuranReaderFilterPrefs({
    clerkUserId: userId,
    view: payload.view as QuranReaderView,
    surahNumber,
    ayahId,
    showPhonetic: payload.showPhonetic,
    showTranslation: payload.showTranslation,
    showTafsir: payload.showTafsir,
    tafsirId,
  });

  if (!prefs) {
    return NextResponse.json({
      error: "Persistence unavailable: reader filters were not saved.",
    }, { status: 503 });
  }

  return NextResponse.json({ ok: true, prefs });
}
