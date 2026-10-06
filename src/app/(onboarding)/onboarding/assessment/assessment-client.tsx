"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { ArrowRight, Headphones, Link2, Mic, UserRoundCheck } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  QURAN_TRANSLATION_OPTIONS,
  isSupportedQuranTranslationId,
  type QuranTranslationId,
} from "@/hifzer/quran/translation-prefs";
import {
  getOnboardingAssessmentDraft,
  setDashboardFirstRunGuidePending,
  setOnboardingAssessmentDraft,
  setOnboardingCompleted,
  setOnboardingStartLane,
  syncLocalStateOwner,
} from "@/hifzer/local/store";

type AssessmentDraft = {
  dailyMinutes: number;
  practiceDaysPerWeek: number;
  planBias: "BALANCED" | "RETENTION" | "SPEED";
  hasTeacher: boolean;
  timezone: string;
  quranTranslationId: QuranTranslationId;
  onboardingStartLane: "hifz" | "fluency" | "listen" | "transitions";
};

const TIMEZONE_PLACEHOLDER = "Detecting timezone...";
const DEFAULT_DRAFT: AssessmentDraft = {
  dailyMinutes: 20,
  practiceDaysPerWeek: 6,
  planBias: "BALANCED",
  hasTeacher: false,
  timezone: TIMEZONE_PLACEHOLDER,
  quranTranslationId: "en.sahih",
  onboardingStartLane: "hifz",
};

