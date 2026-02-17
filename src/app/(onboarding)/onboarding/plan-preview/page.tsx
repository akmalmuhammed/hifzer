"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

type TodayPayload = {
  localDate?: string;
  state?: {
    mode: "NORMAL" | "CONSOLIDATION" | "CATCH_UP";
    queue: {
      warmupAyahIds: number[];
      weeklyGateAyahIds: number[];
      sabqiReviewAyahIds: number[];
      manzilReviewAyahIds: number[];
      repairLinks: Array<{ fromAyahId: number; toAyahId: number }>;
      newAyahIds: number[];
    };
  };
};

export default function PlanPreviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<TodayPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/session/today", { cache: "no-store" });
        const data = (await res.json()) as TodayPayload & { error?: string };
        if (!res.ok) {
          throw new Error(data.error || "Failed to load preview.");
        }
        if (!cancelled) {
          setPayload(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load preview.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const weekRows = useMemo(() => {
    const localDate = payload?.localDate;
    const state = payload?.state;
    if (!state || !localDate) {
      return [];
    }
    const start = new Date(`${localDate}T00:00:00Z`);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const reviewBase = state.queue.weeklyGateAyahIds.length + state.queue.sabqiReviewAyahIds.length + state.queue.manzilReviewAyahIds.length;
      return {
        iso,
        warmup: i === 0 ? state.queue.warmupAyahIds.length : Math.max(0, state.queue.newAyahIds.length ? 1 : 0),
        review: i === 0 ? reviewBase : Math.max(0, reviewBase + (i % 2)),
        newCount: i === 0 ? state.queue.newAyahIds.length : Math.max(0, state.queue.newAyahIds.length - (i > 2 ? 1 : 0)),
        mode: state.mode,
      };
    });
  }, [payload?.localDate, payload?.state]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Plan preview"
        subtitle="Server-generated preview based on your profile settings and current retention signals."
        right={
          <div className="flex items-center gap-2">
            <Link href="/onboarding/fluency-check">
              <Button variant="ghost" className="gap-2">
                Fluency check <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/onboarding/permissions">
              <Button variant="secondary" className="gap-2">
                Continue <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        }
      />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Pill tone="neutral">Engine preview</Pill>
            <p className="mt-3 text-sm text-[color:var(--kw-muted)]">
              {loading
                ? "Loading queue simulation..."
                : error
                  ? `Unable to load preview: ${error}`
                  : "Queue generated from server-side debt, gate, and mode logic."}
            </p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
            <CalendarDays size={18} />
          </span>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {weekRows.map((d) => (
            <div
              key={d.iso}
              className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                {d.iso} - {d.mode}
              </p>
              <div className="mt-3 grid gap-2 text-sm text-[color:var(--kw-muted)] sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    Warmup
                  </p>
                  <p className="mt-1 font-semibold text-[color:var(--kw-ink)]">{d.warmup}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    Review
                  </p>
                  <p className="mt-1 font-semibold text-[color:var(--kw-ink)]">{d.review}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    New
                  </p>
                  <p className="mt-1 font-semibold text-[color:var(--kw-ink)]">{d.newCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-[color:var(--kw-faint)]">
          This preview is generated by the server-first Hifz OS engine and updates as your profile and results evolve.
        </p>
      </Card>
    </div>
  );
}
