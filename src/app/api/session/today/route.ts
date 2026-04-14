import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { loadTodayState } from "@/hifzer/engine/server";
import { resolveAuditNowFromRequestHeader } from "@/hifzer/testing/request-now";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auditNow = resolveAuditNowFromRequestHeader(request);

  try {
    const { profile, state, steps } = await loadTodayState(userId, { now: auditNow });
    return NextResponse.json({
      ok: true,
      localDate: state.localDate,
      profile: {
        activeSurahNumber: profile.activeSurahNumber,
        cursorAyahId: profile.cursorAyahId,
        dailyMinutes: profile.dailyMinutes,
      },
      state,
      previewSteps: steps,
      monthlyAdjustmentMessage: profile.rebalanceUntil && profile.rebalanceUntil.getTime() > Date.now()
        ? "Plan adjusted to protect retention."
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Profile could not be loaded (DB not configured or new user whose profile creation failed).
    // Signal the client to go to onboarding instead of showing a generic error.
    if (message === "Database not configured.") {
      return NextResponse.json({ error: "onboarding_required" }, { status: 403 });
    }
    Sentry.captureException(error, {
      tags: { route: "/api/session/today", method: "GET" },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to build today state." }, { status: 500 });
  }
}
