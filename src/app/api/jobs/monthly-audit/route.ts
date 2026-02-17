import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { runMonthlyAuditForUser } from "@/hifzer/engine/server";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runMonthlyAuditForUser(userId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Monthly audit failed.";
    Sentry.captureException(error, {
      tags: { route: "/api/jobs/monthly-audit", method: "POST" },
      user: { id: userId },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
