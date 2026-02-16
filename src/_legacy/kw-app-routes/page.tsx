"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  FolderKanban,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { HealthPill, SignalPill } from "@/components/app/badges";
import { AreaTrend } from "@/components/charts/area-trend";
import { DonutProgress } from "@/components/charts/donut-progress";
import { HeatStrip } from "@/components/charts/heat-strip";
import { Sparkline } from "@/components/charts/sparkline";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardSoft, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { ProgressBar } from "@/components/ui/progress";
import { projectMilestoneProgress } from "@/demo/derived/progress";
import { activityDays } from "@/demo/derived/activity";
import { activeProjects, healthCounts, okrSummary, signalCounts } from "@/demo/derived/summary";
import { useDemoAuth } from "@/demo/demo-auth";
import { useDemoStore } from "@/demo/store";
import { useTeam } from "@/demo/team";
import { formatDateShort, formatPercent01 } from "@/lib/format";
import { KW_EASE_OUT } from "@/lib/motion";

export default function DashboardPage() {
  const reduceMotion = useReducedMotion();
  const { user } = useDemoAuth();
  const { activeTeam } = useTeam();
  const store = useDemoStore();

  const members = store.listMembersForTeam(activeTeam.id);
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m] as const)), [members]);

  const okrs = store.listOkrsForTeam(activeTeam.id);
  const initiatives = store.listInitiativesForTeam(activeTeam.id);
  const projects = store.listProjectsForTeam(activeTeam.id);
  const signals = store.listSignalsForTeam(activeTeam.id);
  const rituals = store.listRitualsForTeam(activeTeam.id);
  const series = store.listSeriesForTeam(activeTeam.id)[0] ?? null;

  const okrS = useMemo(() => okrSummary(okrs), [okrs]);
  const sigC = useMemo(() => signalCounts(signals), [signals]);
  const active = useMemo(() => activeProjects(projects), [projects]);
  const projHealth = useMemo(() => healthCounts(active), [active]);

  const activity = useMemo(
    () =>
      activityDays({
        seed: `${activeTeam.id}_${user?.id ?? "anon"}`,
        days: 42,
        includeWeekends: store.preferences.showWeekendActivity,
      }),
    [activeTeam.id, store.preferences.showWeekendActivity, user?.id],
  );

  const kpiReveal = (delay: number) => ({
    initial: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0 : 0.45, ease: KW_EASE_OUT, delay },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: activeTeam.brand.primary }}
              aria-hidden="true"
            />
            {activeTeam.name}
          </span>
        }
        title="Dashboard"
        subtitle="A living overview of what moved, what is at risk, and what to do next."
        right={
          <div className="flex items-center gap-2">
            <Link href="/app/goals">
              <Button variant="secondary" className="gap-2">
                Check-ins <ClipboardCheck size={16} />
              </Button>
            </Link>
            <Link href="/app/insights">
              <Button className="gap-2">
                View signals <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <motion.div {...kpiReveal(0.02)}>
          <CardSoft className="h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  OKR Progress
                </p>
                <div className="mt-2 flex items-baseline justify-between gap-3">
                  <p className="font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)]">
                    {formatPercent01(okrS.progress, 0)}
                  </p>
                  <DonutProgress value={okrS.progress} size={44} />
                </div>
                <p className="mt-2 text-xs text-[color:var(--kw-muted)]">
                  Across {okrS.count} objectives.
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                <Target size={18} />
              </span>
            </div>
          </CardSoft>
        </motion.div>

        <motion.div {...kpiReveal(0.06)}>
          <CardSoft className="h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Confidence
                </p>
                <div className="mt-2 flex items-baseline justify-between gap-3">
                  <p className="font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)]">
                    {formatPercent01(okrS.confidence, 0)}
                  </p>
                  <DonutProgress value={okrS.confidence} size={44} tone="accent" />
                </div>
                <p className="mt-2 text-xs text-[color:var(--kw-muted)]">
                  Weighted by recent check-ins.
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                <Sparkles size={18} />
              </span>
            </div>
          </CardSoft>
        </motion.div>

        <motion.div {...kpiReveal(0.1)}>
          <CardSoft className="h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Active Projects
                </p>
                <p className="mt-2 font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)]">
                  {active.length}
                </p>
                <div className="mt-3 space-y-1 text-xs text-[color:var(--kw-muted)]">
                  <p>
                    Green: <span className="font-semibold text-[color:var(--kw-ink)]">{projHealth.green}</span>
                  </p>
                  <p>
                    Amber: <span className="font-semibold text-[color:var(--kw-ink)]">{projHealth.amber}</span>
                  </p>
                </div>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                <FolderKanban size={18} />
              </span>
            </div>
          </CardSoft>
        </motion.div>

        <motion.div {...kpiReveal(0.14)}>
          <CardSoft className="h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Signals
                </p>
                <p className="mt-2 font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)]">
                  {sigC.blocker + sigC.risk}
                </p>
                <p className="mt-2 text-xs text-[color:var(--kw-muted)]">
                  {sigC.blocker} blockers, {sigC.risk} risks, {sigC.win} wins.
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                <Zap size={18} />
              </span>
            </div>
          </CardSoft>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <motion.div {...kpiReveal(0.18)} className="min-w-0">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle>Trend</CardTitle>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  {series ? series.label : "No series for this team"}
                </p>
              </div>
              <Pill tone="neutral" className="shrink-0">
                Last 7 weeks
              </Pill>
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

        <motion.div {...kpiReveal(0.22)}>
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle>Activity</CardTitle>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  6-week heat strip (demo)
                </p>
              </div>
              <Pill tone="neutral" className="shrink-0">
                {store.preferences.showWeekendActivity ? "Weekends on" : "Weekends off"}
              </Pill>
            </div>
            <div className="mt-4">
              <HeatStrip
                days={activity.map((d) => ({ date: d.date, value: d.value }))}
                tone="neutral"
                className="max-w-sm"
              />
            </div>
            <p className="mt-3 text-xs text-[color:var(--kw-muted)]">
              Driven by a deterministic demo generator. Toggle weekend visibility in Settings.
            </p>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div {...kpiReveal(0.26)}>
          <Card className="overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Initiatives</CardTitle>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  Timeline plus health, in one view.
                </p>
              </div>
              <Pill tone="neutral">{initiatives.length} tracks</Pill>
            </div>

            {initiatives.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="No initiatives" message="Seed initiatives in src/demo/data.ts." />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {initiatives.map((i) => {
                  const owner = memberById.get(i.ownerId);
                  return (
                    <div
                      key={i.id}
                      className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[color:var(--kw-ink)]">
                            {i.name}
                          </p>
                          <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                            {formatDateShort(i.start)} to {formatDateShort(i.end)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <HealthPill health={i.health} />
                          {owner ? <Avatar name={owner.name} seed={owner.avatarSeed} size={34} /> : null}
                        </div>
                      </div>
                      <div className="mt-3">
                        <ProgressBar value={i.progress} tone={i.health === "GREEN" ? "brand" : "warn"} />
                      </div>
                      <p className="mt-2 text-xs text-[color:var(--kw-muted)]">
                        Linked projects:{" "}
                        <span className="font-semibold text-[color:var(--kw-ink)]">
                          {i.linkedProjectIds.length}
                        </span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div {...kpiReveal(0.3)}>
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Now</CardTitle>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  What needs attention this week.
                </p>
              </div>
              <Link href="/app/insights" className="shrink-0">
                <Button variant="secondary" size="sm" className="gap-2">
                  All signals <ArrowRight size={16} />
                </Button>
              </Link>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Top signals
                </p>
                {signals.slice(0, 3).length === 0 ? (
                  <EmptyState title="No signals yet" message="Seed signals in src/demo/data.ts." />
                ) : (
                  <div className="space-y-2">
                    {signals.slice(0, 3).map((s) => (
                      <div
                        key={s.id}
                        className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[color:var(--kw-ink)]">
                              {s.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs leading-6 text-[color:var(--kw-muted)]">
                              {s.detail}
                            </p>
                          </div>
                          <SignalPill type={s.type} />
                        </div>
                        <p className="mt-2 text-xs text-[color:var(--kw-faint)]">
                          Severity {s.severity} · {formatDateShort(s.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  OKRs
                </p>
                {okrs.slice(0, 2).length === 0 ? (
                  <EmptyState title="No OKRs yet" message="Seed OKRs in src/demo/data.ts." />
                ) : (
                  <div className="space-y-2">
                    {okrs.slice(0, 2).map((o) => {
                      const owner = memberById.get(o.ownerId);
                      const latest = o.checkIns[0] ?? null;
                      return (
                        <Link
                          key={o.id}
                          href={`/app/goals/${o.id}`}
                          className="block rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3 transition hover:bg-white"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[color:var(--kw-ink)]">
                                {o.objective}
                              </p>
                              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">{o.timeframe}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <DonutProgress value={okrSummary([o]).progress} size={38} />
                              {owner ? <Avatar name={owner.name} seed={owner.avatarSeed} size={34} /> : null}
                            </div>
                          </div>
                          {latest ? (
                            <p className="mt-2 line-clamp-2 text-xs leading-6 text-[color:var(--kw-muted)]">
                              <span className="font-semibold text-[color:var(--kw-ink)]">Latest:</span>{" "}
                              {latest.note}
                            </p>
                          ) : null}
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="text-xs text-[color:var(--kw-faint)]">
                              {o.keyResults.length} key results
                            </span>
                            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[color:var(--kw-muted)]">
                              Open <ArrowRight size={14} />
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Rituals
                </p>
                {rituals.length === 0 ? (
                  <p className="mt-2 text-sm text-[color:var(--kw-muted)]">No rituals set.</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm">
                    {rituals.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate font-semibold text-[color:var(--kw-ink)]">
                          {r.title}
                        </span>
                        <span className="shrink-0 text-xs text-[color:var(--kw-muted)]">
                          {r.day} · {r.cadence}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Workload snapshot
                </p>
                <div className="mt-3 space-y-2">
                  {members.slice(0, 3).map((m, idx) => (
                    <div key={m.id} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={m.name} seed={m.avatarSeed} size={32} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[color:var(--kw-ink)]">
                            {m.name}
                          </p>
                          <p className="truncate text-xs text-[color:var(--kw-muted)]">{m.title}</p>
                        </div>
                      </div>
                      <div className="w-24">
                        <Sparkline
                          values={[3 + idx, 4 + idx, 4 + idx, 5 + idx, 4 + idx, 6 + idx, 5 + idx]}
                          tone={idx === 0 ? "brand" : idx === 1 ? "accent" : "warn"}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link href="/app/team">
                    <Button variant="secondary" size="sm" className="w-full gap-2">
                      Team details <ArrowRight size={16} />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    Projects in motion
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--kw-muted)]">
                    {active.length} active or planning.
                  </p>
                </div>
                <Link href="/app/projects">
                  <Button variant="secondary" size="sm" className="gap-2">
                    Open <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>

              <div className="mt-3 space-y-2">
                {active.slice(0, 3).map((p) => {
                  const owner = memberById.get(p.ownerId);
                  const prog = projectMilestoneProgress(p);
                  return (
                    <Link
                      key={p.id}
                      href={`/app/projects/${p.id}`}
                      className="block rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/75 px-3 py-3 transition hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[color:var(--kw-ink)]">
                            {p.name}
                          </p>
                          <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                            {formatDateShort(p.start)} to {formatDateShort(p.end)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <HealthPill health={p.health} />
                          {owner ? <Avatar name={owner.name} seed={owner.avatarSeed} size={34} /> : null}
                        </div>
                      </div>
                      <div className="mt-3">
                        <ProgressBar value={prog} tone={p.health === "GREEN" ? "brand" : "warn"} />
                      </div>
                      <p className="mt-2 text-xs text-[color:var(--kw-muted)]">
                        Milestones:{" "}
                        <span className="font-semibold text-[color:var(--kw-ink)]">
                          {p.milestones.filter((m) => m.status === "Done").length}/{p.milestones.length}
                        </span>
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/55 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[rgba(43,75,255,0.28)] bg-[rgba(43,75,255,0.12)] text-[rgba(31,54,217,1)]">
                  <CalendarDays size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                    This is demo data.
                  </p>
                  <p className="text-xs text-[color:var(--kw-muted)]">
                    Your check-ins and preferences persist locally in this browser.
                  </p>
                </div>
              </div>
              <Pill tone="neutral">Signed in as {user?.name ?? "Demo"}</Pill>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
