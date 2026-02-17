"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Flame, PlayCircle, RefreshCcw } from "lucide-react";
import { HeatStrip } from "@/components/charts/heat-strip";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";

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

export function StreakClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StreakPayload | null>(null);

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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Streak"
        title="Streak"
        subtitle="Consecutive day momentum based on reciting at least one ayah/day."
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
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Current streak
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-2xl border border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.12)] text-[color:var(--kw-ember-600)]">
                  <Flame size={16} />
                </span>
                <p className="text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                  {data.streak.currentStreakDays}
                </p>
              </div>
            </Card>

            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Best streak
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {data.streak.bestStreakDays}
              </p>
            </Card>

            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Today qualified
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {data.streak.todayQualifiedAyahs} ayah{data.streak.todayQualifiedAyahs === 1 ? "" : "s"}
              </p>
            </Card>
          </div>

          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="neutral">Rules</Pill>
              <Pill tone="accent">Min {data.rule.minQualifiedAyahsPerDay} recited ayah/day</Pill>
              <Pill tone="warn">1-day gaps allowed</Pill>
            </div>
            <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
              A day counts when you recite at least one ayah from Session or Qur&apos;an browse. Your streak continues
              across single missed days, but breaks after two missed days.
            </p>
            <div className="mt-3">
              {data.streak.graceInUseToday ? (
                <Pill tone="warn">Grace in use today</Pill>
              ) : data.streak.currentStreakDays > 0 ? (
                <Pill tone="accent">Streak active</Pill>
              ) : (
                <Pill tone="neutral">No active streak</Pill>
              )}
            </div>
            <p className="mt-3 text-xs text-[color:var(--kw-faint)]">
              Last qualified day: {data.streak.lastQualifiedDate ?? "n/a"}
            </p>
          </Card>

          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Last 84 days
            </p>
            <div className="mt-4">
              <HeatStrip
                days={data.calendar84d.map((day) => ({
                  date: day.date,
                  value: day.qualifiedAyahCount,
                }))}
                tone="brand"
                ariaLabel="Streak heatmap"
              />
            </div>
            <p className="mt-3 text-xs text-[color:var(--kw-faint)]">
              Darker cells indicate more qualified recited ayahs.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
