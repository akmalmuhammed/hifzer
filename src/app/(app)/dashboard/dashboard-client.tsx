"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookMarked,
  Clock3,
  Compass,
  PlayCircle,
  RefreshCcw,
  Sparkles,
  Timer,
  TrendingUp,
  Waves,
} from "lucide-react";
import { AreaTrend } from "@/components/charts/area-trend";
import { DonutProgress } from "@/components/charts/donut-progress";
import { HeatStrip } from "@/components/charts/heat-strip";
import { Sparkline } from "@/components/charts/sparkline";
import { StackedBars } from "@/components/charts/stacked-bars";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import styles from "./dashboard.module.css";

type DashboardOverview = {
  generatedAt: string;
  profile: {
    mode: "NORMAL" | "CONSOLIDATION" | "CATCH_UP";
    timezone: string;
    dailyMinutes: number;
    practiceDaysPerWeek: number;
    reminderTimeLocal: string;
  };
  today: {
    localDate: string;
    status: "idle" | "in_progress" | "completed";
    completedSessions: number;
    openSessions: number;
  };
  kpis: {
    completedSessions7d: number;
    totalSessionMinutes7d: number;
    avgSessionMinutes7d: number;
    recallEvents7d: number;
    trackedAyahs: number;
    quranCompletionPct: number;
    retentionScore14d: number;
  };
  sessionTrend14d: Array<{
    date: string;
    completedSessions: number;
    minutes: number;
    recallEvents: number;
    browseAyahs: number;
  }>;
  gradeMix14d: Record<"AGAIN" | "HARD" | "GOOD" | "EASY", number>;
  stageMix14d: Record<"WARMUP" | "REVIEW" | "NEW" | "LINK" | "WEEKLY_TEST" | "LINK_REPAIR", number>;
  reviewHealth: {
    dueNow: number;
    dueSoon6h: number;
    nextDueAt: string | null;
    weakTransitions: number;
    byBand: Record<"ENCODING" | "SABQI" | "MANZIL" | "MASTERED", number>;
  };
  quran: {
    cursorAyahId: number;
    cursorRef: string;
    currentSurahName: string;
    currentSurahProgressPct: number;
    completedKhatmahCount: number;
    browseRecitedAyahs7d: number;
    uniqueSurahsRecited14d: number;
  };
  streak: {
    currentStreakDays: number;
    bestStreakDays: number;
    graceInUseToday: boolean;
    todayQualifiedAyahs: number;
    lastQualifiedDate: string | null;
  };
  recentSessions: Array<{
    id: string;
    localDate: string;
    status: "OPEN" | "COMPLETED" | "ABANDONED";
    mode: "NORMAL" | "CONSOLIDATION" | "CATCH_UP";
    startedAt: string;
    endedAt: string | null;
    durationMin: number;
    eventCount: number;
    attemptsCount: number;
    warmupPassed: boolean | null;
    weeklyGatePassed: boolean | null;
  }>;
};

type DashboardPayload = {
  ok: true;
  overview: DashboardOverview;
};

function statusPill(status: DashboardOverview["today"]["status"]): { tone: "neutral" | "accent" | "success"; label: string } {
  if (status === "completed") {
    return { tone: "success", label: "Today completed" };
  }
  if (status === "in_progress") {
    return { tone: "accent", label: "Session in progress" };
  }
  return { tone: "neutral", label: "Not started today" };
}

function modeTone(mode: DashboardOverview["profile"]["mode"]): "accent" | "warn" | "neutral" {
  if (mode === "NORMAL") {
    return "accent";
  }
  if (mode === "CONSOLIDATION") {
    return "warn";
  }
  return "neutral";
}

function modeLabel(mode: DashboardOverview["profile"]["mode"]): string {
  if (mode === "CATCH_UP") {
    return "Catch-up";
  }
  if (mode === "CONSOLIDATION") {
    return "Consolidation";
  }
  return "Normal";
}

function formatLocalDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map((v) => Number(v));
  if (!y || !m || !d) {
    return isoDate;
  }
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatMaybeDateTime(value: string | null): string {
  if (!value) {
    return "No review due";
  }
  return new Date(value).toLocaleString();
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="min-h-[220px]">
        <div className="h-6 w-44 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
        <div className="mt-4 h-10 w-[70%] animate-pulse rounded-2xl bg-[color:var(--kw-skeleton)]" />
        <div className="mt-4 h-4 w-[55%] animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="min-h-[130px]">
            <div className="h-4 w-24 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
            <div className="mt-4 h-9 w-20 animate-pulse rounded-xl bg-[color:var(--kw-skeleton)]" />
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const reduceMotion = useReducedMotion();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/overview", { cache: "no-store" });
      const payload = (await res.json()) as DashboardPayload & { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to load dashboard.");
      }
      setOverview(payload.overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const heroScore = useMemo(() => {
    if (!overview) {
      return 0;
    }
    const consistency = Math.min(100, overview.kpis.completedSessions7d * 12.5);
    const retention = overview.kpis.retentionScore14d;
    const coverage = overview.kpis.quranCompletionPct;
    return Math.round((consistency * 0.35) + (retention * 0.45) + (coverage * 0.2));
  }, [overview]);

  const trendMinutes = useMemo(
    () => overview?.sessionTrend14d.map((point) => ({ t: `${point.date}T00:00:00.000Z`, v: point.minutes })) ?? [],
    [overview],
  );
  const trendRecall = useMemo(
    () => overview?.sessionTrend14d.map((point) => point.recallEvents) ?? [],
    [overview],
  );
  const heatDays = useMemo(
    () =>
      overview?.sessionTrend14d.map((point) => ({
        date: point.date,
        value: point.recallEvents + point.browseAyahs + (point.completedSessions * 2),
      })) ?? [],
    [overview],
  );

  const gradeSegments = useMemo(() => {
    if (!overview) {
      return [];
    }
    return [
      { label: "Again", value: overview.gradeMix14d.AGAIN, color: "rgba(225,29,72,0.78)" },
      { label: "Hard", value: overview.gradeMix14d.HARD, color: "rgba(234,88,12,0.78)" },
      { label: "Good", value: overview.gradeMix14d.GOOD, color: "rgba(10,138,119,0.78)" },
      { label: "Easy", value: overview.gradeMix14d.EASY, color: "rgba(var(--kw-accent-rgb),0.78)" },
    ];
  }, [overview]);

  const stageSegments = useMemo(() => {
    if (!overview) {
      return [];
    }
    return [
      { label: "Warmup", value: overview.stageMix14d.WARMUP, color: "rgba(var(--kw-accent-rgb),0.78)" },
      { label: "Review", value: overview.stageMix14d.REVIEW, color: "rgba(10,138,119,0.78)" },
      { label: "New", value: overview.stageMix14d.NEW, color: "rgba(14,165,233,0.78)" },
      { label: "Link", value: overview.stageMix14d.LINK + overview.stageMix14d.LINK_REPAIR, color: "rgba(234,88,12,0.78)" },
      { label: "Weekly", value: overview.stageMix14d.WEEKLY_TEST, color: "rgba(99,102,241,0.78)" },
    ];
  }, [overview]);

  const status = overview ? statusPill(overview.today.status) : null;

  const cardTransition = {
    duration: reduceMotion ? 0 : 0.45,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Home"
        title="Dashboard"
        subtitle="A live command deck for retention, session quality, and Qur'an reading momentum."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" className="gap-2" onClick={() => void load()}>
              Refresh <RefreshCcw size={16} />
            </Button>
            <Link href="/session">
              <Button className="gap-2">
                Start session <PlayCircle size={16} />
              </Button>
            </Link>
          </div>
        }
      />

      {loading ? <DashboardSkeleton /> : null}

      {!loading && error ? (
        <Card>
          <EmptyState
            title="Dashboard unavailable"
            message={error}
            action={(
              <Button variant="secondary" className="gap-2" onClick={() => void load()}>
                Retry <RefreshCcw size={16} />
              </Button>
            )}
          />
        </Card>
      ) : null}

      {!loading && !error && overview ? (
        <div className="space-y-4">
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={cardTransition}
            className={`${styles.commandDeck} px-5 py-5 sm:px-6`}
          >
            <div className={styles.pulseOrb} />
            <div className={styles.driftOrb} />
            <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="accent">Command Deck</Pill>
                  <Pill tone={modeTone(overview.profile.mode)}>{modeLabel(overview.profile.mode)}</Pill>
                  {status ? <Pill tone={status.tone}>{status.label}</Pill> : null}
                  <span className="text-xs text-[color:var(--kw-faint)]">
                    Updated {new Date(overview.generatedAt).toLocaleTimeString()}
                  </span>
                </div>

                <div>
                  <h2 className="text-balance font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
                    Precision view of your Hifz system.
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
                    Sessions, review pressure, Qur&apos;an completion, and recall quality are unified here so you can
                    act immediately.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className={`${styles.kpiTile} px-3 py-2.5`}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                      Sessions (7d)
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                      {overview.kpis.completedSessions7d}
                    </p>
                  </div>
                  <div className={`${styles.kpiTile} px-3 py-2.5`}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                      Recall Events
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                      {overview.kpis.recallEvents7d}
                    </p>
                  </div>
                  <div className={`${styles.kpiTile} px-3 py-2.5`}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                      Qur&apos;an Coverage
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                      {overview.kpis.quranCompletionPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">Focus score</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <DonutProgress value={heroScore / 100} size={86} stroke={8} tone="accent" />
                  <div className="text-right">
                    <p className="text-4xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{heroScore}</p>
                    <p className="text-xs text-[color:var(--kw-muted)]">out of 100</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link href="/quran/read?view=compact">
                    <Button variant="secondary" size="sm" className="gap-2">
                      Continue Qur&apos;an <BookMarked size={14} />
                    </Button>
                  </Link>
                  <Link href="/today">
                    <Button size="sm" className="gap-2">
                      Open Today <ArrowRight size={14} />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={reduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ ...cardTransition, delay: 0.04 }}>
              <Card className={`${styles.metricCard} min-h-[140px]`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Practice minutes (7d)</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                  {overview.kpis.totalSessionMinutes7d}
                </p>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  Avg {overview.kpis.avgSessionMinutes7d.toFixed(1)} min per completed session
                </p>
                <Sparkline values={overview.sessionTrend14d.map((d) => d.minutes)} tone="accent" className="mt-3" />
              </Card>
            </motion.div>

            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={reduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ ...cardTransition, delay: 0.08 }}>
              <Card className={`${styles.metricCard} min-h-[140px]`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Retention score</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                  {overview.kpis.retentionScore14d}
                </p>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">Based on Again/Hard/Good/Easy over 14 days</p>
                <Sparkline values={trendRecall} tone="brand" className="mt-3" />
              </Card>
            </motion.div>

            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={reduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ ...cardTransition, delay: 0.12 }}>
              <Card className={`${styles.metricCard} min-h-[140px]`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Review pressure</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{overview.reviewHealth.dueNow}</p>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  Due now | {overview.reviewHealth.dueSoon6h} due in next 6h
                </p>
                <p className="mt-3 text-xs text-[color:var(--kw-faint)]">{formatMaybeDateTime(overview.reviewHealth.nextDueAt)}</p>
              </Card>
            </motion.div>

            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={reduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ ...cardTransition, delay: 0.16 }}>
              <Card className={`${styles.metricCard} min-h-[140px]`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Streak</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                  {overview.streak.currentStreakDays}d
                </p>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  Best {overview.streak.bestStreakDays}d {overview.streak.graceInUseToday ? "| grace active" : ""}
                </p>
                <div className="mt-3 flex gap-2">
                  <Pill tone="neutral">Today ayahs: {overview.streak.todayQualifiedAyahs}</Pill>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={reduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ ...cardTransition, delay: 0.2 }}>
              <Card className={styles.sectionGlow}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Momentum stream</p>
                    <p className="mt-1 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                      Session minutes over 14 days
                    </p>
                  </div>
                  <Pill tone="accent">{overview.profile.timezone}</Pill>
                </div>
                <div className="mt-4">
                  <AreaTrend points={trendMinutes} tone="accent" valueSuffix="m" />
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Tracked ayahs</p>
                    <p className="mt-1 text-lg font-semibold text-[color:var(--kw-ink)]">{overview.kpis.trackedAyahs}</p>
                  </div>
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Weak links</p>
                    <p className="mt-1 text-lg font-semibold text-[color:var(--kw-ink)]">{overview.reviewHealth.weakTransitions}</p>
                  </div>
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Practice days</p>
                    <p className="mt-1 text-lg font-semibold text-[color:var(--kw-ink)]">{overview.profile.practiceDaysPerWeek}/7</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={reduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ ...cardTransition, delay: 0.24 }}>
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Recitation quality</p>
                    <p className="mt-1 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                      Grade mix + phase distribution
                    </p>
                  </div>
                  <Pill tone="neutral">14d</Pill>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Grades</p>
                    <StackedBars segments={gradeSegments} ariaLabel="Grade distribution over 14 days" />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Pill tone="danger">Again {overview.gradeMix14d.AGAIN}</Pill>
                      <Pill tone="warn">Hard {overview.gradeMix14d.HARD}</Pill>
                      <Pill tone="success">Good {overview.gradeMix14d.GOOD}</Pill>
                      <Pill tone="accent">Easy {overview.gradeMix14d.EASY}</Pill>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Session stages</p>
                    <StackedBars segments={stageSegments} ariaLabel="Stage mix over 14 days" />
                    <p className="mt-2 text-xs text-[color:var(--kw-muted)]">
                      Warm-up {overview.stageMix14d.WARMUP} | Review {overview.stageMix14d.REVIEW} | New {overview.stageMix14d.NEW}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={reduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ ...cardTransition, delay: 0.28 }}>
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Qur&apos;an compass</p>
                    <p className="mt-1 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                      {overview.quran.currentSurahName} | {overview.quran.cursorRef}
                    </p>
                  </div>
                  <Pill tone="accent">Ayah #{overview.quran.cursorAyahId}</Pill>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                  <div className="flex items-center justify-center rounded-[18px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] p-3">
                    <DonutProgress value={overview.kpis.quranCompletionPct / 100} size={96} stroke={8} tone="brand" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-[color:var(--kw-muted)]">
                      Completion {overview.kpis.quranCompletionPct.toFixed(1)}% | Surah progress {overview.quran.currentSurahProgressPct}%
                    </p>
                    <div className="h-2 rounded-full bg-black/[0.06]">
                      <div
                        className="h-2 rounded-full bg-[rgba(var(--kw-accent-rgb),0.82)]"
                        style={{ width: `${Math.max(1, overview.kpis.quranCompletionPct)}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Pill tone="neutral">Khatmah x{overview.quran.completedKhatmahCount}</Pill>
                      <Pill tone="neutral">Browse ayahs (7d): {overview.quran.browseRecitedAyahs7d}</Pill>
                      <Pill tone="neutral">Surahs active (14d): {overview.quran.uniqueSurahsRecited14d}</Pill>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link href="/quran">
                    <Button variant="secondary" className="gap-2">
                      Qur&apos;an hub <Compass size={15} />
                    </Button>
                  </Link>
                  <Link href="/quran/read?view=compact">
                    <Button className="gap-2">
                      Continue reading <ArrowRight size={15} />
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={reduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ ...cardTransition, delay: 0.32 }}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Review health map</p>
                    <p className="mt-1 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">Daily activity intensity</p>
                  </div>
                  <Waves size={18} className="text-[color:var(--kw-muted)]" />
                </div>
                <div className="mt-4">
                  <HeatStrip days={heatDays} tone="brand" animate ariaLabel="Review and browse activity heat strip" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Band SABQI</p>
                    <p className="mt-1 text-base font-semibold text-[color:var(--kw-ink)]">{overview.reviewHealth.byBand.SABQI}</p>
                  </div>
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Band MANZIL</p>
                    <p className="mt-1 text-base font-semibold text-[color:var(--kw-ink)]">{overview.reviewHealth.byBand.MANZIL}</p>
                  </div>
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Reminder</p>
                    <p className="mt-1 text-base font-semibold text-[color:var(--kw-ink)]">{overview.profile.reminderTimeLocal}</p>
                  </div>
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Today date</p>
                    <p className="mt-1 text-base font-semibold text-[color:var(--kw-ink)]">{formatLocalDate(overview.today.localDate)}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={reduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ ...cardTransition, delay: 0.36 }}>
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Recent execution ledger</p>
                  <p className="mt-1 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">Latest sessions and gates</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-[color:var(--kw-muted)]">
                  <Clock3 size={14} />
                  <span>{overview.recentSessions.length} sessions</span>
                </div>
              </div>

              <div className="mt-4">
                {overview.recentSessions.length ? (
                  overview.recentSessions.map((session) => (
                    <div key={session.id} className={styles.sessionRow}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[color:var(--kw-ink)]">
                          {formatLocalDate(session.localDate)} | {modeLabel(session.mode)}
                        </p>
                        <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                          {session.status === "OPEN" ? "In progress" : `${session.durationMin} min`} | {session.eventCount} events
                        </p>
                      </div>
                      <div className="text-right text-xs text-[color:var(--kw-muted)]">
                        <Timer size={14} className="ml-auto" />
                        {session.attemptsCount} attempts
                      </div>
                      <div className="text-right">
                        <Pill tone={session.warmupPassed ? "success" : "neutral"}>
                          Warm-up {session.warmupPassed ? "pass" : "n/a"}
                        </Pill>
                      </div>
                      <div className="text-right">
                        <Pill tone={session.weeklyGatePassed ? "success" : "neutral"}>
                          Weekly {session.weeklyGatePassed ? "pass" : "n/a"}
                        </Pill>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No recent sessions"
                    message="Start a session to begin your live performance ledger."
                    action={(
                      <Link href="/session">
                        <Button className="gap-2">
                          Start now <Sparkles size={15} />
                        </Button>
                      </Link>
                    )}
                  />
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      ) : null}

      {!loading && !error && !overview ? (
        <Card>
          <EmptyState
            title="Dashboard unavailable"
            message="Database is not configured for this environment."
            action={(
              <Link href="/today">
                <Button className="gap-2">
                  Back to Today <TrendingUp size={16} />
                </Button>
              </Link>
            )}
          />
        </Card>
      ) : null}
    </div>
  );
}
