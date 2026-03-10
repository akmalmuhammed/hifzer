import { auth } from "@clerk/nextjs/server";
import { Map } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { getDashboardOverview } from "@/hifzer/dashboard/server";

export const metadata = {
  title: "Progress Map",
};

export default async function ProgressMapPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const overview = await getDashboardOverview(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Progress"
        title="Map"
        subtitle="A compact map of where your current Qur'an and Hifz state sits: coverage, review load, and station distribution."
      />

      {!overview ? (
        <Card>
          <EmptyState
            title="Progress map unavailable"
            message="We could not load your mapped progress right now."
            icon={<Map size={18} />}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <Pill tone="accent">Current read point</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{overview.quran.cursorRef}</p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">{overview.quran.currentSurahName} | {overview.quran.currentSurahProgressPct}% through current surah</p>
            </Card>
            <Card>
              <Pill tone="warn">Due now</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{overview.reviewHealth.dueNow}</p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Ayahs currently due for review.</p>
            </Card>
            <Card>
              <Pill tone="neutral">Weak transitions</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{overview.reviewHealth.weakTransitions}</p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Open seam repairs waiting in the background.</p>
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
