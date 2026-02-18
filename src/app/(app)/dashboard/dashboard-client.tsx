"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookMarked,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Compass,
  PlayCircle,
  RefreshCcw,
  TrendingUp,
} from "lucide-react";
import { AreaTrend } from "@/components/charts/area-trend";
import { DonutProgress } from "@/components/charts/donut-progress";
import { Sparkline } from "@/components/charts/sparkline";
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
  activityByDate: Array<{
    date: string;
    value: number;
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

function activityColor(value: number, max: number): string {
  if (value <= 0) {
    return "rgba(10,138,119,0.07)";
  }
  const pct = value / Math.max(1, max);
  if (pct < 0.2) {
    return "rgba(16,185,129,0.24)";
  }
  if (pct < 0.45) {
    return "rgba(16,185,129,0.38)";
  }
  if (pct < 0.7) {
    return "rgba(16,185,129,0.58)";
  }
  return "rgba(16,185,129,0.82)";
}

function monthStartFromIso(isoDate: string): Date {
  const [y, m] = isoDate.split("-").map((v) => Number(v));
  if (!y || !m) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  return new Date(Date.UTC(y, m - 1, 1));
}

function addMonthsUtc(base: Date, offset: number): Date {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + offset, 1));
}

function daysInMonthUtc(base: Date): number {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
}

