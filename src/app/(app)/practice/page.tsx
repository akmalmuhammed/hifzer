import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, BookOpenText, Dumbbell, Link2, RotateCcw } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { getDashboardOverview } from "@/hifzer/dashboard/server";
import { getRecitationInsights } from "@/hifzer/recitation/server";

export const metadata = {
  title: "Practice",
};

export default async function PracticePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const [overview, insights] = await Promise.all([
    getDashboardOverview(userId),
    getRecitationInsights(userId, { challengeLimit: 4, transitionLimit: 4 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Practice"
        title="Practice drills"
        subtitle="Work outside the scheduled Hifz queue when you want smoother recitation without changing today's plan."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <Pill tone="neutral">Review pressure</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {overview?.reviewHealth.dueNow ?? 0}
          </p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Ayahs due right now in the scheduled Hifz queue.</p>
        </Card>
        <Card>
          <Pill tone="warn">Struggle ayahs</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {insights?.uniqueChallengeAyahs30d ?? 0}
          </p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Ayahs that repeatedly produced `AGAIN` or `HARD` grades this month.</p>
        </Card>
        <Card>
          <Pill tone="accent">Weak seams</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {insights?.openWeakTransitions ?? 0}
          </p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Open transition repairs that deserve separate focused drilling.</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <div className="flex items-center gap-2">
            <RotateCcw size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Review-only drill</p>
          </div>
          <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">Clear what is already due before chasing more new work.</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Best when the queue has pressure or you missed a day. Start the scheduled review lane without opening new memorization.
          </p>
          <Link
            href="/hifz?focus=review"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-3 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
          >
            Start review drill <ArrowRight size={14} />
          </Link>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <BookOpenText size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Repeat-until-stable</p>
          </div>
          <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">Take one difficult ayah back into the reader and listen-read-repeat.</p>
          {insights?.challengeAyahs.length ? (
            <div className="mt-3 space-y-2">
              {insights.challengeAyahs.slice(0, 3).map((ayah) => (
                <Link
                  key={ayah.ayahId}
                  href={`/quran/read?view=compact&surah=${ayah.surahNumber}&cursor=${ayah.ayahId}`}
                  className="block rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-3 text-sm text-[color:var(--kw-ink)] hover:bg-white"
                >
                  <span className="block font-semibold">{ayah.surahNumber}:{ayah.ayahNumber}</span>
                  <span className="mt-1 block text-xs text-[color:var(--kw-muted)]">Again {ayah.againCount} | Hard {ayah.hardCount}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-3">
              <EmptyState
                title="No repeat targets yet"
                message="Once difficult ayahs accumulate, they will become one-click practice targets here."
                icon={<Dumbbell size={18} />}
              />
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Link repair</p>
          </div>
          <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">Smooth the seam, not just the ayah.</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Use transition analytics when a passage is individually known but breaks during forward flow.
          </p>
          {insights?.weakTransitions.length ? (
            <div className="mt-3 space-y-2">
              {insights.weakTransitions.slice(0, 3).map((transition) => (
                <div key={transition.id} className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-3">
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{transition.fromRef} -&gt; {transition.toRef}</p>
                  <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                    Failures {transition.failCount} | Success {transition.successRatePct}%
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          <Link href="/progress/transitions" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
            Open transition view <ArrowRight size={14} />
          </Link>
        </Card>
      </div>
    </div>
  );
}
