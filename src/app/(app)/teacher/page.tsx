import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, GraduationCap, Link2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { getDashboardOverview } from "@/hifzer/dashboard/server";
import { loadTodayState } from "@/hifzer/engine/server";
import { listLearningLanes } from "@/hifzer/profile/server";
import { getMemorizationIntelligence } from "@/hifzer/recitation/intelligence.server";
import { getRecitationInsights } from "@/hifzer/recitation/server";

export const metadata = {
  title: "Teacher",
};

function buildTeacherGuidance(input: {
  mode: "NORMAL" | "CONSOLIDATION" | "CATCH_UP";
  dueNow: number;
  weakTransitions: number;
  challengeCount: number;
  newAyahs: number;
}): string[] {
  const lines: string[] = [];

  if (input.mode === "CATCH_UP") {
    lines.push("Do not assign new memorization today. Clear review pressure first.");
  } else if (input.mode === "CONSOLIDATION") {
    lines.push("Keep new work light. Increase listening to recent material and verify stability before adding more.");
  } else if (input.newAyahs > 0) {
    lines.push("New memorization is available today, but only after warm-up and required review are passed cleanly.");
  }

  if (input.dueNow > 0) {
    lines.push(`There are ${input.dueNow} ayahs due now. Start by listening to recall quality before assigning extra repetition.`);
  }

  if (input.weakTransitions > 0) {
    lines.push("Listen closely to ayah-to-ayah seams. The current system is detecting weak forward joins, not only weak standalone ayahs.");
  }

  if (input.challengeCount > 0) {
    lines.push("The student has repeated AGAIN/HARD signals on specific ayahs. Re-test those passages after guided listening, not only after silent review.");
  }

  if (!lines.length) {
    lines.push("The queue is stable today. Focus on smooth, honest recitation and only advance when recall sounds clean without prompting.");
  }

  return lines;
}

