"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, MessageSquarePlus, Target } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { DonutProgress } from "@/components/charts/donut-progress";
import { Sparkline } from "@/components/charts/sparkline";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardSoft, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Textarea } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { keyResultProgress, okrConfidence, okrProgress } from "@/demo/derived/progress";
import { useDemoAuth } from "@/demo/demo-auth";
import { useDemoStore } from "@/demo/store";
import { useTeam } from "@/demo/team";
import { formatDateLong, formatMetric, formatPercent01 } from "@/lib/format";
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

export default function OkrDetailPage(props: { params: { okrId: string } }) {
  const reduceMotion = useReducedMotion();
  const store = useDemoStore();
  const { activeTeam } = useTeam();
  const { user } = useDemoAuth();
  const { pushToast } = useToast();

  const members = store.listMembersForTeam(activeTeam.id);
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m] as const)), [members]);

  const okr = store.getOkr(props.params.okrId);
  const [note, setNote] = useState("");
  const [confidencePct, setConfidencePct] = useState(68);

  const reveal = (delay: number) => ({
    initial: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0 : 0.45, ease: KW_EASE_OUT, delay },
  });

  if (!okr) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={activeTeam.name}
          title="Goal not found"
          subtitle="This demo OKR ID does not exist."
          right={
            <Link href="/app/goals">
              <Button variant="secondary" className="gap-2">
                Back to goals <ArrowLeft size={16} />
              </Button>
            </Link>
          }
        />
        <EmptyState title="Missing OKR" message="Try another goal from the list." icon={<Target size={18} />} />
      </div>
    );
  }

  const owner = memberById.get(okr.ownerId);
  const progress = okrProgress(okr);
  const confidence = okrConfidence(okr);
  const conf = confidenceTone(confidence);
  const relatedSignals = store
    .listSignalsForTeam(activeTeam.id)
    .filter((s) => s.related?.okrId === okr.id)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Link href="/app/goals" className="inline-flex items-center gap-2 text-[color:var(--kw-muted)] hover:text-[color:var(--kw-ink)]">
              <ArrowLeft size={16} />
              Goals
            </Link>
            <span className="text-[color:var(--kw-faint)]">/</span>
            <span className="truncate">{okr.timeframe}</span>
          </span>
        }
        title={okr.objective}
        subtitle="Key results, narrative check-ins, and the confidence signal in one place."
        right={
          <div className="flex items-center gap-2">
            <Pill tone={conf.tone}>{conf.label} confidence</Pill>
            <Pill tone="neutral">{okr.keyResults.length} KRs</Pill>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div {...reveal(0.02)} className="min-w-0">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle>Pulse</CardTitle>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  Progress, confidence, owner, and narrative.
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

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Progress
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)]">
                    {formatPercent01(progress, 0)}
                  </p>
                  <DonutProgress value={progress} size={48} />
                </div>
              </div>
              <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Confidence
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)]">
                    {formatPercent01(confidence, 0)}
                  </p>
                  <DonutProgress value={confidence} size={48} tone="accent" />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Key results
              </p>
              <div className="mt-2 space-y-2">
                {okr.keyResults.map((kr) => {
                  const krOwner = memberById.get(kr.ownerId);
                  const krProg = keyResultProgress(kr);
                  return (
                    <CardSoft key={kr.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                            {kr.title}
                          </p>
                          <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                            {formatMetric(kr.current, kr.unit)} / {formatMetric(kr.target, kr.unit)}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Pill tone="neutral">{formatPercent01(krProg, 0)} KR</Pill>
                            <Pill tone={confidenceTone(kr.confidence).tone}>
                              {confidenceTone(kr.confidence).label}
                            </Pill>
                            {krOwner ? <Pill tone="neutral">{krOwner.name}</Pill> : null}
                          </div>
                        </div>
                        <div className="w-28">
                          <Sparkline values={kr.sparkline} tone="neutral" />
                        </div>
                      </div>
                    </CardSoft>
                  );
                })}
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div {...reveal(0.06)} className="min-w-0">
          <Card className="overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Check-ins</CardTitle>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  Narrative and confidence update.
                </p>
              </div>
              <Pill tone="neutral">{okr.checkIns.length}</Pill>
            </div>

            <div className="mt-4 rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Add check-in
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                Stored locally. Use it to prototype the interaction model.
              </p>
              <div className="mt-3">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What changed since last week? What is blocked? What is the next bet?"
                  className="min-h-[110px]"
                />
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px] sm:items-end">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    Confidence
                  </span>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={confidencePct}
                      onChange={(e) => setConfidencePct(Number(e.target.value))}
                      className="w-full accent-[rgba(31,54,217,1)]"
                    />
                    <Input
                      value={confidencePct}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (!Number.isFinite(n)) {
                          return;
                        }
                        setConfidencePct(Math.max(0, Math.min(100, Math.round(n))));
                      }}
                      inputMode="numeric"
                      className="h-11 w-[90px] text-center"
                      aria-label="Confidence percent"
                    />
                  </div>
                </label>

                <Button
                  className="gap-2"
                  onClick={() => {
                    if (!user) {
                      pushToast({ title: "Sign in first", message: "Pick a demo user.", tone: "warning" });
                      return;
                    }
                    store.addCheckIn({
                      okrId: okr.id,
                      authorId: user.memberId,
                      note,
                      confidence: confidencePct / 100,
                    });
                    setNote("");
                    pushToast({ title: "Check-in added", message: "Stored locally.", tone: "success" });
                  }}
                >
                  Post <MessageSquarePlus size={16} />
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {okr.checkIns.slice(0, 6).map((ci) => {
                const author = memberById.get(ci.authorId);
                return (
                  <div
                    key={ci.id}
                    className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                          {author ? author.name : "Unknown"}
                        </p>
                        <p className="mt-1 text-xs text-[color:var(--kw-muted)]">{formatDateLong(ci.at)}</p>
                      </div>
                      <Pill tone={confidenceTone(ci.confidence).tone}>
                        {formatPercent01(ci.confidence, 0)}
                      </Pill>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{ci.note}</p>
                  </div>
                );
              })}
            </div>

            {relatedSignals.length ? (
              <div className="mt-6 rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/60 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Related signals</CardTitle>
                    <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                      Risks and wins tagged to this OKR.
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
                        <Pill tone={s.type === "Win" ? "success" : s.type === "Blocker" ? "danger" : "warn"}>
                          {s.type}
                        </Pill>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-6 text-[color:var(--kw-muted)]">
                        {s.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6">
              <Link href="/app/projects" className="block">
                <Button variant="secondary" className="w-full gap-2">
                  See projects that move this goal <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
