import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getUserStreakSummary } from "@/hifzer/streak/server";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await getUserStreakSummary(userId);
    return NextResponse.json({
      ok: true,
      ...summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load streak summary.";
    Sentry.captureException(error, {
      tags: { route: "/api/streak/summary", method: "GET" },
      user: { id: userId },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
