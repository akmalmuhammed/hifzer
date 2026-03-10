import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { getRecitationInsights } from "@/hifzer/recitation/server";

export const metadata = {
  title: "Mistakes",
};

export default async function MistakesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const insights = await getRecitationInsights(userId, { challengeLimit: 8, transitionLimit: 6 });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Progress"
        title="Mistakes"
        subtitle="This is a recitation-friction view, not a shame log. It shows where recall is unstable and where transitions keep breaking."
      />

      {!insights ? (
        <Card>
          <EmptyState
            title="Mistake signals unavailable"
            message="We could not load your recitation signals right now."
            icon={<TriangleAlert size={18} />}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <Pill tone="warn">30-day struggles</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {insights.struggleEvents30d}
              </p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Recent `AGAIN` and `HARD` events across Hifz work.</p>
            </Card>
            <Card>
              <Pill tone="neutral">Affected ayahs</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {insights.uniqueChallengeAyahs30d}
              </p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Unique ayahs that are repeating the same difficulty pattern.</p>
            </Card>
            <Card>
              <Pill tone="accent">Weak seams</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {insights.openWeakTransitions}
              </p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Open transition repairs waiting for smoother ayah-to-ayah flow.</p>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Top ayahs to revisit</p>
                  <p className="mt-2 text-sm text-[color:var(--kw-muted)]">These ayahs collected the most `AGAIN` and `HARD` grades in the last 30 days.</p>
                </div>
                <Link href="/practice" className="text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                  Open practice
                </Link>
              </div>

              {insights.challengeAyahs.length ? (
                <div className="mt-4 space-y-3">
                  {insights.challengeAyahs.map((ayah) => (
                    <div key={ayah.ayahId} className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill tone="warn">{ayah.surahNumber}:{ayah.ayahNumber}</Pill>
                            <Pill tone="neutral">Again {ayah.againCount}</Pill>
                            <Pill tone="neutral">Hard {ayah.hardCount}</Pill>
                          </div>
                          {ayah.snippet ? (
                            <p dir="rtl" className="mt-3 text-sm text-[color:var(--kw-faint)]">{ayah.snippet}</p>
                          ) : null}
                          <p className="mt-2 text-xs text-[color:var(--kw-muted)]">
                            Last seen {new Date(ayah.lastSeenAt).toLocaleString()}
                          </p>
                        </div>
                        <Link
                          href={`/quran/read?view=compact&surah=${ayah.surahNumber}&cursor=${ayah.ayahId}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-3 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
                        >
                          Open ayah <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState
                    title="No recurring ayah struggles yet"
                    message="Once your Hifz sessions log `AGAIN` or `HARD` grades, the most repeated friction points will appear here."
                    icon={<TriangleAlert size={18} />}
                  />
                </div>
              )}
            </Card>

            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Transition hotspots</p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Many reciters do not fail on a single ayah. They fail on the seam between ayahs.</p>
              {insights.weakTransitions.length ? (
                <div className="mt-4 space-y-3">
                  {insights.weakTransitions.map((transition) => (
                    <div key={transition.id} className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone="warn">{transition.fromRef} -&gt; {transition.toRef}</Pill>
                        <Pill tone="neutral">Success {transition.successRatePct}%</Pill>
                      </div>
                      <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                        Failures {transition.failCount} | Attempts {transition.attemptCount}
                      </p>
                      {transition.fromSnippet || transition.toSnippet ? (
                        <p dir="rtl" className="mt-2 text-xs text-[color:var(--kw-faint)]">
                          {transition.fromSnippet ?? "..."}
                          {"  ->  "}
                          {transition.toSnippet ?? "..."}
                        </p>
                      ) : null}
                    </div>
                  ))}
                  <Link href="/progress/transitions" className="inline-flex text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                    Open full transition view
                  </Link>
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState
                    title="No weak transitions logged"
                    message="Link-repair data will appear after sessions record unstable ayah-to-ayah movement."
                    icon={<TriangleAlert size={18} />}
                  />
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
