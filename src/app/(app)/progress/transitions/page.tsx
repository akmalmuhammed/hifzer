"use client";

import { useEffect, useState } from "react";
import { Link2, RefreshCcw } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";

type TransitionRow = {
  id: string;
  fromAyahId: number;
  toAyahId: number;
  attemptCount: number;
  successCount: number;
  failCount: number;
  successRate: number;
  nextRepairAt: string | null;
  weak: boolean;
  lastOccurredAt: string;
};

export default function TransitionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<TransitionRow[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/progress/transitions", { cache: "no-store" });
      const payload = (await res.json()) as { transitions?: TransitionRow[]; error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to load transitions.");
      }
      setRows(payload.transitions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transitions.");
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
        title="Transitions"
        subtitle="Weak seam tracking with auto-scheduled repair targets."
        right={
          <Button variant="secondary" className="gap-2" onClick={() => void load()}>
            Reload <RefreshCcw size={16} />
          </Button>
        }
      />

      {loading ? (
        <Card>
          <p className="text-sm text-[color:var(--kw-muted)]">Loading transition metrics...</p>
        </Card>
      ) : error ? (
        <Card>
          <EmptyState
            title="Transitions unavailable"
            message={error}
            icon={<Link2 size={18} />}
            action={
              <Button onClick={() => void load()} className="gap-2">
                Retry <RefreshCcw size={16} />
              </Button>
            }
          />
        </Card>
      ) : rows.length ? (
        <div className="grid gap-3">
          {rows.map((row) => (
            <Card key={row.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={row.weak ? "warn" : "neutral"}>
                      {row.weak ? "Weak" : "Stable"}
                    </Pill>
                    <Pill tone="neutral">
                      {row.fromAyahId}
                      {" -> "}
                      {row.toAyahId}
                    </Pill>
                    <Pill tone="neutral">Attempts: {row.attemptCount}</Pill>
                    <Pill tone="neutral">Success: {Math.round(row.successRate * 100)}%</Pill>
                  </div>
                  <p className="mt-3 text-sm text-[color:var(--kw-muted)]">
                    Failures: {row.failCount} | Last seen: {new Date(row.lastOccurredAt).toLocaleString()}
                  </p>
                </div>
                {row.nextRepairAt ? (
                  <Pill tone="accent">Repair due {new Date(row.nextRepairAt).toLocaleDateString()}</Pill>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No transition data yet"
            message="Link events from sessions will populate weak-transition analytics here."
            icon={<Link2 size={18} />}
          />
        </Card>
      )}
    </div>
  );
}
