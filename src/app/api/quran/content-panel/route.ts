import { NextResponse } from "next/server";
import { getQuranFoundationAyahEnrichment } from "@/hifzer/quran-foundation/content";
import { getAyahById } from "@/hifzer/quran/lookup.server";

export const runtime = "nodejs";

function parseAyahId(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ayahId = parseAyahId(url.searchParams.get("ayahId"));
  if (!ayahId) {
    return NextResponse.json({ error: "ayahId must be a positive integer." }, { status: 400 });
  }

  const ayah = getAyahById(ayahId);
  if (!ayah) {
    return NextResponse.json({ error: "Ayah not found." }, { status: 404 });
  }

  const verseKey = `${ayah.surahNumber}:${ayah.ayahNumber}` as const;
  const content = await getQuranFoundationAyahEnrichment(verseKey);
  return NextResponse.json({
    ok: true,
    provider: "quran_foundation",
    verseKey,
    content,
  });
}
