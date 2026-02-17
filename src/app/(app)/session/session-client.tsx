"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, CornerDownLeft, Link2, PlayCircle, RotateCcw } from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "@/components/app/page-header";
import { AyahAudioPlayer } from "@/components/audio/ayah-audio-player";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import {
  getPendingSessionSyncPayloads,
  pushPendingSessionSyncPayload,
  replacePendingSessionSyncPayloads,
  type PendingSessionSyncPayload,
} from "@/hifzer/local/store";
import { getAyahById, verseRefFromAyahId } from "@/hifzer/quran/lookup";

type Step =
  | {
      kind: "AYAH";
      stage: "WARMUP" | "REVIEW" | "NEW" | "WEEKLY_TEST" | "LINK_REPAIR";
      phase: "STANDARD" | "NEW_EXPOSE" | "NEW_GUIDED" | "NEW_BLIND" | "WEEKLY_TEST" | "LINK_REPAIR";
      ayahId: number;
      reviewTier?: "SABQI" | "MANZIL";
    }
  | {
      kind: "LINK";
      stage: "LINK" | "LINK_REPAIR";
      phase: "STANDARD" | "LINK_REPAIR";
      fromAyahId: number;
      toAyahId: number;
    };

type SessionStartPayload = {
  sessionId: string;
  startedAt: string;
  localDate: string;
  state: {
    mode: "NORMAL" | "CONSOLIDATION" | "CATCH_UP";
    warmupRequired: boolean;
    weeklyGateRequired: boolean;
    monthlyTestRequired: boolean;
    newUnlocked: boolean;
  };
  steps: Step[];
  translations: {
    provider: "tanzil.en.sahih";
    byAyahId: Record<string, string>;
  };
};

type SessionEvent = PendingSessionSyncPayload["events"][number];

function gradeScore(grade: "AGAIN" | "HARD" | "GOOD" | "EASY"): number {
  if (grade === "AGAIN") return 0;
  if (grade === "HARD") return 1;
  if (grade === "GOOD") return 2;
  return 3;
}

function gatePass(grades: Array<"AGAIN" | "HARD" | "GOOD" | "EASY">): boolean {
  if (!grades.length) {
    return true;
  }
  const againCount = grades.filter((g) => g === "AGAIN").length;
  const avg = grades.reduce((sum, g) => sum + gradeScore(g), 0) / grades.length;
  return avg >= 2 && againCount <= 1;
}

function isGraded(step: Step): boolean {
  if (step.kind === "LINK") {
    return true;
  }
  if (step.stage === "NEW" && (step.phase === "NEW_EXPOSE" || step.phase === "NEW_GUIDED")) {
    return false;
  }
  return true;
}

function stepTitle(step: Step): string {
  if (step.kind === "LINK") {
    return step.stage === "LINK_REPAIR" ? "Link repair" : "Link transition";
  }
  if (step.stage === "NEW") {
    if (step.phase === "NEW_EXPOSE") return "New (Expose)";
    if (step.phase === "NEW_GUIDED") return "New (Guided)";
    return "New (Blind)";
  }
  if (step.stage === "REVIEW" && step.reviewTier === "SABQI") return "Sabqi review";
  if (step.stage === "REVIEW" && step.reviewTier === "MANZIL") return "Manzil review";
  if (step.stage === "WEEKLY_TEST") return "Weekly test";
  if (step.stage === "WARMUP") return "Warm-up (Sabaq check)";
  if (step.stage === "LINK_REPAIR") return "Link repair";
  return "Review";
}

function verseRefLabel(ayahId: number): string {
  const ref = verseRefFromAyahId(ayahId);
  if (!ref) {
    return `#${ayahId}`;
  }
  return `${ref.surahNumber}:${ref.ayahNumber}`;
}

