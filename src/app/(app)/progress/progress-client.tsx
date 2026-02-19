"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, CalendarDays, PlayCircle, RefreshCcw, TrendingUp } from "lucide-react";
import { DonutProgress } from "@/components/charts/donut-progress";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";

type SessionMode = "NORMAL" | "CONSOLIDATION" | "CATCH_UP";
type GradeKey = "AGAIN" | "HARD" | "GOOD" | "EASY";
type GradeCounts = Record<GradeKey, number>;

type ProgressSummaryPayload = {
  ok: true;
  generatedAt: string;
  localDate: string;
  hifz: {
    sessions7d: number;
    sessions30d: number;
    practiceMinutes7d: number;
    avgSessionMinutes7d: number;
    recallEvents7d: number;
    avgRecallDurationSec7d: number;
    trackedAyahs: number;
    dueNow: number;
    gradeCounts14d: GradeCounts;
    recentSessions: Array<{
      id: string;
      localDate: string;
      mode: SessionMode;
      durationMinutes: number;
      recallEvents: number;
      warmupPassed: boolean | null;
      weeklyGatePassed: boolean | null;
    }>;
  };
  quran: {
    ayahsRecited: number;
    ayahsLeft: number;
    ayahCoveragePct: number;
    surahsCovered: number;
    surahsLeft: number;
    surahCoveragePct: number;
    completionKhatmahCount: number;
    lastReadAyahId: number | null;
    lastReadAt: string | null;
    currentSurah: {
      surahNumber: number;
      name: string;
      recitedAyahs: number;
      totalAyahs: number;
      ayahsLeft: number;
      coveragePct: number;
      lastReadRef: string;
    };
  };
};

const GRADE_ROWS: Array<{
  key: GradeKey;
  label: string;
  tone: "danger" | "warn" | "accent" | "success";
  barColor: string;
}> = [
  { key: "AGAIN", label: "Again", tone: "danger", barColor: "rgb(244 63 94)" },
  { key: "HARD", label: "Hard", tone: "warn", barColor: "rgb(234 179 8)" },
  { key: "GOOD", label: "Good", tone: "accent", barColor: "rgba(var(--kw-accent-rgb),0.95)" },
  { key: "EASY", label: "Easy", tone: "success", barColor: "rgb(22 163 74)" },
];

function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map((value) => Number(value));
  if (!year || !month || !day) {
    return isoDate;
  }
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not available yet";
  }
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function modeLabel(mode: SessionMode): string {
  if (mode === "CONSOLIDATION") {
    return "Consolidation";
  }
  if (mode === "CATCH_UP") {
    return "Catch-up";
  }
  return "Normal";
}

function gateTone(value: boolean | null): "success" | "warn" | "neutral" {
  if (value === true) {
    return "success";
  }
  if (value === false) {
    return "warn";
  }
  return "neutral";
}

function gateText(label: string, value: boolean | null): string {
  if (value === true) {
    return `${label} pass`;
  }
  if (value === false) {
    return `${label} retry`;
  }
  return `${label} n/a`;
}

function buildContinueQuranHref(payload: ProgressSummaryPayload["quran"]): string {
  const params = new URLSearchParams({
    view: "compact",
    surah: String(payload.currentSurah.surahNumber),
  });
  if (payload.lastReadAyahId) {
    params.set("cursor", String(payload.lastReadAyahId));
  }
  return `/quran/read?${params.toString()}`;
}

