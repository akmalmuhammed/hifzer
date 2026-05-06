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
  Compass,
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
import { DisclosureCard } from "@/components/ui/disclosure-card";
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

const DashboardFirstRunGuide = dynamic(
  () => import("@/components/app/dashboard-first-run-guide").then((mod) => mod.DashboardFirstRunGuide),
  { ssr: false, loading: () => <GuideSkeleton /> },
);

const DashboardConnectedQuranCard = dynamic(
  () => import("@/components/app/dashboard-connected-quran-card").then((mod) => mod.DashboardConnectedQuranCard),
  { ssr: false, loading: () => <ChartBlockSkeleton height={220} /> },
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

type DashboardSummary = {
  generatedAt: string;
  profile: {
    timezone: string;
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
    retentionScore14d: number;
  };
  sessionTrend14d: Array<{
    date: string;
    minutes: number;
    recallEvents: number;
  }>;
  reviewHealth: {
    dueNow: number;
    dueSoon6h: number;
    nextDueAt: string | null;
  };
  quran: {
    cursorAyahId: number;
    cursorRef: string;
    currentSurahName: string;
  };
};

type DashboardDetails = {
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
    trackedAyahs: number;
  };
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
};

type DashboardDetailsPayload = {
  ok: true;
  details: DashboardDetails;
};

type DashboardSummaryPayload = {
  ok: true;
  summary: DashboardSummary;
};

type DashboardStreak = DashboardOverview["streak"];

type DashboardStreakPayload = {
  ok: true;
  streak: DashboardStreak;
};

type DashboardQuranDetails = {
  completionPct: number;
  currentSurahProgressPct: number;
  completedKhatmahCount: number;
  browseRecitedAyahs7d: number;
  uniqueSurahsRecited14d: number;
};

type DashboardQuranPayload = {
  ok: true;
  quran: DashboardQuranDetails;
};

type DashboardActivityPayload = {
  ok: true;
  activity: Array<{
    date: string;
    value: number;
  }>;
};

const DASHBOARD_SUMMARY_CACHE_KEY = "hifzer.dashboard.summary.v1";
const DASHBOARD_DETAILS_CACHE_KEY = "hifzer.dashboard.details.v1";
const DASHBOARD_STREAK_CACHE_KEY = "hifzer.dashboard.streak.v1";
const DASHBOARD_QURAN_CACHE_KEY = "hifzer.dashboard.quran.v1";
const DASHBOARD_ACTIVITY_CACHE_KEY = "hifzer.dashboard.activity.v1";
const DASHBOARD_CACHE_TTL_MS = 10 * 60 * 1000;

