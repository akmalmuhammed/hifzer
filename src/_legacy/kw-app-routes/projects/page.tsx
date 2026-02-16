"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, FolderKanban, GitMerge, ShieldAlert } from "lucide-react";
import { HealthPill } from "@/components/app/badges";
import { PageHeader } from "@/components/app/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardSoft, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { ProgressBar } from "@/components/ui/progress";
import { projectMilestoneProgress } from "@/demo/derived/progress";
import { useDemoStore } from "@/demo/store";
import { useTeam } from "@/demo/team";
import { formatDateShort } from "@/lib/format";
import { KW_EASE_OUT } from "@/lib/motion";

type ProjectFilter = "All" | "Active" | "Planning" | "Paused" | "Complete";

export default function ProjectsPage() {
  const reduceMotion = useReducedMotion();
  const { activeTeam } = useTeam();
  const store = useDemoStore();

  const [filter, setFilter] = useState<ProjectFilter>("All");

  const projects = store.listProjectsForTeam(activeTeam.id);
  const members = store.listMembersForTeam(activeTeam.id);
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m] as const)), [members]);

  const filtered = useMemo(() => {
    if (filter === "All") {
      return projects;
    }
    return projects.filter((p) => p.status === filter);
  }, [filter, projects]);

  const reveal = (delay: number) => ({
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
        title="Projects"
        subtitle="Timeline, health, milestones, and risks. One view you can steer."
        right={
          <div className="flex items-center gap-2">
            {(["All", "Active", "Planning", "Paused", "Complete"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={
                  f === filter
                    ? "rounded-full border border-[rgba(43,75,255,0.25)] bg-[rgba(43,75,255,0.12)] px-3 py-2 text-xs font-semibold text-[rgba(31,54,217,1)]"
                    : "rounded-full border border-[color:var(--kw-border-2)] bg-white/65 px-3 py-2 text-xs font-semibold text-[color:var(--kw-muted)] hover:bg-white"
                }
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No projects match this filter"
          message="Change the filter or seed more projects in src/demo/data.ts."
          icon={<FolderKanban size={18} />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((p, idx) => {
            const owner = memberById.get(p.ownerId);
            const prog = projectMilestoneProgress(p);
            const done = p.milestones.filter((m) => m.status === "Done").length;
            const blocked = p.milestones.filter((m) => m.status === "Blocked").length;
            const risk = p.riskFlags.length;
            const deps = p.dependencies.length;

            return (
              <motion.div key={p.id} {...reveal(0.03 + idx * 0.03)}>
                <Link href={`/app/projects/${p.id}`} className="block transition hover:translate-y-[-1px]">
                  <Card className="h-full overflow-hidden">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill tone="neutral">{p.status}</Pill>
                          <HealthPill health={p.health} />
                          {p.tags.slice(0, 2).map((t) => (
                            <Pill key={t} tone="neutral">
                              #{t}
                            </Pill>
                          ))}
                        </div>
                        <h2 className="mt-3 text-balance font-[family-name:var(--font-kw-display)] text-2xl leading-tight tracking-tight text-[color:var(--kw-ink)]">
                          {p.name}
                        </h2>
                        <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                          {formatDateShort(p.start)} to {formatDateShort(p.end)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {owner ? (
                          <div className="flex items-center gap-2 text-xs text-[color:var(--kw-muted)]">
                            <Avatar name={owner.name} seed={owner.avatarSeed} size={32} />
                            <span className="max-w-[140px] truncate font-semibold text-[color:var(--kw-ink)]">
                              {owner.name}
                            </span>
                          </div>
                        ) : null}
                        <Pill tone="neutral">
                          {done}/{p.milestones.length} milestones
                        </Pill>
                      </div>
                    </div>

                    <div className="mt-4">
                      <ProgressBar value={prog} tone={p.health === "GREEN" ? "brand" : "warn"} ariaLabel="Milestone completion" />
                      <p className="mt-2 text-xs text-[color:var(--kw-muted)]">
                        {blocked > 0 ? (
                          <span className="font-semibold text-[color:var(--kw-ember-600)]">
                            {blocked} blocked
                          </span>
                        ) : (
                          <span className="font-semibold text-[color:var(--kw-lime-600)]">No blockers</span>
                        )}
                        {" · "}
                        {risk > 0 ? `${risk} risk flags` : "No risk flags"}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <CardSoft className="px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <CardTitle>Dependencies</CardTitle>
                          <GitMerge size={16} className="text-[color:var(--kw-faint)]" />
                        </div>
                        <p className="mt-2 font-[family-name:var(--font-kw-display)] text-2xl tracking-tight text-[color:var(--kw-ink)]">
                          {deps}
                        </p>
                      </CardSoft>
                      <CardSoft className="px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <CardTitle>Risks</CardTitle>
                          <ShieldAlert size={16} className="text-[color:var(--kw-faint)]" />
                        </div>
                        <p className="mt-2 font-[family-name:var(--font-kw-display)] text-2xl tracking-tight text-[color:var(--kw-ink)]">
                          {risk}
                        </p>
                      </CardSoft>
                      <CardSoft className="px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <CardTitle>Speed</CardTitle>
                          <ArrowRight size={16} className="text-[color:var(--kw-faint)]" />
                        </div>
                        <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                          {prog >= 0.66 ? "Strong" : prog >= 0.4 ? "Steady" : "Needs push"}
                        </p>
                      </CardSoft>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs text-[color:var(--kw-muted)]">
                        Milestones: {done} done, {p.milestones.length - done} remaining
                      </span>
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-[color:var(--kw-muted)]">
                        Open <ArrowRight size={14} />
                      </span>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="rounded-[28px] border border-[color:var(--kw-border-2)] bg-white/55 px-5 py-6 shadow-[var(--kw-shadow-soft)] backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Prototype note
            </p>
            <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
              Projects are demo-only. Later you can connect milestones to real issues or tickets.
            </p>
          </div>
          <Link href="/app/settings">
            <Button variant="secondary" className="gap-2">
              Preferences <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
