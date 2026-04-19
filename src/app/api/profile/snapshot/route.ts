import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await resolveClerkUserIdForServer(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await getProfileSnapshot(userId);
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        route: "/api/profile/snapshot",
        method: "GET",
      },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to load profile snapshot." }, { status: 500 });
  }
}
