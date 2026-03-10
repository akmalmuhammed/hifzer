import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, BookOpenText, HeartHandshake, Link2, Radar, RotateCcw } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { getDashboardOverview } from "@/hifzer/dashboard/server";
import { getMemorizationIntelligence } from "@/hifzer/recitation/intelligence.server";

export const metadata = {
  title: "Practice",
};

export default async function PracticePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const [overview, intelligence] = await Promise.all([
    getDashboardOverview(userId),
    getMemorizationIntelligence(userId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Practice"
        title="Practice drills"
        subtitle="Target the exact places where recall bends: similar ayahs, weak seams, rescue work, and meaning cues. None of this mutates today's scheduled Hifz queue."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <Pill tone="accent">Rescue session</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {intelligence?.rescueSession.estimatedMinutes ?? 0}m
          </p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">A focused fix-today session built from recent struggle ayahs, weak seams, and review pressure.</p>
        </Card>
        <Card>
          <Pill tone="warn">Struggle ayahs</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {intelligence?.metrics.fragileAyahs ?? 0}
          </p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Ayahs that repeatedly produced `AGAIN` or `HARD` signals and should not be trusted under pressure yet.</p>
        </Card>
        <Card>
          <Pill tone="accent">Weak seams</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {intelligence?.metrics.weakSeams ?? 0}
          </p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Open transition repairs that deserve seam-only drilling, separate from the normal ayah queue.</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <div className="flex items-center gap-2">
            <RotateCcw size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Rescue session generator</p>
          </div>
          <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">Fix today&apos;s damage in one compact pass.</p>
          {intelligence?.rescueSession.blocks.length ? (
            <div className="mt-4 space-y-3">
              {intelligence.rescueSession.blocks.map((block) => (
                <div key={block.title} className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Pill tone={block.kind === "scheduled_review" ? "neutral" : "warn"}>{block.minutes} min</Pill>
                      <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{block.title}</p>
                    </div>
                    <Link href={block.href} className="inline-flex items-center gap-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                      Start <ArrowRight size={14} />
                    </Link>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{block.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {block.items.map((item) => (
                      <Pill key={item} tone="neutral">{item}</Pill>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No rescue work queued"
                message="Once recent weak points accumulate, Hifzer will build a short recovery session here."
                icon={<RotateCcw size={18} />}
              />
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Radar size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Mushabihat radar</p>
          </div>
          <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">Detect similar ayahs before they start swapping places in memory.</p>
          {intelligence?.mushabihat.length ? (
            <div className="mt-3 space-y-2">
              {intelligence.mushabihat.map((pair) => (
                <div key={`${pair.leftAyahId}-${pair.rightAyahId}`} className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="warn">{pair.similarityPct}% similar</Pill>
                    <Pill tone="neutral">{pair.leftRef}</Pill>
                    <Pill tone="neutral">{pair.rightRef}</Pill>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--kw-muted)]">{pair.reason}</p>
                  <p className="mt-2 text-xs text-[color:var(--kw-faint)]">{pair.contrastHint}</p>
                  {(pair.leftSnippet || pair.rightSnippet) ? (
                    <p dir="rtl" className="mt-2 text-xs text-[color:var(--kw-faint)]">
                      {pair.leftSnippet ?? "..."}
                      {"  /  "}
                      {pair.rightSnippet ?? "..."}
                    </p>
                  ) : null}
                  <div className="mt-3 flex gap-3 text-xs font-semibold">
                    <Link href={`/quran/read?view=compact&surah=${Number(pair.leftRef.split(":")[0])}&cursor=${pair.leftAyahId}`} className="text-[rgba(var(--kw-accent-rgb),1)]">
                      Open first ayah
                    </Link>
                    <Link href={`/quran/read?view=compact&surah=${Number(pair.rightRef.split(":")[0])}&cursor=${pair.rightAyahId}`} className="text-[rgba(var(--kw-accent-rgb),1)]">
                      Open contrast ayah
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3">
              <EmptyState
                title="No mushabihat alerts yet"
                message="As similar ayahs begin overlapping with your fragile or new work, Hifzer will surface contrast drills here."
                icon={<Radar size={18} />}
              />
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Seam trainer</p>
          </div>
          <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">Smooth the seam, not just the ayah.</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Loop only the ayah-to-ayah join first, then return to full-passage flow once the seam stops breaking.
          </p>
          {intelligence?.seamTrainer.length ? (
            <div className="mt-3 space-y-2">
              {intelligence.seamTrainer.map((transition) => (
                <div key={transition.id} className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="warn">{transition.loopCount} loops</Pill>
                    <Pill tone="neutral">{transition.fromRef} -&gt; {transition.toRef}</Pill>
                  </div>
                  <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                    Failures {transition.failCount} | Success {transition.successRatePct}%
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--kw-faint)]">{transition.repairHint}</p>
                </div>
              ))}
            </div>
          ) : null}
          <Link href="/progress/transitions" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
            Open full seam view <ArrowRight size={14} />
          </Link>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <HeartHandshake size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Meaning-linked memorization</p>
          </div>
          <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">Anchor new memorization in meaning before the blind step.</p>
          {intelligence?.meaningFrames.length ? (
            <div className="mt-3 space-y-3">
              {intelligence.meaningFrames.map((frame) => (
                <div key={`${frame.startRef}-${frame.endRef}`} className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="accent">{frame.startRef} - {frame.endRef}</Pill>
                    {frame.focusWords.map((word) => (
                      <Pill key={word} tone="neutral">{word}</Pill>
                    ))}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">{frame.cueTitle}</p>
                  <div className="mt-3 space-y-2">
                    {frame.ayahs.slice(0, 4).map((ayah) => (
                      <div key={ayah.ayahId} className="rounded-2xl border border-[color:var(--kw-border-2)] bg-white px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill tone="neutral">{ayah.ref}</Pill>
                          <Link href={`/quran/read?view=compact&surah=${Number(ayah.ref.split(":")[0])}&cursor=${ayah.ayahId}`} className="text-xs font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                            Open ayah
                          </Link>
                        </div>
                        <p className="mt-2 text-sm text-[color:var(--kw-muted)]">{ayah.cue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3">
              <EmptyState
                title="No new ayahs queued today"
                message="Meaning cues appear when today's Hifz plan contains new memorization."
                icon={<BookOpenText size={18} />}
              />
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Scheduled pressure still matters</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              These drills are deliberately separate from the official Hifz queue. They help you stabilise weak points without silently advancing progression or bypassing the daily gate logic.
            </p>
          </div>
          <Link
            href={overview?.reviewHealth.dueNow ? "/hifz?focus=review" : "/hifz"}
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-3 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
          >
            {overview?.reviewHealth.dueNow ? "Open review lane" : "Open Hifz"} <ArrowRight size={14} />
          </Link>
        </div>
      </Card>
    </div>
  );
}
