"use client";

import Link from "next/link";
import { ArrowRight, Cpu, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import styles from "./roadmap.module.css";

type Milestone = {
  title: string;
  detail: string;
  status: "in_progress" | "planned";
};

type Lane = {
  label: string;
  horizon: string;
  focus: string;
  summary: string;
  milestones: Milestone[];
};

const LANES: Lane[] = [
  {
    label: "Now",
    horizon: "Current build cycle",
    focus: "Reliability and quality foundation",
    summary: "Tighten the core reading and memorization flow so people can trust what they finish and return without friction.",
    milestones: [
      {
        title: "Stabilize progress integrity",
        detail: "Eliminate session/event mismatches, harden idempotency, and improve cross-device sync consistency.",
        status: "in_progress",
      },
      {
        title: "Performance optimization pass",
        detail: "Reduce page payloads, optimize render paths, and tighten cold-start paths for key app routes.",
        status: "in_progress",
      },
      {
        title: "Observability maturity",
        detail: "Broaden Sentry coverage across routing, session completion, and payment-critical flows.",
        status: "planned",
      },
    ],
  },
  {
    label: "Next",
    horizon: "Upcoming major release",
    focus: "Memorization intelligence",
    summary: "Move beyond basic tracking into earlier confusion detection, faster repair loops, and prayer-ready preparation.",
    milestones: [
      {
        title: "Mushabihat radar and seam trainer",
        detail: "Catch similar ayah confusion early, then convert weak transitions into one-tap seam-only drills.",
        status: "planned",
      },
      {
        title: "Rescue sessions and confidence heatmap",
        detail: "Generate 5-10 minute fix-the-damage sessions and show fragility directly on a surah confidence map.",
        status: "planned",
      },
      {
        title: "Imam prep and Hifz-to-salah builder",
        detail: "Turn stable passages into prayer-ready sets with prompt anchors, loop plans, and teacher-facing readiness signals.",
        status: "planned",
      },
    ],
  },
  {
    label: "Later",
    horizon: "Platform expansion",
    focus: "Mobile reach and dependable delivery",
    summary: "Extend Hifzer into dependable mobile routines and stronger delivery foundations without sacrificing calm daily use.",
    milestones: [
      {
        title: "Native iOS app",
        detail: "Focused daily workflow with offline recitation loops, progress sync, and push reminders.",
        status: "planned",
      },
      {
        title: "Native Android app",
        detail: "Parity with iOS core loops and lightweight background sync for low-connectivity environments.",
        status: "planned",
      },
      {
        title: "Scalable infra architecture",
        detail: "Queue-based job orchestration, better caching strategy, and stronger cost-performance controls.",
        status: "planned",
      },
    ],
  },
];

function statusPill(status: Milestone["status"]): { tone: "accent" | "neutral"; label: string } {
  if (status === "in_progress") {
    return { tone: "accent", label: "In progress" };
  }
  return { tone: "neutral", label: "Planned" };
}

export function RoadmapClient() {
  const inProgressCount = LANES.flatMap((lane) => lane.milestones).filter((milestone) => milestone.status === "in_progress").length;
  const plannedCount = LANES.flatMap((lane) => lane.milestones).filter((milestone) => milestone.status === "planned").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Product"
        title="Roadmap"
        subtitle="A transparent view of what is actively being tightened now, what is coming next, and what Hifzer will grow into after the core gets stronger."
        right={(
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard">
              <Button variant="secondary" className="gap-2">
                Open dashboard <ArrowRight size={15} />
              </Button>
            </Link>
            <Link href="/support">
              <Button className="gap-2">
                Talk to dev <Sparkles size={15} />
              </Button>
            </Link>
          </div>
        )}
      />

      <section className={`kw-fade-in ${styles.hero} px-5 py-5 sm:px-6`}>
        <div className={styles.orbA} />
        <div className={styles.orbB} />
        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="accent">Public roadmap</Pill>
              <Pill tone="neutral">Shipped carefully</Pill>
            </div>
            <h2 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
              Building the next layer of Hifzer without losing the calm that makes it usable every day.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
              Priority stays with better daily outcomes first: steadier progress, stronger memorization support,
              and simpler ways to keep returning to the Qur&apos;an without noise.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <div className={`${styles.valueCard} flex items-center gap-3 px-3 py-3`}>
              <ShieldCheck size={16} className="text-[color:var(--kw-ink-2)]" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Quality</p>
                <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{inProgressCount} active priorities</p>
              </div>
            </div>
            <div className={`${styles.valueCard} flex items-center gap-3 px-3 py-3`}>
              <Cpu size={16} className="text-[color:var(--kw-ink-2)]" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Next</p>
                <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{plannedCount} planned moves</p>
              </div>
            </div>
            <div className={`${styles.valueCard} flex items-center gap-3 px-3 py-3`}>
              <Rocket size={16} className="text-[color:var(--kw-ink-2)]" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Direction</p>
                <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Reading, Hifz, mobile reach</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-3">
        {LANES.map((lane, laneIndex) => (
          <div
            key={lane.label}
            className="kw-fade-in"
            style={{ animationDelay: `${laneIndex * 50}ms` }}
          >
            <Card className={`${styles.lane} px-4 py-4`}>
              <div className={styles.laneHeader}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={laneIndex === 0 ? "accent" : "neutral"}>{lane.label}</Pill>
                    <span className={styles.laneCount}>{lane.milestones.length} priorities</span>
                  </div>
                  <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">{lane.horizon}</p>
                  <p className="mt-1 text-sm font-medium text-[color:var(--kw-ink-2)]">{lane.focus}</p>
                </div>
              </div>
              <p className="mt-3 max-w-[58ch] text-sm leading-7 text-[color:var(--kw-muted)]">{lane.summary}</p>

              <div className={`${styles.milestoneList} mt-5`}>
                {lane.milestones.map((milestone, milestoneIndex) => {
                  const pill = statusPill(milestone.status);
                  return (
                    <article key={milestone.title} className={styles.milestone}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className={styles.milestoneIndex}>0{milestoneIndex + 1}</span>
                        <Pill tone={pill.tone}>{pill.label}</Pill>
                      </div>
                      <p className="mt-3 text-base font-semibold leading-7 tracking-tight text-[color:var(--kw-ink)]">
                        {milestone.title}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{milestone.detail}</p>
                      <div className={styles.milestoneFoot}>
                        <span className={styles.milestoneDot} />
                        <span>{lane.label === "Now" ? "Being tightened in the current cycle" : "Queued for a later shipping pass"}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
