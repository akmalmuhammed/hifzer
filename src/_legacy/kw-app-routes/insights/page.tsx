"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Lightbulb, ShieldAlert, Zap } from "lucide-react";
import { SignalPill } from "@/components/app/badges";
import { PageHeader } from "@/components/app/page-header";
import { AreaTrend } from "@/components/charts/area-trend";
import { StackedBars, type StackSegment } from "@/components/charts/stacked-bars";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { useDemoStore } from "@/demo/store";
import { useTeam } from "@/demo/team";
import type { Project, Signal } from "@/demo/types";
import { formatDateShort } from "@/lib/format";
import { KW_EASE_OUT } from "@/lib/motion";

function severityTone(sev: number): "neutral" | "warn" | "danger" {
  if (sev >= 4) {
    return "danger";
  }
  if (sev >= 3) {
    return "warn";
  }
  return "neutral";
}

function workMixSegments(projects: Project[]): StackSegment[] {
  const buckets = new Map<string, { label: string; value: number; color: string }>([
    ["Platform", { label: "Platform", value: 0, color: "var(--kw-chart-1)" }],
    ["Reliability", { label: "Reliability", value: 0, color: "var(--kw-chart-2)" }],
    ["Experience", { label: "Experience", value: 0, color: "var(--kw-chart-3)" }],
    ["Insights", { label: "Insights", value: 0, color: "var(--kw-chart-4)" }],
  ]);

  for (const p of projects) {
    const tags = new Set(p.tags);
    const isPlatform = ["infra", "ci", "platform", "gateway", "migration"].some((t) => tags.has(t));
    const isReliability = ["testing", "quality", "observability", "reliability", "release-train"].some((t) =>
      tags.has(t),
    );
    const isExperience = ["onboarding", "ux", "activation"].some((t) => tags.has(t));
    const isInsights = ["insights", "velocity", "instrumentation"].some((t) => tags.has(t));

    const key = isPlatform
      ? "Platform"
      : isReliability
        ? "Reliability"
        : isExperience
          ? "Experience"
          : isInsights
            ? "Insights"
            : "Platform";
    buckets.get(key)!.value += 1;
  }

  return Array.from(buckets.values()).filter((b) => b.value > 0);
}

function recommendations(signals: Signal[]): string[] {
  const blockers = signals.filter((s) => s.type === "Blocker").sort((a, b) => b.severity - a.severity);
  const risks = signals.filter((s) => s.type === "Risk").sort((a, b) => b.severity - a.severity);
  const wins = signals.filter((s) => s.type === "Win");

  const recs: string[] = [];
  if (blockers[0]) {
    recs.push(`Unblock: ${blockers[0].title}`);
  }
  if (risks[0]) {
    recs.push(`De-risk: ${risks[0].title}`);
  }
  if (wins[0]) {
    recs.push(`Codify the win: ${wins[0].title}`);
  }
  if (recs.length === 0) {
    recs.push("Add a few signals to power recommendations.");
  }
  return recs.slice(0, 3);
}

export default function InsightsPage() {
  const reduceMotion = useReducedMotion();
  const { activeTeam } = useTeam();
  const store = useDemoStore();

  const signals = store.listSignalsForTeam(activeTeam.id);
  const projects = store.listProjectsForTeam(activeTeam.id);
  const series = store.listSeriesForTeam(activeTeam.id)[0] ?? null;

  const mix = useMemo(() => workMixSegments(projects), [projects]);
  const recs = useMemo(() => recommendations(signals), [signals]);

  const reveal = (delay: number) => ({
    initial: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0 : 0.45, ease: KW_EASE_OUT, delay },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={activeTeam.name}
        title="Insights"
        subtitle="Trends, risks, blockers, and recommendations. Signal without the noise."
        right={
          <Link href="/app">
            <Button variant="secondary" className="gap-2">
              Dashboard <ArrowRight size={16} />
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div {...reveal(0.02)} className="min-w-0">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Trend</CardTitle>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  {series ? series.label : "No series for this team"}
                </p>
              </div>
              <Pill tone="neutral">7 points</Pill>
            </div>
            <div className="mt-4">
              {series ? (
                <AreaTrend
                  points={series.points}
                  tone={activeTeam.id === "team_orbit" ? "accent" : "brand"}
                  valueSuffix={series.unit === "percent" ? "%" : ""}
                />
              ) : (
                <EmptyState title="No trend data yet" message="Add a demo series in src/demo/data.ts." />
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div {...reveal(0.06)}>
          <Card className="overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Recommendations</CardTitle>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  A tiny heuristic on top of signals.
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[rgba(43,75,255,0.28)] bg-[rgba(43,75,255,0.12)] text-[rgba(31,54,217,1)]">
                <Lightbulb size={18} />
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {recs.map((r) => (
                <div
                  key={r}
                  className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3 text-sm text-[color:var(--kw-muted)]"
                >
                  <span className="font-semibold text-[color:var(--kw-ink)]">{r}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Work mix</CardTitle>
                <Pill tone="neutral">{projects.length}</Pill>
              </div>
              <div className="mt-3">
                <StackedBars segments={mix.length ? mix : [{ label: "No data", value: 1, color: "rgba(11,18,32,0.18)" }]} height={18} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {mix.map((s) => (
                  <Pill key={s.label} tone="neutral">
                    {s.label}: {s.value}
                  </Pill>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div {...reveal(0.1)}>
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Signal feed</CardTitle>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                Risks and blockers are designed to sit beside the numbers.
              </p>
            </div>
            <Pill tone="neutral">{signals.length}</Pill>
          </div>

          {signals.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No signals yet"
                message="Seed signals in src/demo/data.ts."
                icon={<Zap size={18} />}
              />
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {signals.map((s, idx) => {
                const relOkr = s.related?.okrId ? store.getOkr(s.related.okrId) : null;
                const relProj = s.related?.projectId ? store.getProject(s.related.projectId) : null;
                const tone = severityTone(s.severity);
                return (
                  <motion.div key={s.id} {...reveal(0.12 + idx * 0.02)}>
                    <div className="rounded-[24px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[color:var(--kw-ink)]">
                            {s.title}
                          </p>
                          <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                            {formatDateShort(s.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <SignalPill type={s.type} />
                          <Pill tone={tone}>Sev {s.severity}</Pill>
                        </div>
                      </div>

                      <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{s.detail}</p>

                      {(relOkr || relProj) ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {relOkr ? (
                            <Link href={`/app/goals/${relOkr.id}`}>
                              <Button variant="secondary" size="sm" className="gap-2">
                                OKR <ArrowRight size={16} />
                              </Button>
                            </Link>
                          ) : null}
                          {relProj ? (
                            <Link href={`/app/projects/${relProj.id}`}>
                              <Button variant="secondary" size="sm" className="gap-2">
                                Project <ArrowRight size={16} />
                              </Button>
                            </Link>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/55 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[rgba(234,88,12,0.28)] bg-[rgba(234,88,12,0.12)] text-[color:var(--kw-ember-600)]">
                <ShieldAlert size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Signals are seeded demo data.</p>
                <p className="text-xs text-[color:var(--kw-muted)]">
                  In a real app, these would connect to incidents, experiments, or delivery events.
                </p>
              </div>
            </div>
            <Link href="/app/settings">
              <Button variant="secondary" className="gap-2">
                Settings <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