function toEvent(step: Step, input: {
  stepIndex: number;
  grade?: "AGAIN" | "HARD" | "GOOD" | "EASY";
  durationSec: number;
  createdAt: string;
}): SessionEvent {
  if (step.kind === "LINK") {
    return {
      stepIndex: input.stepIndex,
      stage: step.stage,
      phase: step.phase,
      ayahId: step.toAyahId,
      fromAyahId: step.fromAyahId,
      toAyahId: step.toAyahId,
      grade: input.grade,
      durationSec: input.durationSec,
      createdAt: input.createdAt,
    };
  }
  return {
    stepIndex: input.stepIndex,
    stage: step.stage,
    phase: step.phase,
    ayahId: step.ayahId,
    grade: input.grade,
    durationSec: input.durationSec,
    createdAt: input.createdAt,
  };
}

export function SessionClient() {
  const searchParams = useSearchParams();
  const quickReviewMode = searchParams.get("focus") === "review";
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<SessionStartPayload | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepStartedAt, setStepStartedAt] = useState(Date.now());
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [warmupRetryUsed, setWarmupRetryUsed] = useState(false);
  const [reviewOnlyLock, setReviewOnlyLock] = useState(false);
  const [showText, setShowText] = useState(true);

  const flushPendingSync = useCallback(async () => {
    const pending = getPendingSessionSyncPayloads();
    if (!pending.length) {
      return;
    }
    try {
      const res = await fetch("/api/session/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessions: pending }),
      });
      const payload = (await res.json()) as {
        results?: Array<{ ok: boolean }>;
      };
      if (!res.ok || !payload.results) {
        throw new Error("Sync failed.");
      }
      const kept = pending.filter((_, idx) => !payload.results?.[idx]?.ok);
      replacePendingSessionSyncPayloads(kept);
    } catch {
      // keep pending payloads for next reconnect
    }
  }, []);

  const loadRun = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await flushPendingSync();
      const res = await fetch("/api/session/start", { method: "POST" });
      const payload = (await res.json()) as SessionStartPayload & { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to start session.");
      }
      setRun(payload);
      setStepIndex(0);
      setEvents([]);
      setStepStartedAt(Date.now());
      setWarmupRetryUsed(false);
      setReviewOnlyLock(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session.");
    } finally {
      setLoading(false);
    }
  }, [flushPendingSync]);

  useEffect(() => {
    void loadRun();
  }, [loadRun]);

  useEffect(() => {
    const onOnline = () => {
      void flushPendingSync();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flushPendingSync]);

  const filteredSteps = useMemo(() => {
    if (!run) {
      return [];
    }
    let nextSteps = run.steps;
    if (quickReviewMode) {
      nextSteps = nextSteps.filter((step) => step.stage === "REVIEW" || step.stage === "LINK_REPAIR");
    }
    if (reviewOnlyLock) {
      nextSteps = nextSteps.filter((step) => step.stage !== "NEW" && step.stage !== "LINK");
    }
    return nextSteps;
  }, [quickReviewMode, run, reviewOnlyLock]);

  const currentStep = filteredSteps[stepIndex] ?? null;
  const done = Boolean(run && filteredSteps.length > 0 && stepIndex >= filteredSteps.length);

  const warmupCount = useMemo(
    () => filteredSteps.filter((step) => step.stage === "WARMUP").length,
    [filteredSteps],
  );

  const weeklyGateCount = useMemo(
    () => filteredSteps.filter((step) => step.stage === "WEEKLY_TEST").length,
    [filteredSteps],
  );

  const completeRun = useCallback(async () => {
    if (!run) {
      return;
    }
    const endedAt = new Date().toISOString();
    const payload: PendingSessionSyncPayload = {
      sessionId: run.sessionId,
      startedAt: run.startedAt,
      endedAt,
      localDate: run.localDate,
      events,
    };
    try {
      const res = await fetch("/api/session/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error || "Complete failed.");
      }
      pushToast({ tone: "success", title: "Session saved", message: "Progress synced." });
    } catch {
      pushPendingSessionSyncPayload(payload);
      pushToast({
        tone: "warning",
        title: "Saved offline",
        message: "Session buffered locally and will sync when online.",
      });
    }
  }, [events, pushToast, run]);

  const advance = useCallback(async (grade?: "AGAIN" | "HARD" | "GOOD" | "EASY") => {
    if (!currentStep) {
      return;
    }
    const now = Date.now();
    const durationSec = Math.max(1, Math.floor((now - stepStartedAt) / 1000));
    const event = toEvent(currentStep, {
      stepIndex,
      grade,
      durationSec,
      createdAt: new Date(now).toISOString(),
    });
    const nextEvents = [...events, event];
    setEvents(nextEvents);

    const nextStepIndex = stepIndex + 1;

    if (run) {
      const warmupBoundaryReached =
        run.state.warmupRequired &&
        warmupCount > 0 &&
        stepIndex < warmupCount &&
        nextStepIndex >= warmupCount;
      if (warmupBoundaryReached) {
        const latest = new Map<number, "AGAIN" | "HARD" | "GOOD" | "EASY">();
        for (const ev of nextEvents) {
          if (ev.stage === "WARMUP" && ev.grade) {
            latest.set(ev.ayahId, ev.grade);
          }
        }
        const pass = gatePass(Array.from(latest.values()));
        if (!pass && !warmupRetryUsed) {
          setWarmupRetryUsed(true);
          setStepIndex(0);
          setStepStartedAt(Date.now());
          pushToast({
            tone: "warning",
            title: "Warm-up retry",
            message: "Retry warm-up once before new memorization unlocks.",
          });
          return;
        }
        if (!pass && warmupRetryUsed) {
          setReviewOnlyLock(true);
          pushToast({
            tone: "warning",
            title: "Review-only day",
            message: "Warm-up did not pass after retry. New is blocked today.",
          });
        }
      }

      const weeklyBoundary = warmupCount + weeklyGateCount;
      const weeklyBoundaryReached =
        run.state.weeklyGateRequired &&
        weeklyGateCount > 0 &&
        stepIndex < weeklyBoundary &&
        nextStepIndex >= weeklyBoundary;
      if (weeklyBoundaryReached) {
        const latest = new Map<number, "AGAIN" | "HARD" | "GOOD" | "EASY">();
        for (const ev of nextEvents) {
          if (ev.stage === "WEEKLY_TEST" && ev.grade) {
            latest.set(ev.ayahId, ev.grade);
          }
        }
        const pass = gatePass(Array.from(latest.values()));
        if (!pass) {
          setReviewOnlyLock(true);
          pushToast({
            tone: "warning",
            title: "Weekly gate failed",
            message: "Switched to review-only to stabilize retention.",
          });
        }
      }
    }

    setStepIndex(nextStepIndex);
    setStepStartedAt(Date.now());
  }, [currentStep, events, pushToast, run, stepIndex, stepStartedAt, warmupCount, warmupRetryUsed, weeklyGateCount]);

  useEffect(() => {
    if (!done) {
      return;
    }
    void completeRun();
  }, [completeRun, done]);

  const rightActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setShowText((v) => !v)}
        className="rounded-2xl border border-[color:var(--kw-border)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] hover:bg-white"
      >
        {showText ? "Hide text" : "Show text"}
      </button>
      <Link href="/today">
        <Button variant="secondary" className="gap-2">
          Back to Today <ArrowRight size={16} />
        </Button>
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Practice" title="Session" subtitle="Loading session..." right={rightActions} />
        <Card>
          <p className="text-sm text-[color:var(--kw-muted)]">Preparing today&apos;s queue...</p>
        </Card>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Practice" title="Session" subtitle="Unable to load session." right={rightActions} />
        <Card>
          <EmptyState
            title="Session unavailable"
            message={error ?? "Could not start session."}
            icon={<CornerDownLeft size={18} />}
            action={
              <Button className="gap-2" onClick={() => void loadRun()}>
                Retry <RotateCcw size={16} />
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Practice" title="Session complete" subtitle="Your events were recorded and retention state updated." right={rightActions} />
        <Card>
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-[22px] border border-[rgba(22,163,74,0.26)] bg-[rgba(22,163,74,0.10)] text-[color:var(--kw-lime-600)] shadow-[var(--kw-shadow-soft)]">
              <CheckCircle2 size={18} />
            </span>
            <div className="space-y-3">
              <p className="text-sm leading-7 text-[color:var(--kw-muted)]">
                Session completed. You can return to Today for the refreshed queue.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/today">
                  <Button className="gap-2">
                    Go to Today <ArrowRight size={16} />
                  </Button>
                </Link>
                <Button variant="secondary" className="gap-2" onClick={() => void loadRun()}>
                  Start another <PlayCircle size={16} />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Practice"
          title="Session"
          subtitle={quickReviewMode ? "No review items are due right now." : "No steps queued today."}
          right={rightActions}
        />
        <Card>
          <EmptyState
            title="No queue"
            message={quickReviewMode ? "Your due-review queue is currently empty." : "There are no scheduled steps at the moment."}
            icon={<PlayCircle size={18} />}
            action={
              <Link href="/today">
                <Button className="gap-2">
                  Back to Today <ArrowRight size={16} />
                </Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const progressText = `${stepIndex + 1} / ${filteredSteps.length}`;
  const ayahId = currentStep.kind === "AYAH" ? currentStep.ayahId : currentStep.toAyahId;
  const ayah = getAyahById(ayahId);
  const ref = verseRefFromAyahId(ayahId);
  const translation = run.translations.byAyahId[String(ayahId)] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <span>Practice</span>
            <span className="text-[color:var(--kw-faint)]">/</span>
            <span className="text-[color:var(--kw-muted)]">{run.state.mode}</span>
          </span>
        }
        title={stepTitle(currentStep)}
        subtitle={
          quickReviewMode
            ? "Quick review-only run for due items."
            : "Grade recall steps with 1/2/3/4. New phases include Expose -> Guided -> Blind before linking."
        }
        right={
          <div className="flex items-center gap-2">
            <Pill tone="neutral">{progressText}</Pill>
            {quickReviewMode ? <Pill tone="accent">Review-only</Pill> : null}
            {rightActions}
          </div>
        }
      />

      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="neutral">Stage: {currentStep.stage}</Pill>
            <Pill tone="neutral">Phase: {currentStep.phase}</Pill>
            {currentStep.kind === "AYAH" && currentStep.stage === "REVIEW" && currentStep.reviewTier ? (
              <Pill tone="accent">{currentStep.reviewTier === "SABQI" ? "Sabqi" : "Manzil"}</Pill>
            ) : null}
            {reviewOnlyLock ? <Pill tone="warn">Review-only</Pill> : null}
            {run.state.monthlyTestRequired ? <Pill tone="warn">Monthly test required</Pill> : null}
          </div>

          {currentStep.kind === "LINK" ? (
            <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Link transition
              </p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                Recite the seam: {verseRefLabel(currentStep.fromAyahId)}
                {" -> "}
                {verseRefLabel(currentStep.toAyahId)}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                <Link2 size={16} />
                Ayah {verseRefLabel(currentStep.fromAyahId)} + Ayah {verseRefLabel(currentStep.toAyahId)}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  {ref ? `Surah ${ref.surahNumber}:${ref.ayahNumber}` : `Ayah ${currentStep.ayahId}`}
                </p>
                <div
                  className={clsx(
                    "mt-3 space-y-4",
                    !showText && "select-none blur-[10px] opacity-70",
                  )}
                >
                  <div dir="rtl" className="text-right text-2xl leading-[2.1] text-[color:var(--kw-ink)]">
                    {ayah?.textUthmani ?? "Ayah text unavailable"}
                  </div>
                  <p dir="ltr" className="text-left text-sm leading-7 text-[color:var(--kw-muted)]">
                    {translation ?? "Translation unavailable"}
                  </p>
                </div>
              </div>
              <div className="grid content-start gap-3">
                <AyahAudioPlayer ayahId={currentStep.ayahId} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {isGraded(currentStep) ? (
              <>
                {(["AGAIN", "HARD", "GOOD", "EASY"] as const).map((grade, idx) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => void advance(grade)}
                    className={clsx(
                      "inline-flex items-center gap-2 rounded-[18px] border px-3 py-2 text-sm font-semibold shadow-[var(--kw-shadow-soft)] transition hover:bg-white",
                      "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)]",
                    )}
                  >
                    {grade}
                    <span className="text-xs text-[color:var(--kw-faint)]">{idx + 1}</span>
                  </button>
                ))}
              </>
            ) : (
              <Button onClick={() => void advance("GOOD")} className="gap-2">
                Done <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
