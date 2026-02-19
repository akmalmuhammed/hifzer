import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { db } from "@/lib/db";

type GradeCounts = Record<"AGAIN" | "HARD" | "GOOD" | "EASY", number>;

function emptyGrades(): GradeCounts {
  return { AGAIN: 0, HARD: 0, GOOD: 0, EASY: 0 };
}

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
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    const [reviews, dueCount, recentEvents, recentSessions] = await Promise.all([
      prisma.ayahReview.findMany({
        where: { userId: profile.id },
        select: { station: true },
      }),
      prisma.ayahReview.count({
        where: { userId: profile.id, nextReviewAt: { lte: now } },
      }),
      prisma.reviewEvent.findMany({
        where: {
          userId: profile.id,
          createdAt: { gte: sevenDaysAgo },
          grade: { not: null },
        },
        select: { grade: true, durationSec: true },
      }),
      prisma.session.findMany({
        where: { userId: profile.id, status: "COMPLETED" },
        orderBy: { startedAt: "desc" },
        take: 10,
        select: {
          id: true,
          localDate: true,
          startedAt: true,
          endedAt: true,
          mode: true,
          warmupPassed: true,
          weeklyGatePassed: true,
        },
      }),
    ]);

    const gradeCounts = emptyGrades();
    let totalDurationSec = 0;
    let durationCount = 0;
    for (const event of recentEvents) {
      if (event.grade) {
        gradeCounts[event.grade] += 1;
      }
      if (event.durationSec > 0) {
        totalDurationSec += event.durationSec;
        durationCount += 1;
      }
    }

    const stationCounts: Record<number, number> = {};
    let stationTotal = 0;
    for (const row of reviews) {
      stationCounts[row.station] = (stationCounts[row.station] ?? 0) + 1;
      stationTotal += row.station;
    }
    const avgStation = reviews.length ? (stationTotal / reviews.length) : 0;

    return NextResponse.json({
      ok: true,
      stats: {
        trackedAyahs: reviews.length,
        dueNow: dueCount,
        avgStation,
        gradeCounts,
        avgDurationSec: durationCount ? Math.round(totalDurationSec / durationCount) : 0,
      },
      recentSessions,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "/api/progress/summary", method: "GET" },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to load progress summary." }, { status: 500 });
  }
}
