"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/app/page-header";
import { useToast } from "@/components/ui/toast";

type PlanClientProps = {
  initial: {
    dailyMinutes: number;
    practiceDaysPerWeek: number;
    planBias: "BALANCED" | "RETENTION" | "SPEED";
    hasTeacher: boolean;
    timezone: string;
  };
};

export function PlanSettingsClient(props: PlanClientProps) {
  const { pushToast } = useToast();
  const [draft, setDraft] = useState(props.initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/assessment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to save plan.");
      }
      pushToast({ tone: "success", title: "Saved", message: "Plan settings updated." });
    } catch (error) {
      pushToast({
        tone: "warning",
        title: "Save failed",
        message: error instanceof Error ? error.message : "Failed to save plan.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Plan"
        subtitle="Adjust budget and bias used by the Hifz OS queue engine."
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Daily minutes
            </p>
            <Input
              type="number"
              min={5}
              max={240}
              className="mt-2"
              value={draft.dailyMinutes}
              onChange={(e) => setDraft((d) => ({ ...d, dailyMinutes: Number(e.target.value) }))}
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Practice days / week
            </p>
            <Input
              type="number"
              min={1}
              max={7}
              className="mt-2"
              value={draft.practiceDaysPerWeek}
              onChange={(e) => setDraft((d) => ({ ...d, practiceDaysPerWeek: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Plan bias
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["BALANCED", "RETENTION", "SPEED"] as const).map((bias) => (
                <button
                  key={bias}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, planBias: bias }))}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    draft.planBias === bias
                      ? "border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
                      : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)] hover:bg-white",
                  ].join(" ")}
                >
                  {bias}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Teacher support
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[true, false].map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, hasTeacher: value }))}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    draft.hasTeacher === value
                      ? "border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
                      : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)] hover:bg-white",
                  ].join(" ")}
                >
                  {value ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-[color:var(--kw-faint)]">Timezone: {draft.timezone}</p>
          <Button className="gap-2" loading={saving} onClick={save}>
            Save plan <ArrowRight size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
}

