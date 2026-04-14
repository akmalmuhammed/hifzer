import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getAyahById } from "@/hifzer/quran/lookup.server";
import { getOrCreateUserProfile, saveQuranStartPoint } from "@/hifzer/profile/server";
import { syncQuranReadingContinuityToQuranFoundation } from "@/hifzer/quran-foundation/user-features";
import { recordQuranBrowseAyahSet } from "@/hifzer/quran/read-progress.server";

type Payload = {
  ayahIds?: unknown;
  latestAyahId?: unknown;
  latestSurahNumber?: unknown;
  latestAyahNumber?: unknown;
};

export const runtime = "nodejs";

function parseAyahIds(raw: unknown): number[] | null {
  if (!Array.isArray(raw)) {
    return null;
  }
  const ayahIds = raw
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .map((value) => Math.floor(value));
  if (ayahIds.length < 1) {
    return null;
  }
  return Array.from(new Set(ayahIds));
}

function parseLatestCursor(raw: Payload, ayahIds: number[]): {
  ayahId: number;
  surahNumber: number;
  ayahNumber: number;
} | null {
  if (raw.latestAyahId == null && raw.latestSurahNumber == null && raw.latestAyahNumber == null) {
    return null;
  }

  const latestAyahId = Math.floor(Number(raw.latestAyahId));
  const latestSurahNumber = Math.floor(Number(raw.latestSurahNumber));
  const latestAyahNumber = Math.floor(Number(raw.latestAyahNumber));
  if (!Number.isFinite(latestAyahId) || !Number.isFinite(latestSurahNumber) || !Number.isFinite(latestAyahNumber)) {
    throw new Error("latest cursor payload must include numeric latestAyahId, latestSurahNumber, and latestAyahNumber.");
  }
  if (!ayahIds.includes(latestAyahId)) {
    throw new Error("latestAyahId must be included in ayahIds.");
  }

  const ayah = getAyahById(latestAyahId);
  if (!ayah) {
    throw new Error("latestAyahId is out of range.");
  }
  if (ayah.surahNumber !== latestSurahNumber || ayah.ayahNumber !== latestAyahNumber) {
    throw new Error("latest cursor payload does not match the referenced ayah.");
  }

  return {
    ayahId: latestAyahId,
    surahNumber: latestSurahNumber,
    ayahNumber: latestAyahNumber,
  };
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

  const ayahIds = parseAyahIds(payload.ayahIds);
  if (!ayahIds) {
    return NextResponse.json({ error: "ayahIds must be a non-empty array of positive numbers." }, { status: 400 });
  }

  let latestCursor;
  try {
    latestCursor = parseLatestCursor(payload, ayahIds);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid latest cursor payload." }, { status: 400 });
  }

  try {
    const profile = await getOrCreateUserProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: "Database not configured." }, { status: 503 });
    }

    const result = await recordQuranBrowseAyahSet({
      profileId: profile.id,
      timezone: profile.timezone,
      ayahIds,
      source: "READER_VIEW",
    });

    const updatedProfile = latestCursor
      ? await saveQuranStartPoint(userId, latestCursor.surahNumber, latestCursor.ayahId)
      : null;

    const latestAyah = latestCursor ?? getAyahById(ayahIds[ayahIds.length - 1]);
    if (latestAyah) {
      await syncQuranReadingContinuityToQuranFoundation({
        clerkUserId: userId,
        ayahIds,
        latestSurahNumber: latestAyah.surahNumber,
        latestAyahNumber: latestAyah.ayahNumber,
        localDate: result.localDate,
        timezone: profile.timezone,
      }).catch(() => null);
    }

    return NextResponse.json({
      ok: true,
      trackedAyahCount: ayahIds.length,
      recordedAyahCount: result.recordedAyahCount,
      alreadyTrackedAyahCount: result.alreadyTrackedAyahCount,
      localDate: result.localDate,
      cursorAyahId: updatedProfile?.quranCursorAyahId ?? null,
      cursorSurahNumber: updatedProfile?.quranActiveSurahNumber ?? null,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "/api/quran/progress/track", method: "POST" },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to track Qur'an progress." }, { status: 500 });
  }
}
