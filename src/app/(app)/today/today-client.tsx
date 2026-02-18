"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenText, ChevronDown, PlayCircle, RefreshCcw } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SessionFlowTutorial } from "@/components/app/session-flow-tutorial";
import { SurahSearchSelect } from "@/components/app/surah-search-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { setActiveSurahCursor, setOpenSession } from "@/hifzer/local/store";
import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";

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

type LearningLane = {
  surahNumber: number;
  surahLabel: string;
  ayahNumber: number;
  ayahId: number;
  progressPct: number;
  lastTouchedAt: string | null;
  isActive: boolean;
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

function modeTone(mode: TodayPayload["state"]["mode"]): "accent" | "warn" {
  if (mode === "NORMAL") return "accent";
  return "warn";
}

/* ---------- Skeleton placeholders ---------- */

function HeroSkeleton() {
  return (
    <Card className="relative overflow-hidden">
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
    <Card>
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
        <div className="h-4 w-64 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
        <div className="h-4 w-48 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
      </div>
    </Card>
  );
}

/* ---------- Main component ---------- */

export function TodayClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TodayPayload | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [switchingSurah, setSwitchingSurah] = useState(false);
  const [targetSurahNumber, setTargetSurahNumber] = useState(1);
  const [learningLanes, setLearningLanes] = useState<LearningLane[]>([]);
  const { pushToast } = useToast();
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
      const [todayRes, lanesRes] = await Promise.all([
        fetch("/api/session/today", { cache: "no-store" }),
        fetch("/api/profile/learning-lanes", { cache: "no-store" }),
      ]);
      const payload = (await todayRes.json()) as TodayPayload & { error?: string };
      if (!todayRes.ok) {
        throw new Error(payload.error || "Failed to load today state.");
      }
      setData(payload);

      if (lanesRes.ok) {
        const lanesPayload = (await lanesRes.json()) as { lanes?: LearningLane[] };
        setLearningLanes(Array.isArray(lanesPayload.lanes) ? lanesPayload.lanes : []);
      }
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
        throw new Error(payload.error || "Failed to switch session surah.");
      }

      const nextSurah = Number(payload.profile?.activeSurahNumber);
      const nextCursor = Number(payload.profile?.cursorAyahId);
      if (Number.isFinite(nextSurah) && Number.isFinite(nextCursor)) {
        setActiveSurahCursor(nextSurah, nextCursor);
      }
      setOpenSession(null);
      setSwitchOpen(false);
      await load();

      const abandonedCount = Number(payload.abandonedOpenSessions ?? 0);
      pushToast({
        title: "Session surah updated",
        message: abandonedCount > 0
          ? hasExistingProgress
            ? `Switched to Surah ${surah}. Resuming from ayah ${ayah}. ${abandonedCount} open session${abandonedCount === 1 ? "" : "s"} paused.`
            : `Switched to Surah ${surah}. Starting from ayah 1. ${abandonedCount} open session${abandonedCount === 1 ? "" : "s"} paused.`
          : hasExistingProgress
            ? `Switched to Surah ${surah}. Resuming from ayah ${ayah}.`
            : `Switched to Surah ${surah}. Starting from ayah 1.`,
        tone: "success",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to switch session surah.";
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Home"
        title="Today"
        subtitle="Your daily memorization session, powered by spaced repetition."
        right={
          <div className="flex items-center gap-2">
            <Link href="/quran">
              <Button variant="secondary" className="gap-2">
                Browse Qur&apos;an <BookOpenText size={16} />
              </Button>
            </Link>
          </div>
        }
      />

      <SessionFlowTutorial surface="today" />

      {/* ---------- Monthly adjustment banner ---------- */}
      {data?.monthlyAdjustmentMessage ? (
        <Card className="border-[rgba(31,54,217,0.2)] bg-[rgba(31,54,217,0.08)]">
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{data.monthlyAdjustmentMessage}</p>
          <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
            This runs in the background and does not require a separate test step unless severe risk is detected.
          </p>
        </Card>
      ) : null}

      {/* ---------- Mode shift notice ---------- */}
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

      {/* ---------- Loading skeleton ---------- */}
      {loading ? (
        <>
          <HeroSkeleton />
          <DetailsSkeleton />
        </>
      ) : error ? (
        /* ---------- Error state ---------- */
        <Card>
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Unable to load session</p>
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
          <Card className="relative overflow-hidden">
            {/* Radial gradient accent */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(var(--kw-accent-rgb),0.22),transparent_68%)] blur-2xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(var(--kw-accent-rgb),0.10),transparent_68%)] blur-3xl" />

            <div className="relative">
              {/* Top row: title + mode pill */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-[family-name:var(--font-kw-display)] text-2xl tracking-tight text-[color:var(--kw-ink)] sm:text-3xl">
                    Your session is ready
                  </h2>
                  <p className="mt-1.5 text-sm text-[color:var(--kw-muted)]">
                    {totalQueueItems === 0
                      ? "No items queued today"
                      : `~${estimatedMinutes} min \u00B7 ${totalQueueItems} ayah${totalQueueItems !== 1 ? "s" : ""} queued`}
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
                <Link href="/session">
                  <Button size="lg" className="gap-2">
                    Start session <PlayCircle size={18} />
                  </Button>
                </Link>
                {hasReviewPressure ? (
                  <Link href="/session?focus=review">
                    <Button variant="secondary" className="gap-2">
                      Quick review <ArrowRight size={16} />
                    </Button>
                  </Link>
                ) : null}
                <Button variant="ghost" className="gap-2" onClick={() => void load()}>
                  Reload <RefreshCcw size={16} />
                </Button>
                <Button variant="secondary" className="gap-2" onClick={() => setSwitchOpen((v) => !v)}>
                  {switchOpen ? "Close surah switcher" : "Switch session surah"}
                </Button>
              </div>

              {switchOpen ? (
                <div className="mt-5 rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 p-4">
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Select session surah</p>
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
              {detailsOpen ? "Hide details" : "Show details"}
            </button>

            {detailsOpen ? (
              <div className="mt-2 grid gap-4 md:grid-cols-2">
                {/* Debt & review floor */}
                <Card>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    Queue health
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
                      {data.state.newUnlocked ? "Mode allows new" : "Mode blocks new"}
                    </Pill>
                    <Pill tone={canStartNewNow ? "success" : "neutral"}>
                      {canStartNewNow ? "Can start new now" : "Gate pass required"}
                    </Pill>
                  </div>
                </Card>

                {/* Mode explainer */}
                <Card>
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
                <Card className="md:col-span-2">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                        Due now / soon
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
                    <Link href="/session?focus=review">
                      <Button variant="secondary" className="gap-2">
                        Start quick review <PlayCircle size={16} />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

