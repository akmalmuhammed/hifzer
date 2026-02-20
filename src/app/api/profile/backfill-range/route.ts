import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getAyahById, getSurahInfo } from "@/hifzer/quran/lookup";
import { getOrCreateUserProfile, saveQuranStartPoint } from "@/hifzer/profile/server";
import { recordQuranBrowseAyahRangeRead } from "@/hifzer/quran/read-progress.server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type Payload = {
  surahNumber?: unknown;
  fromAyahNumber?: unknown;
  toAyahNumber?: unknown;
};

function looksLikeMissingCoreSchema(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("P2021") ||
    message.includes("P2022") ||
    /column .* does not exist/i.test(message) ||
    /relation .* does not exist/i.test(message)
  );
}

async function fallbackUpdateQuranStartPoint(input: {
  profileId: string;
  quranActiveSurahNumber: number;
  updatedCursorAyahId: number;
}): Promise<boolean> {
  try {
    await db().userProfile.updateMany({
      where: { id: input.profileId },
      data: {
        quranActiveSurahNumber: input.quranActiveSurahNumber,
        quranCursorAyahId: input.updatedCursorAyahId,
      },
    });
    return true;
  } catch (error) {
    if (!looksLikeMissingCoreSchema(error)) {
      throw error;
    }
  }
  return false;
}

function parsePositiveInt(value: unknown): number | null {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) {
    return null;
  }
  return n;
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
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const surahNumber = parsePositiveInt(payload.surahNumber);
  const fromAyahNumber = parsePositiveInt(payload.fromAyahNumber);
  const toAyahNumber = parsePositiveInt(payload.toAyahNumber);
  if (!surahNumber || !fromAyahNumber || !toAyahNumber) {
    return NextResponse.json(
      { error: "surahNumber, fromAyahNumber, and toAyahNumber are required positive integers." },
      { status: 400 },
    );
  }

  const surah = getSurahInfo(surahNumber);
  if (!surah) {
    return NextResponse.json({ error: "Surah not found." }, { status: 404 });
  }
  if (fromAyahNumber > surah.ayahCount || toAyahNumber > surah.ayahCount) {
    return NextResponse.json(
      { error: `Ayah range is outside Surah ${surah.surahNumber} (1-${surah.ayahCount}).` },
      { status: 400 },
    );
  }
  if (fromAyahNumber > toAyahNumber) {
    return NextResponse.json({ error: "fromAyahNumber cannot be greater than toAyahNumber." }, { status: 400 });
  }

  const rangeStartAyahId = surah.startAyahId + (fromAyahNumber - 1);
  const rangeEndAyahId = surah.startAyahId + (toAyahNumber - 1);
  const ayahIds = Array.from(
    { length: rangeEndAyahId - rangeStartAyahId + 1 },
    (_, index) => rangeStartAyahId + index,
  );

  try {
    const profile = await getOrCreateUserProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: "Database not configured." }, { status: 503 });
    }

    let tracking = {
      recordedAyahCount: 0,
      alreadyTrackedAyahCount: 0,
      localDate: null as string | null,
    };
    let trackingUnavailable = false;
    try {
      tracking = await recordQuranBrowseAyahRangeRead({
        profileId: profile.id,
        mode: profile.mode,
        timezone: profile.timezone,
        ayahIds,
      });
    } catch (error) {
      if (!looksLikeMissingCoreSchema(error)) {
        throw error;
      }
      trackingUnavailable = true;
    }

    const previousCursorAyahId = profile.quranCursorAyahId;
    const updatedCursorAyahId = Math.max(previousCursorAyahId, rangeEndAyahId);
    const updatedAyah = getAyahById(updatedCursorAyahId);
    const quranActiveSurahNumber = updatedAyah?.surahNumber ?? profile.quranActiveSurahNumber;

    let updatedProfile;
    let quranLanePersisted = true;
    try {
      updatedProfile = await saveQuranStartPoint(userId, quranActiveSurahNumber, updatedCursorAyahId);
    } catch (error) {
      if (!looksLikeMissingCoreSchema(error)) {
        throw error;
      }
      quranLanePersisted = await fallbackUpdateQuranStartPoint({
        profileId: profile.id,
        quranActiveSurahNumber,
        updatedCursorAyahId,
      });
      updatedProfile = await getOrCreateUserProfile(userId);
    }

    return NextResponse.json({
      ok: true,
      movedCursor: updatedCursorAyahId > previousCursorAyahId,
      previousCursorAyahId,
      updatedCursorAyahId,
      quranActiveSurahNumber,
      tracking: {
        recordedAyahCount: tracking.recordedAyahCount,
        alreadyTrackedAyahCount: tracking.alreadyTrackedAyahCount,
        totalAyahCount: ayahIds.length,
        unavailable: trackingUnavailable,
        quranLanePersisted,
      },
      range: {
        surahNumber,
        fromAyahNumber,
        toAyahNumber,
        rangeStartAyahId,
        rangeEndAyahId,
        ayahCount: toAyahNumber - fromAyahNumber + 1,
      },
      profile: updatedProfile,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "/api/profile/backfill-range", method: "POST" },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to backfill Qur'an range." }, { status: 500 });
  }
}
