"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CornerDownLeft,
  Link2,
  PlayCircle,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { AyahAudioPlayer } from "@/components/audio/ayah-audio-player";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import {
  appendAttempt,
  archiveSession,
  formatModeLabel,
  getActiveSurahNumber,
  getCursorAyahId,
  getLastCompletedLocalDate,
  getOpenSession,
  newSessionId,
  setActiveSurahCursor,
  setLastCompletedLocalDate,
  setOpenSession,
  todayIsoLocalDate,
  upsertReviewAndApplyGrade,
  listAttempts,
  listDueReviews,
  type AttemptStage,
  type StoredSession,
} from "@/hifzer/local/store";
import { buildTodayQueue, modeForMissedDays, missedDaysSince } from "@/hifzer/srs/queue";
import type { SrsGrade, TodayQueue } from "@/hifzer/srs/types";
import { getAyahById, getSurahInfo, verseRefFromAyahId } from "@/hifzer/quran/lookup";

type SessionStep =
  | { kind: "AYAH"; stage: Exclude<AttemptStage, "LINK">; ayahId: number }
  | { kind: "LINK"; fromAyahId: number; toAyahId: number };

function buildSteps(queue: TodayQueue): SessionStep[] {
  const steps: SessionStep[] = [];
  for (const ayahId of queue.warmupIds) {
    steps.push({ kind: "AYAH", stage: "WARMUP", ayahId });
  }
  for (const ayahId of queue.reviewIds) {
    steps.push({ kind: "AYAH", stage: "REVIEW", ayahId });
  }
  if (queue.newStartAyahId && queue.newEndAyahId) {
    for (let ayahId = queue.newStartAyahId; ayahId <= queue.newEndAyahId; ayahId += 1) {
      steps.push({ kind: "AYAH", stage: "NEW", ayahId });
      if (ayahId > queue.newStartAyahId) {
        steps.push({ kind: "LINK", fromAyahId: ayahId - 1, toAyahId: ayahId });
      }
    }
  }
  return steps;
}

function stageLabel(stage: AttemptStage): string {
  if (stage === "WARMUP") return "Warmup";
  if (stage === "REVIEW") return "Review";
  if (stage === "NEW") return "New";
  return "Link";
}

function gradeLabel(grade: SrsGrade): string {
  if (grade === "AGAIN") return "Again";
  if (grade === "HARD") return "Hard";
  if (grade === "GOOD") return "Good";
  return "Easy";
}

function gradeClasses(grade: SrsGrade): string {
  if (grade === "AGAIN") {
    return "border-[rgba(234,88,12,0.28)] bg-[rgba(234,88,12,0.10)] text-[color:var(--kw-ember-600)] hover:bg-[rgba(234,88,12,0.14)]";
  }
  if (grade === "HARD") {
    return "border-[rgba(2,132,199,0.22)] bg-[rgba(2,132,199,0.10)] text-[color:var(--kw-sky-600)] hover:bg-[rgba(2,132,199,0.14)]";
  }
  if (grade === "EASY") {
    return "border-[rgba(43,75,255,0.22)] bg-[rgba(43,75,255,0.10)] text-[rgba(31,54,217,1)] hover:bg-[rgba(43,75,255,0.14)]";
  }
  return "border-[rgba(10,138,119,0.24)] bg-[rgba(10,138,119,0.10)] text-[color:var(--kw-teal-800)] hover:bg-[rgba(10,138,119,0.14)]";
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

async function syncCompletedSession(session: StoredSession) {
  if (!session.endedAt) {
    return;
  }

  const attempts = listAttempts()
    .filter((attempt) => attempt.sessionId === session.id)
    .map((attempt) => ({
      ayahId: attempt.ayahId,
      stage: attempt.stage,
      grade: attempt.grade,
      createdAt: attempt.createdAt,
    }));

  if (!attempts.length) {
    return;
  }

  await fetch("/api/session/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      localDate: session.localDate,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      queue: {
        warmupIds: session.queue.warmupIds,
        reviewIds: session.queue.reviewIds,
        newStartAyahId: session.queue.newStartAyahId,
        newEndAyahId: session.queue.newEndAyahId,
      },
      attempts,
    }),
  });
}

