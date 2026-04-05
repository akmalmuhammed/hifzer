import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { getAyahById, getSurahInfo } from "@/hifzer/quran/lookup.server";
import {
  DEFAULT_QURAN_TRANSLATION_ID,
  normalizeQuranTranslationId,
  QURAN_TRANSLATION_COOKIE,
} from "@/hifzer/quran/translation-prefs";
import { getQuranTranslationByAyahId } from "@/hifzer/quran/translation.server";
import { clerkEnabled } from "@/lib/clerk-config";

function parseAyahId(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
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

  const authEnabled = clerkEnabled();
  const userId = authEnabled ? (await auth()).userId : null;
  const profile = userId ? await getProfileSnapshot(userId) : null;
  const cookieStore = await cookies();
  const translationId = normalizeQuranTranslationId(
    cookieStore.get(QURAN_TRANSLATION_COOKIE)?.value ??
      profile?.quranTranslationId ??
      DEFAULT_QURAN_TRANSLATION_ID,
  );
  const surah = getSurahInfo(ayah.surahNumber);

  return NextResponse.json({
    ok: true,
    ayah: {
      id: ayah.id,
      surahNumber: ayah.surahNumber,
      ayahNumber: ayah.ayahNumber,
      textUthmani: ayah.textUthmani,
      translation: getQuranTranslationByAyahId(ayah.id, translationId),
      surahNameArabic: surah?.nameArabic ?? "",
      surahNameTransliteration: surah?.nameTransliteration ?? "",
    },
  });
}
