"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  Flame,
  Gauge,
  MoonStar,
  PlayCircle,
  RefreshCcw,
  ShieldCheck,
  SquarePen,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import type { OnboardingStartLane } from "@/hifzer/profile/onboarding";
import { readSessionCache, writeSessionCache } from "@/lib/client-session-cache";
import styles from "./dashboard.module.css";

const AreaTrend = dynamic(
  () => import("@/components/charts/area-trend").then((mod) => mod.AreaTrend),
  { ssr: false, loading: () => <ChartBlockSkeleton height={140} /> },
);

const DonutProgress = dynamic(
  () => import("@/components/charts/donut-progress").then((mod) => mod.DonutProgress),
  { ssr: false, loading: () => <DonutSkeleton /> },
);

const Sparkline = dynamic(
  () => import("@/components/charts/sparkline").then((mod) => mod.Sparkline),
  { ssr: false, loading: () => <SparklineSkeleton /> },
);

const DashboardFirstRunGuide = dynamic(
  () => import("@/components/app/dashboard-first-run-guide").then((mod) => mod.DashboardFirstRunGuide),
  { ssr: false, loading: () => <GuideSkeleton /> },
);

export type DashboardOverview = {
  generatedAt: string;
  profile: {
    mode: "NORMAL" | "CONSOLIDATION" | "CATCH_UP";
    timezone: string;
    dailyMinutes: number;
    practiceDaysPerWeek: number;
    reminderTimeLocal: string;
    onboardingStartLane: OnboardingStartLane | null;
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
    reviewDebtMinutes: number;
    debtRatioPct: number;
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

const DASHBOARD_CACHE_KEY = "hifzer.dashboard.overview.v1";
const DASHBOARD_CACHE_TTL_MS = 2 * 60 * 1000;

function statusPill(status: DashboardOverview["today"]["status"]): { tone: "neutral" | "accent" | "success"; label: string } {
  if (status === "completed") {
    return { tone: "success", label: "Today completed" };
  }
  if (status === "in_progress") {
    return { tone: "accent", label: "Session in progress" };
  }
  return { tone: "neutral", label: "Not started today" };
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
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

function GuideSkeleton() {
  return (
    <Card className="min-h-[180px]">
      <div className="h-5 w-28 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
      <div className="mt-4 h-8 w-[52%] animate-pulse rounded-2xl bg-[color:var(--kw-skeleton)]" />
      <div className="mt-3 h-4 w-[78%] animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-[18px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-skeleton)]"
          />
        ))}
      </div>
    </Card>
  );
}

function ChartBlockSkeleton(props: { height: number }) {
  return (
    <div
      className="animate-pulse rounded-[18px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-skeleton)]"
      style={{ height: `${props.height}px` }}
    />
  );
}

function SparklineSkeleton() {
  return <div className="mt-[18px] h-7 w-full animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />;
}

function DonutSkeleton() {
  return <div className="h-24 w-24 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />;
}

function iconToneClass(tone: "accent" | "neutral" | "warn"): string {
  if (tone === "warn") {
    return styles.iconWarn;
  }
  if (tone === "neutral") {
    return styles.iconNeutral;
  }
  return styles.iconAccent;
}

function QuickActionCard(props: {
  href: string;
  eyebrow: string;
  title: string;
  note?: ReactNode;
  icon: LucideIcon;
  tone?: "accent" | "neutral";
}) {
  const Icon = props.icon;
  return (
    <Link
      href={props.href}
      className={clsx(styles.actionTile, "group")}
      data-tone={props.tone ?? "neutral"}
    >
      <span className={clsx(styles.iconBadge, iconToneClass(props.tone === "accent" ? "accent" : "neutral"))}>
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className={styles.actionEyebrow}>{props.eyebrow}</p>
        <p className={styles.actionTitle}>{props.title}</p>
        {props.note ? <p className={styles.actionNote}>{props.note}</p> : null}
      </div>
      <ArrowRight size={15} className="text-[color:var(--kw-faint)] transition group-hover:text-[rgba(var(--kw-accent-rgb),1)]" />
    </Link>
  );
}

function MetricTile(props: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon: LucideIcon;
  tone: "accent" | "neutral" | "warn";
  foot?: ReactNode;
  delayMs?: number;
}) {
  const Icon = props.icon;
  return (
    <div className="kw-fade-in h-full" style={{ animationDelay: `${props.delayMs ?? 0}ms` }}>
      <Card className={`${styles.metricCard} h-full`}>
        <div className={styles.metricHeader}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">
              {props.label}
            </p>
            <div className={`${styles.numericValue} mt-3 text-3xl text-[color:var(--kw-ink)]`}>
              {props.value}
            </div>
            {props.detail ? (
              <p className={`${styles.metricBody} mt-2 text-sm leading-6 text-[color:var(--kw-muted)]`}>
                {props.detail}
              </p>
            ) : null}
          </div>
          <span className={clsx(styles.iconBadge, iconToneClass(props.tone))}>
            <Icon size={17} />
          </span>
        </div>
        {props.foot ? <div className={styles.metricFoot}>{props.foot}</div> : null}
      </Card>
    </div>
  );
}

