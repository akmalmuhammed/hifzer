import { NextResponse } from "next/server";
import { getQuranFoundationAyahAudioSource } from "@/hifzer/quran-foundation/content";
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
  const reciterId = url.searchParams.get("reciterId");

  if (!ayahId) {
    return NextResponse.json({ error: "ayahId must be a positive integer." }, { status: 400 });
  }
  if (!reciterId) {
    return NextResponse.json({ error: "reciterId is required." }, { status: 400 });
  }

  const ayah = getAyahById(ayahId);
  if (!ayah) {
    return NextResponse.json({ error: "Ayah not found." }, { status: 404 });
  }

  const audio = await getQuranFoundationAyahAudioSource({
    verseKey: `${ayah.surahNumber}:${ayah.ayahNumber}`,
    surahNumber: ayah.surahNumber,
    reciterId,
  });

  return NextResponse.json({
    ok: audio.status === "available",
    provider: "quran_foundation",
    audio,
  });
}
