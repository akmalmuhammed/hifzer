"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
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
  milestones: Milestone[];
};

const LANES: Lane[] = [
  {
    label: "Now",
    horizon: "Current build cycle",
    focus: "Reliability and quality foundation",
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
        detail: "Broaden Sentry and PostHog coverage across routing, session completion, and payment-critical flows.",
        status: "planned",
      },
    ],
  },
  {
    label: "Next",
    horizon: "Upcoming major release",
    focus: "AI recitation intelligence",
    milestones: [
      {
        title: "AI recitation correction",
        detail: "Detect pronunciation and sequence errors at ayah level with actionable correction prompts.",
        status: "planned",
      },
      {
        title: "Tajweed-aware detection",
        detail: "Introduce rule-sensitive feedback for stretch, stop, and articulation confidence markers.",
        status: "planned",
      },
      {
        title: "Teacher review overlays",
        detail: "Enable teacher-assist layers for flagged weak passages and recurring mistakes.",
        status: "planned",
      },
    ],
  },
  {
    label: "Later",
    horizon: "Platform expansion",
    focus: "Mobile and infrastructure scale",
    milestones: [
      {
        title: "Native iOS app",
        detail: "Focused daily workflow with offline recitation loops, queue sync, and push reminders.",
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
  const reduceMotion = useReducedMotion();
  const transition = {
    duration: reduceMotion ? 0 : 0.45,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Product"
        title="Roadmap"
        subtitle="A transparent build plan for where Hifzer is heading next."
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

      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
        transition={transition}
        className={`${styles.hero} px-5 py-5 sm:px-6`}
      >
        <div className={styles.orbA} />
        <div className={styles.orbB} />
        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="accent">Public roadmap</Pill>
              <Pill tone="neutral">Execution-first</Pill>
            </div>
            <h2 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
              Building a professional memorization operating system, step by step.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
              Priority is always retention integrity, then AI-assisted recitation quality, then platform scale.
              Every roadmap item is tied to better day-to-day outcomes, not vanity features.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <div className={`${styles.valueCard} flex items-center gap-3 px-3 py-2.5`}>
              <ShieldCheck size={16} className="text-[color:var(--kw-ink-2)]" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Quality</p>
                <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Retention-first gates</p>
              </div>
            </div>
            <div className={`${styles.valueCard} flex items-center gap-3 px-3 py-2.5`}>
              <Cpu size={16} className="text-[color:var(--kw-ink-2)]" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">AI</p>
                <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Recitation correction</p>
              </div>
            </div>
            <div className={`${styles.valueCard} flex items-center gap-3 px-3 py-2.5`}>
              <Rocket size={16} className="text-[color:var(--kw-ink-2)]" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Scale</p>
                <p className="text-sm font-semibold text-[color:var(--kw-ink)]">iOS, Android, infra</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 xl:grid-cols-3">
        {LANES.map((lane, laneIndex) => (
          <motion.div
            key={lane.label}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ ...transition, delay: laneIndex * 0.05 }}
          >
            <Card className={`${styles.lane} px-4 py-4`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Pill tone={laneIndex === 0 ? "accent" : "neutral"}>{lane.label}</Pill>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">{lane.horizon}</p>
                </div>
              </div>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{lane.focus}</p>

              <div className="mt-4 space-y-4">
                {lane.milestones.map((milestone) => {
                  const pill = statusPill(milestone.status);
                  return (
                    <div key={milestone.title} className={styles.milestone}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{milestone.title}</p>
                        <Pill tone={pill.tone}>{pill.label}</Pill>
                      </div>
                      <p className="mt-1.5 text-sm leading-7 text-[color:var(--kw-muted)]">{milestone.detail}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