function SectionHeader(props: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  icon: LucideIcon;
  tone?: "accent" | "neutral" | "warn";
  meta?: ReactNode;
}) {
  const Icon = props.icon;
  return (
    <div className={styles.sectionHeader}>
      <div className="flex items-start gap-3">
        <span className={clsx(styles.iconBadge, iconToneClass(props.tone ?? "neutral"))}>
          <Icon size={17} />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">
            {props.eyebrow}
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {props.title}
          </p>
          {props.description ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[color:var(--kw-muted)]">
              {props.description}
            </p>
          ) : null}
        </div>
      </div>
      {props.meta ? <div className="flex shrink-0 flex-wrap items-center gap-2">{props.meta}</div> : null}
    </div>
  );
}

function readCachedDashboardOverview() {
  return readSessionCache<DashboardOverview>(DASHBOARD_CACHE_KEY, DASHBOARD_CACHE_TTL_MS);
}

export function DashboardClient(props: { initialOverview?: DashboardOverview | null }) {
  const [loading, setLoading] = useState(() => !props.initialOverview && !readCachedDashboardOverview());
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(() => props.initialOverview ?? readCachedDashboardOverview());
  const [monthCursor, setMonthCursor] = useState(0);

  async function load() {
    if (!overview) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch("/api/dashboard/overview", { cache: "no-store" });
      const payload = (await res.json()) as DashboardPayload & { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to load dashboard.");
      }
      setOverview(payload.overview);
      writeSessionCache(DASHBOARD_CACHE_KEY, payload.overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!props.initialOverview) {
      void load();
    }
    // `load` intentionally stays local so this effect only keys off server-provided hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.initialOverview]);

  useEffect(() => {
    if (!props.initialOverview) {
      return;
    }
    writeSessionCache(DASHBOARD_CACHE_KEY, props.initialOverview);
  }, [props.initialOverview]);

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
      return [] as Array<{ key: string; blank: boolean; day: number; date: string; value: number; isFuture: boolean; isToday: boolean }>;
    }
    const year = selectedMonthStart.getUTCFullYear();
    const monthIndex = selectedMonthStart.getUTCMonth();
    const firstWeekday = (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7;
    const daysInMonth = daysInMonthUtc(selectedMonthStart);
    const cells: Array<{ key: string; blank: boolean; day: number; date: string; value: number; isFuture: boolean; isToday: boolean }> = [];

    for (let idx = 0; idx < firstWeekday; idx += 1) {
      cells.push({
        key: `blank-${idx}`,
        blank: true,
        day: 0,
        date: "",
        value: 0,
        isFuture: false,
        isToday: false,
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
        isToday: date === overview.today.localDate,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" className="gap-2" onClick={() => void load()}>
              Refresh <RefreshCcw size={16} />
            </Button>
            <Link href="/hifz">
              <Button size="sm" className="gap-2">
                Open Hifz <ArrowRight size={16} />
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
        <div className="space-y-5">
          <DashboardFirstRunGuide overview={overview} initialLane={overview.profile.onboardingStartLane} />

          <section className={`kw-fade-in ${styles.commandDeck} px-4 py-4 sm:px-5 sm:py-5`}>
            <div className={styles.pulseOrb} />
            <div className={styles.driftOrb} />
            <div className="relative space-y-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="accent">Today</Pill>
                  {status ? <Pill tone={status.tone}>{status.label}</Pill> : null}
                  <span className="text-xs text-[color:var(--kw-faint)]">
                    Updated {new Date(overview.generatedAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className={styles.actionRail}>
                  <QuickActionCard
                    href="/hifz"
                    eyebrow="Hifz"
                    title="Open Hifz"
                    note={
                      overview.reviewHealth.dueNow > 0
                        ? `${overview.reviewHealth.dueNow} due now`
                        : "Ready"
                    }
                    icon={PlayCircle}
                    tone="accent"
                  />
                  <QuickActionCard
                    href="/quran/read?view=compact"
                    eyebrow="Qur'an"
                    title="Continue reading"
                    note={`${overview.quran.currentSurahName} | ${overview.quran.cursorRef}`}
                    icon={BookOpenText}
                  />
                  <QuickActionCard
                    href="/dua"
                    eyebrow="Dua"
                    title="Open dua"
                    icon={MoonStar}
                  />
                  <QuickActionCard
                    href="/journal"
                    eyebrow="Journal"
                    title="Open journal"
                    icon={SquarePen}
                  />
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <div className={`${styles.kpiTile} px-3 py-3`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Now</p>
                      <p className={`${styles.numericValue} mt-2 text-2xl text-[color:var(--kw-ink)]`}>
                        {overview.kpis.retentionScore14d}
                      </p>
                      <p className="mt-1 text-xs text-[color:var(--kw-muted)]">Recall score (14d)</p>
                    </div>
                    <span className={clsx(styles.iconBadge, styles.iconAccent)}>
                      <Gauge size={17} />
                    </span>
                  </div>
                </div>

                <div className={`${styles.kpiTile} px-3 py-3`}>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Reading place</p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--kw-ink)]">
                    {overview.quran.currentSurahName} | {overview.quran.cursorRef}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                    {overview.quran.currentSurahProgressPct}% through this surah
                  </p>
                </div>

                <div className={`${styles.kpiTile} px-3 py-3`}>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-3 text-xs text-[color:var(--kw-muted)]">
                      <span>Next review</span>
                      <strong className="text-right font-semibold text-[color:var(--kw-ink)]">
                        {formatMaybeDateTime(overview.reviewHealth.nextDueAt)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs text-[color:var(--kw-muted)]">
                      <span>Reminder</span>
                      <strong className="font-semibold text-[color:var(--kw-ink)]">{overview.profile.reminderTimeLocal}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs text-[color:var(--kw-muted)]">
                      <span>Timezone</span>
                      <strong className="font-semibold text-[color:var(--kw-ink)]">{overview.profile.timezone}</strong>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link href="/journal">
                      <Button variant="secondary" size="sm" className="gap-2">
                        Journal <SquarePen size={14} />
                      </Button>
                    </Link>
                    <Link href="/dua">
                      <Button size="sm" className="gap-2">
                        Dua <MoonStar size={14} />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className={`${styles.kpiTile} px-3 py-2.5`}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                    Due now
                  </p>
                  <p className={`${styles.numericValue} mt-1 text-2xl text-[color:var(--kw-ink)]`}>
                    {overview.reviewHealth.dueNow}
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--kw-muted)]">{overview.reviewHealth.weakTransitions} joins</p>
                </div>
                <div className={`${styles.kpiTile} px-3 py-2.5`}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                    Sessions (7d)
                  </p>
                  <p className={`${styles.numericValue} mt-1 text-2xl text-[color:var(--kw-ink)]`}>
                    {overview.kpis.completedSessions7d}
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--kw-muted)]">{overview.kpis.totalSessionMinutes7d} min</p>
                </div>
                <div className={`${styles.kpiTile} px-3 py-2.5`}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                    Qur&apos;an progress
                  </p>
                  <p className={`${styles.numericValue} mt-1 text-2xl text-[color:var(--kw-ink)]`}>
                    {overview.kpis.quranCompletionPct.toFixed(1)}%
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--kw-muted)]">{overview.quran.completedKhatmahCount} khatmah</p>
                </div>
                <div className={`${styles.kpiTile} px-3 py-2.5`}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                    Streak
                  </p>
                  <p className={`${styles.numericValue} mt-1 text-2xl text-[color:var(--kw-ink)]`}>
                    {overview.streak.currentStreakDays}d
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--kw-muted)]">
                    {overview.streak.todayQualifiedAyahs} ayahs today
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              label="Practice time (7d)"
              value={overview.kpis.totalSessionMinutes7d}
              detail={`${overview.kpis.avgSessionMinutes7d.toFixed(1)} min avg`}
              icon={Clock3}
              tone="accent"
              delayMs={40}
              foot={<Sparkline values={overview.sessionTrend14d.map((d) => d.minutes)} tone="accent" className={styles.metricSparkline} />}
            />

            <MetricTile
              label="Recall score"
              value={overview.kpis.retentionScore14d}
              icon={Gauge}
              tone="neutral"
              delayMs={80}
              foot={<Sparkline values={trendRecall} tone="brand" className={styles.metricSparkline} />}
            />

            <MetricTile
              label="Due review"
              value={overview.reviewHealth.dueNow}
              detail={overview.reviewHealth.dueSoon6h > 0 ? `${overview.reviewHealth.dueSoon6h} later today` : undefined}
              icon={RefreshCcw}
              tone="warn"
              delayMs={120}
              foot={(
                <p className={`${styles.metricDate} text-xs text-[color:var(--kw-faint)]`} title={formatMaybeDateTime(overview.reviewHealth.nextDueAt)}>
                  {formatMaybeDateTime(overview.reviewHealth.nextDueAt)}
                </p>
              )}
            />

            <MetricTile
              label="Streak"
              value={`${overview.streak.currentStreakDays}d`}
              detail={`Best ${overview.streak.bestStreakDays}d${overview.streak.graceInUseToday ? " | grace" : ""}`}
              icon={Flame}
              tone="accent"
              delayMs={160}
              foot={<Pill tone="neutral">Today ayahs: {overview.streak.todayQualifiedAyahs}</Pill>}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="kw-fade-in h-full" style={{ animationDelay: "200ms" }}>
              <Card className="h-full">
                <SectionHeader
                  eyebrow="Practice"
                  title="Last 14 days"
                  icon={TrendingUp}
                  tone="accent"
                  meta={<Pill tone="accent">{overview.profile.timezone}</Pill>}
                />
                <div className="mt-4">
                  <AreaTrend points={trendMinutes} tone="accent" valueSuffix="m" />
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Tracked ayahs</p>
                    <p className={`${styles.numericValue} mt-1 text-lg text-[color:var(--kw-ink)]`}>{overview.kpis.trackedAyahs}</p>
                  </div>
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Joins to fix</p>
                    <p className={`${styles.numericValue} mt-1 text-lg text-[color:var(--kw-ink)]`}>{overview.reviewHealth.weakTransitions}</p>
                  </div>
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Practice days</p>
                    <p className={`${styles.numericValue} mt-1 text-lg text-[color:var(--kw-ink)]`}>{overview.profile.practiceDaysPerWeek}/7</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="kw-fade-in h-full" style={{ animationDelay: "240ms" }}>
              <Card className="h-full">
                <SectionHeader
                  eyebrow="Recall"
                  title="How recent sessions felt"
                  icon={ShieldCheck}
                  tone="accent"
                  meta={<Pill tone="neutral">14d</Pill>}
                />

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

                <div className="mt-4 flex flex-wrap gap-2">
                  <Pill tone="danger">Again {overview.gradeMix14d.AGAIN}</Pill>
                  <Pill tone="warn">Hard {overview.gradeMix14d.HARD}</Pill>
                  <Pill tone="success">Good {overview.gradeMix14d.GOOD}</Pill>
                  <Pill tone="accent">Easy {overview.gradeMix14d.EASY}</Pill>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Needs work</p>
                    <p className={`${styles.numericValue} mt-1 text-base text-[color:var(--kw-ink)]`}>
                      {overview.gradeMix14d.AGAIN} / {overview.gradeMix14d.HARD}
                    </p>
                  </div>
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Clean answers</p>
                    <p className={`${styles.numericValue} mt-1 text-base text-[color:var(--kw-ink)]`}>
                      {overview.gradeMix14d.GOOD} / {overview.gradeMix14d.EASY}
                    </p>
                  </div>
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Review work</p>
                    <p className={`${styles.numericValue} mt-1 text-base text-[color:var(--kw-ink)]`}>
                      {overview.stageMix14d.WARMUP + overview.stageMix14d.REVIEW}
                    </p>
                  </div>
                  <div className={`${styles.kpiTile} px-3 py-2`}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">New work</p>
                    <p className={`${styles.numericValue} mt-1 text-base text-[color:var(--kw-ink)]`}>
                      {overview.stageMix14d.NEW + overview.stageMix14d.LINK + overview.stageMix14d.LINK_REPAIR}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="kw-fade-in h-full" style={{ animationDelay: "280ms" }}>
              <Card className="h-full">
                <SectionHeader
                  eyebrow="Qur&apos;an"
                  title={`${overview.quran.currentSurahName} | ${overview.quran.cursorRef}`}
                  icon={BookOpenText}
                  tone="accent"
                  meta={<Pill tone="accent">Ayah {overview.quran.cursorAyahId}</Pill>}
                />

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
                      <Pill tone="neutral">Khatmah {overview.quran.completedKhatmahCount}</Pill>
                      <Pill tone="neutral">Last 7 days: {overview.quran.browseRecitedAyahs7d} ayahs</Pill>
                      <Pill tone="neutral">Last 14 days: {overview.quran.uniqueSurahsRecited14d} surahs</Pill>
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
            </div>

            <div className="kw-fade-in h-full" style={{ animationDelay: "320ms" }}>
              <Card className="h-full">
                <SectionHeader
                  eyebrow="Consistency"
                  title="Activity calendar"
                  icon={CalendarDays}
                  tone="neutral"
                />
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
                        data-today={cell.isToday ? "1" : "0"}
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
            </div>
          </div>
        </div>
      ) : null}

      {!loading && !error && !overview ? (
        <Card>
          <EmptyState
            title="Dashboard unavailable"
            message="Database is not configured for this environment."
            action={(
              <Link href="/dashboard">
                <Button className="gap-2">
                  Back to dashboard <TrendingUp size={16} />
                </Button>
              </Link>
            )}
          />
        </Card>
      ) : null}
    </div>
  );
}