function statusPill(status: DashboardSummary["today"]["status"]): { tone: "neutral" | "accent" | "success"; label: string } {
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

function TodayStat(props: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className={styles.snapshotItem}>
      <p className={styles.snapshotLabel}>{props.label}</p>
      <p className={styles.snapshotValue}>{props.value}</p>
      {props.detail ? <p className={styles.snapshotDetail}>{props.detail}</p> : null}
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

function deriveSummaryFromOverview(overview: DashboardOverview): DashboardSummary {
  return {
    generatedAt: overview.generatedAt,
    profile: {
      timezone: overview.profile.timezone,
    },
    today: overview.today,
    kpis: {
      completedSessions7d: overview.kpis.completedSessions7d,
      totalSessionMinutes7d: overview.kpis.totalSessionMinutes7d,
      avgSessionMinutes7d: overview.kpis.avgSessionMinutes7d,
      retentionScore14d: overview.kpis.retentionScore14d,
    },
    sessionTrend14d: overview.sessionTrend14d.map((point) => ({
      date: point.date,
      minutes: point.minutes,
      recallEvents: point.recallEvents,
    })),
    reviewHealth: {
      dueNow: overview.reviewHealth.dueNow,
      dueSoon6h: overview.reviewHealth.dueSoon6h,
      nextDueAt: overview.reviewHealth.nextDueAt,
    },
    quran: {
      cursorAyahId: overview.quran.cursorAyahId,
      cursorRef: overview.quran.cursorRef,
      currentSurahName: overview.quran.currentSurahName,
    },
  };
}

function readCachedDashboardSummary() {
  return readSessionCache<DashboardSummary>(DASHBOARD_SUMMARY_CACHE_KEY, DASHBOARD_CACHE_TTL_MS);
}

function readCachedDashboardDetails() {
  return readSessionCache<DashboardDetails>(DASHBOARD_DETAILS_CACHE_KEY, DASHBOARD_CACHE_TTL_MS);
}

function readCachedDashboardStreak() {
  return readSessionCache<DashboardStreak>(DASHBOARD_STREAK_CACHE_KEY, DASHBOARD_CACHE_TTL_MS);
}

function readCachedDashboardQuran() {
  return readSessionCache<DashboardQuranDetails>(DASHBOARD_QURAN_CACHE_KEY, DASHBOARD_CACHE_TTL_MS);
}

function readCachedDashboardActivity() {
  return readSessionCache<Array<{ date: string; value: number }>>(DASHBOARD_ACTIVITY_CACHE_KEY, DASHBOARD_CACHE_TTL_MS);
}

export function DashboardClient(props: { initialOverview?: DashboardOverview | null }) {
  const initialDetails = props.initialOverview
    ? {
        generatedAt: props.initialOverview.generatedAt,
        profile: props.initialOverview.profile,
        today: props.initialOverview.today,
        kpis: {
          trackedAyahs: props.initialOverview.kpis.trackedAyahs,
        },
        gradeMix14d: props.initialOverview.gradeMix14d,
        stageMix14d: props.initialOverview.stageMix14d,
        reviewHealth: props.initialOverview.reviewHealth,
      }
    : readCachedDashboardDetails();
  const initialStreak = props.initialOverview?.streak ?? readCachedDashboardStreak();
  const initialQuran = props.initialOverview
    ? {
        completionPct: props.initialOverview.kpis.quranCompletionPct,
        currentSurahProgressPct: props.initialOverview.quran.currentSurahProgressPct,
        completedKhatmahCount: props.initialOverview.quran.completedKhatmahCount,
        browseRecitedAyahs7d: props.initialOverview.quran.browseRecitedAyahs7d,
        uniqueSurahsRecited14d: props.initialOverview.quran.uniqueSurahsRecited14d,
      }
    : readCachedDashboardQuran();
  const initialActivity = props.initialOverview?.activityByDate ?? readCachedDashboardActivity();
  const initialSummary = props.initialOverview
    ? deriveSummaryFromOverview(props.initialOverview)
    : readCachedDashboardSummary();

  const [loading, setLoading] = useState(() => !initialSummary);
  const [loadingDetails, setLoadingDetails] = useState(() => !initialDetails);
  const [loadingStreak, setLoadingStreak] = useState(() => !initialStreak);
  const [loadingQuran, setLoadingQuran] = useState(() => !initialQuran);
  const [loadingActivity, setLoadingActivity] = useState(() => !initialActivity);
  const [error, setError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [streakError, setStreakError] = useState<string | null>(null);
  const [quranError, setQuranError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(initialSummary);
  const [details, setDetails] = useState<DashboardDetails | null>(initialDetails);
  const [streak, setStreak] = useState<DashboardStreak | null>(initialStreak);
  const [quran, setQuran] = useState<DashboardQuranDetails | null>(initialQuran);
  const [activity, setActivity] = useState<Array<{ date: string; value: number }> | null>(initialActivity);
  const [monthCursor, setMonthCursor] = useState(0);

  async function loadSummary(force = false) {
    if (!summary || force) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch("/api/dashboard/overview?view=summary", { cache: "no-store" });
      const payload = (await res.json().catch(() => null)) as (DashboardSummaryPayload & { error?: string }) | null;
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to load dashboard.");
      }
      if (!payload?.summary) {
        throw new Error("Dashboard summary was empty.");
      }
      setSummary(payload.summary);
      writeSessionCache(DASHBOARD_SUMMARY_CACHE_KEY, payload.summary);
      return payload.summary;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function loadDetails(force = false) {
    if (!summary) {
      return null;
    }
    if (!details || force) {
      setLoadingDetails(true);
    }
    setDetailsError(null);
    try {
      const res = await fetch("/api/dashboard/overview?view=details", { cache: "no-store" });
      const payload = (await res.json().catch(() => null)) as (DashboardDetailsPayload & { error?: string }) | null;
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to load dashboard details.");
      }
      if (!payload?.details) {
        throw new Error("Dashboard details were empty.");
      }
      setDetails(payload.details);
      writeSessionCache(DASHBOARD_DETAILS_CACHE_KEY, payload.details);
      return payload.details;
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Failed to load dashboard details.");
      return null;
    } finally {
      setLoadingDetails(false);
    }
  }

  async function loadStreak(force = false) {
    if (!summary) {
      return null;
    }
    if (!streak || force) {
      setLoadingStreak(true);
    }
    setStreakError(null);
    try {
      const res = await fetch("/api/dashboard/overview?view=streak", { cache: "no-store" });
      const payload = (await res.json().catch(() => null)) as (DashboardStreakPayload & { error?: string }) | null;
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to load dashboard streak.");
      }
      if (!payload?.streak) {
        throw new Error("Dashboard streak was empty.");
      }
      setStreak(payload.streak);
      writeSessionCache(DASHBOARD_STREAK_CACHE_KEY, payload.streak);
      return payload.streak;
    } catch (err) {
      setStreakError(err instanceof Error ? err.message : "Failed to load dashboard streak.");
      return null;
    } finally {
      setLoadingStreak(false);
    }
  }

  async function loadQuran(force = false) {
    if (!summary) {
      return null;
    }
    if (!quran || force) {
      setLoadingQuran(true);
    }
    setQuranError(null);
    try {
      const res = await fetch("/api/dashboard/overview?view=quran", { cache: "no-store" });
      const payload = (await res.json().catch(() => null)) as (DashboardQuranPayload & { error?: string }) | null;
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to load Quran progress.");
      }
      if (!payload?.quran) {
        throw new Error("Quran progress was empty.");
      }
      setQuran(payload.quran);
      writeSessionCache(DASHBOARD_QURAN_CACHE_KEY, payload.quran);
      return payload.quran;
    } catch (err) {
      setQuranError(err instanceof Error ? err.message : "Failed to load Quran progress.");
      return null;
    } finally {
      setLoadingQuran(false);
    }
  }

  async function loadActivity(force = false) {
    if (!summary) {
      return null;
    }
    if (!activity || force) {
      setLoadingActivity(true);
    }
    setActivityError(null);
    try {
      const res = await fetch("/api/dashboard/overview?view=activity", { cache: "no-store" });
      const payload = (await res.json().catch(() => null)) as (DashboardActivityPayload & { error?: string }) | null;
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to load dashboard activity.");
      }
      if (!payload?.activity) {
        throw new Error("Dashboard activity was empty.");
      }
      setActivity(payload.activity);
      writeSessionCache(DASHBOARD_ACTIVITY_CACHE_KEY, payload.activity);
      return payload.activity;
    } catch (err) {
      setActivityError(err instanceof Error ? err.message : "Failed to load dashboard activity.");
      return null;
    } finally {
      setLoadingActivity(false);
    }
  }

  async function refreshDashboard() {
    const nextSummary = await loadSummary(true);
    if (nextSummary) {
      void loadDetails(true);
      void loadStreak(true);
      void loadQuran(true);
      void loadActivity(true);
    }
  }

  useEffect(() => {
    if (props.initialOverview) {
      const nextSummary = deriveSummaryFromOverview(props.initialOverview);
      writeSessionCache(DASHBOARD_SUMMARY_CACHE_KEY, nextSummary);
      writeSessionCache(DASHBOARD_DETAILS_CACHE_KEY, {
        generatedAt: props.initialOverview.generatedAt,
        profile: props.initialOverview.profile,
        today: props.initialOverview.today,
        kpis: { trackedAyahs: props.initialOverview.kpis.trackedAyahs },
        gradeMix14d: props.initialOverview.gradeMix14d,
        stageMix14d: props.initialOverview.stageMix14d,
        reviewHealth: props.initialOverview.reviewHealth,
      });
      writeSessionCache(DASHBOARD_STREAK_CACHE_KEY, props.initialOverview.streak);
      writeSessionCache(DASHBOARD_QURAN_CACHE_KEY, {
        completionPct: props.initialOverview.kpis.quranCompletionPct,
        currentSurahProgressPct: props.initialOverview.quran.currentSurahProgressPct,
        completedKhatmahCount: props.initialOverview.quran.completedKhatmahCount,
        browseRecitedAyahs7d: props.initialOverview.quran.browseRecitedAyahs7d,
        uniqueSurahsRecited14d: props.initialOverview.quran.uniqueSurahsRecited14d,
      });
      writeSessionCache(DASHBOARD_ACTIVITY_CACHE_KEY, props.initialOverview.activityByDate);
      return;
    }
    if (!summary) {
      void loadSummary();
    }
    // Intentionally scoped to hydration inputs; the loader manages its own state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.initialOverview, summary]);

  useEffect(() => {
    if (!summary || details) {
      return;
    }
    void loadDetails();
    // Intentionally waits until the lightweight summary is present.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, details]);

  useEffect(() => {
    if (!summary || streak) {
      return;
    }
    void loadStreak();
    // Intentionally waits until the lightweight summary is present.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, streak]);

  useEffect(() => {
    if (!summary || quran) {
      return;
    }
    void loadQuran();
    // Intentionally deferred until the summary is visible.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, quran]);

  useEffect(() => {
    if (!details || activity) {
      return;
    }
    const idleHandle =
      typeof window !== "undefined" && typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(() => {
            void loadActivity();
          }, { timeout: 1000 })
        : null;

    if (idleHandle != null) {
      return () => {
        window.cancelIdleCallback?.(idleHandle);
      };
    }

    const timeoutId = globalThis.setTimeout(() => {
      void loadActivity();
    }, 180);
    return () => {
      globalThis.clearTimeout(timeoutId);
    };
    // Intentionally staged behind the core detail payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, activity]);

  const trendMinutes = useMemo(
    () => summary?.sessionTrend14d.map((point) => ({ t: `${point.date}T00:00:00.000Z`, v: point.minutes })) ?? [],
    [summary],
  );
  const activityByDate = useMemo(() => {
    if (!activity) {
      return new Map<string, number>();
    }
    return new Map(activity.map((entry) => [entry.date, entry.value]));
  }, [activity]);

  const baseMonthStart = useMemo(
    () => monthStartFromIso((details ?? summary)?.today.localDate ?? new Date().toISOString().slice(0, 10)),
    [details, summary],
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
    if (!details) {
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
        isFuture: date > details.today.localDate,
        isToday: date === details.today.localDate,
      });
    }

    return cells;
  }, [activityByDate, details, selectedMonthStart]);

  const calendarMax = useMemo(
    () => Math.max(1, ...calendarCells.filter((cell) => !cell.blank).map((cell) => cell.value)),
    [calendarCells],
  );

  const recitationQuality = useMemo(() => {
    if (!details) {
      return { qualityPct: 0, stabilityPct: 0, gradeArc: "conic-gradient(#e2e8f0 0 100%)", stageArc: "conic-gradient(#e2e8f0 0 100%)" };
    }
    const totalGrades = details.gradeMix14d.AGAIN + details.gradeMix14d.HARD + details.gradeMix14d.GOOD + details.gradeMix14d.EASY;
    const qualityPct = totalGrades > 0
      ? Math.round(((details.gradeMix14d.GOOD + details.gradeMix14d.EASY) / totalGrades) * 100)
      : 0;
    const stabilityPct = totalGrades > 0
      ? Math.round((details.gradeMix14d.EASY / totalGrades) * 100)
      : 0;

    const againPct = totalGrades > 0 ? (details.gradeMix14d.AGAIN / totalGrades) : 0;
    const hardPct = totalGrades > 0 ? (details.gradeMix14d.HARD / totalGrades) : 0;
    const goodPct = totalGrades > 0 ? (details.gradeMix14d.GOOD / totalGrades) : 0;
    const easyPct = totalGrades > 0 ? (details.gradeMix14d.EASY / totalGrades) : 0;

    const stageTotal = details.stageMix14d.WARMUP + details.stageMix14d.REVIEW + details.stageMix14d.NEW +
      details.stageMix14d.LINK + details.stageMix14d.WEEKLY_TEST + details.stageMix14d.LINK_REPAIR;
    const warmReviewPct = stageTotal > 0 ? ((details.stageMix14d.WARMUP + details.stageMix14d.REVIEW) / stageTotal) : 0;
    const newPct = stageTotal > 0 ? (details.stageMix14d.NEW / stageTotal) : 0;
    const linkPct = stageTotal > 0 ? ((details.stageMix14d.LINK + details.stageMix14d.LINK_REPAIR) / stageTotal) : 0;
    const weeklyPct = stageTotal > 0 ? (details.stageMix14d.WEEKLY_TEST / stageTotal) : 0;

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
  }, [details]);

  const status = summary ? statusPill(summary.today.status) : null;
  const shouldShowGuide = Boolean(
    details &&
    summary &&
    summary.kpis.completedSessions7d === 0 &&
    summary.today.completedSessions === 0 &&
    summary.today.openSessions === 0,
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      {loading ? <DashboardSkeleton /> : null}

      {!loading && error ? (
        <Card>
          <EmptyState
            title="Dashboard unavailable"
            message={error}
            action={(
              <Button variant="secondary" className="gap-2" onClick={() => void refreshDashboard()}>
                Retry <RefreshCcw size={16} />
              </Button>
            )}
          />
        </Card>
      ) : null}

      {!loading && !error && summary ? (
        <div className="space-y-5">
          {shouldShowGuide && details ? (
            <DashboardFirstRunGuide overview={details} initialLane={details.profile.onboardingStartLane} />
          ) : null}

          <section className={`kw-fade-in ${styles.commandDeck} px-4 py-4 sm:px-5 sm:py-5`}>
            <div className={styles.pulseOrb} />
            <div className={styles.driftOrb} />
            <div className={`relative ${styles.todayGrid}`}>
              <div className={styles.todayMain}>
                <div className="flex flex-wrap items-center gap-2">
                  {status ? <Pill tone={status.tone}>{status.label}</Pill> : null}
                  {summary.reviewHealth.dueNow > 0 ? <Pill tone="warn">{summary.reviewHealth.dueNow} due</Pill> : null}
                </div>

                <p className={styles.todayKicker}>Today</p>
                <h2 className={styles.todayTitle}>Continue from {summary.quran.cursorRef}</h2>
                <p className={styles.todayBody}>
                  You are in {summary.quran.currentSurahName}. Read a little, review what is due, or leave a reflection when something lands.
                </p>

                <div className={styles.todayButtons}>
                  <Link href="/quran/read?view=compact">
                    <Button className="gap-2">
                      Continue reading <ArrowRight size={16} />
                    </Button>
                  </Link>
                  <Link href="/hifz">
                    <Button variant="secondary" className="gap-2">
                      {summary.reviewHealth.dueNow > 0 ? "Review Hifz" : "Open Hifz"} <PlayCircle size={16} />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                <div className={styles.compactActions}>
                  <QuickActionCard
                    href="/dua"
                    eyebrow="Dua"
                    title="Make dua"
                    note="Open a guided module."
                    icon={MoonStar}
                  />
                  <QuickActionCard
                    href="/journal"
                    eyebrow="Journal"
                    title="Reflect"
                    note="Save a private note."
                    icon={SquarePen}
                  />
                </div>
                {shouldShowGuide ? (
                  <p className="text-sm leading-7 text-[color:var(--kw-muted)]">
                    Start with reading or Hifz first. Dua and reflection can wait.
                  </p>
                ) : null}
              </div>

              <div className={`${styles.snapshotRail} xl:col-span-2`}>
                <TodayStat
                  label="Streak"
                  value={streak ? `${streak.currentStreakDays}d` : loadingStreak ? "..." : "Not ready"}
                  detail={streak ? `Best ${streak.bestStreakDays}d` : (streakError ?? "Loading")}
                />
                <TodayStat
                  label="Review"
                  value={summary.reviewHealth.dueNow}
                  detail={summary.reviewHealth.dueSoon6h > 0 ? `${summary.reviewHealth.dueSoon6h} later today` : "Clear now"}
                />
                <TodayStat
                  label="This week"
                  value={`${summary.kpis.totalSessionMinutes7d}m`}
                  detail={`${summary.kpis.completedSessions7d} sessions`}
                />
                <TodayStat
                  label="Recall"
                  value={summary.kpis.retentionScore14d}
                  detail="Last 14 days"
                />
              </div>
            </div>
          </section>

          <div className="kw-fade-in" style={{ animationDelay: "36ms" }}>
            <DashboardConnectedQuranCard mode="simple" />
          </div>

          <DisclosureCard
            summary={(
              <div>
                <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Progress and details</p>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
                  Charts, recall, reading progress, and activity.
                </p>
              </div>
            )}
          >
            {!details ? (
              <div className="space-y-4">
                {loadingDetails ? (
                  <>
                    <ChartBlockSkeleton height={220} />
                    <div className="grid gap-4 xl:grid-cols-2">
                      <ChartBlockSkeleton height={320} />
                      <ChartBlockSkeleton height={320} />
                    </div>
                    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                      <ChartBlockSkeleton height={280} />
                      <ChartBlockSkeleton height={280} />
                    </div>
                  </>
                ) : (
                  <EmptyState
                    title="Detailed insights unavailable"
                    message={detailsError ?? "The full dashboard details could not be loaded yet."}
                    action={(
                      <Button variant="secondary" className="gap-2" onClick={() => void loadDetails(true)}>
                        Retry details <RefreshCcw size={16} />
                      </Button>
                    )}
                  />
                )}
              </div>
            ) : (
            <div className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-2">
                <div className="kw-fade-in h-full" style={{ animationDelay: "200ms" }}>
                  <Card className="h-full">
                    <SectionHeader
                      eyebrow="Practice"
                      title="Last 14 days"
                      icon={TrendingUp}
                      tone="accent"
                      meta={<Pill tone="accent">{details.profile.timezone}</Pill>}
                    />
                    <div className="mt-4">
                      <AreaTrend points={trendMinutes} tone="accent" valueSuffix="m" />
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <div className={`${styles.kpiTile} px-3 py-2`}>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Tracked ayahs</p>
                        <p className={`${styles.numericValue} mt-1 text-lg text-[color:var(--kw-ink)]`}>{details.kpis.trackedAyahs}</p>
                      </div>
                      <div className={`${styles.kpiTile} px-3 py-2`}>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Joins to fix</p>
                        <p className={`${styles.numericValue} mt-1 text-lg text-[color:var(--kw-ink)]`}>{details.reviewHealth.weakTransitions}</p>
                      </div>
                      <div className={`${styles.kpiTile} px-3 py-2`}>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Practice days</p>
                        <p className={`${styles.numericValue} mt-1 text-lg text-[color:var(--kw-ink)]`}>{details.profile.practiceDaysPerWeek}/7</p>
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
                      <Pill tone="danger">Again {details.gradeMix14d.AGAIN}</Pill>
                      <Pill tone="warn">Hard {details.gradeMix14d.HARD}</Pill>
                      <Pill tone="success">Good {details.gradeMix14d.GOOD}</Pill>
                      <Pill tone="accent">Easy {details.gradeMix14d.EASY}</Pill>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div className={`${styles.kpiTile} px-3 py-2`}>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Needs work</p>
                        <p className={`${styles.numericValue} mt-1 text-base text-[color:var(--kw-ink)]`}>
                          {details.gradeMix14d.AGAIN} / {details.gradeMix14d.HARD}
                        </p>
                      </div>
                      <div className={`${styles.kpiTile} px-3 py-2`}>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Clean answers</p>
                        <p className={`${styles.numericValue} mt-1 text-base text-[color:var(--kw-ink)]`}>
                          {details.gradeMix14d.GOOD} / {details.gradeMix14d.EASY}
                        </p>
                      </div>
                      <div className={`${styles.kpiTile} px-3 py-2`}>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Review work</p>
                        <p className={`${styles.numericValue} mt-1 text-base text-[color:var(--kw-ink)]`}>
                          {details.stageMix14d.WARMUP + details.stageMix14d.REVIEW}
                        </p>
                      </div>
                      <div className={`${styles.kpiTile} px-3 py-2`}>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">New work</p>
                        <p className={`${styles.numericValue} mt-1 text-base text-[color:var(--kw-ink)]`}>
                          {details.stageMix14d.NEW + details.stageMix14d.LINK + details.stageMix14d.LINK_REPAIR}
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
                      title={`${summary.quran.currentSurahName} | ${summary.quran.cursorRef}`}
                      icon={BookOpenText}
                      tone="accent"
                      meta={<Pill tone="accent">Ayah {summary.quran.cursorAyahId}</Pill>}
                    />

                    {quran ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                        <div className="flex items-center justify-center rounded-[18px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] p-3">
                          <DonutProgress value={quran.completionPct / 100} size={96} stroke={8} tone="brand" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-[color:var(--kw-muted)]">
                            Completion {quran.completionPct.toFixed(1)}% | Surah progress {quran.currentSurahProgressPct}%
                          </p>
                          <div className="h-2 rounded-full bg-black/[0.06]">
                            <div
                              className="h-2 rounded-full bg-[rgba(var(--kw-accent-rgb),0.82)]"
                              style={{ width: `${Math.max(1, quran.completionPct)}%` }}
                            />
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Pill tone="neutral">Khatmah {quran.completedKhatmahCount}</Pill>
                            <Pill tone="neutral">Last 7 days: {quran.browseRecitedAyahs7d} ayahs</Pill>
                            <Pill tone="neutral">Last 14 days: {quran.uniqueSurahsRecited14d} surahs</Pill>
                          </div>
                        </div>
                      </div>
                    ) : loadingQuran ? (
                      <div className="mt-4">
                        <ChartBlockSkeleton height={180} />
                      </div>
                    ) : (
                      <EmptyState
                        title="Qur'an progress unavailable"
                        message={quranError ?? "The Qur'an progress summary could not be loaded yet."}
                        action={(
                          <Button variant="secondary" className="gap-2" onClick={() => void loadQuran(true)}>
                            Retry Qur&apos;an progress <RefreshCcw size={16} />
                          </Button>
                        )}
                      />
                    )}

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
                    {!activity ? (
                      loadingActivity ? (
                        <div className="mt-4">
                          <ChartBlockSkeleton height={260} />
                        </div>
                      ) : (
                        <div className="mt-4">
                          <EmptyState
                            title="Activity unavailable"
                            message={activityError ?? "The calendar could not be loaded yet."}
                            action={(
                              <Button variant="secondary" className="gap-2" onClick={() => void loadActivity(true)}>
                                Retry calendar <RefreshCcw size={16} />
                              </Button>
                            )}
                          />
                        </div>
                      )
                    ) : (
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
                    )}
                  </Card>
                </div>
              </div>
            </div>
            )}
          </DisclosureCard>
        </div>
      ) : null}

      {!loading && !error && !summary ? (
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
