"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, PlayCircle, RefreshCcw } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import styles from "./streak-client.module.css";

type StreakPayload = {
  onboardingEligible: boolean;
  rule: {
    minQualifiedAyahsPerDay: number;
    minQualifiedSecondsPerDay: number;
    minQualifiedMinutesPerDay: number;
    gracePolicy: "always_allow_1_day_gap";
  };
  streak: {
    currentStreakDays: number;
    bestStreakDays: number;
    graceInUseToday: boolean;
    todayQualifiedAyahs: number;
    todayQualifiedSeconds: number;
    todayQualifiedMinutes: number;
    lastQualifiedDate: string | null;
  };
  calendar84d: Array<{
    date: string;
    qualified: boolean;
    qualifiedAyahCount: number;
    qualifiedSeconds: number;
    qualifiedMinutes: number;
    eligible: boolean;
  }>;
};

type CalendarCell = {
  key: string;
  blank: boolean;
  day: number;
  date: string;
  value: number;
  qualified: boolean;
  eligible: boolean;
  isFuture: boolean;
  qualifiedMinutes: number;
  qualifiedSeconds: number;
};

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

function monthStartFromIso(isoDate: string): Date {
  const [year, month] = isoDate.split("-").map((value) => Number(value));
  if (!year || !month) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  return new Date(Date.UTC(year, month - 1, 1));
}

function addMonthsUtc(base: Date, offset: number): Date {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + offset, 1));
}

function diffMonthsUtc(min: Date, max: Date): number {
  return ((max.getUTCFullYear() - min.getUTCFullYear()) * 12) + (max.getUTCMonth() - min.getUTCMonth());
}

function daysInMonthUtc(base: Date): number {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
}

function isoDateUtc(year: number, monthIndex: number, day: number): string {
  return new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);
}

function activityColor(value: number, max: number, eligible: boolean, isFuture: boolean): string {
  if (isFuture) {
    return "rgba(11,18,32,0.05)";
  }
  if (!eligible) {
    return "rgba(11,18,32,0.04)";
  }
  if (value <= 0) {
    return "rgba(16,185,129,0.10)";
  }
  const pct = value / Math.max(1, max);
  if (pct < 0.2) {
    return "rgba(16,185,129,0.28)";
  }
  if (pct < 0.45) {
    return "rgba(16,185,129,0.45)";
  }
  if (pct < 0.7) {
    return "rgba(16,185,129,0.64)";
  }
  return "rgba(16,185,129,0.84)";
}

function ringShadow(value: number, max: number, qualified: boolean): string {
  if (!qualified || value <= 0) {
    return "inset 0 0 0 1px rgba(11,18,32,0.12)";
  }
  const pct = value / Math.max(1, max);
  const glow = 0.2 + (pct * 0.35);
  return `inset 0 0 0 1px rgba(255,255,255,0.62), 0 0 0 1px rgba(16,185,129,${glow.toFixed(2)})`;
}

