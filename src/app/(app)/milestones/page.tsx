import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, Award } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { getDashboardOverview } from "@/hifzer/dashboard/server";

export const metadata = {
  title: "Milestones",
};

function nextStep(current: number, steps: number[]): number {
  return steps.find((step) => current < step) ?? steps[steps.length - 1] ?? current;
}

export default async function MilestonesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const overview = await getDashboardOverview(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Milestones"
        title="Milestones"
        subtitle="A calm record of what has actually been built: sessions completed, Qur'an coverage, and long-term consistency."
      />

      {!overview ? (
        <Card>
          <EmptyState
            title="Milestones unavailable"
            message="We could not load your progress summary."
            icon={<Award size={18} />}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <Pill tone="accent">Qur&apos;an coverage</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {overview.kpis.quranCompletionPct.toFixed(1)}%
              </p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Tracked reading coverage across the entire Qur&apos;an.</p>
            </Card>
            <Card>
              <Pill tone="neutral">Khatmah</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {overview.quran.completedKhatmahCount}
              </p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Completed tracked khatmah cycles so far.</p>
            </Card>
            <Card>
              <Pill tone="warn">Current streak</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {overview.streak.currentStreakDays}
              </p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Days in your current qualifying recitation streak.</p>
            </Card>
            <Card>
              <Pill tone="neutral">Hifz sessions</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {overview.kpis.completedSessions7d}
              </p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Completed Hifz sessions in the last 7 days.</p>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Next milestone targets</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Next Qur&apos;an coverage step</p>
                    <Pill tone="accent">{nextStep(Math.floor(overview.kpis.quranCompletionPct), [5, 10, 25, 50, 75, 100])}%</Pill>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                    Continue reading from {overview.quran.cursorRef} in {overview.quran.currentSurahName}.
                  </p>
                </div>
                <div className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Next streak step</p>
                    <Pill tone="warn">{nextStep(overview.streak.currentStreakDays, [3, 7, 14, 30, 60, 90, 180])} days</Pill>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                    Best streak so far: {overview.streak.bestStreakDays} days.
                  </p>
                </div>
                <div className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Next Hifz cadence step</p>
                    <Pill tone="neutral">{nextStep(overview.kpis.completedSessions7d, [3, 5, 7, 10])} sessions / 7d</Pill>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                    Retention score over 14 days: {overview.kpis.retentionScore14d}%.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">What counts as a meaningful milestone</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                <p>Consistency is a milestone. Smoothness is a milestone. Review integrity is a milestone.</p>
                <p>Hifzer should reward real continuity, not vanity badges detached from Qur&apos;an work.</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/today"
                  className="inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-3 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
                >
                  Open dashboard <ArrowRight size={14} />
                </Link>
                <Link
                  href="/quran"
                  className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)]"
                >
                  Continue Qur&apos;an
                </Link>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
