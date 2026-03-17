import { auth } from "@clerk/nextjs/server";
import { LineChart } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { getDashboardOverview } from "@/hifzer/dashboard/server";

export const metadata = {
  title: "Retention",
};

export default async function RetentionPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const overview = await getDashboardOverview(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Progress"
        title="Retention"
        subtitle="A simple view of how stable your recall has been recently and how much review pressure is building."
      />

      {!overview ? (
        <Card>
          <EmptyState
            title="Retention view unavailable"
            message="We could not load your retention signals right now."
            icon={<LineChart size={18} />}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <Pill tone="accent">Retention score</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {overview.kpis.retentionScore14d}%
              </p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Weighted 14-day quality based on `Again/Hard/Good/Easy` mix.</p>
            </Card>
            <Card>
              <Pill tone="warn">Due soon</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {overview.reviewHealth.dueSoon6h}
              </p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Ayahs due within the next 6 hours.</p>
            </Card>
            <Card>
              <Pill tone="neutral">Ayahs in review</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {overview.kpis.trackedAyahs}
              </p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Ayahs currently present in the Hifz review system.</p>
            </Card>
          </div>

          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">14-day grade mix</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["AGAIN", "Again", "warn"],
                ["HARD", "Hard", "warn"],
                ["GOOD", "Good", "accent"],
                ["EASY", "Easy", "success"],
              ].map(([key, label, tone]) => (
                <div key={key} className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4">
                  <Pill tone={tone as "warn" | "accent" | "success"}>{label}</Pill>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                    {overview.gradeMix14d[key as keyof typeof overview.gradeMix14d]}
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
