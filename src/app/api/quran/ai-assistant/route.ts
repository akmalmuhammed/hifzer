import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requestQuranAssistant } from "@/hifzer/ai/server";
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
  query?: unknown;
  ayahId?: unknown;
};

function parseAyahId(value: unknown): number | null {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeQuery(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length < 3) {
    return null;
  }
  return trimmed.slice(0, 280);
}

function inferResponseLanguage(label: string | null): string {
  const language = label?.split(" - ")[0]?.trim();
  return language || "English";
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as RequestShape | null;
  const query = normalizeQuery(body?.query);
  if (!query) {
    return NextResponse.json({ error: "query must be at least 3 characters." }, { status: 400 });
  }

  const ayahId = parseAyahId(body?.ayahId);
  const currentAyah = ayahId ? getAyahById(ayahId) : null;

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

  const payload = await requestQuranAssistant({
    query,
    responseLanguage: inferResponseLanguage(translationOption?.label ?? null),
    currentAyah: currentAyah
      ? {
          verseKey: `${currentAyah.surahNumber}:${currentAyah.ayahNumber}`,
          surahNumber: currentAyah.surahNumber,
          ayahNumber: currentAyah.ayahNumber,
          arabicText: currentAyah.textUthmani,
          localTranslation: (() => {
            if (!translationOption) {
              return null;
            }
            const text = getQuranTranslationByAyahId(currentAyah.id, translationId);
            if (!text) {
              return null;
            }
            return {
              text,
              label: translationOption.label,
              sourceLabel: translationOption.sourceLabel,
              direction: translationOption.rtl ? "rtl" : "ltr",
            };
          })(),
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
