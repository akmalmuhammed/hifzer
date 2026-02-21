"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, CornerDownLeft, Link2, PlayCircle, RotateCcw } from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "@/components/app/page-header";
import { SessionFlowTutorial } from "@/components/app/session-flow-tutorial";
import { SurahSearchSelect } from "@/components/app/surah-search-select";
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
  setActiveSurahCursor,
  setOpenSession,
  type PendingSessionSyncPayload,
} from "@/hifzer/local/store";
import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";

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
  ayahTextByAyahId: Record<string, string>;
};

type SessionEvent = PendingSessionSyncPayload["events"][number];
type LearningLane = {
  surahNumber: number;
  surahLabel: string;
  ayahNumber: number;
  ayahId: number;
  progressPct: number;
  lastTouchedAt: string | null;
  isActive: boolean;
};
const GRADE_ACTIONS: Array<{
  grade: "AGAIN" | "HARD" | "GOOD" | "EASY";
  hint: string;
}> = [
  { grade: "AGAIN", hint: "Could not recall" },
  { grade: "HARD", hint: "Needed prompts" },
  { grade: "GOOD", hint: "Mostly correct" },
  { grade: "EASY", hint: "Clean recall" },
];
const REVEAL_SECONDS = 8;
const SESSION_COACH_KEYS = {
  tiers: "hifzer_tip_session_tiers_v1",
  warmup: "hifzer_tip_session_warmup_v1",
  grades: "hifzer_tip_session_grades_v1",
  weeklyGate: "hifzer_tip_weekly_gate_v1",
} as const;
const SESSION_PROGRESS_KEY_LEGACY = "hifzer_open_session_progress_v1";

type CoachKey = keyof typeof SESSION_COACH_KEYS;
type StoredSessionProgress = {
  sessionId: string;
  localDate: string;
  quickReviewMode: boolean;
  stepIndex: number;
  events: SessionEvent[];
  warmupRetryUsed: boolean;
  warmupInterstitial: boolean;
  reviewOnlyLock: boolean;
};

function gradeScore(grade: "AGAIN" | "HARD" | "GOOD" | "EASY"): number {
  if (grade === "AGAIN") return 0;
  if (grade === "HARD") return 1;
  if (grade === "GOOD") return 2;
  return 3;
}

function applyStepFilters(steps: Step[], quickReviewMode: boolean, reviewOnlyLock: boolean): Step[] {
  let nextSteps = steps;
  if (quickReviewMode) {
    nextSteps = nextSteps.filter((step) => step.stage === "REVIEW" || step.stage === "LINK_REPAIR");
  }
  if (reviewOnlyLock) {
    nextSteps = nextSteps.filter((step) => step.stage !== "NEW" && step.stage !== "LINK");
  }
  return nextSteps;
}

function sessionProgressStorageKey(userId: string | null | undefined): string {
  return userId ? `${SESSION_PROGRESS_KEY_LEGACY}:${userId}` : SESSION_PROGRESS_KEY_LEGACY;
}

function migrateLegacySessionProgress(storageKey: string): void {
  if (typeof window === "undefined" || storageKey === SESSION_PROGRESS_KEY_LEGACY) {
    return;
  }
  try {
    const scoped = window.localStorage.getItem(storageKey);
    if (scoped) {
      return;
    }
    const legacy = window.localStorage.getItem(SESSION_PROGRESS_KEY_LEGACY);
    if (!legacy) {
      return;
    }
    window.localStorage.setItem(storageKey, legacy);
    window.localStorage.removeItem(SESSION_PROGRESS_KEY_LEGACY);
  } catch {
    // Ignore storage errors (private mode / quota).
  }
}

