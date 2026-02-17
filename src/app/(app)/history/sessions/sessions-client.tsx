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
  recentSessions: Array<{
    id: string;
    localDate: string;
    startedAt: string;
    endedAt: string | null;
    mode: "NORMAL" | "CONSOLIDATION" | "CATCH_UP";
    warmupPassed: boolean | null;
    weeklyGatePassed: boolean | null;
  }>;
};

export function HistorySessionsClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SummaryPayload["recentSessions"]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/progress/summary", { cache: "no-store" });
      const payload = (await res.json()) as SummaryPayload & { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to load history.");
      }
      setRows(payload.recentSessions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history.");
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
        eyebrow="History"
        title="Session history"
        subtitle="Server-backed session ledger from the new Hifz OS event pipeline."
        right={
          <div className="flex items-center gap-2">
            <Link href="/session">
              <Button className="gap-2">
                Start session <PlayCircle size={16} />
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
          <p className="text-sm text-[color:var(--kw-muted)]">Loading session history...</p>
        </Card>
      ) : error ? (
        <Card>
          <EmptyState
            title="History unavailable"
            message={error}
            action={
              <Button onClick={() => void load()} className="gap-2">
                Retry <RefreshCcw size={16} />
              </Button>
            }
          />
        </Card>
      ) : rows.length ? (
        <div className="grid gap-3">
          {rows.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="neutral">{r.localDate}</Pill>
                    <Pill tone="neutral">{r.mode}</Pill>
                    <Pill tone={r.warmupPassed ? "accent" : "neutral"}>
                      Warm-up {r.warmupPassed ? "pass" : "n/a or fail"}
                    </Pill>
                    <Pill tone={r.weeklyGatePassed ? "accent" : "neutral"}>
                      Weekly {r.weeklyGatePassed ? "pass" : "n/a or fail"}
                    </Pill>
                  </div>
                  <p className="mt-3 text-sm text-[color:var(--kw-muted)]">
                    Started: {new Date(r.startedAt).toLocaleString()}
                    {r.endedAt ? ` | Ended: ${new Date(r.endedAt).toLocaleString()}` : ""}
                  </p>
                </div>
                <Link href="/session">
                  <Button variant="ghost" className="gap-2">
                    New session <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No sessions yet"
            message="Start your first session to build retention history."
            action={
              <Link href="/session">
                <Button className="gap-2">
                  Start session <PlayCircle size={16} />
                </Button>
              </Link>
            }
          />
        </Card>
      )}
    </div>
  );
}