export function OnboardingAssessmentClient(props: { localStorageUserId: string | null }) {
  const router = useRouter();
  const { pushToast } = useToast();

  const [draft, setDraft] = useState<AssessmentDraft>(DEFAULT_DRAFT);
  const [saving, setSaving] = useState(false);
  const [quickStarting, setQuickStarting] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let raf: number | null = null;
    void (async () => {
      const ownerReady = await syncLocalStateOwner(props.localStorageUserId);
      if (cancelled || !ownerReady) {
        return;
      }

      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
      const stored = getOnboardingAssessmentDraft();
      const nextDraft: AssessmentDraft = stored
        ? {
            ...stored,
            timezone: stored.timezone === TIMEZONE_PLACEHOLDER ? browserTimezone : stored.timezone,
            quranTranslationId: isSupportedQuranTranslationId(stored.quranTranslationId)
              ? stored.quranTranslationId
              : "en.sahih",
          }
        : {
            ...DEFAULT_DRAFT,
            timezone: browserTimezone,
          };

      raf = window.requestAnimationFrame(() => {
        setDraft(nextDraft);
        setDraftHydrated(true);
      });
    })();
    return () => {
      cancelled = true;
      if (raf !== null) {
        window.cancelAnimationFrame(raf);
      }
    };
  }, [props.localStorageUserId]);

  useEffect(() => {
    if (!draftHydrated) {
      return;
    }
    setOnboardingAssessmentDraft(draft);
  }, [draft, draftHydrated]);

  async function saveAndNext() {
    if (saving) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile/assessment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to save assessment.");
      }
      setOnboardingAssessmentDraft(draft);
      setOnboardingStartLane(draft.onboardingStartLane);
      pushToast({ title: "Saved", message: "Assessment persisted to your profile.", tone: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save assessment.";
      Sentry.captureException(error, {
        tags: {
          area: "onboarding",
          step: "assessment",
          action: "save_assessment",
        },
        extra: {
          draft,
        },
      });
      pushToast({
        title: "Could not save setup",
        message: `${message} Please try again so your dashboard starts with the right plan.`,
        tone: "warning",
      });
      return;
    } finally {
      setSaving(false);
    }

    setOnboardingAssessmentDraft(draft);
    setOnboardingStartLane(draft.onboardingStartLane);
    router.push("/onboarding/start-point");
  }

  async function startWithDefaults() {
    if (quickStarting) {
      return;
    }

    setQuickStarting(true);
    try {
      const quickStartResponse = await fetch("/api/profile/onboarding-quick-start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...draft,
          onboardingStartLane: draft.onboardingStartLane,
        }),
      });
      const quickStartPayload = (await quickStartResponse.json()) as { error?: string; localOnly?: boolean };
      if (!quickStartResponse.ok) {
        throw new Error(quickStartPayload.error || "Failed to start with defaults.");
      }
      if (quickStartPayload.localOnly) {
        throw new Error("Could not save your setup to your account yet.");
      }

      setOnboardingAssessmentDraft(draft);
      setOnboardingStartLane(draft.onboardingStartLane);
      setOnboardingCompleted();
      setDashboardFirstRunGuidePending();
      pushToast({
        title: "Started with defaults",
        message: "You are in. You can adjust your plan and settings later from inside the app.",
        tone: "success",
      });
      router.push("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start with defaults.";
      Sentry.captureException(error, {
        tags: {
          area: "onboarding",
          step: "assessment",
          action: "quick_start",
        },
        extra: {
          draft,
        },
      });
      pushToast({ title: "Quick start failed", message, tone: "warning" });
    } finally {
      setQuickStarting(false);
    }
  }

  return (
    <OnboardingShell
      step="assessment"
      title="Let’s set up your first week."
      subtitle="Pick a realistic pace, choose the lane that fits you best, and we’ll keep the rest light."
      backHref="/"
      supportTitle="Only the essentials"
      supportBody="This step is doing the heavy lifting now so you do not have to click through extra setup screens later."
      supportPoints={[
        {
          title: "Pick a pace you can keep",
          description: "A realistic plan is better than a perfect-looking one that burns out by day three.",
        },
        {
          title: "Choose your best starting lane",
          description: "If hifz is not the right first surface today, you can start with fluency, listening, or transitions instead.",
        },
        {
          title: "Everything stays editable",
          description: "You can adjust pace, lane, translation, and reminders later once the app feels familiar.",
        },
      ]}
    >
      <Card className="border-0! bg-transparent! p-0! shadow-none!">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[0.94rem] leading-[1.5] text-[color:var(--kw-faint)]">
            This one step now covers your pace and your starting lane so onboarding stays short.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[18px] bg-[color:var(--kw-card)] px-5 py-5">
            <label
              htmlFor="assessment-daily-minutes"
              className="text-[1.06rem] font-semibold tracking-[-0.015em] text-[color:var(--kw-ink)]"
            >
              Daily minutes
            </label>
            <div className="mt-3 flex items-center gap-2.5">
              <Input
                id="assessment-daily-minutes"
                type="number"
                min={5}
                max={180}
                value={draft.dailyMinutes}
                onChange={(e) => setDraft((d) => ({ ...d, dailyMinutes: Number(e.target.value) }))}
              />
              <span className="text-[0.94rem] font-medium text-[color:var(--kw-muted)]">min</span>
            </div>
          </div>

          <div className="rounded-[18px] bg-[color:var(--kw-card)] px-5 py-5">
            <label
              htmlFor="assessment-practice-days"
              className="text-[1.06rem] font-semibold tracking-[-0.015em] text-[color:var(--kw-ink)]"
            >
              Practice days / week
            </label>
            <div className="mt-3 flex items-center gap-2.5">
              <Input
                id="assessment-practice-days"
                type="number"
                min={1}
                max={7}
                value={draft.practiceDaysPerWeek}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, practiceDaysPerWeek: Number(e.target.value) }))
                }
              />
              <span className="text-[0.94rem] font-medium text-[color:var(--kw-muted)]">days</span>
            </div>
          </div>

          <div className="rounded-[18px] bg-[color:var(--kw-card)] px-5 py-5">
            <p className="text-[1.06rem] font-semibold tracking-[-0.015em] text-[color:var(--kw-ink)]">
              Plan bias
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { v: "BALANCED", label: "Balanced" },
                { v: "RETENTION", label: "Retention" },
                { v: "SPEED", label: "Speed" },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, planBias: opt.v as AssessmentDraft["planBias"] }))}
                  className={[
                    "inline-flex h-11 items-center rounded-full px-5 text-[0.94rem] font-medium transition-colors duration-200",
                    draft.planBias === opt.v
                      ? "bg-[rgba(var(--kw-accent-rgb),1)] text-white"
                      : "bg-[color:var(--kw-fill-strong)] text-[color:var(--kw-ink)] hover:bg-[color:var(--kw-hover-strong)]",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] bg-[color:var(--kw-card)] px-5 py-5">
            <p className="text-[1.06rem] font-semibold tracking-[-0.015em] text-[color:var(--kw-ink)]">
              Teacher mode
            </p>
            <p className="mt-1 text-[0.94rem] leading-[1.45] text-[color:var(--kw-muted)]">
              Do you have a teacher who reviews your recitation?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { v: true, label: "Yes" },
                { v: false, label: "No" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, hasTeacher: opt.v }))}
                  className={[
                    "inline-flex h-11 items-center rounded-full px-5 text-[0.94rem] font-medium transition-colors duration-200",
                    draft.hasTeacher === opt.v
                      ? "bg-[rgba(var(--kw-accent-rgb),1)] text-white"
                      : "bg-[color:var(--kw-fill-strong)] text-[color:var(--kw-ink)] hover:bg-[color:var(--kw-hover-strong)]",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] bg-[color:var(--kw-card)] px-5 py-5 md:col-span-2">
            <p className="text-[1.06rem] font-semibold tracking-[-0.015em] text-[color:var(--kw-ink)]">
              Start with
            </p>
            <p className="mt-1 text-[0.94rem] leading-[1.45] text-[color:var(--kw-muted)]">
              Choose the surface that feels most helpful right now. You can move between them later.
            </p>
            <div className="mt-4 grid gap-2.5">
              {[
                {
                  v: "hifz",
                  label: "Hifz first",
                  body: "Go straight into memorization and review.",
                  icon: <UserRoundCheck size={16} />,
                },
                {
                  v: "fluency",
                  label: "Fluency first",
                  body: "Warm up recitation before heavier recall.",
                  icon: <Mic size={16} />,
                },
                {
                  v: "listen",
                  label: "Listening first",
                  body: "Use listen-and-repeat to build confidence.",
                  icon: <Headphones size={16} />,
                },
                {
                  v: "transitions",
                  label: "Transitions first",
                  body: "Repair ayah joins that keep slipping.",
                  icon: <Link2 size={16} />,
                },
              ].map((option) => {
                const active = draft.onboardingStartLane === option.v;
                return (
                  <button
                    key={option.v}
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        onboardingStartLane: option.v as AssessmentDraft["onboardingStartLane"],
                      }))
                    }
                    className={[
                      "min-h-[4.5rem] rounded-[16px] px-4 py-3.5 text-left transition-colors duration-200",
                      active
                        ? "bg-[rgba(var(--kw-accent-rgb),0.1)] [&_span]:bg-[rgba(var(--kw-accent-rgb),1)] [&_span]:text-white"
                        : "bg-[color:var(--kw-fill)] hover:bg-[color:var(--kw-fill-strong)]",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[1.02rem] font-semibold tracking-[-0.01em] text-[color:var(--kw-ink)]">{option.label}</p>
                        <p className="mt-0.5 text-[0.94rem] leading-[1.45] text-[color:var(--kw-muted)]">{option.body}</p>
                      </div>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--kw-card)] text-[color:var(--kw-muted)] transition-colors duration-200">
                        {option.icon}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[18px] bg-[color:var(--kw-card)] px-5 py-5 md:col-span-2">
            <p className="text-[1.06rem] font-semibold tracking-[-0.015em] text-[color:var(--kw-ink)]">
              Translation language
            </p>
            <p className="mt-1 text-[0.94rem] leading-[1.45] text-[color:var(--kw-muted)]">
              This becomes your default across Qur&apos;an reading and session translation views.
            </p>
            <label className="mt-4 block text-[0.94rem] text-[color:var(--kw-muted)]">
              Language
              <select
                value={draft.quranTranslationId}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, quranTranslationId: e.target.value as QuranTranslationId }))
                }
                className="mt-1.5 h-11 w-full rounded-[12px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 text-[0.94rem] text-[color:var(--kw-ink)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[rgba(var(--kw-accent-rgb),0.55)] focus-visible:ring-4 focus-visible:ring-[rgba(var(--kw-accent-rgb),0.16)]"
              >
                {QURAN_TRANSLATION_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse items-center gap-6 text-center">
          <div className="max-w-xl">
            <p className="text-[0.84rem] leading-[1.45] text-[color:var(--kw-faint)]">
              Timezone detected: {draft.timezone}. Adjust it later if you travel often.
            </p>
            <p className="mt-1 text-[0.84rem] leading-[1.45] text-[color:var(--kw-faint)]">
              Two quick steps from here: this page, then your starting point.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={startWithDefaults} variant="secondary" className="min-w-[11rem] gap-2" loading={quickStarting}>
              Start with defaults <ArrowRight size={16} />
            </Button>
            <Button onClick={saveAndNext} className="min-w-[11rem] gap-2" loading={saving}>
              Continue <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </OnboardingShell>
  );
}