export default async function TeacherPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const [overview, today, lanes, insights, intelligence] = await Promise.all([
    getDashboardOverview(userId),
    loadTodayState(userId),
    listLearningLanes(userId, 6),
    getRecitationInsights(userId, { challengeLimit: 6, transitionLimit: 6 }),
    getMemorizationIntelligence(userId),
  ]);

  if (!overview || !insights) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Teacher"
          title="Teacher dashboard"
          subtitle="A teacher-first summary of what should be listened for today."
        />
        <Card>
          <EmptyState
            title="Teacher summary unavailable"
            message="We could not load the student's current practice state."
            icon={<GraduationCap size={18} />}
          />
        </Card>
      </div>
    );
  }

  const guidance = buildTeacherGuidance({
    mode: today.state.mode,
    dueNow: overview.reviewHealth.dueNow,
    weakTransitions: insights.openWeakTransitions,
    challengeCount: insights.challengeAyahs.length,
    newAyahs: today.state.queue.newAyahIds.length,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teacher"
        title="Teacher dashboard"
        subtitle="One clear view for a teacher or parent to understand what should be listened for today, what should be held back, and where the recitation is fragile."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <Pill tone={today.state.mode === "NORMAL" ? "accent" : "warn"}>{today.state.mode.replace("_", " ")}</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{overview.reviewHealth.dueNow}</p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Ayahs due now before more new work should be trusted.</p>
        </Card>
        <Card>
          <Pill tone="neutral">Retention</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{overview.kpis.retentionScore14d}%</p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Recent quality over the last 14 days.</p>
        </Card>
        <Card>
          <Pill tone="warn">Weak seams</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{insights.openWeakTransitions}</p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Open transition repairs that deserve oral supervision.</p>
        </Card>
        <Card>
          <Pill tone="accent">New ayahs</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{today.state.queue.newAyahIds.length}</p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Potential new memorization after gates are passed.</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Recommended supervision today</p>
          </div>
          <div className="mt-4 space-y-3">
            {guidance.map((line) => (
              <div key={line} className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4 text-sm leading-7 text-[color:var(--kw-muted)]">
                {line}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Current learning lanes</p>
          </div>
          {lanes.length ? (
            <div className="mt-4 space-y-3">
              {lanes.map((lane) => (
                <div key={`${lane.surahNumber}-${lane.ayahId}`} className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={lane.isActive ? "accent" : "neutral"}>{lane.surahLabel}</Pill>
                    <Pill tone="neutral">Ayah {lane.ayahNumber}</Pill>
                    <Pill tone="neutral">{lane.progressPct}%</Pill>
                  </div>
                  <p className="mt-2 text-xs text-[color:var(--kw-muted)]">
                    {lane.lastTouchedAt ? `Last touched ${new Date(lane.lastTouchedAt).toLocaleString()}` : "Active memorization lane"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No active learning lanes yet"
                message="Lanes appear once sessions and review events create memorization history."
                icon={<Users size={18} />}
              />
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Challenge ayahs to re-test</p>
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
                    </div>
                    <Link
                      href={`/quran/read?view=compact&surah=${ayah.surahNumber}&cursor=${ayah.ayahId}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-3 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
                    >
                      Open passage <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No repeated ayah struggles logged"
                message="Once repeated AGAIN/HARD patterns appear, this page will give the teacher a cleaner retest list."
                icon={<GraduationCap size={18} />}
              />
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Transition checks</p>
          </div>
          {insights.weakTransitions.length ? (
            <div className="mt-4 space-y-3">
              {insights.weakTransitions.map((transition) => (
                <div key={transition.id} className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="warn">{transition.fromRef} -&gt; {transition.toRef}</Pill>
                    <Pill tone="neutral">Success {transition.successRatePct}%</Pill>
                  </div>
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
                Open full transitions view
              </Link>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No open transition repairs"
                message="When the student starts breaking at ayah joins, the weak seams will appear here."
                icon={<Link2 size={18} />}
              />
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Imam prep mode</p>
          </div>
          <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">Prayer-paced passages that are already stable enough to lead with.</p>
          {intelligence?.imamPrep.length ? (
            <div className="mt-4 space-y-3">
              {intelligence.imamPrep.map((passage) => (
                <div key={`${passage.startAyahId}-${passage.endAyahId}`} className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={passage.confidenceZone === "Green" ? "success" : passage.confidenceZone === "Amber" ? "warn" : "neutral"}>
                      {passage.confidenceZone}
                    </Pill>
                    <Pill tone="neutral">{passage.startRef} - {passage.endRef}</Pill>
                    <Pill tone="neutral">{passage.confidenceScore}% confidence</Pill>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                    {passage.surahName} | {passage.ayahCount} ayahs | Emergency prompt at {passage.promptRef}
                  </p>
                  {passage.promptSnippet ? (
                    <p dir="rtl" className="mt-2 text-xs text-[color:var(--kw-faint)]">{passage.promptSnippet}</p>
                  ) : null}
                  <p className="mt-3 text-sm text-[color:var(--kw-muted)]">{passage.loopPlan}</p>
                  <Link
                    href={`/quran/read?view=compact&surah=${passage.surahNumber}&cursor=${passage.startAyahId}`}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
                  >
                    Open imam prep <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No imam-ready passages yet"
                message="This unlocks once a contiguous passage is sitting in stable Manzil or Mastered territory without recent breakdowns."
                icon={<Sparkles size={18} />}
              />
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Hifz-to-salah builder</p>
          </div>
          <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">Turn stable memorization into prayer-sized sets without guessing what is safe to use.</p>
          {intelligence?.salahBuilder.length ? (
            <div className="mt-4 space-y-3">
              {intelligence.salahBuilder.map((set) => (
                <div key={set.label} className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="accent">{set.label}</Pill>
                    <Pill tone="neutral">{set.passages.length} passage{set.passages.length === 1 ? "" : "s"}</Pill>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--kw-muted)]">{set.rationale}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {set.passages.map((passage) => (
                      <Link
                        key={`${set.label}-${passage.startAyahId}`}
                        href={`/quran/read?view=compact&surah=${passage.surahNumber}&cursor=${passage.startAyahId}`}
                        className="rounded-full border border-[color:var(--kw-border-2)] bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--kw-ink)]"
                      >
                        {passage.startRef} - {passage.endRef}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No salah sets available yet"
                message="Build more stable contiguous Manzil passages first. Once they hold cleanly, Hifzer can package them into prayer-ready sets here."
                icon={<GraduationCap size={18} />}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
