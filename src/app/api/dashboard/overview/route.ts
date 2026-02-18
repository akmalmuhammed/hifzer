import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getDashboardOverview } from "@/hifzer/dashboard/server";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const overview = await getDashboardOverview(userId);
    if (!overview) {
      return NextResponse.json({ error: "Database not configured." }, { status: 503 });
    }
    return NextResponse.json({
      ok: true,
      overview,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load dashboard overview.";
    Sentry.captureException(error, {
      tags: {
        route: "/api/dashboard/overview",
        method: "GET",
      },
      user: { id: userId },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
