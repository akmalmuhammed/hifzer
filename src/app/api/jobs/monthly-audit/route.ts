import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { runMonthlyAuditForUser } from "@/hifzer/engine/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // SECURITY: Rate-lock to once per calendar month to prevent SRS gaming
  // (users repeatedly triggering the monthly rebalancer to manipulate their schedule).
  const profile = await getOrCreateUserProfile(userId);
  if (profile) {
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const existingAudit = await db().qualityGateRun.findFirst({
      where: {
        userId: profile.id,
        gateType: "MONTHLY",
        createdAt: { gte: startOfMonth },
      },
      select: { createdAt: true },
    });
    if (existingAudit) {
      return NextResponse.json(
        { error: "Monthly audit has already been run this calendar month." },
        { status: 429 },
      );
    }
  }

  try {
    const result = await runMonthlyAuditForUser(userId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "/api/jobs/monthly-audit", method: "POST" },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Monthly audit failed." }, { status: 500 });
  }
}

