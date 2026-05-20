import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";
import { clerkEnabled } from "@/lib/clerk-config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = clerkEnabled() ? await resolveClerkUserIdForServer(request) : null;
  if (!userId) {
    return clerkEnabled()
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.json({ ok: true, profile: null });
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
