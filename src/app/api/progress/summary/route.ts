import type { AttemptStage } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { addIsoDaysUtc } from "@/hifzer/derived/dates";
import { isoDateInTimeZone } from "@/hifzer/engine/date";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { getAyahById, getSurahInfo } from "@/hifzer/quran/lookup.server";
import {
  QURAN_BROWSE_MARKER_DURATION_SEC,
  QURAN_BROWSE_MARKER_PHASE,
  QURAN_BROWSE_MARKER_STAGE,
  getQuranReadProgress,
} from "@/hifzer/quran/read-progress.server";
import { db } from "@/lib/db";

const TOTAL_AYAHS = 6236;
const TOTAL_SURAHS = 114;
const TOTAL_JUZ = 30;
const MAX_SESSION_MINUTES_BUCKET = 240;
const HIFZ_GRADED_STAGES: AttemptStage[] = ["WARMUP", "REVIEW", "NEW", "LINK", "WEEKLY_TEST", "LINK_REPAIR"];

type GradeCounts = Record<"AGAIN" | "HARD" | "GOOD" | "EASY", number>;

function emptyGrades(): GradeCounts {
  return { AGAIN: 0, HARD: 0, GOOD: 0, EASY: 0 };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sessionDurationMinutes(startedAt: Date, endedAt: Date | null): number {
  if (!endedAt) {
    return 0;
  }
  const raw = (endedAt.getTime() - startedAt.getTime()) / 60000;
  if (!Number.isFinite(raw) || raw <= 0) {
    return 0;
  }
  return clamp(raw, 0, MAX_SESSION_MINUTES_BUCKET);
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
    const todayLocalDate = isoDateInTimeZone(now, profile.timezone);
    const start7d = addIsoDaysUtc(todayLocalDate, -6);
    const start14d = addIsoDaysUtc(todayLocalDate, -13);
    const start30d = addIsoDaysUtc(todayLocalDate, -29);

    const quranMarkerWhere = {
      userId: profile.id,
      stage: QURAN_BROWSE_MARKER_STAGE,
      phase: QURAN_BROWSE_MARKER_PHASE,
      grade: null,
      durationSec: QURAN_BROWSE_MARKER_DURATION_SEC,
      fromAyahId: { not: null },
      toAyahId: { not: null },
    };

    const [
      sessions30dRaw,
      recentSessionsRaw,
      gradedEvents14d,
      dueNow,
      trackedAyahs,
      quranReadProgress,
      quranDistinctAyahs,
    ] = await Promise.all([
      prisma.session.findMany({
        where: {
          userId: profile.id,
          status: "COMPLETED",
          localDate: {
            gte: start30d,
            lte: todayLocalDate,
          },
        },
        select: {
          localDate: true,
          startedAt: true,
          endedAt: true,
          _count: {
            select: {
              attempts: true,
            },
          },
        },
      }),
      prisma.session.findMany({
        where: {
          userId: profile.id,
          status: "COMPLETED",
        },
        orderBy: { startedAt: "desc" },
        take: 20,
        select: {
          id: true,
          localDate: true,
          startedAt: true,
          endedAt: true,
          mode: true,
          warmupPassed: true,
          weeklyGatePassed: true,
          _count: {
            select: {
              attempts: true,
            },
          },
        },
      }),
      prisma.reviewEvent.findMany({
        where: {
          userId: profile.id,
          stage: { in: HIFZ_GRADED_STAGES },
          grade: { not: null },
          session: {
            localDate: {
              gte: start14d,
              lte: todayLocalDate,
            },
          },
        },
        select: {
          grade: true,
          durationSec: true,
          session: {
            select: {
              localDate: true,
            },
          },
        },
      }),
      prisma.ayahReview.count({
        where: {
          userId: profile.id,
          nextReviewAt: { lte: now },
        },
      }),
      prisma.ayahReview.count({
        where: { userId: profile.id },
      }),
      getQuranReadProgress(profile.id),
      prisma.reviewEvent.groupBy({
        by: ["ayahId", "surahNumber"],
        where: quranMarkerWhere,
      }),
    ]);

    const realSessions30d = sessions30dRaw.filter((session) => session._count.attempts > 0);
    const realSessions7d = realSessions30d.filter((session) => session.localDate >= start7d);
    const sessions30d = realSessions30d.length;
    const sessions7d = realSessions7d.length;
    const practiceMinutes7dRaw = realSessions7d.reduce(
      (sum, session) => sum + sessionDurationMinutes(session.startedAt, session.endedAt),
      0,
    );
    const practiceMinutes7d = Math.round(practiceMinutes7dRaw);
    const avgSessionMinutes7d = sessions7d > 0
      ? Number((practiceMinutes7dRaw / sessions7d).toFixed(1))
      : 0;

    const gradeCounts14d = emptyGrades();
    let recallEvents7d = 0;
    let recallDurationSec7d = 0;
    for (const event of gradedEvents14d) {
      if (event.grade) {
        gradeCounts14d[event.grade] += 1;
      }
      if (event.session.localDate >= start7d) {
        recallEvents7d += 1;
        if (event.durationSec > 0) {
          recallDurationSec7d += event.durationSec;
        }
      }
    }
    const avgRecallDurationSec7d = recallEvents7d > 0
      ? Math.round(recallDurationSec7d / recallEvents7d)
      : 0;

    const recentSessions = recentSessionsRaw
      .filter((session) => session._count.attempts > 0)
      .slice(0, 8)
      .map((session) => ({
        id: session.id,
        localDate: session.localDate,
        mode: session.mode,
        startedAt: session.startedAt.toISOString(),
        endedAt: session.endedAt ? session.endedAt.toISOString() : null,
        durationMinutes: Math.round(sessionDurationMinutes(session.startedAt, session.endedAt)),
        recallEvents: session._count.attempts,
        warmupPassed: session.warmupPassed,
        weeklyGatePassed: session.weeklyGatePassed,
      }));

    const ayahsRecited = quranDistinctAyahs.length;
    const ayahsLeft = Math.max(0, TOTAL_AYAHS - ayahsRecited);
    const ayahCoveragePct = Number(((ayahsRecited / TOTAL_AYAHS) * 100).toFixed(1));

    const surahSet = new Set<number>();
    const juzSet = new Set<number>();
    for (const row of quranDistinctAyahs) {
      surahSet.add(row.surahNumber);
      const ayah = getAyahById(row.ayahId);
      if (ayah) {
        juzSet.add(ayah.juzNumber);
      }
    }
    const surahsCovered = surahSet.size;
    const surahsLeft = Math.max(0, TOTAL_SURAHS - surahsCovered);
    const surahCoveragePct = Number(((surahsCovered / TOTAL_SURAHS) * 100).toFixed(1));
    const juzsCovered = juzSet.size;
    const juzsLeft = Math.max(0, TOTAL_JUZ - juzsCovered);
    const juzCoveragePct = Number(((juzsCovered / TOTAL_JUZ) * 100).toFixed(1));

    const lastReadAyah = quranReadProgress.lastReadAyahId
      ? getAyahById(quranReadProgress.lastReadAyahId)
      : null;
    const currentSurahNumber = lastReadAyah?.surahNumber ?? profile.quranActiveSurahNumber;
    const currentSurah = getSurahInfo(currentSurahNumber);
    const currentSurahRecitedAyahs = quranDistinctAyahs.filter(
      (row) => row.surahNumber === currentSurahNumber,
    ).length;
    const currentSurahTotalAyahs = currentSurah?.ayahCount ?? 1;
    const currentSurahAyahsLeft = Math.max(0, currentSurahTotalAyahs - currentSurahRecitedAyahs);
    const currentSurahCoveragePct = Number(
      ((currentSurahRecitedAyahs / Math.max(1, currentSurahTotalAyahs)) * 100).toFixed(1),
    );

    return NextResponse.json({
      ok: true,
      generatedAt: now.toISOString(),
      localDate: todayLocalDate,
      recentSessions,
      hifz: {
        sessions7d,
        sessions30d,
        practiceMinutes7d,
        avgSessionMinutes7d,
        recallEvents7d,
        avgRecallDurationSec7d,
        trackedAyahs,
        dueNow,
        gradeCounts14d,
        recentSessions,
      },
      quran: {
        ayahsRecited,
        ayahsLeft,
        ayahCoveragePct,
        surahsCovered,
        surahsLeft,
        surahCoveragePct,
        juzsCovered,
        juzsLeft,
        juzCoveragePct,
        completionKhatmahCount: quranReadProgress.completionKhatmahCount,
        lastReadAyahId: quranReadProgress.lastReadAyahId,
        lastReadAt: quranReadProgress.lastReadAt,
        currentSurah: {
          surahNumber: currentSurahNumber,
          name: currentSurah?.nameTransliteration ?? `Surah ${currentSurahNumber}`,
          recitedAyahs: currentSurahRecitedAyahs,
          totalAyahs: currentSurahTotalAyahs,
          ayahsLeft: currentSurahAyahsLeft,
          coveragePct: currentSurahCoveragePct,
          lastReadRef: lastReadAyah
            ? `${lastReadAyah.surahNumber}:${lastReadAyah.ayahNumber}`
            : `${currentSurahNumber}:1`,
        },
      },
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "/api/progress/summary", method: "GET" },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to load progress summary." }, { status: 500 });
  }
}
