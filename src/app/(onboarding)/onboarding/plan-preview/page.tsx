"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<TodayPayload | null>(null);

  async function loadPreview(signal?: AbortSignal) {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/session/today", { cache: "no-store", signal });
    const data = (await res.json()) as TodayPayload & { error?: string };
    if (!res.ok) {
      throw new Error(data.error || "Failed to load preview.");
    }
    setPayload(data);
  }

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        await loadPreview(controller.signal);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load preview.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
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

  const queueSummary = useMemo(() => {
    const queue = payload?.state?.queue;
    if (!queue) {
      return [];
    }

    return [
      { label: "Warmup", value: queue.warmupAyahIds.length, note: "Settle into recitation before pressure rises." },
      {
        label: "Review",
        value: queue.weeklyGateAyahIds.length + queue.sabqiReviewAyahIds.length + queue.manzilReviewAyahIds.length,
        note: "Protect previously learned ayahs from drifting.",
      },
      { label: "New", value: queue.newAyahIds.length, note: "Fresh material, only when the review load allows it." },
      { label: "Weak links", value: queue.repairLinks.length, note: "Transition repairs where ayah joins feel unstable." },
    ];
  }, [payload?.state?.queue]);

  const summaryCards = loading
    ? Array.from({ length: 4 }, (_, index) => ({
        key: `loading-${index}`,
        loading: true as const,
      }))
    : queueSummary.map((item) => ({
        ...item,
        key: item.label,
        loading: false as const,
      }));

  return (
    <OnboardingShell
      step="plan-preview"
      title="See your first week before you start."
      subtitle="This preview turns your profile and current retention signals into a practical first queue, so the product feels intentional from day one."
      backHref="/onboarding/start-point"
      supportTitle="A plan preview builds trust fast"
      supportBody="New users should be able to see how Hifzer thinks before they commit to their first session."
      supportPoints={[
        {
          title: "Server generated",
          description: "The preview comes from the same retention-aware logic that shapes your live queue later on.",
        },
        {
          title: "Balanced workload",
          description: "Warmup, review, new material, and seam repair are separated so each job stays readable.",
        },
        {
          title: "Still flexible",
          description: "This is a starting plan, not a lock. Your queue shifts as your results and study rhythm evolve.",
        },
      ]}
    >
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Pill tone="accent">Engine preview</Pill>
            <p className="mt-3 text-sm text-[color:var(--kw-muted)]">
              {loading
                ? "Loading queue simulation..."
                : error
                  ? `Unable to load preview: ${error}`
                  : "Queue generated from the same server-side debt, gate, and mode logic that powers the live app."}
            </p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
            <CalendarDays size={18} />
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <div
              key={item.key}
              className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/72 px-4 py-3"
            >
              {item.loading ? (
                <div className="space-y-3">
                  <div className="h-3 w-20 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
                  <div className="h-7 w-12 animate-pulse rounded-xl bg-[color:var(--kw-skeleton)]" />
                  <div className="h-3 w-full animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
                </div>
              ) : (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">{item.note}</p>
                </>
              )}
            </div>
          ))}
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

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[color:var(--kw-faint)]">
            This preview updates as your profile, streak, and graded results evolve.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {error ? (
              <Button
                variant="secondary"
                className="gap-2"
                onClick={async () => {
                  try {
                    await loadPreview();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to load preview.");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Retry preview
              </Button>
            ) : null}
            <Button className="gap-2" onClick={() => router.push("/onboarding/fluency-check")}>
              Continue <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </OnboardingShell>
  );
}
