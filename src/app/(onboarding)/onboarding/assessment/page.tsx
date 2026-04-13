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

export default function OnboardingAssessmentPage() {
  const router = useRouter();
  const { pushToast } = useToast();

  const [draft, setDraft] = useState<AssessmentDraft>(DEFAULT_DRAFT);
  const [saving, setSaving] = useState(false);
  const [quickStarting, setQuickStarting] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);

  useEffect(() => {
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

    const raf = window.requestAnimationFrame(() => {
      setDraft(nextDraft);
      setDraftHydrated(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

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
    let persisted = false;
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
      persisted = true;
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
        title: "Saved locally",
        message: `${message} We’ll keep going and sync the profile as the rest of onboarding completes.`,
        tone: "warning",
      });
    } finally {
      setSaving(false);
    }

    setOnboardingAssessmentDraft(draft);
    setOnboardingStartLane(draft.onboardingStartLane);
    if (!persisted) {
      window.localStorage.removeItem("hifzer_onboarding_completed_v1");
    }
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
      if (!quickStartResponse.ok) {
        const quickStartPayload = (await quickStartResponse.json()) as { error?: string };
        const fallbackResponse = await fetch("/api/profile/onboarding-complete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ onboardingStartLane: "hifz" }),
        });
        const fallbackPayload = (await fallbackResponse.json()) as { error?: string };
        if (!fallbackResponse.ok) {
          throw new Error(quickStartPayload.error || fallbackPayload.error || "Failed to start with defaults.");
        }
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
      <Card>
        <div className="max-w-2xl">
          <p className="text-sm leading-7 text-[color:var(--kw-muted)]">
            This one step now covers your pace and your starting lane so onboarding stays short.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
            <label
              htmlFor="assessment-daily-minutes"
              className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]"
            >
              Daily minutes
            </label>
            <div className="mt-2 flex items-center gap-2">
              <Input
                id="assessment-daily-minutes"
                type="number"
                min={5}
                max={180}
                value={draft.dailyMinutes}
                onChange={(e) => setDraft((d) => ({ ...d, dailyMinutes: Number(e.target.value) }))}
              />
              <span className="text-sm font-semibold text-[color:var(--kw-muted)]">min</span>
            </div>
          </div>

          <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
            <label
              htmlFor="assessment-practice-days"
              className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]"
            >
              Practice days / week
            </label>
            <div className="mt-2 flex items-center gap-2">
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
              <span className="text-sm font-semibold text-[color:var(--kw-muted)]">days</span>
            </div>
          </div>

          <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
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
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    draft.planBias === opt.v
                      ? "border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
                      : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)] hover:bg-white",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Teacher mode
            </p>
            <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
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
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    draft.hasTeacher === opt.v
                      ? "border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
                      : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)] hover:bg-white",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Start with
            </p>
            <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
              Choose the surface that feels most helpful right now. You can move between them later.
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
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
                      "rounded-[20px] border px-4 py-3 text-left transition",
                      active
                        ? "border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.10)]"
                        : "border-[color:var(--kw-border-2)] bg-white/70 hover:bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{option.label}</p>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">{option.body}</p>
                      </div>
                      <span className="grid h-9 w-9 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/80 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
                        {option.icon}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Translation language
            </p>
            <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
              This becomes your default across Qur&apos;an reading and session translation views.
            </p>
            <label className="mt-3 block text-sm text-[color:var(--kw-muted)]">
              Language
              <select
                value={draft.quranTranslationId}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, quranTranslationId: e.target.value as QuranTranslationId }))
                }
                className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 text-sm text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] outline-none transition focus:border-[rgba(var(--kw-accent-rgb),0.55)] focus-visible:ring-4 focus-visible:ring-[rgba(var(--kw-accent-rgb),0.16)] md:max-w-[520px]"
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

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-xs text-[color:var(--kw-faint)]">
              Timezone detected: {draft.timezone}. Adjust it later if you travel often.
            </p>
            <p className="mt-2 text-xs text-[color:var(--kw-faint)]">
              Two quick steps from here: this page, then your starting point.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={startWithDefaults} variant="secondary" className="gap-2" loading={quickStarting}>
              Start with defaults <ArrowRight size={16} />
            </Button>
            <Button onClick={saveAndNext} className="gap-2" loading={saving}>
              Continue <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </OnboardingShell>
  );
}
