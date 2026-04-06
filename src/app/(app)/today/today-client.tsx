"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpenText, ChevronDown, Flame, Headphones, MoonStar, PlayCircle, RefreshCcw, SquarePen, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SessionFlowTutorial } from "@/components/app/session-flow-tutorial";
import { SurahSearchSelect } from "@/components/app/surah-search-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { setHifzActiveSurahCursor, setOpenSession } from "@/hifzer/local/store";
import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";
import { readSessionCache, writeSessionCache } from "@/lib/client-session-cache";
import {
  toTodayDashboardSummary,
  type DashboardOverviewLike,
  type TodayDashboardSummary,
  type TodayPayload,
  type LearningLane,
} from "./today-types";
import styles from "./today.module.css";

const TODAY_CACHE_KEY = "hifzer.today.snapshot.v1";
const TODAY_CACHE_TTL_MS = 90 * 1000;

type TodayCacheSnapshot = {
  data: TodayPayload | null;
  lanes: LearningLane[];
  overview: TodayDashboardSummary | null;
};

function readCachedTodaySnapshot() {
  return readSessionCache<TodayCacheSnapshot>(TODAY_CACHE_KEY, TODAY_CACHE_TTL_MS);
}

function modeExplain(state: TodayPayload["state"]): { title: string; body: string; tone: "neutral" | "warn" | "accent" } {
  const debtPct = Math.round(state.debtRatio);
  if (state.mode === "CATCH_UP") {
    const reason = state.meta.missedDays >= 3
      ? `you missed ${state.meta.missedDays} days`
      : `review debt is ${debtPct}% of your daily budget`;
    return {
      tone: "warn",
      title: `You are in Catch-up because ${reason}.`,
      body: "New is paused. Complete Sabqi + Manzil until debt falls below 45%, then Normal mode unlocks new again.",
    };
  }

  if (state.mode === "CONSOLIDATION") {
    const reason = state.retention3dAvg < 1.8
      ? `retention dropped (${state.retention3dAvg.toFixed(2)} / 3)`
      : state.meta.missedDays === 2
        ? "you missed 2 days"
        : `review debt reached ${debtPct}%`;
    return {
      tone: "warn",
      title: `You are in Consolidation because ${reason}.`,
      body: "New stays limited while review density is increased. Clear today's review queue to return to Normal.",
    };
  }

  return {
    tone: "accent",
    title: "You are in Normal mode.",
    body: "Warm-up and weekly gates still apply, but new memorization is available once required gates are passed.",
  };
}

function modeTone(mode: TodayPayload["state"]["mode"]): "accent" | "warn" {
  if (mode === "NORMAL") return "accent";
  return "warn";
}

function todayStatus(status: TodayDashboardSummary["today"]["status"]): { tone: "neutral" | "accent" | "success"; label: string } {
  if (status === "completed") {
    return { tone: "success", label: "Completed today" };
  }
  if (status === "in_progress") {
    return { tone: "accent", label: "In progress" };
  }
  return { tone: "neutral", label: "Not started" };
}

function parseIsoDateToUtc(value: string): Date | null {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day));
}

function addUtcDays(base: Date, days: number): Date {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + days));
}

function isoDateUtc(base: Date): string {
  return base.toISOString().slice(0, 10);
}

function activityColor(value: number, max: number, isFuture: boolean): string {
  if (isFuture) {
    return "rgba(148,163,184,0.12)";
  }
  if (value <= 0) {
    return "rgba(16,185,129,0.08)";
  }
  const pct = value / Math.max(1, max);
  if (pct < 0.2) {
    return "rgba(16,185,129,0.22)";
  }
  if (pct < 0.45) {
    return "rgba(16,185,129,0.4)";
  }
  if (pct < 0.7) {
    return "rgba(16,185,129,0.62)";
  }
  return "rgba(16,185,129,0.86)";
}

/* ---------- Skeleton placeholders ---------- */

