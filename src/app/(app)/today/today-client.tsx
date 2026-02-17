"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenText, CalendarDays, PlayCircle, RefreshCcw, Target } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

type TodayPayload = {
  localDate: string;
  profile: {
    activeSurahNumber: number;
    cursorAyahId: number;
    dailyMinutes: number;
  };
  state: {
    mode: "NORMAL" | "CONSOLIDATION" | "CATCH_UP";
    reviewDebtMinutes: number;
    debtRatio: number;
    reviewFloorPct: number;
    weeklyGateRequired: boolean;
    monthlyTestRequired: boolean;
    warmupRequired: boolean;
    newUnlocked: boolean;
    queue: {
      warmupAyahIds: number[];
      weeklyGateAyahIds: number[];
      sabqiReviewAyahIds: number[];
      manzilReviewAyahIds: number[];
      repairLinks: Array<{ fromAyahId: number; toAyahId: number }>;
      newAyahIds: number[];
    };
  };
  monthlyAdjustmentMessage?: string | null;
};

export function TodayClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TodayPayload | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session/today", { cache: "no-store" });
      const payload = (await res.json()) as TodayPayload & { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to load today state.");
      }
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load today state.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Home"
        title="Today"
        subtitle="Server-first queue with debt control, dynamic review floor, and quality gates."
        right={
          <div className="flex items-center gap-2">
            <Link href="/session">
              <Button className="gap-2">
                Start session <PlayCircle size={16} />
              </Button>
            </Link>
            <Link href="/quran">
              <Button variant="secondary" className="gap-2">
                Browse Qur&apos;an <BookOpenText size={16} />
              </Button>
            </Link>
          </div>
        }
      />

      {data?.monthlyAdjustmentMessage ? (
        <Card className="border-[rgba(31,54,217,0.2)] bg-[rgba(31,54,217,0.08)]">
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{data.monthlyAdjustmentMessage}</p>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Queue health
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {loading ? "Loading..." : error ? "Unavailable" : data?.state.mode}
              </p>
              {!loading && !error && data ? (
                <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                  Debt: {data.state.reviewDebtMinutes.toFixed(1)} min ({Math.round(data.state.debtRatio)}% of budget)
                </p>
              ) : null}
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
              <CalendarDays size={18} />
            </span>
          </div>

          {!loading && !error && data ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Pill tone="neutral">Review floor: {data.state.reviewFloorPct}%</Pill>
              {data.state.warmupRequired ? <Pill tone="warn">Warm-up gate</Pill> : null}
              {data.state.weeklyGateRequired ? <Pill tone="warn">Weekly gate</Pill> : null}
              {data.state.monthlyTestRequired ? <Pill tone="warn">Monthly test required</Pill> : null}
              <Pill tone={data.state.newUnlocked ? "accent" : "neutral"}>
                {data.state.newUnlocked ? "New unlocked" : "New locked"}
              </Pill>
            </div>
          ) : null}
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Today counts
              </p>
              {!loading && !error && data ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-3">
                    <p className="text-xs text-[color:var(--kw-faint)]">Warmup</p>
                    <p className="mt-1 text-2xl font-semibold text-[color:var(--kw-ink)]">
                      {data.state.queue.warmupAyahIds.length}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-3">
                    <p className="text-xs text-[color:var(--kw-faint)]">Review</p>
                    <p className="mt-1 text-2xl font-semibold text-[color:var(--kw-ink)]">{reviewCount}</p>
                  </div>
                  <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-3">
                    <p className="text-xs text-[color:var(--kw-faint)]">New</p>
                    <p className="mt-1 text-2xl font-semibold text-[color:var(--kw-ink)]">
                      {data.state.queue.newAyahIds.length}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                  {error ?? "Loading queue..."}
                </p>
              )}
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
              <Target size={18} />
            </span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link href="/session">
              <Button className="gap-2">
                Begin session <ArrowRight size={16} />
              </Button>
            </Link>
            <Button variant="secondary" className="gap-2" onClick={() => void load()}>
              Reload <RefreshCcw size={16} />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