export function StreakClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StreakPayload | null>(null);
  const [monthCursor, setMonthCursor] = useState(0);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/streak/summary", { cache: "no-store" });
      const payload = (await res.json()) as StreakPayload & { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to load streak summary.");
      }
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load streak summary.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const calendarByDate = useMemo(() => {
    return new Map(data?.calendar84d.map((day) => [day.date, day]) ?? []);
  }, [data]);

  const latestDate = data?.calendar84d[data.calendar84d.length - 1]?.date ?? new Date().toISOString().slice(0, 10);
  const earliestDate = data?.calendar84d[0]?.date ?? latestDate;
  const minMonthStart = useMemo(() => monthStartFromIso(earliestDate), [earliestDate]);
  const maxMonthStart = useMemo(() => monthStartFromIso(latestDate), [latestDate]);
  const minCursor = useMemo(() => -diffMonthsUtc(minMonthStart, maxMonthStart), [minMonthStart, maxMonthStart]);
  const clampedCursor = Math.max(minCursor, Math.min(0, monthCursor));
  const selectedMonthStart = useMemo(() => addMonthsUtc(maxMonthStart, clampedCursor), [maxMonthStart, clampedCursor]);
  const canGoPreviousMonth = clampedCursor > minCursor;
  const canGoNextMonth = clampedCursor < 0;

  const calendarCells = useMemo(() => {
    const firstWeekdaySun0 = selectedMonthStart.getUTCDay();
    const firstWeekdayMon0 = (firstWeekdaySun0 + 6) % 7;
    const monthDays = daysInMonthUtc(selectedMonthStart);
    const totalSlots = Math.ceil((firstWeekdayMon0 + monthDays) / 7) * 7;
    const year = selectedMonthStart.getUTCFullYear();
    const monthIndex = selectedMonthStart.getUTCMonth();

    return Array.from({ length: totalSlots }, (_, slot): CalendarCell => {
      if (slot < firstWeekdayMon0) {
        return {
          key: `blank-start-${slot}`,
          blank: true,
          day: 0,
          date: "",
          value: 0,
          qualified: false,
          eligible: false,
          isFuture: false,
          qualifiedMinutes: 0,
          qualifiedSeconds: 0,
        };
      }

      const day = slot - firstWeekdayMon0 + 1;
      if (day > monthDays) {
        return {
          key: `blank-end-${slot}`,
          blank: true,
          day: 0,
          date: "",
          value: 0,
          qualified: false,
          eligible: false,
          isFuture: false,
          qualifiedMinutes: 0,
          qualifiedSeconds: 0,
        };
      }

      const date = isoDateUtc(year, monthIndex, day);
      const row = calendarByDate.get(date);
      const isFuture = date > latestDate;
      return {
        key: date,
        blank: false,
        day,
        date,
        value: row?.qualifiedAyahCount ?? 0,
        qualified: row?.qualified ?? false,
        eligible: row?.eligible ?? false,
        isFuture,
        qualifiedMinutes: row?.qualifiedMinutes ?? 0,
        qualifiedSeconds: row?.qualifiedSeconds ?? 0,
      };
    });
  }, [selectedMonthStart, calendarByDate, latestDate]);

  const calendarMax = useMemo(() => {
    const values = calendarCells
      .filter((cell) => !cell.blank && cell.eligible && !cell.isFuture)
      .map((cell) => cell.value);
    return Math.max(1, ...values);
  }, [calendarCells]);

  const detailCell = useMemo(() => {
    if (hoverDate) {
      const hovered = calendarCells.find((cell) => !cell.blank && cell.date === hoverDate) ?? null;
      if (hovered) {
        return hovered;
      }
    }
    const today = data?.calendar84d[data.calendar84d.length - 1];
    if (!today) {
      return null;
    }
    return calendarCells.find((cell) => !cell.blank && cell.date === today.date) ?? null;
  }, [calendarCells, data, hoverDate]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Streak"
        title="Streak"
        subtitle="Calendar-style momentum tracking from your daily recitation activity."
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
        <Card>
          <p className="text-sm text-[color:var(--kw-muted)]">Loading streak metrics...</p>
        </Card>
      ) : error ? (
        <Card>
          <EmptyState
            title="Streak unavailable"
            message={error}
            action={
              <Button onClick={() => void load()} className="gap-2">
                Retry <RefreshCcw size={16} />
              </Button>
            }
          />
        </Card>
      ) : !data?.onboardingEligible ? (
        <Card>
          <EmptyState
            title="Streak starts after onboarding"
            message="Complete onboarding to unlock streak tracking."
            action={
              <Link href="/onboarding/welcome">
                <Button className="gap-2">
                  Continue onboarding <ArrowRight size={16} />
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Current streak</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{data.streak.currentStreakDays}</p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Best streak</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{data.streak.bestStreakDays}</p>
            </Card>
          </div>

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-[color:var(--kw-faint)]" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    Circular commit calendar
                  </p>
                </div>
                <p className="mt-1 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                  {selectedMonthStart.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1"
                  onClick={() => setMonthCursor((prev) => Math.max(minCursor, prev - 1))}
                  disabled={!canGoPreviousMonth}
                >
                  <ChevronLeft size={14} />
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1"
                  onClick={() => setMonthCursor((prev) => Math.min(0, prev + 1))}
                  disabled={!canGoNextMonth}
                >
                  Next
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className={styles.calendarFrame}>
                <div className={styles.calendarWeekdays}>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>
                <div className={styles.calendarGrid} aria-label="Streak monthly calendar">
                  {calendarCells.map((cell) =>
                    cell.blank ? (
                      <span key={cell.key} className={styles.calendarBlank} />
                    ) : (
                      <button
                        key={cell.key}
                        type="button"
                        title={`${formatIsoDate(cell.date)}: ${cell.value} ayahs`}
                        className={styles.calendarCell}
                        data-qualified={cell.qualified ? "1" : "0"}
                        data-future={cell.isFuture ? "1" : "0"}
                        onMouseEnter={() => setHoverDate(cell.date)}
                        onFocus={() => setHoverDate(cell.date)}
                        style={{
                          backgroundColor: activityColor(cell.value, calendarMax, cell.eligible, cell.isFuture),
                          boxShadow: ringShadow(cell.value, calendarMax, cell.qualified),
                        }}
                      >
                        {cell.day}
                      </button>
                    ),
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[color:var(--kw-faint)]">
                  <span>Low</span>
                  <span className={styles.legendDot} style={{ backgroundColor: activityColor(0, calendarMax, true, false) }} />
                  <span className={styles.legendDot} style={{ backgroundColor: activityColor(Math.ceil(calendarMax * 0.2), calendarMax, true, false) }} />
                  <span className={styles.legendDot} style={{ backgroundColor: activityColor(Math.ceil(calendarMax * 0.5), calendarMax, true, false) }} />
                  <span className={styles.legendDot} style={{ backgroundColor: activityColor(calendarMax, calendarMax, true, false) }} />
                  <span>High</span>
                </div>
              </div>

              <div className="rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Day details</p>
                {detailCell ? (
                  <>
                    <p className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                      {formatIsoDate(detailCell.date)}
                    </p>
                    <div className="mt-3 space-y-2 text-sm text-[color:var(--kw-muted)]">
                      <p>Qualified ayahs: {detailCell.value}</p>
                      <p>Qualified minutes: {detailCell.qualifiedMinutes}</p>
                      <p>Qualified seconds: {detailCell.qualifiedSeconds}</p>
                    </div>
                    <div className="mt-3">
                      {detailCell.qualified ? (
                        <Pill tone="success">Qualified day</Pill>
                      ) : detailCell.isFuture ? (
                        <Pill tone="neutral">Future day</Pill>
                      ) : detailCell.eligible ? (
                        <Pill tone="warn">No qualifying recitation</Pill>
                      ) : (
                        <Pill tone="neutral">Not eligible</Pill>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Hover a day to inspect details.</p>
                )}
                <p className="mt-4 text-xs text-[color:var(--kw-faint)]">
                  Last qualified day: {data.streak.lastQualifiedDate ? formatIsoDate(data.streak.lastQualifiedDate) : "n/a"}
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
