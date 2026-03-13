import Link from "next/link";
import { GraduationCap, Users } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export const metadata = {
  title: "Teacher Mode",
};

export default function TeacherSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Teacher mode"
        subtitle="Teacher and parent collaboration should become a first-class surface. This page explains the current state and the intended direction."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Current state</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone="neutral">Single-user Hifz engine</Pill>
            <Pill tone="neutral">Per-user progress views</Pill>
            <Pill tone="neutral">No roster yet</Pill>
          </div>
          <p className="mt-4 text-sm leading-7 text-[color:var(--kw-muted)]">
            Hifzer already supports teacher-informed queue logic through its review model, but it does not yet expose teacher dashboards, student rosters, or approval workflows.
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Planned direction</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone="accent">Student queue review</Pill>
            <Pill tone="accent">Assignment handoff</Pill>
            <Pill tone="accent">Parent supervision</Pill>
          </div>
          <p className="mt-4 text-sm leading-7 text-[color:var(--kw-muted)]">
            The intended flow is teacher-approved advancement, clearer re-test requests, and simple parent summaries that reflect real recitation quality rather than vanity stats.
          </p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">What to use right now</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Today, the practical workflow is to use Hifz sessions, transitions, and progress screens during live teacher review, then share the relevant screen directly.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/teacher"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-3 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
            >
              Open teacher dashboard
            </Link>
            <Link
              href="/hifz/progress"
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)]"
            >
              Open Hifz progress
            </Link>
            <Link
              href="/settings/plan"
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)]"
            >
              Open plan settings
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