export function ProgressClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProgressSummaryPayload | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/progress/summary", { cache: "no-store" });
      const payload = (await res.json()) as ProgressSummaryPayload & { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to load progress.");
      }
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load progress.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const gradeTotal = data
    ? data.hifz.gradeCounts14d.AGAIN +
      data.hifz.gradeCounts14d.HARD +
      data.hifz.gradeCounts14d.GOOD +
      data.hifz.gradeCounts14d.EASY
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Progress"
        title="Progress snapshot"
        subtitle="Simple per-user Hifz and Qur'an metrics synced from your sessions and reading."
        right={
          <div className="flex items-center gap-2">
            <Link href="/session">
              <Button className="gap-2">
                Start session <PlayCircle size={16} />
              </Button>
            </Link>
            <Button variant="secondary" className="gap-2" onClick={() => void load()}>
              Reload <RefreshCcw size={16} />
            </Button>
          </div>
        }
      />

      {loading ? (
        <>
          <Card className="min-h-[170px]">
            <div className="h-6 w-36 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
            <div className="mt-4 h-12 w-[65%] animate-pulse rounded-2xl bg-[color:var(--kw-skeleton)]" />
            <div className="mt-4 h-4 w-[42%] animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
          </Card>
          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <div className="h-4 w-28 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-2xl bg-[color:var(--kw-skeleton)]" />
                ))}
              </div>
            </Card>
            <Card>
              <div className="h-4 w-24 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
              <div className="mt-4 h-28 animate-pulse rounded-2xl bg-[color:var(--kw-skeleton)]" />
              <div className="mt-4 h-20 animate-pulse rounded-2xl bg-[color:var(--kw-skeleton)]" />
            </Card>
          </div>
          <Card>
            <div className="h-4 w-40 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-[color:var(--kw-skeleton)]" />
              ))}
            </div>
          </Card>
        </>
      ) : error ? (
        <Card>
          <EmptyState
            title="Progress unavailable"
            message={error}
            action={
              <Button onClick={() => void load()} className="gap-2">
                Retry <RefreshCcw size={16} />
              </Button>
            }
          />
        </Card>
      ) : data ? (
        <>
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[rgba(var(--kw-accent-rgb),0.12)]" />
            <div className="pointer-events-none absolute -bottom-24 -right-20 h-60 w-60 rounded-full bg-[rgba(11,18,32,0.06)]" />
            <div className="relative flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-2xl">
                <Pill tone="accent">Per-user progress</Pill>
                <h2 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-4xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-5xl">
                  Your Hifz sessions and Qur&apos;an reading in one place.
                </h2>
                <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                  Local date {formatIsoDate(data.localDate)} | Last refresh {formatDateTime(data.generatedAt)}
                </p>
              </div>
              <div className="grid gap-2 rounded-2xl border border-[color:var(--kw-border-2)] bg-white/75 p-4 text-sm shadow-[var(--kw-shadow-soft)]">
                <span className="text-[color:var(--kw-muted)]">Tracked ayahs</span>
                <span className="text-2xl font-semibold text-[color:var(--kw-ink)]">{data.hifz.trackedAyahs}</span>
                <span className="text-[color:var(--kw-muted)]">Qur&apos;an ayah coverage</span>
                <span className="text-lg font-semibold text-[color:var(--kw-ink)]">{data.quran.ayahCoveragePct.toFixed(1)}%</span>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-[color:var(--kw-faint)]" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Hifz progress</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="neutral">Sessions 7d: {data.hifz.sessions7d}</Pill>
                  <Pill tone="neutral">Sessions 30d: {data.hifz.sessions30d}</Pill>
                  <Pill tone={data.hifz.dueNow > 0 ? "warn" : "success"}>Due now: {data.hifz.dueNow}</Pill>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-[color:var(--kw-border-2)] bg-white/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">Practice time (7d)</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                    {data.hifz.practiceMinutes7d}m
                  </p>
                </div>
                <div className="rounded-2xl border border-[color:var(--kw-border-2)] bg-white/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">Avg session (7d)</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                    {data.hifz.avgSessionMinutes7d.toFixed(1)}m
                  </p>
                </div>
                <div className="rounded-2xl border border-[color:var(--kw-border-2)] bg-white/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">Recall events (7d)</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                    {data.hifz.recallEvents7d}
                  </p>
                </div>
                <div className="rounded-2xl border border-[color:var(--kw-border-2)] bg-white/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">Avg recall speed</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                    {data.hifz.avgRecallDurationSec7d}s
                  </p>
                </div>
                <div className="rounded-2xl border border-[color:var(--kw-border-2)] bg-white/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">Tracked ayahs</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                    {data.hifz.trackedAyahs}
                  </p>
                </div>
                <div className="rounded-2xl border border-[color:var(--kw-border-2)] bg-white/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">Due now</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{data.hifz.dueNow}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[color:var(--kw-border-2)] bg-white/65 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Grade mix (14d)</p>
                  <Pill tone="neutral">Total graded events: {gradeTotal}</Pill>
                </div>
                {gradeTotal > 0 ? (
                  <div className="mt-4 space-y-3">
                    {GRADE_ROWS.map((grade) => {
                      const value = data.hifz.gradeCounts14d[grade.key] ?? 0;
                      const pct = (value / gradeTotal) * 100;
                      return (
                        <div key={grade.key}>
                          <div className="flex items-center justify-between text-xs text-[color:var(--kw-muted)]">
                            <div className="flex items-center gap-2">
                              <Pill tone={grade.tone}>{grade.label}</Pill>
                              <span>{value}</span>
                            </div>
                            <span>{pct.toFixed(1)}%</span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/[0.08]">
                            <div
                              className="h-full rounded-full transition-[width]"
                              style={{
                                width: `${Math.max(0, Math.min(100, pct))}%`,
                                backgroundColor: grade.barColor,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[color:var(--kw-muted)]">
                    No graded recall events in the last 14 days yet.
                  </p>
                )}
                <div className="mt-4">
                  <Link href="/progress/transitions">
                    <Button variant="secondary" className="gap-2">
                      Weak transitions <ArrowRight size={16} />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-[color:var(--kw-faint)]" />
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Qur&apos;an progress</p>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <DonutProgress value={data.quran.ayahCoveragePct / 100} size={74} stroke={8} tone="accent" />
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                    {data.quran.ayahCoveragePct.toFixed(1)}%
                  </p>
                  <p className="text-xs text-[color:var(--kw-muted)]">Ayah coverage</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-[color:var(--kw-border-2)] bg-white/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">Ayahs recited</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                    {data.quran.ayahsRecited}
                  </p>
                </div>
                <div className="rounded-xl border border-[color:var(--kw-border-2)] bg-white/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">Ayahs left</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{data.quran.ayahsLeft}</p>
                </div>
                <div className="rounded-xl border border-[color:var(--kw-border-2)] bg-white/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">Surahs covered</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                    {data.quran.surahsCovered}
                  </p>
                </div>
                <div className="rounded-xl border border-[color:var(--kw-border-2)] bg-white/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">Surahs left</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{data.quran.surahsLeft}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 p-3">
                <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                  Surah {data.quran.currentSurah.surahNumber}: {data.quran.currentSurah.name}
                </p>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  Last read {data.quran.currentSurah.lastReadRef} | Updated {formatDateTime(data.quran.lastReadAt)}
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/[0.08]">
                  <div
                    className="h-full rounded-full bg-[rgba(var(--kw-accent-rgb),0.8)] transition-[width]"
                    style={{ width: `${Math.max(0, Math.min(100, data.quran.currentSurah.coveragePct))}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[color:var(--kw-muted)]">
                  {data.quran.currentSurah.recitedAyahs}/{data.quran.currentSurah.totalAyahs} ayahs recited (
                  {data.quran.currentSurah.ayahsLeft} left) | Surah coverage {data.quran.surahCoveragePct.toFixed(1)}%
                </p>
                <p className="mt-2 text-xs text-[color:var(--kw-muted)]">
                  Completed khatmah count: {data.quran.completionKhatmahCount}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link href={buildContinueQuranHref(data.quran)}>
                    <Button variant="secondary" className="gap-2">
                      Continue reading <ArrowRight size={16} />
                    </Button>
                  </Link>
                  <Link href="/quran">
                    <Button variant="ghost" className="gap-2">
                      Open Qur&apos;an <BookOpen size={16} />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-[color:var(--kw-faint)]" />
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Recent Hifz sessions
                </p>
              </div>
              <Pill tone="neutral">Showing latest {data.hifz.recentSessions.length}</Pill>
            </div>
            {data.hifz.recentSessions.length > 0 ? (
              <div className="mt-4 space-y-2">
                {data.hifz.recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-[color:var(--kw-border-2)] bg-white/65 px-3 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone="neutral">{formatIsoDate(session.localDate)}</Pill>
                        <Pill tone="accent">{modeLabel(session.mode)}</Pill>
                        <Pill tone={gateTone(session.warmupPassed)}>{gateText("Warm-up", session.warmupPassed)}</Pill>
                        <Pill tone={gateTone(session.weeklyGatePassed)}>{gateText("Weekly", session.weeklyGatePassed)}</Pill>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--kw-muted)]">
                        <span>{session.durationMinutes}m</span>
                        <span>|</span>
                        <span>{session.recallEvents} recall events</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[color:var(--kw-muted)]">
                No completed sessions yet. Start a session and your metrics will appear here.
              </p>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
