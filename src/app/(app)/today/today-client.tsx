"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenText, CalendarDays, PlayCircle, RefreshCcw, Target } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { capturePosthogEvent } from "@/lib/posthog/client";

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
    retention3dAvg: number;
    weeklyGateRequired: boolean;
    monthlyTestRequired: boolean;
    warmupRequired: boolean;
    newUnlocked: boolean;
    dueNowCount: number;
    dueSoonCount: number;
    nextDueAt: string | null;
    queue: {
      warmupAyahIds: number[];
      weeklyGateAyahIds: number[];
      sabqiReviewAyahIds: number[];
      manzilReviewAyahIds: number[];
      repairLinks: Array<{ fromAyahId: number; toAyahId: number }>;
      newAyahIds: number[];
    };
    meta: {
      missedDays: number;
      weekOne: boolean;
      reviewPoolSize: number;
    };
  };
  monthlyAdjustmentMessage?: string | null;
};

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

export function TodayClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TodayPayload | null>(null);
  const [modeShiftNotice, setModeShiftNotice] = useState<{
    from: TodayPayload["state"]["mode"];
    to: TodayPayload["state"]["mode"];
    title: string;
    body: string;
  } | null>(null);

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
      capturePosthogEvent("today.mode_shift_notice", {
        from: previous,
        to: data.state.mode,
        debtRatio: data.state.debtRatio,
        retention3dAvg: data.state.retention3dAvg,
      });
    }
    window.localStorage.setItem(key, data.state.mode);
  }, [data]);

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

  const modeExplanation = data ? modeExplain(data.state) : null;
  const hasReviewPressure = Boolean(data && (data.state.dueNowCount > 0 || data.state.dueSoonCount > 0));
  const canStartNewNow = Boolean(
    data &&
      data.state.newUnlocked &&
      !data.state.warmupRequired &&
      !data.state.weeklyGateRequired,
  );

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
            {hasReviewPressure ? (
              <Link href="/session?focus=review">
                <Button variant="secondary" className="gap-2">
                  Quick review <ArrowRight size={16} />
                </Button>
              </Link>
            ) : null}
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
          <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
            This runs in the background and does not require a separate test step unless severe risk is detected.
          </p>
        </Card>
      ) : null}

      {modeShiftNotice ? (
        <Card className="border-[rgba(31,54,217,0.2)] bg-[rgba(31,54,217,0.08)]">
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
              {data.state.monthlyTestRequired ? <Pill tone="warn">Monthly retention guard</Pill> : null}
              <Pill tone={data.state.newUnlocked ? "accent" : "neutral"}>
                {data.state.newUnlocked ? "Mode allows new" : "Mode blocks new"}
              </Pill>
              <Pill tone={canStartNewNow ? "success" : "neutral"}>
                {canStartNewNow ? "Can start new now" : "Gate pass required"}
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
            <Link href="/session?focus=review">
              <Button variant="secondary" className="gap-2">
                Review-only <PlayCircle size={16} />
              </Button>
            </Link>
            <Button variant="secondary" className="gap-2" onClick={() => void load()}>
              Reload <RefreshCcw size={16} />
            </Button>
          </div>
        </Card>
      </div>

      {!loading && !error && data ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Mode explainer
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {modeExplanation?.title}
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                {modeExplanation?.body}
              </p>
            </div>
            <Pill tone={modeExplanation?.tone ?? "neutral"}>{data.state.mode}</Pill>
          </div>
        </Card>
      ) : null}

      {!loading && !error && data ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Due now / soon
              </p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                Due now: <span className="font-semibold text-[color:var(--kw-ink)]">{data.state.dueNowCount}</span>
                {" - "}
                Due in next 6h: <span className="font-semibold text-[color:var(--kw-ink)]">{data.state.dueSoonCount}</span>
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-faint)]">
                Next due: {data.state.nextDueAt ? new Date(data.state.nextDueAt).toLocaleString() : "No upcoming review"}
              </p>
            </div>
            <Link href="/session?focus=review">
              <Button variant="secondary" className="gap-2">
                Start quick review <PlayCircle size={16} />
              </Button>
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
