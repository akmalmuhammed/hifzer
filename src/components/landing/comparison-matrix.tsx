"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const ROWS = [
  { feature: "Spaced repetition (SRS)", teacher: false, generic: true, hifzer: true },
  { feature: "Sabaq / Sabqi / Manzil tiers", teacher: true, generic: false, hifzer: true },
  { feature: "Review debt protection", teacher: false, generic: false, hifzer: true },
  { feature: "Quality gates (warm-up + weekly)", teacher: false, generic: false, hifzer: true },
  { feature: "Transition / link tracking", teacher: "partial", generic: false, hifzer: true },
  { feature: "Adapts to missed days", teacher: false, generic: false, hifzer: true },
  { feature: "Mode switching (auto)", teacher: false, generic: false, hifzer: true },
  { feature: "Works with a teacher", teacher: true, generic: false, hifzer: true },
  { feature: "Tajweed correction", teacher: true, generic: false, hifzer: false },
] as const;

function CellIcon({ value }: { value: boolean | "partial" }) {
  if (value === true)
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full border border-[rgba(22,163,74,0.26)] bg-[rgba(22,163,74,0.10)] text-[color:var(--kw-lime-600)]">
        <Check size={14} />
      </span>
    );
  if (value === "partial")
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full border border-[rgba(234,179,8,0.26)] bg-[rgba(234,179,8,0.10)] text-[color:var(--kw-ember-600)]">
        <Check size={14} />
      </span>
    );
  return (
    <span className="grid h-6 w-6 place-items-center rounded-full border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-faint)]">
      <Minus size={14} />
    </span>
  );
}

export function ComparisonMatrix() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            Compare
          </p>
          <h2 className="mt-3 max-w-2xl text-balance font-[family-name:var(--font-kw-display)] text-3xl leading-tight tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
            How Hifzer is different.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-[color:var(--kw-muted)]">
          Teacher-only methods rely on intuition. Flashcard apps ignore Hifz methodology.
          Hifzer combines both — and adds intelligent retention protection.
        </p>
      </div>

      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: reduceMotion ? 0 : 0.45 }}
        className="mt-8"
      >
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--kw-border-2)]">
                <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Feature
                </th>
                <th className="pb-3 px-3 text-center text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Teacher-only
                </th>
                <th className="pb-3 px-3 text-center text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Anki / Flashcards
                </th>
                <th className="pb-3 pl-3 text-center">
                  <Pill tone="accent">Hifzer</Pill>
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, idx) => (
                <tr
                  key={row.feature}
                  className={
                    idx < ROWS.length - 1 ? "border-b border-[color:var(--kw-border-2)]" : ""
                  }
                >
                  <td className="py-3 pr-4 font-semibold text-[color:var(--kw-ink)]">
                    {row.feature}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex justify-center">
                      <CellIcon value={row.teacher} />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex justify-center">
                      <CellIcon value={row.generic} />
                    </div>
                  </td>
                  <td className="py-3 pl-3 text-center">
                    <div className="flex justify-center">
                      <CellIcon value={row.hifzer} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </motion.div>
    </section>
  );
}
