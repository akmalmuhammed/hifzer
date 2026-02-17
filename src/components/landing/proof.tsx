"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Gauge, Link2, RotateCcw } from "lucide-react";
import { CardSoft } from "@/components/ui/card";
import { Sparkline } from "@/components/charts/sparkline";

const SECTIONS = [
  {
    title: "Know exactly where you stand",
    copy:
      "After each ayah, you grade yourself: Again, Hard, Good, Easy. The system uses that to decide what you review next and when — no guesswork.",
    icon: <Gauge size={18} />,
    trend: [0.42, 0.5, 0.56, 0.6, 0.66, 0.7, 0.74],
    meta: "Grades drive your review schedule",
  },
  {
    title: "Smooth transitions from day one",
    copy:
      "Memorizing isn't just learning individual ayahs — it's connecting them. Every session includes a link step so you can recite seamlessly, not just piece by piece.",
    icon: <Link2 size={18} />,
    trend: [0.18, 0.22, 0.28, 0.33, 0.4, 0.48, 0.55],
    meta: "Connections strengthen with practice",
  },
  {
    title: "Miss a day? The plan adjusts",
    copy:
      "Life happens. After 1 missed day, reviews come first. After 2, new material pauses. After 3+, a structured catch-up kicks in until you're back on track.",
    icon: <RotateCcw size={18} />,
    trend: [0.9, 0.78, 0.66, 0.7, 0.76, 0.82, 0.88],
    meta: "Consistency over perfection",
  },
] as const;

export function Proof() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            Method
          </p>
          <h2 className="mt-3 max-w-2xl text-balance font-[family-name:var(--font-kw-display)] text-3xl leading-tight tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
            A practice system that respects your time.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-[color:var(--kw-muted)]">
          The goal is not intensity. It is continuity: new memorization that sticks, and review that
          stays small because it stays regular.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {SECTIONS.map((s, idx) => (
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
                    <Sparkline values={s.trend} tone={idx === 0 ? "accent" : idx === 1 ? "brand" : "warn"} />
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

