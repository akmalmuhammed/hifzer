"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarCheck2, RotateCcw, ShieldCheck } from "lucide-react";
import { CardSoft } from "@/components/ui/card";
import { Sparkline } from "@/components/charts/sparkline";

const OUTCOMES = [
  {
    title: "Retention protected",
    copy:
      "The app blocks false forward progress when recall is weak, so your memorization does not collapse behind you.",
    icon: <ShieldCheck size={18} />,
    trend: [0.4, 0.48, 0.56, 0.62, 0.7, 0.76, 0.82],
    meta: "New unlocks only after quality checks",
  },
  {
    title: "Daily plan generated",
    copy:
      "Open the app and the queue is already arranged for today: what to review now and what can wait.",
    icon: <CalendarCheck2 size={18} />,
    trend: [0.3, 0.35, 0.44, 0.52, 0.6, 0.68, 0.74],
    meta: "No guesswork on what to practice",
  },
  {
    title: "Missed days handled",
    copy:
      "If you miss days, the system shifts to recovery mode and gets you stable again without losing direction.",
    icon: <RotateCcw size={18} />,
    trend: [0.88, 0.74, 0.62, 0.69, 0.77, 0.83, 0.9],
    meta: "Recovery plan is built in",
  },
] as const;

export function Proof() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            Proof
          </p>
          <h2 className="mt-3 max-w-2xl text-balance font-[family-name:var(--font-kw-display)] text-3xl leading-tight tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
            Outcomes you feel in week one.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-[color:var(--kw-muted)]">
          This is not about doing more. It is about practicing the right things each day so retention
          stays intact.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {OUTCOMES.map((s, idx) => (
          <motion.div
            key={s.title}
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, delay: idx * 0.05 }}
          >
            <CardSoft className="h-full overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                    {s.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{s.copy}</p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                  {s.icon}
                </span>
              </div>

              <div className="mt-5 rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    {s.meta}
                  </p>
                  <div className="w-24">
                    <Sparkline values={s.trend} tone={idx === 1 ? "accent" : idx === 0 ? "brand" : "warn"} />
                  </div>
                </div>
              </div>
            </CardSoft>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
