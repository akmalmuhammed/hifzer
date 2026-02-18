import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSurahInfo } from "@/hifzer/quran/lookup";
import { getOrCreateUserProfile, saveStartPoint } from "@/hifzer/profile/server";
import { recordQuranBrowseAyahRead } from "@/hifzer/quran/read-progress.server";
import { db } from "@/lib/db";

type Payload = {
  surahNumber?: unknown;
  ayahNumber?: unknown;
  cursorAyahId?: unknown;
  source?: unknown;
  resetOpenSession?: unknown;
};

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

  const surahNumber = Number(payload.surahNumber);
  const ayahNumber = Number(payload.ayahNumber);
  const cursorAyahIdRaw = payload.cursorAyahId;
  const cursorAyahId = cursorAyahIdRaw == null ? null : Number(cursorAyahIdRaw);
  const source = typeof payload.source === "string" ? payload.source : null;
  const resetOpenSession = payload.resetOpenSession === true;

  if (!Number.isFinite(surahNumber) || !Number.isFinite(ayahNumber)) {
    return NextResponse.json({ error: "surahNumber and ayahNumber are required" }, { status: 400 });
  }

  if (cursorAyahIdRaw != null && !Number.isFinite(cursorAyahId)) {
    return NextResponse.json({ error: "cursorAyahId must be numeric when provided" }, { status: 400 });
  }

  const surah = getSurahInfo(surahNumber);
  if (!surah) {
    return NextResponse.json({ error: "Surah not found" }, { status: 404 });
  }

  if (ayahNumber < 1 || ayahNumber > surah.ayahCount) {
    return NextResponse.json({ error: "Ayah out of range for this surah" }, { status: 400 });
  }

  const expectedAyahId = surah.startAyahId + (ayahNumber - 1);
  if (cursorAyahId != null && Number.isFinite(cursorAyahId) && expectedAyahId !== cursorAyahId) {
    return NextResponse.json({ error: "cursorAyahId does not match surah+ayah" }, { status: 400 });
  }

  const fullProfile = await getOrCreateUserProfile(userId);
  if (!fullProfile) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const previousSurahNumber = fullProfile.activeSurahNumber;
  const previousCursorAyahId = fullProfile.cursorAyahId;

  if (source === "session_switch" || resetOpenSession) {
    await recordQuranBrowseAyahRead({
      profileId: fullProfile.id,
      mode: fullProfile.mode,
      timezone: fullProfile.timezone,
      ayahId: previousCursorAyahId,
    });
  }

  const profile = await saveStartPoint(userId, surahNumber, expectedAyahId);
  let abandonedOpenSessions = 0;

  if (resetOpenSession) {
    const abandoned = await db().session.updateMany({
      where: {
        userId: fullProfile.id,
        status: "OPEN",
      },
      data: {
        status: "ABANDONED",
        endedAt: new Date(),
      },
    });
    abandonedOpenSessions = abandoned.count;
  }

  if (source === "quran_read") {
    await recordQuranBrowseAyahRead({
      profileId: fullProfile.id,
      mode: fullProfile.mode,
      timezone: fullProfile.timezone,
      ayahId: expectedAyahId,
    });
  }

  return NextResponse.json({
    ok: true,
    profile,
    abandonedOpenSessions,
    previousLane: {
      surahNumber: previousSurahNumber,
      cursorAyahId: previousCursorAyahId,
    },
  });
}
