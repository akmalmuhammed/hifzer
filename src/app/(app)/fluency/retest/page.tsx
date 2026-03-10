import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { getDashboardOverview } from "@/hifzer/dashboard/server";
import { getRecitationInsights } from "@/hifzer/recitation/server";

export const metadata = {
  title: "Fluency Retest",
};

function readinessTone(score: number, challenges: number, weakTransitions: number): "success" | "warn" | "accent" {
  if (score >= 75 && challenges <= 2 && weakTransitions <= 1) {
    return "success";
  }
  if (score < 60 || challenges >= 5 || weakTransitions >= 4) {
    return "warn";
  }
  return "accent";
}

function readinessLabel(score: number, challenges: number, weakTransitions: number): string {
  if (score >= 75 && challenges <= 2 && weakTransitions <= 1) {
    return "Ready for a cleaner retest";
  }
  if (score < 60 || challenges >= 5 || weakTransitions >= 4) {
    return "Needs more stabilization first";
  }
  return "Improving, but retest gently";
}

export default async function FluencyRetestPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const [overview, insights] = await Promise.all([
    getDashboardOverview(userId),
    getRecitationInsights(userId, { challengeLimit: 5, transitionLimit: 5 }),
  ]);

  const retentionScore = overview?.kpis.retentionScore14d ?? 0;
  const challengeCount = insights?.challengeAyahs.length ?? 0;
  const weakTransitions = insights?.openWeakTransitions ?? 0;
  const tone = readinessTone(retentionScore, challengeCount, weakTransitions);
  const readiness = readinessLabel(retentionScore, challengeCount, weakTransitions);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fluency"
        title="Retest"
        subtitle="Re-attempt fluency only after the recitation actually sounds calmer. The point is cleaner flow, not just finishing another screen."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <Pill tone={tone}>{readiness}</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{retentionScore}%</p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Recent retention-quality signal.</p>
        </Card>
        <Card>
          <Pill tone="warn">Challenge ayahs</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{challengeCount}</p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Ayahs still repeatedly triggering AGAIN/HARD friction.</p>
        </Card>
        <Card>
          <Pill tone="accent">Weak seams</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{weakTransitions}</p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Open ayah-to-ayah joins that still sound unstable.</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <RotateCcw size={16} className="text-[color:var(--kw-faint)]" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Recommended retest path</p>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--kw-muted)]">
              <p>If the flow still breaks, return to `listen-repeat` first.</p>
              <p>If the ayah itself is shaky, retest your hesitation passages.</p>
              <p>If the ayah is stable but the join breaks, retest transitions separately.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/fluency/lesson/listen-repeat"
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)]"
            >
              Listen-repeat
            </Link>
            <Link
              href="/fluency/lesson/hesitation"
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)]"
            >
              Hesitation
            </Link>
            <Link
              href="/fluency/lesson/transitions"
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)]"
            >
              Transitions
            </Link>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">When you are ready</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Move back into the main practice surfaces and judge the retest by stability, hesitation reduction, and smoother forward movement.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-3 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
            >
              Open practice <ArrowRight size={14} />
            </Link>
            <Link
              href="/hifz"
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)]"
            >
              Return to Hifz
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
