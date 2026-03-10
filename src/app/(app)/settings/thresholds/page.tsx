import { auth } from "@clerk/nextjs/server";
import { SlidersHorizontal } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { getProfileSnapshot } from "@/hifzer/profile/server";

export const metadata = {
  title: "Thresholds",
};

export default async function ThresholdsSettingsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const profile = await getProfileSnapshot(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Thresholds"
        subtitle="These are the queue thresholds currently shaping your Hifz engine. They are visible here so the system feels transparent before we expose more tuning."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <Pill tone="neutral">Review floor</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {profile?.reviewFloorPct ?? 70}%
          </p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Minimum review share before new memorization expands again.</p>
        </Card>
        <Card>
          <Pill tone="warn">Consolidation trigger</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {profile?.consolidationThresholdPct ?? 25}%
          </p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">When review debt reaches this level, the engine increases review density.</p>
        </Card>
        <Card>
          <Pill tone="accent">Catch-up trigger</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {profile?.catchUpThresholdPct ?? 45}%
          </p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">At this point new work pauses until retention pressure comes down.</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-[color:var(--kw-faint)]" />
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Why these are not user-tuned yet</p>
        </div>
        <p className="mt-4 text-sm leading-7 text-[color:var(--kw-muted)]">
          Exposing threshold sliders too early would let users accidentally break their own queue integrity. The right long-term move is guided presets and teacher-safe overrides, not raw knobs without context.
        </p>
      </Card>
    </div>
  );
}
