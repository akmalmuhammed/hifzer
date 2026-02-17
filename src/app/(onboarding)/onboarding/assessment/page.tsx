"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";

type AssessmentDraft = {
  dailyMinutes: number;
  practiceDaysPerWeek: number;
  planBias: "BALANCED" | "RETENTION" | "SPEED";
  hasTeacher: boolean;
  timezone: string;
};

const TIMEZONE_PLACEHOLDER = "Detecting timezone...";

export default function OnboardingAssessmentPage() {
  const router = useRouter();
  const { pushToast } = useToast();

  const [draft, setDraft] = useState<AssessmentDraft>({
    dailyMinutes: 20,
    practiceDaysPerWeek: 6,
    planBias: "BALANCED",
    hasTeacher: false,
    timezone: TIMEZONE_PLACEHOLDER,
  });

  useEffect(() => {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
    const raf = window.requestAnimationFrame(() => {
      setDraft((current) =>
        current.timezone === browserTimezone ? current : { ...current, timezone: browserTimezone },
      );
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  async function saveAndNext() {
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
      pushToast({ title: "Saved", message: "Assessment persisted to your profile.", tone: "success" });
      router.push("/onboarding/start-point");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save assessment.";
      pushToast({ title: "Save failed", message, tone: "warning" });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Assessment"
        subtitle="Five quick questions. We use this to shape your plan."
      />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <Pill tone="neutral">Prototype</Pill>
            <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
              These answers shape your scheduling policy and are saved to your profile immediately.
            </p>
          </div>
          <Link href="/onboarding/start-point" className="text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline">
            Skip <ArrowRight className="inline" size={16} />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Daily minutes
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Input
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
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Practice days / week
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Input
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
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[color:var(--kw-faint)]">Timezone: {draft.timezone}</p>
          <Button onClick={saveAndNext} className="gap-2">
            Continue <ArrowRight size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
