import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { startTodaySession } from "@/hifzer/engine/server";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await startTodaySession(userId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "/api/session/start", method: "POST" },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to start session." }, { status: 500 });
  }
}
