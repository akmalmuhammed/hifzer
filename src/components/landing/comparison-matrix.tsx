"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Minus } from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DisclosureCard } from "@/components/ui/disclosure-card";
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

const COLUMNS = [
  { key: "teacher", label: "Teacher-only" },
  { key: "generic", label: "Anki / Flashcards" },
  { key: "hifzer", label: "Hifzer" },
] as const;

function getCellLabel(value: boolean | "partial") {
  if (value === true) return "Included";
  if (value === "partial") return "Partial";
  return "Not included";
}

function CellIcon({ value }: { value: boolean | "partial" }) {
  if (value === true)
    return (
      <span
        aria-hidden="true"
        className="grid h-6 w-6 place-items-center rounded-full border border-[rgba(22,163,74,0.26)] bg-[rgba(22,163,74,0.10)] text-[color:var(--kw-lime-600)]"
      >
        <Check size={14} />
      </span>
    );
  if (value === "partial")
    return (
      <span
        aria-hidden="true"
        className="grid h-6 w-6 place-items-center rounded-full border border-[rgba(234,179,8,0.26)] bg-[rgba(234,179,8,0.10)] text-sm font-bold text-[color:var(--kw-ember-600)]"
      >
        ~
      </span>
    );
  return (
    <span
      aria-hidden="true"
      className="grid h-6 w-6 place-items-center rounded-full border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-faint)]"
    >
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
          Hifzer combines both and adds retention protection.
        </p>
      </div>

      <div className="mt-6 md:hidden">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
          Tap a feature to compare
        </p>
        <div className="mt-3 grid gap-3">
          {ROWS.map((row, idx) => (
            <DisclosureCard
              key={row.feature}
              defaultOpen={idx === 0}
              summaryClassName="rounded-[18px]"
              contentClassName="space-y-3"
              summary={
                <div className="pr-2">
                  <p className="text-base font-semibold tracking-tight text-[color:var(--kw-ink)]">
                    {row.feature}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-[color:var(--kw-faint)]">
                    Compare teacher-only, flashcards, and Hifzer at a glance.
                  </p>
                </div>
              }
            >
              {COLUMNS.map((column) => {
                const value = row[column.key];
                return (
                  <div
                    key={column.key}
                    className={[
                      "flex items-center justify-between gap-3 rounded-[18px] border px-3 py-3",
                      column.key === "hifzer"
                        ? "border-[rgba(var(--kw-accent-rgb),0.24)] bg-[rgba(var(--kw-accent-rgb),0.08)]"
                        : "border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)]",
                    ].join(" ")}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                        {column.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">
                        {getCellLabel(value)}
                      </p>
                    </div>
                    <CellIcon value={value} />
                  </div>
                );
              })}
            </DisclosureCard>
          ))}
        </div>
      </div>

      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: reduceMotion ? 0 : 0.45 }}
        className="mt-8 hidden md:block"
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
                      <span className="sr-only">{getCellLabel(row.teacher)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex justify-center">
                      <CellIcon value={row.generic} />
                      <span className="sr-only">{getCellLabel(row.generic)}</span>
                    </div>
                  </td>
                  <td className="py-3 pl-3 text-center">
                    <div className="flex justify-center">
                      <CellIcon value={row.hifzer} />
                      <span className="sr-only">{getCellLabel(row.hifzer)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </motion.div>

      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: reduceMotion ? 0 : 0.4 }}
        className="mt-10 flex flex-col items-center gap-3 text-center"
      >
        <p className="text-sm leading-7 text-[color:var(--kw-muted)]">
          Try the system that combines all three.
        </p>
        <Button asChild size="lg" className="gap-2">
          <PublicAuthLink signedInHref="/dashboard" signedOutHref="/signup">
            Get started free <ArrowRight size={16} />
          </PublicAuthLink>
        </Button>
      </motion.div>
    </section>
  );
}
