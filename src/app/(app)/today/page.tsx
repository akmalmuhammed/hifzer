import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { getReciterLabel } from "@/hifzer/audio/reciters";
import { loadTodayState } from "@/hifzer/engine/server";
import { listLearningLanes } from "@/hifzer/profile/server";
import { getQuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/server";
import { getAyahById, getSurahInfo } from "@/hifzer/quran/lookup.server";
import { getQuranReadProgress } from "@/hifzer/quran/read-progress.server";
import { clerkEnabled } from "@/lib/clerk-config";
import { dbConfigured } from "@/lib/db";
import { TodayClient } from "./today-client";
import type { TodayPayload } from "./today-types";

export const metadata = {
  title: "Dashboard",
};

export default async function TodayPage() {
  const authEnabled = clerkEnabled();

  if (!authEnabled || !dbConfigured()) {
    // Demo / no-auth mode — let the client component fetch data itself.
    return <TodayClient />;
  }

  const { userId } = await auth();
  if (!userId) {
    return <TodayClient />;
  }

  try {
    // Fetch today state and learning lanes in parallel on the server so the
    // client renders immediately — no skeleton, no waterfall fetch on mount.
    const [todayResult, lanes, quranFoundation] = await Promise.all([
      loadTodayState(userId),
      listLearningLanes(userId),
      getQuranFoundationConnectionStatus(userId),
    ]);

    const { profile, state } = todayResult;
    const quranProgress = await getQuranReadProgress(profile.id);
    const quranAyah = getAyahById(quranProgress.lastReadAyahId ?? profile.quranCursorAyahId) ?? getAyahById(1);
    const quranSurah = getSurahInfo(quranAyah?.surahNumber ?? 1);
    const quranRef = quranAyah ? `${quranAyah.surahNumber}:${quranAyah.ayahNumber}` : "1:1";
    const trackedParams = new URLSearchParams({ view: "compact" });
    if (quranAyah) {
      trackedParams.set("surah", String(quranAyah.surahNumber));
      trackedParams.set("cursor", String(quranAyah.id));
    }
    const continueHref = `/quran/read?${trackedParams.toString()}`;
    const anonymousHref = `${continueHref}&anon=1`;

    const initialData: TodayPayload = {
      localDate: state.localDate,
      profile: {
        activeSurahNumber: profile.activeSurahNumber,
        cursorAyahId: profile.cursorAyahId,
        dailyMinutes: profile.dailyMinutes,
        reciterLabel: getReciterLabel(profile.reciterId),
      },
      quran: {
        completionPct: quranProgress.completionPct,
        completedKhatmahCount: quranProgress.completionKhatmahCount,
        currentSurahName: quranSurah?.nameTransliteration ?? `Surah ${quranAyah?.surahNumber ?? 1}`,
        currentRef: quranRef,
        continueHref,
        anonymousHref,
      },
      state: {
        mode: state.mode,
        reviewDebtMinutes: state.reviewDebtMinutes,
        debtRatio: state.debtRatio,
        reviewFloorPct: state.reviewFloorPct,
        retention3dAvg: state.retention3dAvg,
        weeklyGateRequired: state.weeklyGateRequired,
        monthlyTestRequired: state.monthlyTestRequired,
        warmupRequired: state.warmupRequired,
        newUnlocked: state.newUnlocked,
        dueNowCount: state.dueNowCount,
        dueSoonCount: state.dueSoonCount,
        nextDueAt: state.nextDueAt ?? null,
        queue: {
          warmupAyahIds: state.queue.warmupAyahIds,
          weeklyGateAyahIds: state.queue.weeklyGateAyahIds,
          sabqiReviewAyahIds: state.queue.sabqiReviewAyahIds,
          manzilReviewAyahIds: state.queue.manzilReviewAyahIds,
          repairLinks: state.queue.repairLinks,
          newAyahIds: state.queue.newAyahIds,
        },
        meta: {
          missedDays: state.meta.missedDays,
          weekOne: state.meta.weekOne,
          reviewPoolSize: state.meta.reviewPoolSize,
        },
      },
      monthlyAdjustmentMessage:
        profile.rebalanceUntil && profile.rebalanceUntil.getTime() > Date.now()
          ? "Plan adjusted to protect retention."
          : null,
      quranFoundation,
    };

    const initialLanes = lanes.map((lane) => ({
      surahNumber: lane.surahNumber,
      surahLabel: lane.surahLabel,
      ayahNumber: lane.ayahNumber,
      ayahId: lane.ayahId,
      progressPct: lane.progressPct,
      lastTouchedAt: lane.lastTouchedAt,
      isActive: lane.isActive,
    }));
    return (
      <TodayClient
        initialData={initialData}
        initialLanes={initialLanes}
      />
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: { area: "today-page", operation: "loadTodayState" },
      user: { id: userId },
    });
    // Fall back to client-side fetch on error.
    return <TodayClient />;
  }
}
