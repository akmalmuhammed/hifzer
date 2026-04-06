import { NextResponse } from "next/server";
import {
  getQuranFoundationAyahEnrichment,
  getQuranFoundationContentCatalog,
} from "@/hifzer/quran-foundation/content";
import { getAyahById } from "@/hifzer/quran/lookup.server";

export const runtime = "nodejs";

function parseAyahId(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseOptionalPositiveInt(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseTafsirIds(value: string | null): number[] {
  if (!value) {
    return [];
  }
  return Array.from(
    new Set(
      value
        .split(",")
        .map((entry) => parseOptionalPositiveInt(entry))
        .filter((entry): entry is number => entry != null),
    ),
  );
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
  const translationId = parseOptionalPositiveInt(url.searchParams.get("translationId"));
  const tafsirIds = parseTafsirIds(url.searchParams.get("tafsirIds"));
  const [catalog, content] = await Promise.all([
    getQuranFoundationContentCatalog(),
    getQuranFoundationAyahEnrichment(verseKey, { translationId, tafsirIds }),
  ]);
  return NextResponse.json({
    ok: true,
    provider: "quran_foundation",
    verseKey,
    catalog,
    content,
  });
}
