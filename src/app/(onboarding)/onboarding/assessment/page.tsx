"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
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
};

const TIMEZONE_PLACEHOLDER = "Detecting timezone...";
const DEFAULT_DRAFT: AssessmentDraft = {
  dailyMinutes: 20,
  practiceDaysPerWeek: 6,
  planBias: "BALANCED",
  hasTeacher: false,
  timezone: TIMEZONE_PLACEHOLDER,
  quranTranslationId: "en.sahih",
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
      pushToast({ title: "Saved", message: "Assessment persisted to your profile.", tone: "success" });
      router.push("/onboarding/start-point");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save assessment.";
      pushToast({ title: "Save failed", message, tone: "warning" });
    } finally {
      setSaving(false);
    }
  }

  async function startWithDefaults() {
    if (quickStarting) {
      return;
    }

    setQuickStarting(true);
    try {
      const res = await fetch("/api/profile/onboarding-quick-start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...draft,
          onboardingStartLane: "hifz",
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to start with defaults.");
      }

      setOnboardingAssessmentDraft(draft);
      setOnboardingStartLane("hifz");
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
      pushToast({ title: "Quick start failed", message, tone: "warning" });
    } finally {
      setQuickStarting(false);
    }
  }

  return (
    <OnboardingShell
      step="assessment"
      title="Shape a plan you can keep."
      subtitle="These defaults tune your daily load, weekly cadence, and reading support so Hifzer starts at the right intensity."
      backHref="/onboarding/welcome"
      supportTitle="Recommended settings are already loaded"
      supportBody="You can move quickly here. The goal is not to be perfect on day one, only to give the planner enough signal to stay realistic."
      supportPoints={[
        {
          title: "Pace before pressure",
          description: "A smaller plan you return to is better than an ambitious plan you abandon after three days.",
        },
        {
          title: "Translation follows you",
          description: "Your chosen translation becomes the default across Qur'an reading and session support text.",
        },
        {
          title: "Editable later",
          description: "Every setting on this step can be changed again from Settings once you are inside the app.",
        },
      ]}
    >
      <Card>
        <div className="max-w-2xl">
          <p className="text-sm leading-7 text-[color:var(--kw-muted)]">
            We save these answers to your profile so the dashboard and planning engine can stay aligned from your first session.
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
              If sync is being stubborn, start with the recommended defaults and refine everything later.
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
