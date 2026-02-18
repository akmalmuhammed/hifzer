import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSurahInfo } from "@/hifzer/quran/lookup";
import { getOrCreateUserProfile, saveStartPoint } from "@/hifzer/profile/server";
import { recordQuranBrowseAyahRead } from "@/hifzer/quran/read-progress.server";

type Payload = {
  surahNumber?: unknown;
  ayahNumber?: unknown;
  cursorAyahId?: unknown;
  source?: unknown;
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
  const cursorAyahId = Number(payload.cursorAyahId);
  const source = typeof payload.source === "string" ? payload.source : null;

  if (!Number.isFinite(surahNumber) || !Number.isFinite(ayahNumber) || !Number.isFinite(cursorAyahId)) {
    return NextResponse.json({ error: "surahNumber, ayahNumber, and cursorAyahId are required" }, { status: 400 });
  }

  const surah = getSurahInfo(surahNumber);
  if (!surah) {
    return NextResponse.json({ error: "Surah not found" }, { status: 404 });
  }

  if (ayahNumber < 1 || ayahNumber > surah.ayahCount) {
    return NextResponse.json({ error: "Ayah out of range for this surah" }, { status: 400 });
  }

  const expectedAyahId = surah.startAyahId + (ayahNumber - 1);
  if (expectedAyahId !== cursorAyahId) {
    return NextResponse.json({ error: "cursorAyahId does not match surah+ayah" }, { status: 400 });
  }

  const profile = await saveStartPoint(userId, surahNumber, cursorAyahId);
  if (source === "quran_read") {
    const fullProfile = await getOrCreateUserProfile(userId);
    if (fullProfile) {
      await recordQuranBrowseAyahRead({
        profileId: fullProfile.id,
        mode: fullProfile.mode,
        timezone: fullProfile.timezone,
        ayahId: cursorAyahId,
      });
    }
  }

  return NextResponse.json({ ok: true, profile });
}
