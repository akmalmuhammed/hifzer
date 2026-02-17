import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { loadTodayState } from "@/hifzer/engine/server";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { profile, state, steps } = await loadTodayState(userId);
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
    const message = error instanceof Error ? error.message : "Failed to build today state.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

