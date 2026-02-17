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
  fromRef: { surahNumber: number; ayahNumber: number } | null;
  toRef: { surahNumber: number; ayahNumber: number } | null;
  fromSurahName: string | null;
  toSurahName: string | null;
  fromSnippet: string | null;
  toSnippet: string | null;
  attemptCount: number;
  successCount: number;
  failCount: number;
  successRate: number;
  nextRepairAt: string | null;
  weak: boolean;
  lastOccurredAt: string;
};

function refLabel(ref: TransitionRow["fromRef"] | TransitionRow["toRef"], fallbackAyahId: number): string {
  if (!ref) {
    return `#${fallbackAyahId}`;
  }
  return `${ref.surahNumber}:${ref.ayahNumber}`;
}

function trimSnippet(text: string | null): string | null {
  if (!text) {
    return null;
  }
  return text.length > 44 ? `${text.slice(0, 44)}...` : text;
}

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
                      {refLabel(row.fromRef, row.fromAyahId)}
                      {" -> "}
                      {refLabel(row.toRef, row.toAyahId)}
                    </Pill>
                    <Pill tone="neutral">Attempts: {row.attemptCount}</Pill>
                    <Pill tone="neutral">Success: {Math.round(row.successRate * 100)}%</Pill>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                    {row.fromSurahName ?? "Unknown surah"} {refLabel(row.fromRef, row.fromAyahId)}
                    {" -> "}
                    {row.toSurahName ?? "Unknown surah"} {refLabel(row.toRef, row.toAyahId)}
                  </p>
                  {row.fromSnippet || row.toSnippet ? (
                    <p dir="rtl" className="mt-1 text-xs text-[color:var(--kw-faint)]">
                      {trimSnippet(row.fromSnippet) ?? "..."}
                      {"  ->  "}
                      {trimSnippet(row.toSnippet) ?? "..."}
                    </p>
                  ) : null}
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
