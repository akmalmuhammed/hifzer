import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAyahById, getSurahInfo } from "@/hifzer/quran/lookup";
import { getOrCreateUserProfile, saveStartPoint } from "@/hifzer/profile/server";
import { recordQuranBrowseAyahRangeRead } from "@/hifzer/quran/read-progress.server";

export const runtime = "nodejs";

type Payload = {
  surahNumber?: unknown;
  fromAyahNumber?: unknown;
  toAyahNumber?: unknown;
};

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

  const profile = await getOrCreateUserProfile(userId);
  if (!profile) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const tracking = await recordQuranBrowseAyahRangeRead({
    profileId: profile.id,
    mode: profile.mode,
    timezone: profile.timezone,
    ayahIds,
  });

  const previousCursorAyahId = profile.cursorAyahId;
  const updatedCursorAyahId = Math.max(previousCursorAyahId, rangeEndAyahId);
  const updatedAyah = getAyahById(updatedCursorAyahId);
  const activeSurahNumber = updatedAyah?.surahNumber ?? profile.activeSurahNumber;

  const updatedProfile = await saveStartPoint(userId, activeSurahNumber, updatedCursorAyahId);

  return NextResponse.json({
    ok: true,
    movedCursor: updatedCursorAyahId > previousCursorAyahId,
    previousCursorAyahId,
    updatedCursorAyahId,
    activeSurahNumber,
    tracking: {
      recordedAyahCount: tracking.recordedAyahCount,
      alreadyTrackedAyahCount: tracking.alreadyTrackedAyahCount,
      totalAyahCount: ayahIds.length,
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
}
