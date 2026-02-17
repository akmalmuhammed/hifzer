"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Clock, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const GATES = [
  {
    title: "Warm-up gate",
    subtitle: "Yesterday's Sabaq must pass first",
    copy: "Before new ayahs unlock, you must recall yesterday's material. If your average grade is below GOOD, new memorization is blocked. This prevents building on a shaky foundation.",
    rule: "Pass: avg ≥ GOOD, AGAIN count ≤ 1",
    icon: <ShieldCheck size={18} />,
    pill: { label: "Daily", tone: "brand" as const },
  },
  {
    title: "Weekly consolidation test",
    subtitle: "Catch silent decay early",
    copy: "Once per week, the system tests 20 random ayahs from your Sabqi window. If your pass rate drops, the engine shifts to Consolidation mode — automatically, without guilt or decision fatigue.",
    rule: "20-ayah sample from last 14 days",
    icon: <Clock size={18} />,
    pill: { label: "Weekly", tone: "accent" as const },
  },
  {
    title: "Review debt engine",
    subtitle: "Minutes-based, not item count",
    copy: "Counting overdue items is not enough. Hifzer estimates the time cost of every due review, sums it against your daily budget, and shifts gears when debt grows — from Normal to Consolidation to Catch-up.",
    rule: "Consolidation at 25% debt ratio · Catch-up at 45%",
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
            Enforcement
          </p>
          <h2 className="mt-3 max-w-2xl text-balance font-[family-name:var(--font-kw-display)] text-3xl leading-tight tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
            Hifzer protects your progress.
            <span className="block text-[rgba(var(--kw-accent-rgb),1)]">Automatically.</span>
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-[color:var(--kw-muted)]">
          Other apps let you sprint ahead and forget everything behind you. Hifzer has built-in
          quality gates that block false progress and keep retention real.
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
              <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {g.title}
              </p>
              <p className="mt-1 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                {g.subtitle}
              </p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{g.copy}</p>

              <div className="mt-4 rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Rule
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