function readStoredSessionProgress(storageKey: string): StoredSessionProgress | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<StoredSessionProgress>;
    if (
      typeof parsed.sessionId !== "string" ||
      typeof parsed.localDate !== "string" ||
      typeof parsed.quickReviewMode !== "boolean" ||
      typeof parsed.stepIndex !== "number" ||
      !Array.isArray(parsed.events) ||
      typeof parsed.warmupRetryUsed !== "boolean" ||
      typeof parsed.warmupInterstitial !== "boolean" ||
      typeof parsed.reviewOnlyLock !== "boolean"
    ) {
      return null;
    }
    return {
      sessionId: parsed.sessionId,
      localDate: parsed.localDate,
      quickReviewMode: parsed.quickReviewMode,
      stepIndex: parsed.stepIndex,
      events: parsed.events as SessionEvent[],
      warmupRetryUsed: parsed.warmupRetryUsed,
      warmupInterstitial: parsed.warmupInterstitial,
      reviewOnlyLock: parsed.reviewOnlyLock,
    };
  } catch {
    return null;
  }
}

function writeStoredSessionProgress(storageKey: string, progress: StoredSessionProgress): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch {
    // Ignore storage errors (private mode / quota).
  }
}

function clearStoredSessionProgress(storageKey: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Ignore storage errors.
  }
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
    return step.stage === "LINK_REPAIR" ? "Link Repair" : "Link Practice";
  }
  if (step.stage === "NEW") {
    if (step.phase === "NEW_EXPOSE") return "New Memorization (Expose)";
    if (step.phase === "NEW_GUIDED") return "New Memorization (Guided)";
    return "New Memorization (Blind Recall)";
  }
  if (step.stage === "REVIEW" && step.reviewTier === "SABQI") return "Sabqi Review (Recent)";
  if (step.stage === "REVIEW" && step.reviewTier === "MANZIL") return "Manzil Review (Old)";
  if (step.stage === "WEEKLY_TEST") return "Weekly Consolidation Gate";
  if (step.stage === "WARMUP") return "Warm-up (Yesterday's Sabaq)";
  if (step.stage === "LINK_REPAIR") return "Link Repair";
  return "Review";
}

function stepSummary(step: Step): string {
  if (step.kind === "LINK") {
    return step.stage === "LINK_REPAIR"
      ? "Repair weak ayah-to-ayah transitions."
      : "Practice moving smoothly from one ayah to the next.";
  }
  if (step.stage === "WARMUP") {
    return "Recite yesterday's new ayahs from memory. Passing this gate unlocks new memorization.";
  }
  if (step.stage === "WEEKLY_TEST") {
    return "Mandatory weekly check to protect retention. Passing keeps your plan stable.";
  }
  if (step.stage === "REVIEW" && step.reviewTier === "SABQI") {
    return "Recent ayahs that are still fragile. Recall from memory first.";
  }
  if (step.stage === "REVIEW" && step.reviewTier === "MANZIL") {
    return "Older ayahs on long-term rotation. Keep them active.";
  }
  if (step.stage === "NEW") {
    if (step.phase === "NEW_EXPOSE") {
      return "Listen and read carefully before recall.";
    }
    if (step.phase === "NEW_GUIDED") {
      return "Recall with support before blind recall.";
    }
    return "Blind recall decides whether this ayah can advance.";
  }
  return "Recite and grade honestly.";
}

function shouldDefaultHideText(step: Step): boolean {
  if (step.kind === "LINK") {
    return true;
  }
  if (step.stage === "WARMUP" || step.stage === "REVIEW" || step.stage === "WEEKLY_TEST" || step.stage === "LINK_REPAIR") {
    return true;
  }
  if (step.stage === "NEW" && step.phase === "NEW_BLIND") {
    return true;
  }
  return false;
}

function verseRefFromAyahId(ayahId: number): { surahNumber: number; ayahNumber: number } | null {
  const id = Math.floor(ayahId);
  if (!Number.isFinite(id) || id < 1) {
    return null;
  }
  for (const surah of SURAH_INDEX) {
    if (id < surah.startAyahId || id > surah.endAyahId) {
      continue;
    }
    return {
      surahNumber: surah.surahNumber,
      ayahNumber: (id - surah.startAyahId) + 1,
    };
  }
  return null;
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
  textVisible: boolean;
  assisted: boolean;
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
      textVisible: input.textVisible,
      assisted: input.assisted,
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
    textVisible: input.textVisible,
    assisted: input.assisted,
    createdAt: input.createdAt,
  };
}