export function SessionClient() {
  const reducedMotion = useReducedMotion();
  const { pushToast } = useToast();

  const [bootNow] = useState(() => new Date());
  const today = todayIsoLocalDate(bootNow);

  const [showText, setShowText] = useState(true);

  const [session, setSession] = useState<StoredSession | null>(() => {
    const existing = getOpenSession();
    if (existing && existing.status === "OPEN" && existing.localDate === today) {
      return existing;
    }

    const activeSurahNumber = getActiveSurahNumber();
    const cursorAyahId = getCursorAyahId();
    if (!activeSurahNumber || !cursorAyahId) {
      return null;
    }

    const lastCompletedLocalDate = getLastCompletedLocalDate();
    const due = listDueReviews(bootNow);
    const queue = buildTodayQueue(
      { activeSurahNumber, cursorAyahId, lastCompletedLocalDate },
      due,
      bootNow,
    );

    const created: StoredSession = {
      id: newSessionId(bootNow),
      status: "OPEN",
      localDate: today,
      startedAt: bootNow.toISOString(),
      activeSurahNumber,
      cursorAyahIdAtStart: cursorAyahId,
      queue,
      stepIndex: 0,
    };

    setOpenSession(created);
    return created;
  });

  const steps = useMemo(() => (session ? buildSteps(session.queue) : []), [session]);
  const currentStep = session && session.status === "OPEN" ? (steps[session.stepIndex] ?? null) : null;

  const modeBadge = useMemo(() => {
    if (!session) {
      return null;
    }
    const last = getLastCompletedLocalDate();
    const missedDays = missedDaysSince(last, today);
    const mode = modeForMissedDays(missedDays);
    return { missedDays, mode };
  }, [session, today]);

  const onCommitSession = useCallback((next: StoredSession | null) => {
    setSession(next);
    setOpenSession(next);
  }, []);

  const onAdvance = useCallback(
    (grade: SrsGrade) => {
      if (!session || session.status !== "OPEN" || !currentStep) {
        return;
      }

      const now = new Date();

      if (currentStep.kind === "AYAH") {
        appendAttempt({
          sessionId: session.id,
          ayahId: currentStep.ayahId,
          stage: currentStep.stage,
          grade,
          createdAt: now,
        });

        const nextReview = upsertReviewAndApplyGrade(currentStep.ayahId, grade, now);
        if (currentStep.stage === "NEW") {
          setActiveSurahCursor(session.activeSurahNumber, currentStep.ayahId + 1);
        }

        pushToast({
          title: `${gradeLabel(grade)} recorded`,
          message: `Next review scheduled (${nextReview.intervalDays}d).`,
          tone: grade === "AGAIN" ? "warning" : "success",
        });
      } else {
        appendAttempt({
          sessionId: session.id,
          ayahId: currentStep.toAyahId,
          stage: "LINK",
          grade,
          createdAt: now,
        });
        pushToast({
          title: "Link logged",
          message: `${gradeLabel(grade)} for ${currentStep.fromAyahId} -> ${currentStep.toAyahId}.`,
          tone: grade === "AGAIN" ? "warning" : "neutral",
        });
      }

      const nextIndex = session.stepIndex + 1;
      if (nextIndex >= steps.length) {
        const completed: StoredSession = {
          ...session,
          status: "COMPLETED",
          endedAt: now.toISOString(),
          stepIndex: steps.length,
        };
        archiveSession(completed);
        setOpenSession(null);
        setLastCompletedLocalDate(todayIsoLocalDate(now));
        setSession(completed);

        void syncCompletedSession(completed).catch(() => {
          // Local progress already committed; backend sync will be retried in a later sync pass.
        });
        return;
      }

      onCommitSession({ ...session, stepIndex: nextIndex });
      setShowText(true);
    },
    [currentStep, onCommitSession, pushToast, session, steps.length],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!currentStep || isTypingTarget(e.target)) {
        return;
      }
      if (e.key === "1") {
        e.preventDefault();
        onAdvance("AGAIN");
      } else if (e.key === "2") {
        e.preventDefault();
        onAdvance("HARD");
      } else if (e.key === "3") {
        e.preventDefault();
        onAdvance("GOOD");
      } else if (e.key === "4") {
        e.preventDefault();
        onAdvance("EASY");
      } else if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        setShowText((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentStep, onAdvance]);

  const headerRight = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setShowText((v) => !v)}
        className="rounded-2xl border border-[color:var(--kw-border)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] transition hover:bg-white"
        title="Toggle text visibility (T)"
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

  if (!session) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Practice"
          title="Session"
          subtitle="Choose a surah and a starting ayah, then start your first grade-driven session."
          right={headerRight}
        />

        <Card>
          <EmptyState
            title="No starting point selected"
            message="Go to onboarding and set an active surah + cursor ayahId. Then come back to start a session."
            icon={<PlayCircle size={18} />}
            action={
              <Link
                href="/onboarding/start-point"
                className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--kw-border)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] hover:bg-white"
              >
                Choose start point <ArrowRight size={16} />
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  if (session.status !== "OPEN") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Practice"
          title="Session complete"
          subtitle="Grades are saved instantly and synced to Prisma when backend auth is available."
          right={headerRight}
        />

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-sm leading-7 text-[color:var(--kw-muted)]">
                Nice work. Your attempts updated the SRS schedule per ayah. If you want, you can
                start another session, but typically you&apos;d return tomorrow.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/today">
                  <Button className="gap-2">
                    Go to Today <ArrowRight size={16} />
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  className="gap-2"
                  onClick={() => {
                    setOpenSession(null);
                    onCommitSession(null);
                  }}
                >
                  Clear session <RotateCcw size={16} />
                </Button>
              </div>
            </div>

            <span className="grid h-12 w-12 place-items-center rounded-[22px] border border-[rgba(22,163,74,0.26)] bg-[rgba(22,163,74,0.10)] text-[color:var(--kw-lime-600)] shadow-[var(--kw-shadow-soft)]">
              <CheckCircle2 size={18} />
            </span>
          </div>
        </Card>
      </div>
    );
  }

  const progressText = `${Math.min(session.stepIndex + 1, steps.length)} / ${steps.length}`;
  const modeText = modeBadge ? `${formatModeLabel(modeBadge.mode)}${modeBadge.missedDays ? ` (${modeBadge.missedDays} missed)` : ""}` : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <span>Practice</span>
            <span className="text-[color:var(--kw-faint)]">/</span>
            <span className="text-[color:var(--kw-muted)]">{modeText ?? "Session"}</span>
          </span>
        }
        title="Session"
        subtitle="Listen, recall, and grade each ayah. Keyboard: 1 Again, 2 Hard, 3 Good, 4 Easy, T toggle text."
        right={
          <div className="flex items-center gap-2">
            <Pill tone="neutral">{progressText}</Pill>
            {headerRight}
          </div>
        }
      />

      {currentStep ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${session.id}:${session.stepIndex}`}
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <Card>
              {currentStep.kind === "AYAH" ? (
                <AyahStep
                  ayahId={currentStep.ayahId}
                  stage={currentStep.stage}
                  showText={showText}
                  onToggleText={() => setShowText((v) => !v)}
                  onGrade={onAdvance}
                />
              ) : (
                <LinkStep
                  fromAyahId={currentStep.fromAyahId}
                  toAyahId={currentStep.toAyahId}
                  showText={showText}
                  onToggleText={() => setShowText((v) => !v)}
                  onGrade={onAdvance}
                />
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      ) : (
        <Card>
          <EmptyState
            title="Nothing queued"
            message="No due reviews and no new range. If you finished a surah, choose your next one from Today."
            icon={<CornerDownLeft size={18} />}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/today">
                  <Button variant="secondary" className="gap-2">
                    Go to Today <ArrowLeft size={16} />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="gap-2"
                  onClick={() => {
                    const endedAt = new Date().toISOString();
                    archiveSession({ ...session, status: "ABANDONED", endedAt });
                    setOpenSession(null);
                    setSession(null);
                  }}
                >
                  Clear session <RotateCcw size={16} />
                </Button>
              </div>
            }
          />
        </Card>
      )}
    </div>
  );
}

function AyahStep(props: {
  ayahId: number;
  stage: Exclude<AttemptStage, "LINK">;
  showText: boolean;
  onToggleText: () => void;
  onGrade: (grade: SrsGrade) => void;
}) {
  const ayah = getAyahById(props.ayahId);
  const ref = verseRefFromAyahId(props.ayahId);
  const surah = ref ? getSurahInfo(ref.surahNumber) : null;

  if (!ayah || !ref || !surah) {
    return (
      <EmptyState
        title="Ayah not found"
        message={`Invalid ayahId ${props.ayahId}.`}
        icon={<CornerDownLeft size={18} />}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            {stageLabel(props.stage)} - Surah {ref.surahNumber}:{ref.ayahNumber} - ayahId {props.ayahId}
          </p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--kw-ink)]">
            <span dir="rtl">{surah.nameArabic}</span>
            <span className="ml-2 text-sm font-semibold text-[color:var(--kw-muted)]">
              {surah.nameTransliteration}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={props.onToggleText}
          className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-xs font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] hover:bg-white"
        >
          {props.showText ? "Text on" : "Text off"}
          <span className="text-[color:var(--kw-faint)]">(T)</span>
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
          <div
            dir="rtl"
            className={clsx(
              "text-right text-2xl leading-[2.15] text-[color:var(--kw-ink)]",
              !props.showText && "select-none blur-[10px] opacity-70",
            )}
          >
            {ayah.textUthmani}
          </div>
          {!props.showText ? (
            <p className="mt-3 text-xs text-[color:var(--kw-faint)]">
              Tip: hide text for recall, then reveal before grading.
            </p>
          ) : null}
        </div>

        <div className="grid content-start gap-3">
          <AyahAudioPlayer ayahId={props.ayahId} />
          <GradeRow onGrade={props.onGrade} />
          <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/60 px-4 py-3 text-xs text-[color:var(--kw-muted)]">
            <p className="font-semibold text-[color:var(--kw-ink)]">What gets saved</p>
            <p className="mt-2 leading-6">
              Your grade updates the per-ayah SRS state (station, next review date) and logs an
              attempt record.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkStep(props: {
  fromAyahId: number;
  toAyahId: number;
  showText: boolean;
  onToggleText: () => void;
  onGrade: (grade: SrsGrade) => void;
}) {
  const fromAyah = getAyahById(props.fromAyahId);
  const toAyah = getAyahById(props.toAyahId);
  const ref = verseRefFromAyahId(props.toAyahId);
  const surah = ref ? getSurahInfo(ref.surahNumber) : null;

  if (!fromAyah || !toAyah || !ref || !surah) {
    return (
      <EmptyState
        title="Link not found"
        message={`Invalid link ${props.fromAyahId} -> ${props.toAyahId}.`}
        icon={<CornerDownLeft size={18} />}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            Link - {props.fromAyahId} to {props.toAyahId} - Surah {ref.surahNumber}:{ref.ayahNumber}
          </p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--kw-ink)]">
            Strengthen the transition
            <span className="ml-2 text-sm font-semibold text-[color:var(--kw-muted)]">
              {surah.nameTransliteration}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={props.onToggleText}
          className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-xs font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] hover:bg-white"
        >
          {props.showText ? "Text on" : "Text off"}
          <span className="text-[color:var(--kw-faint)]">(T)</span>
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            <Link2 size={14} />
            Previous + Current
          </div>

          <div className="mt-4 grid gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Previous
              </p>
              <div
                dir="rtl"
                className={clsx(
                  "mt-2 text-right text-xl leading-[2.1] text-[color:var(--kw-ink)]",
                  !props.showText && "select-none blur-[10px] opacity-70",
                )}
              >
                {fromAyah.textUthmani}
              </div>
            </div>
            <div className="kw-hairline border-t pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Current
              </p>
              <div
                dir="rtl"
                className={clsx(
                  "mt-2 text-right text-xl leading-[2.1] text-[color:var(--kw-ink)]",
                  !props.showText && "select-none blur-[10px] opacity-70",
                )}
              >
                {toAyah.textUthmani}
              </div>
            </div>
          </div>
        </div>

        <div className="grid content-start gap-3">
          <AyahAudioPlayer ayahId={props.toAyahId} />
          <GradeRow onGrade={props.onGrade} />
          <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/60 px-4 py-3 text-xs text-[color:var(--kw-muted)]">
            <p className="font-semibold text-[color:var(--kw-ink)]">What this affects</p>
            <p className="mt-2 leading-6">
              This logs a LINK attempt. Next: update WeakTransition edges to schedule link-repair
              sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GradeRow(props: { onGrade: (grade: SrsGrade) => void }) {
  const grades: SrsGrade[] = ["AGAIN", "HARD", "GOOD", "EASY"];
  return (
    <div className="grid grid-cols-2 gap-2">
      {grades.map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => props.onGrade(g)}
          className={clsx(
            "inline-flex items-center justify-between rounded-[18px] border px-3 py-3 text-sm font-semibold shadow-[var(--kw-shadow-soft)] transition active:translate-y-[1px]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--kw-accent-rgb),0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--kw-bg)]",
            gradeClasses(g),
          )}
        >
          <span className="truncate">{gradeLabel(g)}</span>
          <span className="ml-2 text-xs font-semibold opacity-70">
            {g === "AGAIN" ? "1" : g === "HARD" ? "2" : g === "GOOD" ? "3" : "4"}
          </span>
        </button>
      ))}
    </div>
  );
}
