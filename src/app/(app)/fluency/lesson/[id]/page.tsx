import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, BookOpen, Headphones, Link2, Mic } from "lucide-react";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { PageHeader } from "@/components/app/page-header";
import { getDashboardOverview } from "@/hifzer/dashboard/server";
import { getRecitationInsights } from "@/hifzer/recitation/server";

export const metadata = {
  title: "Fluency Lesson",
};

export default async function FluencyLessonPage(props: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const params = await props.params;
  const [overview, insights] = await Promise.all([
    getDashboardOverview(userId),
    getRecitationInsights(userId, { challengeLimit: 6, transitionLimit: 6 }),
  ]);
  const lessonId = params.id.toLowerCase();

  const lesson = (() => {
    if (lessonId === "listen-repeat") {
      return {
        eyebrow: "Fluency",
        title: "Listen then repeat",
        subtitle: "Build recitation flow by hearing a stable voice, echoing it, then reading the same passage back yourself.",
        icon: <Headphones size={18} />,
      };
    }
    if (lessonId === "hesitation") {
      return {
        eyebrow: "Fluency",
        title: "Hesitation cleanup",
        subtitle: "Use your hardest ayahs as deliberate repeat targets until the stop-start pattern softens.",
        icon: <Mic size={18} />,
      };
    }
    if (lessonId === "transitions") {
      return {
        eyebrow: "Fluency",
        title: "Transition smoothing",
        subtitle: "Practice the seam between ayahs when the individual ayah is known but the join still breaks.",
        icon: <Link2 size={18} />,
      };
    }
    return null;
  })();

  if (!lesson) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Fluency"
          title={`Lesson ${params.id}`}
          subtitle="Unknown lesson."
        />
        <Card>
          <EmptyState
            title="Lesson not found"
            message="Supported lessons are listen-repeat, hesitation, and transitions."
            icon={<BookOpen size={18} />}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={lesson.eyebrow}
        title={lesson.title}
        subtitle={lesson.subtitle}
      />

      {lessonId === "listen-repeat" ? (
        <Card>
          <div className="flex items-center gap-2">
            <Headphones size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Three-step loop</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              "Listen to a short passage in compact reader with repeat enabled.",
              "Repeat aloud using the same reciter and same pace.",
              "Read the passage yourself without the audio immediately after.",
            ].map((step) => (
              <div key={step} className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4 text-sm leading-7 text-[color:var(--kw-muted)]">
                {step}
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/quran/read?view=compact"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-3 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
            >
              Open compact reader <ArrowRight size={14} />
            </Link>
            <Link
              href="/settings/reciter"
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)]"
            >
              Change reciter
            </Link>
          </div>
        </Card>
      ) : null}

      {lessonId === "hesitation" ? (
        <Card>
          <div className="flex items-center gap-2">
            <Mic size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Target passages</p>
          </div>
          {insights?.challengeAyahs.length ? (
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
                title="No hesitation passages yet"
                message="Hifzer has not logged repeated AGAIN/HARD ayahs for this user yet."
                icon={<Mic size={18} />}
              />
            </div>
          )}
        </Card>
      ) : null}

      {lessonId === "transitions" ? (
        <Card>
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Seam drills</p>
          </div>
          {insights?.weakTransitions.length ? (
            <div className="mt-4 space-y-3">
              {insights.weakTransitions.map((transition) => (
                <div key={transition.id} className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="warn">{transition.fromRef} -&gt; {transition.toRef}</Pill>
                    <Pill tone="neutral">Success {transition.successRatePct}%</Pill>
                  </div>
                  {transition.fromSnippet || transition.toSnippet ? (
                    <p dir="rtl" className="mt-3 text-xs text-[color:var(--kw-faint)]">
                      {transition.fromSnippet ?? "..."}
                      {"  ->  "}
                      {transition.toSnippet ?? "..."}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No transition hotspots yet"
                message="Once the recitation starts breaking at joins, Hifzer will surface those seams here."
                icon={<Link2 size={18} />}
              />
            </div>
          )}
        </Card>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Current context</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Retention score {overview?.kpis.retentionScore14d ?? 0}% | Due now {overview?.reviewHealth.dueNow ?? 0} | Weak seams {insights?.openWeakTransitions ?? 0}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/fluency/retest"
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)]"
            >
              Retest
            </Link>
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-3 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
            >
              Practice <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