export function SessionClient() {
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const progressStorageKey = useMemo(() => sessionProgressStorageKey(userId), [userId]);
  const quickReviewMode = searchParams.get("focus") === "review";
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<SessionStartPayload | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepStartedAt, setStepStartedAt] = useState(Date.now());
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [warmupRetryUsed, setWarmupRetryUsed] = useState(false);
  const [warmupInterstitial, setWarmupInterstitial] = useState(false);
  const [reviewOnlyLock, setReviewOnlyLock] = useState(false);
  const [showText, setShowText] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [switchingSurah, setSwitchingSurah] = useState(false);
  const [targetSurahNumber, setTargetSurahNumber] = useState(1);
  const [learningLanes, setLearningLanes] = useState<LearningLane[]>([]);
  const [textVisibleDuringStep, setTextVisibleDuringStep] = useState(true);
  const [assistedThisStep, setAssistedThisStep] = useState(false);
  const [revealUntilMs, setRevealUntilMs] = useState<number | null>(null);
  const [coachSeen, setCoachSeen] = useState<Record<CoachKey, boolean>>(() => {
    if (typeof window === "undefined") {
      return {
        tiers: false,
        warmup: false,
        grades: false,
        weeklyGate: false,
      };
    }
    return {
      tiers: window.localStorage.getItem(SESSION_COACH_KEYS.tiers) === "1",
      warmup: window.localStorage.getItem(SESSION_COACH_KEYS.warmup) === "1",
      grades: window.localStorage.getItem(SESSION_COACH_KEYS.grades) === "1",
      weeklyGate: window.localStorage.getItem(SESSION_COACH_KEYS.weeklyGate) === "1",
    };
  });
  const resumeAyahForSurah = useCallback((surahNumber: number): number => {
    const lane = learningLanes.find((item) => item.surahNumber === surahNumber);
    return lane?.ayahNumber && lane.ayahNumber > 0 ? lane.ayahNumber : 1;
  }, [learningLanes]);

  useEffect(() => {
    migrateLegacySessionProgress(progressStorageKey);
  }, [progressStorageKey]);

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

  const loadLearningLanes = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/learning-lanes", { cache: "no-store" });
      if (!res.ok) {
        return;
      }
      const payload = (await res.json()) as { lanes?: LearningLane[] };
      setLearningLanes(Array.isArray(payload.lanes) ? payload.lanes : []);
    } catch {
      // non-blocking: Hifz can still run
    }
  }, []);

  const loadRun = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      void flushPendingSync();
      const res = await fetch("/api/session/start", { method: "POST" });
      void loadLearningLanes();
      const payload = (await res.json()) as SessionStartPayload & { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to start Hifz.");
      }

      const restored = readStoredSessionProgress(progressStorageKey);
      const resumeState = restored &&
          restored.sessionId === payload.sessionId &&
          restored.localDate === payload.localDate &&
          restored.quickReviewMode === quickReviewMode
        ? restored
        : null;

      const nextReviewOnlyLock = resumeState?.reviewOnlyLock ?? false;
      const nextWarmupRetryUsed = resumeState?.warmupRetryUsed ?? false;
      const nextWarmupInterstitial = resumeState?.warmupInterstitial ?? false;
      const nextEvents = resumeState?.events ?? [];
      const filteredLength = applyStepFilters(payload.steps, quickReviewMode, nextReviewOnlyLock).length;
      const rawStepIndex = resumeState ? Math.floor(resumeState.stepIndex) : 0;
      const nextStepIndex = Number.isFinite(rawStepIndex)
        ? Math.max(0, Math.min(rawStepIndex, filteredLength))
        : 0;
      if (!resumeState) {
        clearStoredSessionProgress(progressStorageKey);
      }

      setRun(payload);
      setStepIndex(nextStepIndex);
      setEvents(nextEvents);
      setStepStartedAt(Date.now());
      setWarmupRetryUsed(nextWarmupRetryUsed);
      setWarmupInterstitial(nextWarmupInterstitial);
      setReviewOnlyLock(nextReviewOnlyLock);
      setSwitchOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Hifz.");
    } finally {
      setLoading(false);
    }
  }, [flushPendingSync, loadLearningLanes, progressStorageKey, quickReviewMode]);

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
    return applyStepFilters(run.steps, quickReviewMode, reviewOnlyLock);
  }, [quickReviewMode, run, reviewOnlyLock]);

  const currentStep = filteredSteps[stepIndex] ?? null;
  const done = Boolean(run && filteredSteps.length > 0 && stepIndex >= filteredSteps.length);
  const currentStepRequiresHiddenText = currentStep ? shouldDefaultHideText(currentStep) : false;
  const canRevealCurrentStep = Boolean(currentStep && currentStep.kind === "AYAH" && currentStepRequiresHiddenText);

  const warmupCount = useMemo(
    () => filteredSteps.filter((step) => step.stage === "WARMUP").length,
    [filteredSteps],
  );

  const weeklyGateCount = useMemo(
    () => filteredSteps.filter((step) => step.stage === "WEEKLY_TEST").length,
    [filteredSteps],
  );

  useEffect(() => {
    if (!currentStep) {
      return;
    }
    const defaultVisible = !shouldDefaultHideText(currentStep);
    setShowText(defaultVisible);
    setTextVisibleDuringStep(defaultVisible);
    setAssistedThisStep(false);
    setRevealUntilMs(null);
  }, [currentStep, stepIndex]);

  useEffect(() => {
    const activeLane = learningLanes.find((lane) => lane.isActive) ?? learningLanes[0];
    if (!activeLane) {
      return;
    }
    setTargetSurahNumber(activeLane.surahNumber);
  }, [learningLanes, resumeAyahForSurah]);

  useEffect(() => {
    if (!currentStep || revealUntilMs == null) {
      return;
    }
    const delay = Math.max(0, revealUntilMs - Date.now());
    const timer = window.setTimeout(() => {
      setRevealUntilMs(null);
      if (shouldDefaultHideText(currentStep)) {
        setShowText(false);
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [currentStep, revealUntilMs]);

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
      pushToast({ tone: "success", title: "Hifz saved", message: "Progress synced." });
    } catch {
      pushPendingSessionSyncPayload(payload);
      pushToast({
        tone: "warning",
        title: "Saved offline",
        message: "Hifz run buffered locally and will sync when online.",
      });
    }
  }, [events, pushToast, run]);

  const markCoachSeen = useCallback((key: CoachKey) => {
    setCoachSeen((prev) => ({ ...prev, [key]: true }));
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_COACH_KEYS[key], "1");
    }
  }, []);

  const revealTemporarily = useCallback(() => {
    if (!canRevealCurrentStep) {
      return;
    }
    const nextRevealUntil = Date.now() + (REVEAL_SECONDS * 1000);
    setShowText(true);
    setTextVisibleDuringStep(true);
    setAssistedThisStep(true);
    setRevealUntilMs(nextRevealUntil);
    pushToast({
      tone: "warning",
      title: "Assist reveal active",
      message: `Text is visible for ${REVEAL_SECONDS}s. This attempt cannot be graded above HARD.`,
    });
  }, [canRevealCurrentStep, pushToast]);

  const switchSessionSurah = useCallback(async () => {
    const surah = Math.floor(targetSurahNumber);
    const selectedSurah = SURAH_INDEX.find((row) => row.surahNumber === surah);
    if (!Number.isFinite(surah) || !selectedSurah) {
      pushToast({
        tone: "warning",
        title: "Invalid surah",
        message: "Choose a valid surah from the selector.",
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
        throw new Error(payload.error || "Failed to switch Hifz surah.");
      }

      const nextSurah = Number(payload.profile?.activeSurahNumber);
      const nextCursor = Number(payload.profile?.cursorAyahId);
      if (Number.isFinite(nextSurah) && Number.isFinite(nextCursor)) {
        setActiveSurahCursor(nextSurah, nextCursor);
      }
      setOpenSession(null);
      clearStoredSessionProgress(progressStorageKey);
      setSwitchOpen(false);
      await loadRun();

      const abandonedCount = Number(payload.abandonedOpenSessions ?? 0);
      pushToast({
        tone: "success",
        title: "Surah switched",
        message: abandonedCount > 0
          ? hasExistingProgress
            ? `Moved to Surah ${surah}. Resuming from ayah ${ayah}. ${abandonedCount} open Hifz run${abandonedCount === 1 ? "" : "s"} paused.`
            : `Moved to Surah ${surah}. Starting from ayah 1. ${abandonedCount} open Hifz run${abandonedCount === 1 ? "" : "s"} paused.`
          : hasExistingProgress
            ? `Moved to Surah ${surah}. Resuming from ayah ${ayah}.`
            : `Moved to Surah ${surah}. Starting from ayah 1.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to switch surah.";
      pushToast({
        tone: "warning",
        title: "Switch failed",
        message,
      });
    } finally {
      setSwitchingSurah(false);
    }
  }, [learningLanes, loadRun, progressStorageKey, pushToast, resumeAyahForSurah, targetSurahNumber]);

  const advance = useCallback(async (grade?: "AGAIN" | "HARD" | "GOOD" | "EASY") => {
    if (!currentStep) {
      return;
    }
    let effectiveGrade = grade;
    if (assistedThisStep && grade && (grade === "GOOD" || grade === "EASY")) {
      effectiveGrade = "HARD";
      pushToast({
        tone: "warning",
        title: "Assist applied",
        message: "Revealed attempts are capped at HARD to protect recall integrity.",
      });
    }

    const now = Date.now();
    const durationSec = Math.max(1, Math.floor((now - stepStartedAt) / 1000));
    const event = toEvent(currentStep, {
      stepIndex,
      grade: effectiveGrade,
      durationSec,
      textVisible: textVisibleDuringStep,
      assisted: assistedThisStep,
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
          setWarmupInterstitial(true);
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
  }, [
    assistedThisStep,
    currentStep,
    events,
    pushToast,
    run,
    stepIndex,
    stepStartedAt,
    textVisibleDuringStep,
    warmupCount,
    warmupRetryUsed,
    weeklyGateCount,
  ]);

  useEffect(() => {
    if (!done) {
      return;
    }
    void completeRun();
  }, [completeRun, done]);

  useEffect(() => {
    if (!run || done) {
      return;
    }
    writeStoredSessionProgress(progressStorageKey, {
      sessionId: run.sessionId,
      localDate: run.localDate,
      quickReviewMode,
      stepIndex,
      events,
      warmupRetryUsed,
      warmupInterstitial,
      reviewOnlyLock,
    });
  }, [
    done,
    events,
    progressStorageKey,
    quickReviewMode,
    reviewOnlyLock,
    run,
    stepIndex,
    warmupInterstitial,
    warmupRetryUsed,
  ]);

  useEffect(() => {
    if (!done) {
      return;
    }
    clearStoredSessionProgress(progressStorageKey);
  }, [done, progressStorageKey]);

  const rightActions = (
    <div className="flex w-full flex-wrap items-stretch gap-2 sm:w-auto sm:items-center">
      {canRevealCurrentStep ? (
        <Button
          type="button"
          variant="secondary"
          onClick={revealTemporarily}
          className={clsx(
            "w-full gap-2 border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.10)] hover:bg-[rgba(var(--kw-accent-rgb),0.14)] sm:w-auto",
            showText && revealUntilMs ? "text-[rgba(var(--kw-accent-rgb),1)]" : "text-[color:var(--kw-ink)]",
          )}
        >
          {showText && revealUntilMs ? "Reveal active" : "Reveal (I'm stuck)"}
        </Button>
      ) : currentStep?.kind === "AYAH" ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setShowText((v) => {
              const next = !v;
              if (next) {
                setTextVisibleDuringStep(true);
              }
              return next;
            });
          }}
          className="w-full gap-2 sm:w-auto"
        >
          {showText ? "Hide text" : "Show text"}
        </Button>
      ) : null}
      {currentStep?.kind === "AYAH" ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowTranslation((v) => !v)}
          disabled={!showText}
          className="w-full gap-2 sm:w-auto"
        >
          {showTranslation ? "Hide translation" : "Show translation"}
        </Button>
      ) : null}
      <Link href="/today" className="w-full sm:w-auto">
        <Button variant="secondary" className="w-full gap-2 sm:w-auto">
          Back to Today <ArrowRight size={16} />
        </Button>
      </Link>
      <Button
        variant="secondary"
        className="w-full gap-2 sm:w-auto"
        onClick={() => setSwitchOpen((prev) => !prev)}
      >
        {switchOpen ? "Close surah switcher" : "Switch surah"}
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-20 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
          <div className="h-8 w-48 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
          <div className="h-4 w-64 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
        </div>
        <div className="rounded-[22px] border border-[color:var(--kw-border)] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-28 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
            <div className="h-6 w-20 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
          </div>
          <div className="rounded-[18px] border border-[color:var(--kw-border)] p-4 space-y-3">
            <div className="h-3 w-24 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
            <div className="h-8 w-full animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
            <div className="h-8 w-3/4 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
            <div className="h-4 w-full animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
          </div>
          <div className="h-10 w-40 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="h-14 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
            <div className="h-14 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
            <div className="h-14 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
            <div className="h-14 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Practice" title="Hifz" subtitle="Unable to load Hifz." right={rightActions} />
        <Card>
          <EmptyState
            title="Hifz unavailable"
            message={error ?? "Could not start Hifz."}
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

  if (warmupInterstitial) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Practice" title="Warm-up check" subtitle="Let's review how the warm-up went." right={rightActions} />
        <Card>
          <div className="flex flex-col items-center text-center space-y-5 py-6">
            <span className="grid h-16 w-16 place-items-center rounded-full border border-[rgba(234,88,12,0.26)] bg-[rgba(234,88,12,0.10)] text-[rgba(234,88,12,0.85)]">
              <RotateCcw size={28} />
            </span>
            <div className="space-y-1.5 max-w-sm">
              <h2 className="text-lg font-semibold text-[color:var(--kw-ink)]">Your warm-up showed some gaps</h2>
              <p className="text-sm leading-relaxed text-[color:var(--kw-muted)]">
                Recalling yesterday&apos;s material is important for long-term retention. A second pass helps
                reinforce fragile connections before moving on.
              </p>
            </div>
            <Button
              className="gap-2"
              onClick={() => {
                setWarmupInterstitial(false);
                setStepIndex(0);
                setStepStartedAt(Date.now());
              }}
            >
              Let&apos;s try once more <RotateCcw size={16} />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (done) {
    const gradeCounts = { AGAIN: 0, HARD: 0, GOOD: 0, EASY: 0 };
    for (const ev of events) {
      if (ev.grade && ev.grade in gradeCounts) {
        gradeCounts[ev.grade as keyof typeof gradeCounts]++;
      }
    }
    const totalGraded = gradeCounts.AGAIN + gradeCounts.HARD + gradeCounts.GOOD + gradeCounts.EASY;
    const positiveRatio = totalGraded > 0 ? (gradeCounts.GOOD + gradeCounts.EASY) / totalGraded : 1;
    const encouragement =
      positiveRatio >= 0.8
        ? "Strong Hifz run. Your recall is solid."
        : positiveRatio >= 0.5
          ? "Good effort. Consistency builds mastery."
          : "Keep pushing! Every repetition strengthens memory.";

    const elapsedMs = Date.now() - new Date(run.startedAt).getTime();
    const elapsedTotalSec = Math.max(0, Math.floor(elapsedMs / 1000));
    const elapsedMin = Math.floor(elapsedTotalSec / 60);
    const elapsedSec = elapsedTotalSec % 60;
    const timeLabel = elapsedMin > 0 ? `${elapsedMin} min ${elapsedSec} sec` : `${elapsedSec} sec`;

    const gradeColors: Record<string, string> = {
      AGAIN: "border-[rgba(239,68,68,0.30)] bg-[rgba(239,68,68,0.10)] text-[rgba(239,68,68,0.90)]",
      HARD: "border-[rgba(234,88,12,0.30)] bg-[rgba(234,88,12,0.10)] text-[rgba(234,88,12,0.90)]",
      GOOD: "border-[rgba(22,163,74,0.30)] bg-[rgba(22,163,74,0.10)] text-[rgba(22,163,74,0.90)]",
      EASY: "border-[rgba(37,99,235,0.30)] bg-[rgba(37,99,235,0.10)] text-[rgba(37,99,235,0.90)]",
    };

    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Practice" title="Hifz complete" subtitle="Your progress has been saved." right={rightActions} />
        <Card>
          <div className="flex flex-col items-center text-center space-y-6 py-4">
            {/* Success icon with glow */}
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-[rgba(22,163,74,0.18)] blur-xl" />
              <span className="relative grid h-20 w-20 place-items-center rounded-full border border-[rgba(22,163,74,0.26)] bg-[rgba(22,163,74,0.10)] text-[color:var(--kw-lime-600)] shadow-[0_0_30px_rgba(22,163,74,0.15)]">
                <CheckCircle2 size={36} />
              </span>
            </div>

            {/* Title and encouragement */}
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-[color:var(--kw-ink)]">Hifz complete</h2>
              <p className="text-sm text-[color:var(--kw-muted)]">{encouragement}</p>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex flex-col items-center rounded-[18px] border border-[color:var(--kw-border)] bg-white/70 px-4 py-3 shadow-[var(--kw-shadow-soft)]">
                <span className="text-lg font-semibold text-[color:var(--kw-ink)]">{timeLabel}</span>
                <span className="text-xs text-[color:var(--kw-muted)]">Time spent</span>
              </div>
              <div className="flex flex-col items-center rounded-[18px] border border-[color:var(--kw-border)] bg-white/70 px-4 py-3 shadow-[var(--kw-shadow-soft)]">
                <span className="text-lg font-semibold text-[color:var(--kw-ink)]">{events.length} / {filteredSteps.length}</span>
                <span className="text-xs text-[color:var(--kw-muted)]">Steps completed</span>
              </div>
            </div>

            {/* Grade breakdown pills */}
            {totalGraded > 0 ? (
              <div className="space-y-2 w-full max-w-md">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Grade breakdown</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {(["AGAIN", "HARD", "GOOD", "EASY"] as const).map((g) =>
                    gradeCounts[g] > 0 ? (
                      <span
                        key={g}
                        className={clsx(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                          gradeColors[g],
                        )}
                      >
                        {g}
                        <span className="rounded-full bg-white/50 px-1.5 py-0.5 text-[10px] font-bold leading-none">
                          {gradeCounts[g]}
                        </span>
                      </span>
                    ) : null,
                  )}
                </div>
              </div>
            ) : null}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
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
        </Card>
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Practice"
          title="Hifz"
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
  const ref = verseRefFromAyahId(ayahId);
  const translation = run.translations.byAyahId[String(ayahId)] ?? null;
  const ayahText = run.ayahTextByAyahId[String(ayahId)] ?? null;
  const weeklyGateBoundary = warmupCount + weeklyGateCount;
  const weeklyGateWindowActive = run.state.weeklyGateRequired && weeklyGateCount > 0 && stepIndex < weeklyGateBoundary;
  const shouldShowWeeklyGateIntro = weeklyGateWindowActive && !coachSeen.weeklyGate;
  const coachTip = !coachSeen.tiers
    ? {
      key: "tiers" as CoachKey,
      title: "Sabaq, Sabqi, Manzil",
      message: "Sabaq is yesterday's new material, Sabqi is recent review, and Manzil is long-term rotation.",
    }
    : run.state.warmupRequired && !coachSeen.warmup
      ? {
        key: "warmup" as CoachKey,
        title: "Why warm-up can block new",
        message: "Warm-up checks yesterday's Sabaq. If it does not pass, new memorization is paused to protect retention.",
      }
      : isGraded(currentStep) && !coachSeen.grades
        ? {
          key: "grades" as CoachKey,
        title: "How grades work",
        message: "Tap Again, Hard, Good, or Easy. Your choice saves the step and moves you forward immediately.",
      }
      : null;

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
            : stepSummary(currentStep)
        }
        right={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Pill tone="neutral">{progressText}</Pill>
            {quickReviewMode ? <Pill tone="accent">Review-only</Pill> : null}
            {rightActions}
          </div>
        }
      />

      <SessionFlowTutorial surface="session" />

      {switchOpen ? (
        <Card>
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Select Hifz surah</p>
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
        </Card>
      ) : null}

      {shouldShowWeeklyGateIntro ? (
        <Card className="border-[rgba(234,88,12,0.28)] bg-[rgba(234,88,12,0.10)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Weekly consolidation gate (mandatory)</p>
              <p className="mt-1 text-sm leading-7 text-[color:var(--kw-muted)]">
                This gate is required before new memorization continues. It protects retention and prevents hidden decay.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => markCoachSeen("weeklyGate")}>
              I understand
            </Button>
          </div>
        </Card>
      ) : null}

      {coachTip ? (
        <Card className="border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{coachTip.title}</p>
              <p className="mt-1 text-sm leading-7 text-[color:var(--kw-muted)]">{coachTip.message}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => markCoachSeen(coachTip.key)}>
              Got it
            </Button>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="neutral">{stepTitle(currentStep)}</Pill>
            {currentStep.kind === "AYAH" && currentStep.stage === "NEW" ? (
              <Pill tone="neutral">
                {currentStep.phase === "NEW_EXPOSE"
                  ? "Expose"
                  : currentStep.phase === "NEW_GUIDED"
                    ? "Guided recall"
                    : "Blind recall"}
              </Pill>
            ) : null}
            {currentStep.kind === "AYAH" && currentStep.stage === "REVIEW" && currentStep.reviewTier ? (
              <Pill tone="accent">{currentStep.reviewTier === "SABQI" ? "Recent review tier" : "Long-term review tier"}</Pill>
            ) : null}
            {reviewOnlyLock ? <Pill tone="warn">Review-only</Pill> : null}
            {run.state.monthlyTestRequired ? <Pill tone="warn">Monthly retention check</Pill> : null}
            {currentStepRequiresHiddenText ? <Pill tone="warn">Blind recall mode</Pill> : null}
            {assistedThisStep ? <Pill tone="warn">Assisted reveal used</Pill> : null}
          </div>

          {currentStep.kind === "LINK" ? (
            <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Link practice
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
            <div className="space-y-3">
              <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  {ref ? `Surah ${ref.surahNumber}:${ref.ayahNumber}` : `Ayah ${currentStep.ayahId}`}
                </p>
                {showText ? (
                  <div className="mt-3 space-y-4">
                    <div dir="rtl" className="text-right font-[family-name:var(--font-kw-quran)] text-2xl leading-[2.1] text-[color:var(--kw-ink)]">
                      {ayahText ?? "Ayah text unavailable"}
                    </div>
                    {showTranslation ? (
                      <p dir="ltr" className="text-left text-sm leading-7 text-[color:var(--kw-muted)]">
                        {translation ?? "Translation unavailable"}
                      </p>
                    ) : (
                      <p dir="ltr" className="text-left text-sm leading-7 text-[color:var(--kw-faint)]">
                        Translation hidden.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 rounded-[18px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] px-3 py-3">
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Text hidden for recall integrity.</p>
                    <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                      Recite from memory first.
                      {currentStepRequiresHiddenText
                        ? " Use Reveal only if stuck."
                        : " You can show text from the top controls."}
                    </p>
                  </div>
                )}
                {showText && revealUntilMs ? (
                  <p className="mt-2 text-xs font-semibold text-[color:var(--kw-faint)]">
                    Assisted reveal active.
                  </p>
                ) : null}
              </div>
              <div className="max-w-xl">
                <AyahAudioPlayer ayahId={currentStep.ayahId} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            {isGraded(currentStep) ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Choose a grade to continue (no extra next button).
                </p>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {GRADE_ACTIONS.map(({ grade, hint }, idx) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => void advance(grade)}
                      className={clsx(
                        "flex items-center justify-between gap-3 rounded-[18px] border px-3 py-2 text-left shadow-[var(--kw-shadow-soft)] transition hover:bg-white",
                        "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)]",
                      )}
                    >
                      <span>
                        <span className="block text-sm font-semibold">{grade}</span>
                        <span className="block text-xs text-[color:var(--kw-muted)]">{hint}</span>
                      </span>
                      <span className="rounded-full border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-2 py-1 text-xs font-semibold text-[color:var(--kw-faint)]">
                        {idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
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

