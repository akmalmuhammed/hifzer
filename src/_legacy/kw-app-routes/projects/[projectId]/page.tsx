"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, FolderKanban, GitMerge, ShieldAlert } from "lucide-react";
import { HealthPill, SignalPill } from "@/components/app/badges";
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
import { formatDateLong, formatDateShort } from "@/lib/format";
import { KW_EASE_OUT } from "@/lib/motion";

function milestoneTone(status: "Done" | "Next" | "Blocked"): "success" | "accent" | "danger" {
  if (status === "Done") {
    return "success";
  }
  if (status === "Blocked") {
    return "danger";
  }
  return "accent";
}

export default function ProjectDetailPage(props: { params: { projectId: string } }) {
  const reduceMotion = useReducedMotion();
  const store = useDemoStore();
  const { activeTeam } = useTeam();

  const members = store.listMembersForTeam(activeTeam.id);
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m] as const)), [members]);

  const project = store.getProject(props.params.projectId);

  const reveal = (delay: number) => ({
    initial: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0 : 0.45, ease: KW_EASE_OUT, delay },
  });

  if (!project) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={activeTeam.name}
          title="Project not found"
          subtitle="This demo project ID does not exist."
          right={
            <Link href="/legacy/app/projects">
              <Button variant="secondary" className="gap-2">
                Back to projects <ArrowLeft size={16} />
              </Button>
            </Link>
          }
        />
        <EmptyState
          title="Missing project"
          message="Try another project from the list."
          icon={<FolderKanban size={18} />}
        />
      </div>
    );
  }

  const owner = memberById.get(project.ownerId);
  const prog = projectMilestoneProgress(project);
  const done = project.milestones.filter((m) => m.status === "Done").length;
  const relatedSignals = store
    .listSignalsForTeam(activeTeam.id)
    .filter((s) => s.related?.projectId === project.id)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Link href="/legacy/app/projects" className="inline-flex items-center gap-2 text-[color:var(--kw-muted)] hover:text-[color:var(--kw-ink)]">
              <ArrowLeft size={16} />
              Projects
            </Link>
            <span className="text-[color:var(--kw-faint)]">/</span>
            <span className="truncate">{project.status}</span>
          </span>
        }
        title={project.name}
        subtitle="Milestones, dependencies, and risk flags in one narrative view."
        right={
          <div className="flex items-center gap-2">
            <Pill tone="neutral">{project.status}</Pill>
            <HealthPill health={project.health} />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div {...reveal(0.02)} className="min-w-0">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle>Timeline</CardTitle>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  {formatDateShort(project.start)} to {formatDateShort(project.end)}
                </p>
              </div>
              {owner ? (
                <div className="flex items-center gap-2 rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2">
                  <Avatar name={owner.name} seed={owner.avatarSeed} size={34} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[color:var(--kw-ink)]">{owner.name}</p>
                    <p className="truncate text-xs text-[color:var(--kw-muted)]">{owner.title}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <ProgressBar value={prog} tone={project.health === "GREEN" ? "brand" : "warn"} ariaLabel="Milestone completion" />
              <p className="mt-2 text-xs text-[color:var(--kw-muted)]">
                {done}/{project.milestones.length} milestones done.
              </p>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Milestones
              </p>
              <div className="mt-2 space-y-2">
                {project.milestones.map((m) => (
                  <CardSoft key={m.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[color:var(--kw-ink)]">
                          {m.title}
                        </p>
                        <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                          {formatDateLong(m.date)}
                        </p>
                      </div>
                      <Pill tone={milestoneTone(m.status)}>{m.status}</Pill>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{m.detail}</p>
                  </CardSoft>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div {...reveal(0.06)} className="min-w-0">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Risks & Dependencies</CardTitle>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  What can break the plan, and what you rely on.
                </p>
              </div>
              <Pill tone="neutral">{project.riskFlags.length + project.dependencies.length}</Pill>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Dependencies</CardTitle>
                  <GitMerge size={16} className="text-[color:var(--kw-faint)]" />
                </div>
                {project.dependencies.length === 0 ? (
                  <p className="mt-2 text-sm text-[color:var(--kw-muted)]">None</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {project.dependencies.map((d) => {
                      const dep = store.getProject(d.projectId);
                      return (
                        <Link
                          key={`${project.id}_${d.projectId}`}
                          href={dep ? `/legacy/app/projects/${dep.id}` : "/legacy/app/projects"}
                          className="block rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/75 px-3 py-2 transition hover:bg-white"
                        >
                          <p className="truncate text-sm font-semibold text-[color:var(--kw-ink)]">
                            {dep ? dep.name : d.projectId}
                          </p>
                          <p className="mt-1 text-xs text-[color:var(--kw-muted)]">{d.note}</p>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Risk flags</CardTitle>
                  <ShieldAlert size={16} className="text-[color:var(--kw-faint)]" />
                </div>
                {project.riskFlags.length === 0 ? (
                  <p className="mt-2 text-sm text-[color:var(--kw-muted)]">None</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm text-[color:var(--kw-muted)]">
                    {project.riskFlags.map((r) => (
                      <li key={r} className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/75 px-3 py-2">
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {relatedSignals.length ? (
              <div className="mt-4 rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/60 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Related signals</CardTitle>
                    <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                      Risks and blockers tagged to this project.
                    </p>
                  </div>
                  <Pill tone="neutral">{relatedSignals.length}</Pill>
                </div>
                <div className="mt-3 space-y-2">
                  {relatedSignals.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 truncate text-sm font-semibold text-[color:var(--kw-ink)]">
                          {s.title}
                        </p>
                        <SignalPill type={s.type} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-6 text-[color:var(--kw-muted)]">
                        {s.detail}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link href="/legacy/app/insights">
                    <Button variant="secondary" size="sm" className="w-full gap-2">
                      Open Insights <ArrowRight size={16} />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : null}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