function isoDateUtc(year: number, monthIndex: number, day: number): string {
  return new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);
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
  const [monthCursor, setMonthCursor] = useState(0);
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
  const activityByDate = useMemo(() => {
    if (!overview) {
      return new Map<string, number>();
    }
    return new Map(overview.activityByDate.map((entry) => [entry.date, entry.value]));
  }, [overview]);

  const baseMonthStart = useMemo(
    () => monthStartFromIso(overview?.today.localDate ?? new Date().toISOString().slice(0, 10)),
    [overview],
  );

  const selectedMonthStart = useMemo(
    () => addMonthsUtc(baseMonthStart, monthCursor),
    [baseMonthStart, monthCursor],
  );

  const currentMonthSerial = (baseMonthStart.getUTCFullYear() * 12) + baseMonthStart.getUTCMonth();
  const selectedMonthSerial = (selectedMonthStart.getUTCFullYear() * 12) + selectedMonthStart.getUTCMonth();
  const canGoPreviousMonth = selectedMonthSerial > (currentMonthSerial - 12);
  const canGoNextMonth = selectedMonthSerial < (currentMonthSerial + 3);

  const calendarCells = useMemo(() => {
    if (!overview) {
      return [] as Array<{ key: string; blank: boolean; day: number; date: string; value: number; isFuture: boolean }>;
    }
    const year = selectedMonthStart.getUTCFullYear();
    const monthIndex = selectedMonthStart.getUTCMonth();
    const firstWeekday = (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7;
    const daysInMonth = daysInMonthUtc(selectedMonthStart);
    const cells: Array<{ key: string; blank: boolean; day: number; date: string; value: number; isFuture: boolean }> = [];

    for (let idx = 0; idx < firstWeekday; idx += 1) {
      cells.push({
        key: `blank-${idx}`,
        blank: true,
        day: 0,
        date: "",
        value: 0,
        isFuture: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = isoDateUtc(year, monthIndex, day);
      cells.push({
        key: date,
        blank: false,
        day,
        date,
        value: activityByDate.get(date) ?? 0,
        isFuture: date > overview.today.localDate,
      });
    }

    return cells;
  }, [activityByDate, overview, selectedMonthStart]);

  const calendarMax = useMemo(
    () => Math.max(1, ...calendarCells.filter((cell) => !cell.blank).map((cell) => cell.value)),
    [calendarCells],
  );

  const recitationQuality = useMemo(() => {
    if (!overview) {
      return { qualityPct: 0, stabilityPct: 0, gradeArc: "conic-gradient(#e2e8f0 0 100%)", stageArc: "conic-gradient(#e2e8f0 0 100%)" };
    }
    const totalGrades = overview.gradeMix14d.AGAIN + overview.gradeMix14d.HARD + overview.gradeMix14d.GOOD + overview.gradeMix14d.EASY;
    const qualityPct = totalGrades > 0
      ? Math.round(((overview.gradeMix14d.GOOD + overview.gradeMix14d.EASY) / totalGrades) * 100)
      : 0;
    const stabilityPct = totalGrades > 0
      ? Math.round((overview.gradeMix14d.EASY / totalGrades) * 100)
      : 0;

    const againPct = totalGrades > 0 ? (overview.gradeMix14d.AGAIN / totalGrades) : 0;
    const hardPct = totalGrades > 0 ? (overview.gradeMix14d.HARD / totalGrades) : 0;
    const goodPct = totalGrades > 0 ? (overview.gradeMix14d.GOOD / totalGrades) : 0;
    const easyPct = totalGrades > 0 ? (overview.gradeMix14d.EASY / totalGrades) : 0;

    const stageTotal = overview.stageMix14d.WARMUP + overview.stageMix14d.REVIEW + overview.stageMix14d.NEW +
      overview.stageMix14d.LINK + overview.stageMix14d.WEEKLY_TEST + overview.stageMix14d.LINK_REPAIR;
    const warmReviewPct = stageTotal > 0 ? ((overview.stageMix14d.WARMUP + overview.stageMix14d.REVIEW) / stageTotal) : 0;
    const newPct = stageTotal > 0 ? (overview.stageMix14d.NEW / stageTotal) : 0;
    const linkPct = stageTotal > 0 ? ((overview.stageMix14d.LINK + overview.stageMix14d.LINK_REPAIR) / stageTotal) : 0;
    const weeklyPct = stageTotal > 0 ? (overview.stageMix14d.WEEKLY_TEST / stageTotal) : 0;

    const gradeArc = `conic-gradient(
      rgba(225,29,72,0.95) 0 ${(againPct * 100).toFixed(2)}%,
      rgba(234,88,12,0.95) ${(againPct * 100).toFixed(2)}% ${((againPct + hardPct) * 100).toFixed(2)}%,
      rgba(16,185,129,0.95) ${((againPct + hardPct) * 100).toFixed(2)}% ${((againPct + hardPct + goodPct) * 100).toFixed(2)}%,
      rgba(var(--kw-accent-rgb),0.95) ${((againPct + hardPct + goodPct) * 100).toFixed(2)}% ${((againPct + hardPct + goodPct + easyPct) * 100).toFixed(2)}%,
      rgba(11,18,32,0.08) ${((againPct + hardPct + goodPct + easyPct) * 100).toFixed(2)}% 100%
    )`;

    const stageArc = `conic-gradient(
      rgba(var(--kw-accent-rgb),0.92) 0 ${(warmReviewPct * 100).toFixed(2)}%,
      rgba(56,189,248,0.92) ${(warmReviewPct * 100).toFixed(2)}% ${((warmReviewPct + newPct) * 100).toFixed(2)}%,
      rgba(251,146,60,0.92) ${((warmReviewPct + newPct) * 100).toFixed(2)}% ${((warmReviewPct + newPct + linkPct) * 100).toFixed(2)}%,
      rgba(99,102,241,0.92) ${((warmReviewPct + newPct + linkPct) * 100).toFixed(2)}% ${((warmReviewPct + newPct + linkPct + weeklyPct) * 100).toFixed(2)}%,
      rgba(11,18,32,0.08) ${((warmReviewPct + newPct + linkPct + weeklyPct) * 100).toFixed(2)}% 100%
    )`;

    return {
      qualityPct,
      stabilityPct,
      gradeArc,
      stageArc,
    };
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
            <motion.div
              className="h-full"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ ...cardTransition, delay: 0.2 }}
            >
              <Card className="h-full">
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

            <motion.div
              className="h-full"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ ...cardTransition, delay: 0.24 }}
            >
              <Card className="h-full">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Recitation quality</p>
                    <p className="mt-1 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                      Futuristic quality radar
                    </p>
                  </div>
                  <Pill tone="neutral">14d</Pill>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className={styles.qualityOrbWrap}>
                    <div className={styles.qualityOrb} style={{ background: recitationQuality.gradeArc }}>
                      <span className={styles.qualityOrbInner}>
                        <span className={styles.qualityOrbValue}>{recitationQuality.qualityPct}%</span>
                        <span className={styles.qualityOrbLabel}>Recall quality</span>
                      </span>
                    </div>
                  </div>
                  <div className={styles.qualityOrbWrap}>
                    <div className={styles.qualityOrb} style={{ background: recitationQuality.stageArc }}>
                      <span className={styles.qualityOrbInner}>
                        <span className={styles.qualityOrbValue}>{recitationQuality.stabilityPct}%</span>
                        <span className={styles.qualityOrbLabel}>Easy recall</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Again / Hard</p>
                    <p className="mt-1 text-base font-semibold text-[color:var(--kw-ink)]">
                      {overview.gradeMix14d.AGAIN} / {overview.gradeMix14d.HARD}
                    </p>
                  </div>
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Good / Easy</p>
                    <p className="mt-1 text-base font-semibold text-[color:var(--kw-ink)]">
                      {overview.gradeMix14d.GOOD} / {overview.gradeMix14d.EASY}
                    </p>
                  </div>
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Warmup + Review</p>
                    <p className="mt-1 text-base font-semibold text-[color:var(--kw-ink)]">
                      {overview.stageMix14d.WARMUP + overview.stageMix14d.REVIEW}
                    </p>
                  </div>
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">New + Link</p>
                    <p className="mt-1 text-base font-semibold text-[color:var(--kw-ink)]">
                      {overview.stageMix14d.NEW + overview.stageMix14d.LINK + overview.stageMix14d.LINK_REPAIR}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <motion.div
              className="h-full"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ ...cardTransition, delay: 0.28 }}
            >
              <Card className="h-full">
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

            <motion.div
              className="h-full"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ ...cardTransition, delay: 0.32 }}
            >
              <Card className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Review health map</p>
                    <p className="mt-1 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">Monthly activity calendar</p>
                  </div>
                  <CalendarDays size={18} className="text-[color:var(--kw-muted)]" />
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1"
                      onClick={() => setMonthCursor((prev) => prev - 1)}
                      disabled={!canGoPreviousMonth}
                    >
                      <ChevronLeft size={14} />
                      Prev
                    </Button>
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                      {selectedMonthStart.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" })}
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1"
                      onClick={() => setMonthCursor((prev) => prev + 1)}
                      disabled={!canGoNextMonth}
                    >
                      Next
                      <ChevronRight size={14} />
                    </Button>
                  </div>

                  <div className={styles.calendarWeekdays}>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((weekday) => (
                      <span key={weekday}>{weekday}</span>
                    ))}
                  </div>

                  <div className={styles.calendarGrid} aria-label="Monthly activity calendar">
                    {calendarCells.map((cell) => (
                      <span
                        key={cell.key}
                        title={cell.blank ? "" : `${formatLocalDate(cell.date)}: ${cell.value}`}
                        className={cell.blank ? styles.calendarBlank : styles.calendarCell}
                        data-future={cell.isFuture ? "1" : "0"}
                        style={cell.blank ? undefined : { backgroundColor: activityColor(cell.value, calendarMax) }}
                      >
                        {cell.blank ? "" : cell.day}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--kw-faint)]">
                    <span>Low</span>
                    <span className={styles.legendCircle} style={{ backgroundColor: activityColor(0, calendarMax) }} />
                    <span className={styles.legendCircle} style={{ backgroundColor: activityColor(Math.ceil(calendarMax * 0.2), calendarMax) }} />
                    <span className={styles.legendCircle} style={{ backgroundColor: activityColor(Math.ceil(calendarMax * 0.45), calendarMax) }} />
                    <span className={styles.legendCircle} style={{ backgroundColor: activityColor(calendarMax, calendarMax) }} />
                    <span>High</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
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
