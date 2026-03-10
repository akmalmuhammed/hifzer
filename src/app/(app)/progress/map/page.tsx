import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, Map } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { getDashboardOverview } from "@/hifzer/dashboard/server";
import { getMemorizationIntelligence } from "@/hifzer/recitation/intelligence.server";

export const metadata = {
  title: "Progress Map",
};

export default async function ProgressMapPage() {
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
        eyebrow="Progress"
        title="Confidence heatmap"
        subtitle="A surah-by-surah confidence map built from Hifz review state, weak seams, recent breakdowns, and due pressure."
      />

      {!overview || !intelligence ? (
        <Card>
          <EmptyState
            title="Confidence heatmap unavailable"
            message="We could not load your mapped progress right now."
            icon={<Map size={18} />}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <Pill tone="accent">Tracked surahs</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{intelligence.heatmap.length}</p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Surahs with real Hifz tracking and enough history to score confidence.</p>
            </Card>
            <Card>
              <Pill tone="warn">Fragile ayahs</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{intelligence.metrics.fragileAyahs}</p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Ayahs with enough recent struggle to make the heatmap visibly colder.</p>
            </Card>
            <Card>
              <Pill tone="neutral">Weak transitions</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{intelligence.metrics.weakSeams}</p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Open seam repairs currently dragging confidence down by surah.</p>
            </Card>
          </div>

          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Surah confidence map</p>
            <div className="mt-4 grid gap-3">
              {intelligence.heatmap.map((row) => {
                const fillColor = row.confidenceScore >= 80
                  ? "bg-[rgba(22,163,74,0.82)]"
                  : row.confidenceScore >= 60
                    ? "bg-[rgba(234,179,8,0.72)]"
                    : "bg-[rgba(244,63,94,0.78)]";
                return (
                  <div key={row.surahNumber} className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill tone={row.bucket === "Stable" ? "success" : row.bucket === "Building" ? "warn" : "danger"}>
                            {row.bucket}
                          </Pill>
                          <Pill tone="neutral">Surah {row.surahNumber}</Pill>
                          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{row.surahName}</p>
                        </div>
                        <div className="mt-3 h-2.5 w-full max-w-[320px] overflow-hidden rounded-full bg-[color:var(--kw-border-2)]">
                          <div className={`h-full rounded-full ${fillColor}`} style={{ width: `${row.confidenceScore}%` }} />
                        </div>
                        <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                          {row.confidenceScore}% confidence | {row.stablePct}% stable | Focus ref {row.focusRef}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Pill tone="neutral">Tracked {row.trackedAyahs}</Pill>
                        <Pill tone="warn">Due {row.dueNow}</Pill>
                        <Pill tone="warn">Fragile {row.fragileAyahs}</Pill>
                        <Pill tone="neutral">Seams {row.weakTransitions}</Pill>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm leading-7 text-[color:var(--kw-muted)]">{row.nextAction}</p>
                      <Link href="/practice" className="inline-flex items-center gap-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                        Open practice <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Memorization band distribution</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["ENCODING", "Encoding"],
                ["SABQI", "Sabqi"],
                ["MANZIL", "Manzil"],
                ["MASTERED", "Mastered"],
              ].map(([key, label]) => (
                <div key={key} className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">{label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                    {overview.reviewHealth.byBand[key as keyof typeof overview.reviewHealth.byBand]}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
