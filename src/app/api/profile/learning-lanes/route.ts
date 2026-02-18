import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { listLearningLanes } from "@/hifzer/profile/server";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const lanes = await listLearningLanes(userId, 10);
    return NextResponse.json({ ok: true, lanes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load learning lanes.";
    Sentry.captureException(error, {
      tags: {
        route: "/api/profile/learning-lanes",
        method: "GET",
      },
      user: { id: userId },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
