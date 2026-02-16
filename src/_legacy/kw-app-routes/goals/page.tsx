"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageSquareText, Target } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { DonutProgress } from "@/components/charts/donut-progress";
import { Sparkline } from "@/components/charts/sparkline";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardSoft, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { okrConfidence, okrProgress } from "@/demo/derived/progress";
import { useDemoStore } from "@/demo/store";
import { useTeam } from "@/demo/team";
import { formatDateShort, formatMetric, formatPercent01 } from "@/lib/format";
import { KW_EASE_OUT } from "@/lib/motion";

function confidenceTone(v: number): { tone: "success" | "warn" | "danger"; label: string } {
  if (v >= 0.72) {
    return { tone: "success", label: "High" };
  }
  if (v >= 0.52) {
    return { tone: "warn", label: "Medium" };
  }
  return { tone: "danger", label: "Low" };
}

export default function GoalsPage() {
  const reduceMotion = useReducedMotion();
  const { activeTeam } = useTeam();
  const store = useDemoStore();
  const okrs = store.listOkrsForTeam(activeTeam.id);
  const members = store.listMembersForTeam(activeTeam.id);
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m] as const)), [members]);

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
              style={{ background: activeTeam.brand.accent }}
              aria-hidden="true"
            />
            {activeTeam.name}
          </span>
        }
        title="Goals"
        subtitle="OKRs with narrative. Check-ins are first-class, so progress always has a why."
        right={
          <Link href="/app">
            <Button variant="secondary" className="gap-2">
              Back to dashboard <ArrowRight size={16} />
            </Button>
          </Link>
        }
      />

      {okrs.length === 0 ? (
        <EmptyState
          title="No OKRs for this team"
          message="Seed OKRs in src/demo/data.ts."
          icon={<Target size={18} />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {okrs.map((okr, idx) => {
            const owner = memberById.get(okr.ownerId);
            const progress = okrProgress(okr);
            const confidence = okrConfidence(okr);
            const conf = confidenceTone(confidence);
            const latest = okr.checkIns[0] ?? null;

            return (
              <motion.div key={okr.id} {...reveal(0.03 + idx * 0.03)}>
                <Link
                  href={`/app/goals/${okr.id}`}
                  className="block transition hover:translate-y-[-1px]"
                >
                  <Card className="h-full overflow-hidden">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill tone="accent">{okr.timeframe}</Pill>
                          <Pill tone={conf.tone}>{conf.label} confidence</Pill>
                        </div>
                        <h2 className="mt-3 text-balance font-[family-name:var(--font-kw-display)] text-2xl leading-tight tracking-tight text-[color:var(--kw-ink)]">
                          {okr.objective}
                        </h2>
                        <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                          {okr.tags.slice(0, 3).map((t) => `#${t}`).join("  ")}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <p className="font-[family-name:var(--font-kw-display)] text-2xl tracking-tight text-[color:var(--kw-ink)]">
                            {formatPercent01(progress, 0)}
                          </p>
                          <DonutProgress value={progress} size={44} />
                        </div>
                        {owner ? (
                          <div className="flex items-center gap-2 text-xs text-[color:var(--kw-muted)]">
                            <Avatar name={owner.name} seed={owner.avatarSeed} size={30} />
                            <span className="max-w-[140px] truncate font-semibold text-[color:var(--kw-ink)]">
                              {owner.name}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {okr.keyResults.slice(0, 2).map((kr) => {
                        const krOwner = memberById.get(kr.ownerId);
                        return (
                          <CardSoft key={kr.id} className="px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[color:var(--kw-ink)]">
                                  {kr.title}
                                </p>
                                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                                  {formatMetric(kr.current, kr.unit)} / {formatMetric(kr.target, kr.unit)}
                                </p>
                              </div>
                              <div className="w-24">
                                <Sparkline values={kr.sparkline} tone="neutral" />
                              </div>
                            </div>
                            {krOwner ? (
                              <p className="mt-2 text-xs text-[color:var(--kw-faint)]">
                                Owner: <span className="font-semibold text-[color:var(--kw-ink)]">{krOwner.name}</span>
                              </p>
                            ) : null}
                          </CardSoft>
                        );
                      })}
                    </div>

                    <div className="mt-4 rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/65 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle>Latest check-in</CardTitle>
                          {latest ? (
                            <>
                              <p className="mt-2 line-clamp-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                                {latest.note}
                              </p>
                              <p className="mt-2 text-xs text-[color:var(--kw-faint)]">
                                {formatDateShort(latest.at)}
                              </p>
                            </>
                          ) : (
                            <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                              No check-ins yet.
                            </p>
                          )}
                        </div>
                        <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                          <MessageSquareText size={18} />
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs text-[color:var(--kw-muted)]">
                        {okr.keyResults.length} key results · {okr.checkIns.length} check-ins
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
    </div>
  );
}
