import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { listLearningLanes } from "@/hifzer/profile/server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";

export const runtime = "nodejs";

export async function GET() {
  const userId = await resolveClerkUserIdForServer();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const lanes = await listLearningLanes(userId, 10);
    return NextResponse.json({ ok: true, lanes });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        route: "/api/profile/learning-lanes",
        method: "GET",
      },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to load learning lanes." }, { status: 500 });
  }
}
