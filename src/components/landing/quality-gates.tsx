"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Clock, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const GATES = [
  {
    title: "Warm-up gate",
    subtitle: "Yesterday's Sabaq must pass first",
    copy: "Every session starts with a quick recall of what you learned yesterday. If you can reproduce it cleanly, the session unlocks. If not, you review first. No new material gets added onto a shaky foundation.",
    rule: "Runs before every session",
    icon: <ShieldCheck size={18} />,
    pill: { label: "Daily", tone: "brand" as const },
  },
  {
    title: "Weekly check",
    subtitle: "Catch silent forgetting early",
    copy: "Once a week the app quietly tests a sample of older material. If retention has dropped, it automatically shifts focus to consolidation without you needing to notice or decide anything.",
    rule: "Runs once per week, automatically",
    icon: <Clock size={18} />,
    pill: { label: "Weekly", tone: "accent" as const },
  },
  {
    title: "Review load balancing",
    subtitle: "Adjusts when you fall behind",
    copy: "When overdue reviews build up beyond what a session can handle, the app scales back new memorisation and prioritises clearing the backlog first. It shifts gears so you never dig a hole you cannot climb out of.",
    rule: "Adjusts your daily load automatically",
    icon: <AlertTriangle size={18} />,
    pill: { label: "Automatic", tone: "warn" as const },
  },
] as const;

export function QualityGates() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            How it protects you
          </p>
          <h2 className="kw-marketing-display mt-3 max-w-2xl text-balance text-3xl leading-tight text-[color:var(--kw-ink)] sm:text-4xl">
            Built to protect your progress.
            <span className="block text-[rgba(var(--kw-accent-rgb),1)]">Not just track it.</span>
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-[color:var(--kw-muted)]">
          Most apps let you sprint ahead while forgetting what is behind you. Hifzer has built-in checkpoints
          that block false progress and keep what you have learned real.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {GATES.map((g, idx) => (
          <motion.div
            key={g.title}
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, delay: idx * 0.05 }}
          >
            <Card className="h-full">
              <div className="flex items-start justify-between gap-4">
                <Pill tone={g.pill.tone}>{g.pill.label}</Pill>
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                  {g.icon}
                </span>
              </div>
              <p className="mt-3 text-lg font-bold tracking-tight text-[color:var(--kw-ink)]">
                {g.title}
              </p>
              <p className="mt-1 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                {g.subtitle}
              </p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{g.copy}</p>

              <div className="mt-4 rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  When
                </p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">{g.rule}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
