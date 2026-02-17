import { auth } from "@clerk/nextjs/server";
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
    const message = error instanceof Error ? error.message : "Failed to start session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

