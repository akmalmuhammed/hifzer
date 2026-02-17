import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const profile = await getOrCreateUserProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: "Database not configured." }, { status: 503 });
    }

    const prisma = db();
    const rows = await prisma.weakTransition.findMany({
      where: { userId: profile.id },
      orderBy: [{ successRateCached: "asc" }, { lastOccurredAt: "desc" }],
      take: 120,
    });

    const data = rows.map((row) => ({
      id: row.id,
      fromAyahId: row.fromAyahId,
      toAyahId: row.toAyahId,
      attemptCount: row.attemptCount,
      successCount: row.successCount,
      failCount: row.failCount,
      successRate: row.attemptCount ? (row.successCount / row.attemptCount) : 0,
      nextRepairAt: row.nextRepairAt?.toISOString() ?? null,
      lastGrade: row.lastGrade,
      weak: row.attemptCount >= 3 && ((row.successCount / row.attemptCount) < 0.7),
      lastOccurredAt: row.lastOccurredAt.toISOString(),
    }));

    return NextResponse.json({ ok: true, transitions: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load transitions.";
    Sentry.captureException(error, {
      tags: { route: "/api/progress/transitions", method: "GET" },
      user: { id: userId },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
