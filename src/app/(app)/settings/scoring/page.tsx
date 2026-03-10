import Link from "next/link";
import { Gauge, Target } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export const metadata = {
  title: "Scoring",
};

export default function ScoringSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Scoring"
        subtitle="Hifzer already uses a stable four-grade model. This page explains the current rubric and what will later become configurable."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Again", desc: "Could not recall cleanly or lost the ayah.", tone: "warn" as const },
          { label: "Hard", desc: "Needed prompting, reveal, or felt unstable.", tone: "warn" as const },
          { label: "Good", desc: "Mostly correct with usable forward flow.", tone: "accent" as const },
          { label: "Easy", desc: "Clean recall with strong control and confidence.", tone: "success" as const },
        ].map((item) => (
          <Card key={item.label}>
            <Pill tone={item.tone}>{item.label}</Pill>
            <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{item.desc}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <Gauge size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Current guardrails</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone="neutral">Reveal caps at Hard</Pill>
            <Pill tone="neutral">Off-plan events rejected</Pill>
            <Pill tone="neutral">Gate evidence required</Pill>
          </div>
          <p className="mt-4 text-sm leading-7 text-[color:var(--kw-muted)]">
            The current scoring model is intentionally simple so the Hifz engine can trust it. Assisted recall should not masquerade as clean recall.
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Target size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Later configuration</p>
          </div>
          <p className="mt-4 text-sm leading-7 text-[color:var(--kw-muted)]">
            Future scoring controls should tune how AI or teacher feedback maps into the same four grades, not invent a second incompatible grading system.
          </p>
          <Link href="/hifz" className="mt-5 inline-flex text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
            Open a Hifz session
          </Link>
        </Card>
      </div>
    </div>
  );
}
