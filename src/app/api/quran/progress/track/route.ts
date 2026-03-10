import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { recordQuranBrowseAyahSet } from "@/hifzer/quran/read-progress.server";

type Payload = {
  ayahIds?: unknown;
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

    return NextResponse.json({
      ok: true,
      trackedAyahCount: ayahIds.length,
      recordedAyahCount: result.recordedAyahCount,
      alreadyTrackedAyahCount: result.alreadyTrackedAyahCount,
      localDate: result.localDate,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "/api/quran/progress/track", method: "POST" },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to track Qur'an progress." }, { status: 500 });
  }
}
