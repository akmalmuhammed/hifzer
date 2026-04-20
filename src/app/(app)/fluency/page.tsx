import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, Headphones, Link2, Mic } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { getCachedDashboardOverview } from "@/hifzer/dashboard/server";
import { getCachedRecitationInsights } from "@/hifzer/recitation/server";

export const metadata = {
  title: "Fluency",
};

export default async function FluencyPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const [overview, insights] = await Promise.all([
    getCachedDashboardOverview(userId),
    getCachedRecitationInsights(userId, { challengeLimit: 5, transitionLimit: 5 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fluency"
        title="Fluency track"
        subtitle="This track is for smoother recitation, fewer stops, and better forward flow. It stays separate from your main Hifz plan."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <Pill tone="accent">Browse recitation</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {overview?.quran.browseRecitedAyahs7d ?? 0}
          </p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Ayahs listened to or recited through the Qur&apos;an reader this week.</p>
        </Card>
        <Card>
          <Pill tone="warn">Struggle events</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {insights?.struggleEvents30d ?? 0}
          </p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Recent `AGAIN` and `HARD` signals that point to unstable flow.</p>
        </Card>
        <Card>
          <Pill tone="neutral">Weak transitions</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {insights?.openWeakTransitions ?? 0}
          </p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Places where the seam between ayahs is weaker than the ayah itself.</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <div className="flex items-center gap-2">
            <Headphones size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Listening-led loop</p>
          </div>
          <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
            Hear, repeat, then read back without rushing.
          </p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Best for users who need smoother pace before heavier memorization. Use compact reader audio with repeat and auto-next, then read the same passage aloud.
          </p>
          <Link href="/fluency/lesson/listen-repeat" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
            Open lesson <ArrowRight size={14} />
          </Link>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Mic size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Hesitation cleanup</p>
          </div>
          {insights?.challengeAyahs.length ? (
            <div className="mt-3 space-y-3">
              {insights.challengeAyahs.slice(0, 3).map((ayah) => (
                <div key={ayah.ayahId} className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-3">
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{ayah.surahNumber}:{ayah.ayahNumber}</p>
                  <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                    Again {ayah.againCount} | Hard {ayah.hardCount}
                  </p>
                  <Link
                    href="/fluency/lesson/hesitation"
                    className="mt-2 inline-flex text-xs font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
                  >
                    Open hesitation lesson
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3">
              <EmptyState
                title="No hesitation targets yet"
                message="As you build a history of difficult ayahs, Hifzer will surface them here for repeat-until-stable work."
                icon={<Mic size={18} />}
              />
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Transition smoothing</p>
          </div>
          <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
            Many reciters know the ayah but lose the join.
          </p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Use transition repair when your recitation sounds fragmented even though individual ayahs feel familiar.
          </p>
          {insights?.weakTransitions.length ? (
            <div className="mt-3 space-y-2">
              {insights.weakTransitions.slice(0, 3).map((transition) => (
                <div key={transition.id} className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-3">
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{transition.fromRef} -&gt; {transition.toRef}</p>
                  <p className="mt-1 text-xs text-[color:var(--kw-muted)]">Success {transition.successRatePct}%</p>
                </div>
              ))}
            </div>
          ) : null}
          <Link href="/fluency/lesson/transitions" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
            Open transition lesson <ArrowRight size={14} />
          </Link>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Retest when your flow feels calmer</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Retesting should answer one question: does the recitation sound more stable than before? It should not be a punishment screen.
            </p>
          </div>
          <Link
            href="/fluency/retest"
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-3 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
          >
            Open fluency retest <ArrowRight size={14} />
          </Link>
        </div>
      </Card>
    </div>
  );
}
