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
              <Pill tone="accent">Surahs scored</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{intelligence.heatmap.length}</p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Surahs with enough Hifz history to score confidence.</p>
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
                        <Pill tone="neutral">Reviewed {row.trackedAyahs}</Pill>
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

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Weak ayah hotspots</p>
              <div className="mt-4 space-y-3">
                {intelligence.weakAyahHotspots.length ? intelligence.weakAyahHotspots.map((hotspot) => (
                  <div key={hotspot.ayahId} className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={hotspot.confidenceScore >= 70 ? "warn" : "danger"}>{hotspot.confidenceScore}% confidence</Pill>
                      <Pill tone="neutral">{hotspot.ref}</Pill>
                      <Pill tone="neutral">Page {hotspot.pageNumber}</Pill>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">{hotspot.surahName}</p>
                    {hotspot.snippet ? (
                      <p dir="rtl" className="mt-2 text-xs text-[color:var(--kw-faint)]">{hotspot.snippet}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {hotspot.reasons.map((reason) => (
                        <Pill key={`${hotspot.ayahId}-${reason}`} tone="neutral">{reason}</Pill>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-[color:var(--kw-muted)]">Next review {new Date(hotspot.nextReviewAt).toLocaleString()}</p>
                      <Link href={`/quran/read?view=compact&surah=${Number(hotspot.ref.split(":")[0])}&cursor=${hotspot.ayahId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                        Open ayah <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                )) : (
                  <EmptyState
                    title="No weak ayahs mapped"
                    message="As Hifz history accumulates, the weakest ayahs will appear here with their reasons."
                    icon={<Map size={18} />}
                  />
                )}
              </div>
            </Card>

            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Weak line zones and seam hotspots</p>
              <div className="mt-4 space-y-3">
                {intelligence.weakLineZones.length ? intelligence.weakLineZones.map((zone) => (
                  <div key={`${zone.startAyahId}-${zone.endAyahId}`} className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={zone.intensityScore >= 40 ? "danger" : "warn"}>{zone.intensityScore} intensity</Pill>
                      <Pill tone="neutral">Page {zone.pageNumber}</Pill>
                      <Pill tone="neutral">{zone.startRef} - {zone.endRef}</Pill>
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--kw-muted)]">{zone.surahName} | {zone.hotspotCount} hotspot{zone.hotspotCount === 1 ? "" : "s"} | {zone.rationale}</p>
                    <Link href={`/quran/read?view=compact&surah=${zone.surahNumber}&cursor=${zone.startAyahId}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                      Open weak zone <ArrowRight size={14} />
                    </Link>
                  </div>
                )) : (
                  <EmptyState
                    title="No weak zones mapped"
                    message="When multiple weak ayahs cluster on the same page, they will appear here as a hotter line-like zone."
                    icon={<Map size={18} />}
                  />
                )}
                {intelligence.seamTrainer.length ? (
                  <div className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Weak transitions</p>
                    <div className="mt-3 space-y-2">
                      {intelligence.seamTrainer.slice(0, 4).map((seam) => (
                        <div key={seam.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--kw-border-2)] bg-white px-3 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill tone="warn">{seam.loopCount} loops</Pill>
                            <Pill tone="neutral">{seam.fromRef} -&gt; {seam.toRef}</Pill>
                          </div>
                          <p className="text-xs text-[color:var(--kw-muted)]">Success {seam.successRatePct}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>
          </div>

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
