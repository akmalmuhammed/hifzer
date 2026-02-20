import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getSurahInfo } from "@/hifzer/quran/lookup";
import { getOrCreateUserProfile, saveQuranStartPoint, saveStartPoint } from "@/hifzer/profile/server";
import { recordQuranBrowseAyahRead } from "@/hifzer/quran/read-progress.server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type Payload = {
  surahNumber?: unknown;
  ayahNumber?: unknown;
  cursorAyahId?: unknown;
  source?: unknown;
  resetOpenSession?: unknown;
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

async function fallbackUpdateStartPoint(input: {
  profileId: string;
  quranSource: boolean;
  surahNumber: number;
  expectedAyahId: number;
}): Promise<void> {
  if (input.quranSource) {
    try {
      await db().userProfile.updateMany({
        where: { id: input.profileId },
        data: {
          quranActiveSurahNumber: input.surahNumber,
          quranCursorAyahId: input.expectedAyahId,
        },
      });
      return;
    } catch (error) {
      if (!looksLikeMissingCoreSchema(error)) {
        throw error;
      }
    }
  }

  await db().userProfile.updateMany({
    where: { id: input.profileId },
    data: {
      activeSurahNumber: input.surahNumber,
      cursorAyahId: input.expectedAyahId,
    },
  });
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

  const surahNumber = Number(payload.surahNumber);
  const ayahNumber = Number(payload.ayahNumber);
  const cursorAyahIdRaw = payload.cursorAyahId;
  const cursorAyahId = cursorAyahIdRaw == null ? null : Number(cursorAyahIdRaw);
  const source = typeof payload.source === "string" ? payload.source : null;
  const resetOpenSession = payload.resetOpenSession === true;
  const quranSource = source === "quran_read";

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

  try {
    const fullProfile = await getOrCreateUserProfile(userId);
    if (!fullProfile) {
      return NextResponse.json({ error: "Database not configured." }, { status: 503 });
    }

    const previousSurahNumber = fullProfile.activeSurahNumber;
    const previousCursorAyahId = fullProfile.cursorAyahId;
    const previousQuranSurahNumber = fullProfile.quranActiveSurahNumber;
    const previousQuranCursorAyahId = fullProfile.quranCursorAyahId;

    let profile;
    try {
      profile = quranSource
        ? await saveQuranStartPoint(userId, surahNumber, expectedAyahId)
        : await saveStartPoint(userId, surahNumber, expectedAyahId);
    } catch (error) {
      if (!looksLikeMissingCoreSchema(error)) {
        throw error;
      }
      await fallbackUpdateStartPoint({
        profileId: fullProfile.id,
        quranSource,
        surahNumber,
        expectedAyahId,
      });
      profile = await getOrCreateUserProfile(userId);
    }

    let abandonedOpenSessions = 0;
    if (!quranSource && resetOpenSession) {
      try {
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
      } catch (error) {
        if (!looksLikeMissingCoreSchema(error)) {
          throw error;
        }
        abandonedOpenSessions = 0;
      }
    }

    if (source === "quran_read") {
      try {
        await recordQuranBrowseAyahRead({
          profileId: fullProfile.id,
          mode: fullProfile.mode,
          timezone: fullProfile.timezone,
          ayahId: expectedAyahId,
        });
      } catch (error) {
        if (!looksLikeMissingCoreSchema(error)) {
          throw error;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      profile,
      abandonedOpenSessions,
      previousHifzLane: {
        surahNumber: previousSurahNumber,
        cursorAyahId: previousCursorAyahId,
      },
      previousQuranLane: {
        surahNumber: previousQuranSurahNumber,
        cursorAyahId: previousQuranCursorAyahId,
      },
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "/api/profile/start-point", method: "POST" },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to update start point." }, { status: 500 });
  }
}
