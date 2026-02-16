"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarClock, Users } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StackedBars } from "@/components/charts/stacked-bars";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardSoft, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { memberWorkload } from "@/demo/derived/workload";
import { useDemoStore } from "@/demo/store";
import { useTeam } from "@/demo/team";
import { KW_EASE_OUT } from "@/lib/motion";

function roleTone(role: "Admin" | "Lead" | "Member"): "accent" | "brand" | "neutral" {
  if (role === "Admin") {
    return "accent";
  }
  if (role === "Lead") {
    return "brand";
  }
  return "neutral";
}

export default function TeamPage() {
  const reduceMotion = useReducedMotion();
  const { activeTeam } = useTeam();
  const store = useDemoStore();

  const members = store.listMembersForTeam(activeTeam.id);
  const rituals = store.listRitualsForTeam(activeTeam.id);

  const reveal = (delay: number) => ({
    initial: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0 : 0.45, ease: KW_EASE_OUT, delay },
  });

  const summary = useMemo(() => {
    const admins = members.filter((m) => m.role === "Admin").length;
    const leads = members.filter((m) => m.role === "Lead").length;
    return { admins, leads, total: members.length };
  }, [members]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={activeTeam.name}
        title="Team"
        subtitle="Members, roles, workload mix, and operating rhythm."
        right={
          <div className="flex items-center gap-2">
            <Pill tone="neutral">{summary.total} members</Pill>
            <Pill tone="neutral">{summary.leads} leads</Pill>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <motion.div {...reveal(0.02)} className="min-w-0">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Roster</CardTitle>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  Workload is demo-derived but deterministic.
                </p>
              </div>
              <Pill tone="neutral">{members.length}</Pill>
            </div>

            {members.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="No members" message="Seed team membership in src/demo/data.ts." icon={<Users size={18} />} />
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {members.map((m, idx) => {
                  const w = memberWorkload(`${activeTeam.id}_${m.id}_${m.avatarSeed}`);
                  const segments = [
                    { label: "Build", value: w.build, color: "var(--kw-chart-2)" },
                    { label: "Ship", value: w.ship, color: "var(--kw-chart-1)" },
                    { label: "Support", value: w.support, color: "var(--kw-chart-3)" },
                  ];
                  return (
                    <motion.div key={m.id} {...reveal(0.04 + idx * 0.02)}>
                      <div className="rounded-[24px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <Avatar name={m.name} seed={m.avatarSeed} size={40} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[color:var(--kw-ink)]">{m.name}</p>
                              <p className="truncate text-xs text-[color:var(--kw-muted)]">{m.title}</p>
                              <p className="mt-1 truncate text-xs text-[color:var(--kw-faint)]">{m.timezone}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Pill tone={roleTone(m.role)}>{m.role}</Pill>
                            <Pill tone="neutral">Focus: {w.focus}</Pill>
                          </div>
                        </div>

                        <div className="mt-3">
                          <StackedBars segments={segments} height={18} ariaLabel="Workload mix" />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Pill tone="neutral">Build {w.build}%</Pill>
                          <Pill tone="neutral">Ship {w.ship}%</Pill>
                          <Pill tone="neutral">Support {w.support}%</Pill>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div {...reveal(0.06)} className="min-w-0">
          <Card className="overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Operating rhythm</CardTitle>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  Rituals are where teams create compounding alignment.
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[rgba(10,138,119,0.25)] bg-[rgba(10,138,119,0.12)] text-[color:var(--kw-teal-800)]">
                <CalendarClock size={18} />
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {rituals.length === 0 ? (
                <EmptyState title="No rituals" message="Seed rituals in src/demo/data.ts." />
              ) : (
                rituals.map((r) => (
                  <CardSoft key={r.id} className="px-4 py-3">
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{r.title}</p>
                    <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                      {r.cadence} · {r.day} · {r.timeUtc} UTC
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Pill tone="neutral">Owner: {store.getMember(r.ownerId)?.name ?? r.ownerId}</Pill>
                    </div>
                  </CardSoft>
                ))
              )}
            </div>

            <div className="mt-6 rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Next step
              </p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                In a real build, rituals connect to agenda templates, notes, and ownership.
              </p>
              <div className="mt-4">
                <a href="#" onClick={(e) => e.preventDefault()} className="block">
                  <Button variant="secondary" className="w-full gap-2">
                    Create a ritual (demo) <ArrowRight size={16} />
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