function HeroSkeleton() {
  return (
    <Card className={`${styles.heroCard} relative overflow-hidden`}>
      {/* gradient accent mimicking the real hero */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(var(--kw-accent-rgb),0.18),transparent_68%)] blur-2xl" />

      <div className="relative space-y-5">
        {/* title line */}
        <div className="h-7 w-56 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
        {/* subtitle / time line */}
        <div className="h-4 w-40 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />

        {/* pill row */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-28 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
          <div className="h-7 w-20 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
          <div className="h-7 w-20 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
          <div className="h-7 w-16 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
        </div>

        {/* button row */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-40 animate-pulse rounded-2xl bg-[color:var(--kw-skeleton)]" />
          <div className="h-10 w-32 animate-pulse rounded-2xl bg-[color:var(--kw-skeleton)]" />
        </div>
      </div>
    </Card>
  );
}

function DetailsSkeleton() {
  return (
    <Card className={styles.detailCard}>
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
        <div className="h-4 w-64 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
        <div className="h-4 w-48 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
      </div>
    </Card>
  );
}

/* ---------- Main component ---------- */

export function TodayClient({
  initialData,
  initialLanes,
  initialOverview,
}: {
  initialData?: TodayPayload | null;
  initialLanes?: LearningLane[];
  initialOverview?: TodayDashboardSummary | null;
}) {
  const initialLanesProvided = typeof initialLanes !== "undefined";
  const initialOverviewProvided = typeof initialOverview !== "undefined";
  const router = useRouter();
  // When initialData is provided by the server component, start in a loaded state
  // so the skeleton is never shown to the user.
  const [loading, setLoading] = useState(() => !initialData && !readCachedTodaySnapshot()?.data);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TodayPayload | null>(() => initialData ?? readCachedTodaySnapshot()?.data ?? null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [switchingSurah, setSwitchingSurah] = useState(false);
  const [targetSurahNumber, setTargetSurahNumber] = useState(1);
  const [learningLanes, setLearningLanes] = useState<LearningLane[]>(() => initialLanes ?? readCachedTodaySnapshot()?.lanes ?? []);
  const [overview, setOverview] = useState<TodayDashboardSummary | null>(() => initialOverview ?? readCachedTodaySnapshot()?.overview ?? null);
  const { pushToast } = useToast();
  const dataRef = useRef<TodayPayload | null>(data);
  const learningLanesRef = useRef<LearningLane[]>(learningLanes);
  const overviewRef = useRef<TodayDashboardSummary | null>(overview);
  const [modeShiftNotice, setModeShiftNotice] = useState<{
    from: TodayPayload["state"]["mode"];
    to: TodayPayload["state"]["mode"];
    title: string;
    body: string;
  } | null>(null);

  const load = useCallback(async (options?: {
    includePrimary?: boolean;
    includeLanes?: boolean;
    includeOverview?: boolean;
    includeQuranFoundation?: boolean;
  }) => {
    const includePrimary = options?.includePrimary ?? true;
    const includeLanes = options?.includeLanes ?? true;
    const includeOverview = options?.includeOverview ?? true;
    const includeQuranFoundation = options?.includeQuranFoundation ?? true;

    if (includePrimary && !dataRef.current) {
      setLoading(true);
    }
    if (includePrimary) {
      setError(null);
    }
    try {
      const [todayRes, lanesRes, overviewRes, quranFoundationRes] = await Promise.all([
        includePrimary ? fetch("/api/session/today", { cache: "no-store" }) : Promise.resolve(null),
        includeLanes ? fetch("/api/profile/learning-lanes", { cache: "no-store" }) : Promise.resolve(null),
        includeOverview ? fetch("/api/dashboard/overview", { cache: "no-store" }) : Promise.resolve(null),
        includeQuranFoundation ? fetch("/api/quran-foundation/status", { cache: "no-store" }) : Promise.resolve(null),
      ]);

      let nextData = dataRef.current;
      if (todayRes) {
        const payload = (await todayRes.json()) as TodayPayload & { error?: string };
        if (todayRes.status === 403 && payload.error === "onboarding_required") {
          router.replace("/onboarding/welcome");
          return;
        }
        if (!todayRes.ok) {
          throw new Error(payload.error || "Failed to load today state.");
        }
        nextData = payload;
        dataRef.current = payload;
        setData(payload);
      }

      let nextLearningLanes = learningLanesRef.current;
      if (lanesRes?.ok) {
        const lanesPayload = (await lanesRes.json()) as { lanes?: LearningLane[] };
        nextLearningLanes = Array.isArray(lanesPayload.lanes) ? lanesPayload.lanes : [];
        learningLanesRef.current = nextLearningLanes;
        setLearningLanes(nextLearningLanes);
      }

      let nextOverview = overviewRef.current;
      if (overviewRes?.ok) {
        const overviewPayload = (await overviewRes.json()) as { overview?: DashboardOverviewLike };
        nextOverview = toTodayDashboardSummary(overviewPayload.overview);
        overviewRef.current = nextOverview;
        setOverview(nextOverview);
      }

      if (quranFoundationRes?.ok) {
        const quranFoundationPayload = (await quranFoundationRes.json()) as { status?: TodayPayload["quranFoundation"] };
        if (quranFoundationPayload.status && nextData) {
          nextData = { ...nextData, quranFoundation: quranFoundationPayload.status };
          dataRef.current = nextData;
          setData(nextData);
        }
      }

      writeSessionCache(TODAY_CACHE_KEY, {
        data: nextData,
        lanes: nextLearningLanes,
        overview: nextOverview,
      });
    } catch (err) {
      if (includePrimary) {
        setError(err instanceof Error ? err.message : "Failed to load today state.");
      }
    } finally {
      if (includePrimary) {
        setLoading(false);
      }
    }
  }, [router]);

  useEffect(() => {
    if (!initialData) {
      void load({
        includePrimary: true,
        includeLanes: true,
        includeOverview: true,
        includeQuranFoundation: true,
      });
      return;
    }

    const shouldLoadBackgroundOverview = !initialOverviewProvided;
    const shouldLoadBackgroundLanes = !initialLanesProvided;
    const shouldLoadBackgroundQuranFoundation = !initialData.quranFoundation;

    if (shouldLoadBackgroundOverview || shouldLoadBackgroundLanes || shouldLoadBackgroundQuranFoundation) {
      void load({
        includePrimary: false,
        includeLanes: shouldLoadBackgroundLanes,
        includeOverview: shouldLoadBackgroundOverview,
        includeQuranFoundation: shouldLoadBackgroundQuranFoundation,
      });
    }
  }, [initialData, initialLanesProvided, initialOverviewProvided, load]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    learningLanesRef.current = learningLanes;
  }, [learningLanes]);

  useEffect(() => {
    overviewRef.current = overview;
  }, [overview]);

  useEffect(() => {
    if (!data) {
      return;
    }
    writeSessionCache(TODAY_CACHE_KEY, {
      data,
      lanes: learningLanes,
      overview,
    });
  }, [data, learningLanes, overview]);

  useEffect(() => {
    if (!data || typeof window === "undefined") {
      return;
    }
    const key = "hifzer_last_mode_seen_v1";
    const previous = window.localStorage.getItem(key) as TodayPayload["state"]["mode"] | null;
    if (previous && previous !== data.state.mode) {
      const explanation = modeExplain(data.state);
      setModeShiftNotice({
        from: previous,
        to: data.state.mode,
        title: `Mode updated: ${previous} -> ${data.state.mode}`,
        body: explanation.body,
      });
    }
    window.localStorage.setItem(key, data.state.mode);
  }, [data]);

  const activeSurahNumber = data?.profile.activeSurahNumber ?? null;
  const resumeAyahForSurah = (surahNumber: number): number => {
    const lane = learningLanes.find((item) => item.surahNumber === surahNumber);
    return lane?.ayahNumber && lane.ayahNumber > 0 ? lane.ayahNumber : 1;
  };

  useEffect(() => {
    if (activeSurahNumber == null || !Number.isFinite(activeSurahNumber)) {
      return;
    }
    setTargetSurahNumber(activeSurahNumber);
  }, [activeSurahNumber, learningLanes]);

  async function switchSessionSurah() {
    const surah = Math.floor(targetSurahNumber);
    const selectedSurah = SURAH_INDEX.find((row) => row.surahNumber === surah);
    if (!Number.isFinite(surah) || !selectedSurah) {
      pushToast({
        title: "Invalid surah",
        message: "Choose a valid surah from the selector.",
        tone: "warning",
      });
      return;
    }
    const ayah = Math.max(1, Math.min(selectedSurah.ayahCount, resumeAyahForSurah(surah)));
    const hasExistingProgress = learningLanes.some((lane) => lane.surahNumber === surah);

    setSwitchingSurah(true);
    try {
      const res = await fetch("/api/profile/start-point", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          surahNumber: surah,
          ayahNumber: ayah,
          source: "session_switch",
          resetOpenSession: true,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        profile?: { activeSurahNumber?: number; cursorAyahId?: number };
        abandonedOpenSessions?: number;
      };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to switch Hifz surah.");
      }

      const nextSurah = Number(payload.profile?.activeSurahNumber);
      const nextCursor = Number(payload.profile?.cursorAyahId);
      if (Number.isFinite(nextSurah) && Number.isFinite(nextCursor)) {
        setHifzActiveSurahCursor(nextSurah, nextCursor);
      }
      setOpenSession(null);
      setSwitchOpen(false);
      await load();

      const abandonedCount = Number(payload.abandonedOpenSessions ?? 0);
      pushToast({
        title: "Hifz surah updated",
        message: abandonedCount > 0
          ? hasExistingProgress
            ? `Switched to Surah ${surah}. Resuming from ayah ${ayah}. ${abandonedCount} open Hifz run${abandonedCount === 1 ? "" : "s"} paused.`
            : `Switched to Surah ${surah}. Starting from ayah 1. ${abandonedCount} open Hifz run${abandonedCount === 1 ? "" : "s"} paused.`
          : hasExistingProgress
            ? `Switched to Surah ${surah}. Resuming from ayah ${ayah}.`
            : `Switched to Surah ${surah}. Starting from ayah 1.`,
        tone: "success",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to switch Hifz surah.";
      pushToast({
        title: "Switch failed",
        message,
        tone: "warning",
      });
    } finally {
      setSwitchingSurah(false);
    }
  }

  const reviewCount = useMemo(() => {
    if (!data) {
      return 0;
    }
    return (
      data.state.queue.weeklyGateAyahIds.length +
      data.state.queue.sabqiReviewAyahIds.length +
      data.state.queue.manzilReviewAyahIds.length
    );
  }, [data]);

  const totalQueueItems = useMemo(() => {
    if (!data) return 0;
    return (
      data.state.queue.warmupAyahIds.length +
      data.state.queue.weeklyGateAyahIds.length +
      data.state.queue.sabqiReviewAyahIds.length +
      data.state.queue.manzilReviewAyahIds.length +
      data.state.queue.newAyahIds.length
    );
  }, [data]);

  const estimatedMinutes = useMemo(() => {
    // ~1.2 min per ayah is a reasonable estimate for mixed review/new
    return Math.max(1, Math.round(totalQueueItems * 1.2));
  }, [totalQueueItems]);

  const modeExplanation = data ? modeExplain(data.state) : null;
  const hasReviewPressure = Boolean(data && (data.state.dueNowCount > 0 || data.state.dueSoonCount > 0));
  const canStartNewNow = Boolean(
    data &&
      data.state.newUnlocked &&
      !data.state.warmupRequired &&
      !data.state.weeklyGateRequired,
  );
  const progressSummary = overview?.progress ?? null;
  const streakSummary = overview?.streak ?? null;
  const todayStatusPill = overview ? todayStatus(overview.today.status) : null;
  const streakHeatmap = useMemo(() => {
    if (!overview?.today.localDate) {
      return [];
    }
    const endDate = parseIsoDateToUtc(overview.today.localDate);
    if (!endDate) {
      return [];
    }
    const weekdayMon0 = (endDate.getUTCDay() + 6) % 7;
    const currentWeekStart = addUtcDays(endDate, -weekdayMon0);
    const firstWeekStart = addUtcDays(currentWeekStart, -(7 * 7));
    const activityMap = new Map(overview.activityByDate.map((row) => [row.date, row.value]));

    return Array.from({ length: 56 }, (_, index) => {
      const date = addUtcDays(firstWeekStart, index);
      const iso = isoDateUtc(date);
      return {
        key: iso,
        date: iso,
        value: activityMap.get(iso) ?? 0,
        isToday: iso === overview.today.localDate,
        isFuture: iso > overview.today.localDate,
      };
    });
  }, [overview]);
  const streakHeatmapMax = useMemo(
    () => Math.max(1, ...streakHeatmap.filter((cell) => !cell.isFuture).map((cell) => cell.value)),
    [streakHeatmap],
  );

  return (
    <div className={`${styles.page} space-y-6`}>
      <PageHeader
        eyebrow="Dashboard"
        title="Dashboard"
        subtitle="Your reading, review, memorization, progress, and streak in one focused daily surface."
        right={
          <div className="flex items-center gap-2">
            <Link href="/quran">
              <Button variant="secondary" className="gap-2">
                Open Qur&apos;an <BookOpenText size={16} />
              </Button>
            </Link>
          </div>
        }
      />

      <SessionFlowTutorial surface="today" />

      {data?.quranFoundation ? (
        <Card className={styles.infoCard}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={data.quranFoundation.state === "connected" ? "accent" : data.quranFoundation.state === "degraded" ? "warn" : "neutral"}>
                  Quran.com {data.quranFoundation.state.replace("_", " ")}
                </Pill>
                {data.quranFoundation.contentApiReady ? <Pill tone="neutral">Official enrichment ready</Pill> : null}
              </div>
              <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{data.quranFoundation.detail}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/quran/read?view=compact">
                <Button variant="secondary">Open reader</Button>
              </Link>
              <Link href="/quran/bookmarks">
                <Button variant="secondary">Open bookmarks</Button>
              </Link>
              <Link href="/journal">
                <Button variant="ghost">Reflect in journal</Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : null}

      {/* ---------- Monthly adjustment banner ---------- */}
      {data?.monthlyAdjustmentMessage ? (
        <Card className={styles.noticeCard}>
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{data.monthlyAdjustmentMessage}</p>
          <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
            This runs in the background and does not require a separate test step unless severe risk is detected.
          </p>
        </Card>
      ) : null}

      {/* ---------- Mode shift notice ---------- */}
      {modeShiftNotice ? (
        <Card className={styles.noticeCard}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{modeShiftNotice.title}</p>
              <p className="mt-1 text-sm text-[color:var(--kw-muted)]">{modeShiftNotice.body}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setModeShiftNotice(null)}>
              Got it
            </Button>
          </div>
        </Card>
      ) : null}

      {/* ---------- Loading skeleton ---------- */}
      {loading ? (
        <>
          <HeroSkeleton />
          <DetailsSkeleton />
        </>
      ) : error ? (
        /* ---------- Error state ---------- */
        <Card className={styles.detailCard}>
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Unable to load Hifz</p>
          <p className="mt-1 text-sm text-[color:var(--kw-muted)]">{error}</p>
          <div className="mt-4">
            <Button variant="secondary" className="gap-2" onClick={() => void load()}>
              Retry <RefreshCcw size={16} />
            </Button>
          </div>
        </Card>
      ) : data ? (
        <>
          {/* ========== PRIMARY HERO CARD ========== */}
          <Card className={`${styles.heroCard} relative overflow-hidden`}>
            {/* Radial gradient accent */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(var(--kw-accent-rgb),0.22),transparent_68%)] blur-2xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(var(--kw-accent-rgb),0.10),transparent_68%)] blur-3xl" />

            <div className="relative">
              {/* Top row: title + mode pill */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-[family-name:var(--font-kw-display)] text-2xl tracking-tight text-[color:var(--kw-ink)] sm:text-3xl">
                    Your Qur&apos;an day is ready
                  </h2>
                  <p className="mt-1.5 text-sm text-[color:var(--kw-muted)]">
                    {totalQueueItems === 0
                      ? `No Hifz steps are queued right now. Reading and listening are still open.`
                      : `~${estimatedMinutes} min \u00B7 ${totalQueueItems} Hifz ayah${totalQueueItems !== 1 ? "s" : ""} queued`}
                  </p>
                </div>
                <Pill tone={modeTone(data.state.mode)}>{data.state.mode.replace("_", " ")}</Pill>
              </div>

              {/* Queue summary pills */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Pill tone="neutral">
                  Warmup: {data.state.queue.warmupAyahIds.length}
                </Pill>
                <Pill tone="neutral">
                  Review: {reviewCount}
                </Pill>
                <Pill tone="neutral">
                  New: {data.state.queue.newAyahIds.length}
                </Pill>
                {hasReviewPressure ? (
                  <Pill tone="warn">
                    {data.state.dueNowCount} due now
                  </Pill>
                ) : null}
              </div>

              {/* Action buttons */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link href={data.quran.continueHref}>
                  <Button variant="secondary" size="lg" className="gap-2">
                    Read <BookOpenText size={18} />
                  </Button>
                </Link>
                <Link href={data.quran.anonymousHref}>
                  <Button variant="secondary" className="gap-2">
                    Listen <Headphones size={16} />
                  </Button>
                </Link>
                <Link href="/hifz">
                  <Button size="lg" className="gap-2">
                    Memorize <PlayCircle size={18} />
                  </Button>
                </Link>
                {hasReviewPressure ? (
                  <Link href="/hifz?focus=review">
                    <Button variant="secondary" className="gap-2">
                      Review due items <ArrowRight size={16} />
                    </Button>
                  </Link>
                ) : null}
                <Button variant="ghost" className="gap-2" onClick={() => void load()}>
                  Reload <RefreshCcw size={16} />
                </Button>
                <Button variant="secondary" className="gap-2" onClick={() => setSwitchOpen((v) => !v)}>
                  {switchOpen ? "Close surah switcher" : "Switch Hifz surah"}
                </Button>
              </div>

              {switchOpen ? (
                <div className={`${styles.insetPanel} ${styles.switchPanel} mt-5 rounded-2xl border p-4`}>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Select Hifz surah</p>
                  <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                    If you already practiced this surah, we continue from your last paused ayah. Otherwise it starts from ayah 1.
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
                    <label className="text-xs text-[color:var(--kw-muted)]">
                      Surah
                      <div className="mt-1">
                        <SurahSearchSelect
                          value={targetSurahNumber}
                          onChange={(surahNumber) => {
                            setTargetSurahNumber(surahNumber);
                          }}
                          disabled={switchingSurah}
                        />
                      </div>
                    </label>
                    <div className="flex items-end">
                      <Button className="w-full" onClick={() => void switchSessionSurah()} disabled={switchingSurah}>
                        {switchingSurah ? "Switching..." : "Switch surah"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className={styles.summaryCard}>
              <div className={styles.summaryCardBody}>
                <div className={styles.summaryHeader}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Hifz</p>
                    <p className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                      {totalQueueItems > 0 ? `${totalQueueItems} ayahs ready today` : "No ayahs queued right now"}
                    </p>
                  </div>
                  <span className={styles.summaryIcon}>
                    <PlayCircle size={18} />
                  </span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                  {totalQueueItems > 0
                    ? `Warm-up ${data.state.queue.warmupAyahIds.length} · Review ${reviewCount} · New ${data.state.queue.newAyahIds.length}`
                    : "Use Hifz to continue recall, clear reviews, or switch to your active surah."}
                </p>
                <div className={styles.summaryMeta}>
                  <span className={styles.summaryMiniPill}>Mode {data.state.mode.toLowerCase().replace("_", "-")}</span>
                  {hasReviewPressure ? <span className={styles.summaryMiniPill}>{data.state.dueNowCount} due now</span> : null}
                </div>
                <Link href="/hifz" className={styles.summaryCta}>
                  Start Hifz run <ArrowRight size={16} />
                </Link>
              </div>
            </Card>

            <Card className={styles.summaryCard}>
              <div className={styles.summaryCardBody}>
                <div className={styles.summaryHeader}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Qur&apos;an</p>
                    <p className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                      Continue from {data.quran.currentRef}
                    </p>
                  </div>
                  <span className={styles.summaryIcon}>
                    <BookOpenText size={18} />
                  </span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                  Qur&apos;an coverage {data.quran.completionPct.toFixed(1)}% · {data.quran.currentSurahName}
                </p>
                <div className={styles.summaryMeta}>
                  <span className={styles.summaryMiniPill}>Keep your place</span>
                  <span className={styles.summaryMiniPill}>{progressSummary?.trackedAyahs ?? 0} read this week</span>
                </div>
                <Link href={data.quran.continueHref} className={styles.summaryCta}>
                  Open reader <ArrowRight size={16} />
                </Link>
              </div>
            </Card>

            <Card className={styles.summaryCard}>
              <div className={styles.summaryCardBody}>
                <div className={styles.summaryHeader}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Dua</p>
                    <p className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                      Return with a guided dua module
                    </p>
                  </div>
                  <span className={styles.summaryIcon}>
                    <MoonStar size={18} />
                  </span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                  Move through repentance, ruqyah, provision, beautiful names, and Laylat al-Qadr in one calm place.
                </p>
                <div className={styles.summaryMeta}>
                  <span className={styles.summaryMiniPill}>Personal duas stay close</span>
                </div>
                <Link href="/dua" className={styles.summaryCta}>
                  Open dua <ArrowRight size={16} />
                </Link>
              </div>
            </Card>

            <Card className={styles.summaryCard}>
              <div className={styles.summaryCardBody}>
                <div className={styles.summaryHeader}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Journal</p>
                    <p className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                      Capture what stayed with you today
                    </p>
                  </div>
                  <span className={styles.summaryIcon}>
                    <SquarePen size={18} />
                  </span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                  Save a short reflection, link an ayah, or keep a private dua from today&apos;s reading without leaving the flow.
                </p>
                <div className={styles.summaryMeta}>
                  <span className={styles.summaryMiniPill}>Private and personal</span>
                </div>
                <Link href="/journal" className={styles.summaryCta}>
                  Open journal <ArrowRight size={16} />
                </Link>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className={`${styles.featureCard} h-full`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Progress</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                    {progressSummary ? `${progressSummary.quranCompletionPct.toFixed(1)}%` : `${data.quran.completionPct.toFixed(1)}%`}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--kw-muted)]">
                    How much of the Qur&apos;an you have read so far.
                  </p>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-[18px] border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.08)] text-[rgba(var(--kw-accent-rgb),1)]">
                  <TrendingUp size={18} />
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className={`${styles.insetPanel} rounded-[18px] border px-3.5 py-3`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Current surah</p>
                  <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">
                    {progressSummary?.currentSurahName ?? data.quran.currentSurahName}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                    {progressSummary
                      ? `${progressSummary.currentSurahProgressPct}% through this surah`
                      : `Continue from ${data.quran.currentRef}`}
                  </p>
                </div>
                <div className={`${styles.insetPanel} rounded-[18px] border px-3.5 py-3`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Reading this week</p>
                  <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">
                    {progressSummary?.trackedAyahs ?? 0} ayahs read
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                    {progressSummary?.browseRecitedAyahs7d ?? 0} ayahs read in the last 7 days
                  </p>
                </div>
                <div className={`${styles.insetPanel} rounded-[18px] border px-3.5 py-3`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Hifz recall</p>
                  <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">
                    {progressSummary?.recallEvents7d ?? 0} recall events in 7 days
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                    Progress stays separate between Qur&apos;an reading and Hifz review.
                  </p>
                </div>
                <div className={`${styles.insetPanel} rounded-[18px] border px-3.5 py-3`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Khatmah count</p>
                  <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">
                    {progressSummary?.completedKhatmahCount ?? data.quran.completedKhatmahCount} completed
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                    Resume from {data.quran.currentRef} whenever you return.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link href="/quran/progress">
                  <Button variant="secondary" className="gap-2">
                    Qur&apos;an surahs <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/hifz/progress">
                  <Button variant="ghost" className="gap-2">
                    Hifz surahs <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className={`${styles.featureCard} h-full`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Streak</p>
                  <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                    A calmer view of whether today still feels alive, not just whether a counter moved.
                  </p>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-[18px] border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.08)] text-[rgba(var(--kw-accent-rgb),1)]">
                  <Flame size={18} />
                </span>
              </div>

              <div className={styles.streakHero}>
                <div className={styles.streakLead}>
                  <div className={styles.streakLeadInner}>
                    <p className={styles.streakCount}>
                      {streakSummary ? streakSummary.currentStreakDays : 0}
                    </p>
                    <p className={styles.streakCountLabel}>
                      day{streakSummary?.currentStreakDays === 1 ? "" : "s"} in a row. Keep today alive with a gentle return through Qur&apos;an or Hifz.
                    </p>
                    <div className={`${styles.streakCapsules} mt-4`}>
                      {todayStatusPill ? <Pill tone={todayStatusPill.tone}>{todayStatusPill.label}</Pill> : null}
                      <Pill tone="accent">{streakSummary?.todayQualifiedAyahs ?? 0} ayahs today</Pill>
                      {streakSummary?.graceInUseToday ? <Pill tone="warn">Grace used</Pill> : null}
                    </div>
                  </div>
                </div>

                <div className={styles.streakMetricGrid}>
                  <div className={styles.streakMetricCard}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Best run</p>
                    <p className={styles.streakMetricValue}>
                      {streakSummary?.bestStreakDays ?? 0} day{streakSummary?.bestStreakDays === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className={styles.streakMetricCard}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Last kept</p>
                    <p className={styles.streakMetricValue}>{streakSummary?.lastQualifiedDate ?? "Not yet"}</p>
                  </div>
                  <div className={styles.streakMetricCard}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Signal</p>
                    <p className={styles.streakMetricValue}>
                      {streakSummary && streakSummary.currentStreakDays > 0 ? "Momentum active" : "Return today"}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.insetPanel} ${styles.heatmapPanel} mt-5 rounded-[18px] border p-3.5`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                    Return rhythm · last 8 weeks
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[color:var(--kw-faint)]">
                    <span>Less</span>
                    {[
                      "rgba(16,185,129,0.08)",
                      "rgba(16,185,129,0.22)",
                      "rgba(16,185,129,0.4)",
                      "rgba(16,185,129,0.62)",
                      "rgba(16,185,129,0.86)",
                    ].map((tone) => (
                      <span
                        key={tone}
                        className="h-2.5 w-2.5 rounded-[4px] border border-white/10"
                        style={{ backgroundColor: tone }}
                      />
                    ))}
                    <span>More</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto pb-1">
                  {streakHeatmap.map((cell) => (
                    <span
                      key={cell.key}
                      title={`${cell.date}: ${cell.value} activity`}
                      className="h-3.5 w-3.5 rounded-[4px] border transition"
                      style={{
                        backgroundColor: activityColor(cell.value, streakHeatmapMax, cell.isFuture),
                        borderColor: cell.isToday ? "rgba(var(--kw-accent-rgb),0.55)" : "rgba(255,255,255,0.08)",
                        boxShadow: cell.isToday ? "0 0 0 1px rgba(var(--kw-accent-rgb),0.18)" : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link href="/quran/read?view=compact">
                  <Button variant="secondary" className="gap-2">
                    Keep today alive <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/hifz">
                  <Button variant="ghost" className="gap-2">
                    Open Hifz <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* ========== COLLAPSIBLE DIAGNOSTICS ========== */}
          <div>
            <button
              type="button"
              onClick={() => setDetailsOpen((prev) => !prev)}
              className="group flex w-full items-center gap-2 rounded-2xl px-1 py-2 text-left text-sm font-semibold text-[color:var(--kw-muted)] transition hover:text-[color:var(--kw-ink)]"
            >
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${detailsOpen ? "rotate-0" : "-rotate-90"}`}
              />
              {detailsOpen ? "Hide plan signals" : "How today's plan works"}
            </button>

            {detailsOpen ? (
              <>
                <p className={styles.detailsIntro}>
                  These panels explain why today feels lighter, heavier, or review-first so the plan stays understandable instead of opaque.
                </p>
                <div className="mt-2 grid gap-4 md:grid-cols-2">
                {/* Debt & review floor */}
                <Card className={styles.detailCard}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    Today&apos;s queue signals
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                    Debt: {data.state.reviewDebtMinutes.toFixed(1)} min ({Math.round(data.state.debtRatio)}% of budget)
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Pill tone="neutral">Review floor: {data.state.reviewFloorPct}%</Pill>
                    {data.state.warmupRequired ? <Pill tone="warn">Warm-up gate</Pill> : null}
                    {data.state.weeklyGateRequired ? <Pill tone="warn">Weekly gate</Pill> : null}
                    {data.state.monthlyTestRequired ? <Pill tone="warn">Monthly retention guard</Pill> : null}
                    <Pill tone={data.state.newUnlocked ? "accent" : "neutral"}>
                      {data.state.newUnlocked ? "New is open" : "New is paused"}
                    </Pill>
                    <Pill tone={canStartNewNow ? "success" : "neutral"}>
                      {canStartNewNow ? "Ready for new ayahs" : "Gate pass required"}
                    </Pill>
                  </div>
                </Card>

                {/* Mode explainer */}
                <Card className={styles.detailCard}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    Mode explainer
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                    {modeExplanation?.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-7 text-[color:var(--kw-muted)]">
                    {modeExplanation?.body}
                  </p>
                </Card>

                {/* Due now / soon */}
                <Card className={`${styles.detailCard} md:col-span-2`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                        Review timing
                      </p>
                      <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                        Due now: <span className="font-semibold text-[color:var(--kw-ink)]">{data.state.dueNowCount}</span>
                        {" \u2014 "}
                        Due in next 6h: <span className="font-semibold text-[color:var(--kw-ink)]">{data.state.dueSoonCount}</span>
                      </p>
                      <p className="mt-1 text-xs text-[color:var(--kw-faint)]">
                        Next due: {data.state.nextDueAt ? new Date(data.state.nextDueAt).toLocaleString() : "No upcoming review"}
                      </p>
                    </div>
                    <Link href="/hifz?focus=review">
                      <Button variant="secondary" className="gap-2">
                        Start quick review <PlayCircle size={16} />
                      </Button>
                    </Link>
                  </div>
                </Card>
                </div>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

