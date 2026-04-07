import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requestAyahExplanation } from "@/hifzer/ai/server";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { getAyahById } from "@/hifzer/quran/lookup.server";
import {
  DEFAULT_QURAN_TRANSLATION_ID,
  getQuranTranslationOption,
  normalizeQuranTranslationId,
  QURAN_TRANSLATION_COOKIE,
} from "@/hifzer/quran/translation-prefs";
import { getQuranTranslationByAyahId } from "@/hifzer/quran/translation.server";
import { clerkEnabled } from "@/lib/clerk-config";

export const runtime = "nodejs";
export const maxDuration = 65;

type RequestShape = {
  ayahId?: unknown;
};

function parseAyahId(value: unknown): number | null {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function inferResponseLanguage(label: string | null): string {
  const language = label?.split(" - ")[0]?.trim();
  return language || "English";
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as RequestShape | null;
  const ayahId = parseAyahId(body?.ayahId);
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
  const translationOption = getQuranTranslationOption(translationId);
  const translation = getQuranTranslationByAyahId(ayahId, translationId);
  const verseKey = `${ayah.surahNumber}:${ayah.ayahNumber}`;

  const payload = await requestAyahExplanation({
    verseKey,
    surahNumber: ayah.surahNumber,
    ayahNumber: ayah.ayahNumber,
    arabicText: ayah.textUthmani,
    responseLanguage: inferResponseLanguage(translationOption?.label ?? null),
    localTranslation: translation && translationOption
      ? {
          text: translation,
          label: translationOption.label,
          sourceLabel: translationOption.sourceLabel,
          direction: translationOption.rtl ? "rtl" : "ltr",
        }
      : null,
  });

  if (!payload.ok) {
    return NextResponse.json(payload, {
      status: payload.status === "not_configured" ? 503 : payload.status === "timeout" ? 504 : 502,
    });
  }

  return NextResponse.json(payload);
}
