import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { recordBrowseAyahRecitation } from "@/hifzer/streak/server";

type Payload = {
  ayahId?: unknown;
  source?: unknown;
};

export const runtime = "nodejs";

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

  const ayahId = Number(payload.ayahId);
  const source = String(payload.source ?? "quran_browse");
  if (!Number.isFinite(ayahId) || ayahId <= 0) {
    return NextResponse.json({ error: "ayahId must be a positive number." }, { status: 400 });
  }
  if (source !== "quran_browse") {
    return NextResponse.json({ error: "Unsupported source." }, { status: 400 });
  }

  try {
    const result = await recordBrowseAyahRecitation(userId, Math.floor(ayahId));
    return NextResponse.json(result);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "/api/streak/recite", method: "POST" },
      user: { id: userId },
      extra: { ayahId: Math.floor(ayahId), source },
    });
    return NextResponse.json({ error: "Failed to record recitation." }, { status: 500 });
  }
}
