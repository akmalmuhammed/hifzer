"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, PlayCircle, RefreshCcw } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";

type SummaryPayload = {
  stats: {
    trackedAyahs: number;
    dueNow: number;
    avgStation: number;
    avgDurationSec: number;
    gradeCounts: Record<"AGAIN" | "HARD" | "GOOD" | "EASY", number>;
  };
};

export function ProgressClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SummaryPayload | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/progress/summary", { cache: "no-store" });
      const payload = (await res.json()) as SummaryPayload & { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to load progress.");
      }
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load progress.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Progress"
        title="Progress"
        subtitle="Server-backed grade, SRS, and session metrics."
        right={
          <div className="flex items-center gap-2">
            <Link href="/session">
              <Button className="gap-2">
                Practice <PlayCircle size={16} />
              </Button>
            </Link>
            <Button variant="secondary" className="gap-2" onClick={() => void load()}>
              Reload <RefreshCcw size={16} />
            </Button>
          </div>
        }
      />

      {loading ? (
        <Card>
          <p className="text-sm text-[color:var(--kw-muted)]">Loading progress metrics...</p>
        </Card>
      ) : error ? (
        <Card>
          <EmptyState
            title="Progress unavailable"
            message={error}
            action={
              <Button onClick={() => void load()} className="gap-2">
                Retry <RefreshCcw size={16} />
              </Button>
            }
          />
        </Card>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Tracked ayahs</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {data.stats.trackedAyahs}
              </p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Due now</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {data.stats.dueNow}
              </p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Avg station</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {data.stats.avgStation.toFixed(1)}
              </p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Avg duration</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {data.stats.avgDurationSec}s
              </p>
            </Card>
          </div>

          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="neutral">Grade mix (7d)</Pill>
              <Pill tone="warn">Again: {data.stats.gradeCounts.AGAIN}</Pill>
              <Pill tone="neutral">Hard: {data.stats.gradeCounts.HARD}</Pill>
              <Pill tone="accent">Good: {data.stats.gradeCounts.GOOD}</Pill>
              <Pill tone="accent">Easy: {data.stats.gradeCounts.EASY}</Pill>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link href="/progress/transitions">
                <Button variant="secondary" className="gap-2">
                  Weak transitions <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

