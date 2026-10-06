"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Minus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DisclosureCard } from "@/components/ui/disclosure-card";
import { Pill } from "@/components/ui/pill";

const ROWS = [
  { feature: "Spaced repetition (SRS)", teacher: false, generic: true, hifzer: true },
  { feature: "Sabaq / Sabqi / Manzil tiers", teacher: true, generic: false, hifzer: true },
  { feature: "Protects review from piling up", teacher: false, generic: false, hifzer: true },
  { feature: "Memory checks before moving ahead", teacher: false, generic: false, hifzer: true },
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
        className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--kw-pill-success-bg)] text-[color:var(--kw-lime-600)]"
      >
        <Check size={14} />
      </span>
    );
  if (value === "partial")
    return (
      <span
        aria-hidden="true"
        className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--kw-pill-warn-bg)] text-sm font-semibold text-[color:var(--kw-ember-600)]"
      >
        ~
      </span>
    );
  return (
    <span
      aria-hidden="true"
      className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--kw-fill-strong)] text-[color:var(--kw-faint)]"
    >
      <Minus size={14} />
    </span>
  );
}

export function ComparisonMatrix() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="pt-20 text-left md:pt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[1.05rem] font-semibold tracking-[-0.014em] text-[rgba(var(--kw-accent-rgb),1)]">
            Compare
          </p>
          <h2 className="mt-2 max-w-2xl text-balance font-[family-name:var(--font-kw-display)] text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[color:var(--kw-ink)]">
            How Hifzer is different.
          </h2>
        </div>
        <p className="max-w-xl text-[1.06rem] leading-[1.5] text-[color:var(--kw-muted)]">
          Teachers remain essential for recitation and tajweed. Hifzer supports the work between lessons:
          reading continuity, structured hifz review, source-grounded understanding, and private reflection.
        </p>
      </div>

      <div className="mt-6 md:hidden">
        <p className="text-[0.84rem] font-semibold text-[color:var(--kw-faint)]">
          Tap a feature to compare
        </p>
        <div className="mt-3 grid gap-3">
          {ROWS.map((row, idx) => (
            <DisclosureCard
              key={row.feature}
              defaultOpen={idx === 0}
              className="rounded-[20px]! border-0! shadow-none!"
              summaryClassName="rounded-[18px]"
              contentClassName="space-y-3"
              summary={
                <div className="pr-2">
                  <p className="text-[1.06rem] font-semibold tracking-[-0.015em] text-[color:var(--kw-ink)]">
                    {row.feature}
                  </p>
                  <p className="mt-1 text-[0.84rem] leading-[1.45] text-[color:var(--kw-faint)]">
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
                      "flex items-center justify-between gap-3 rounded-[14px] px-4 py-3",
                      column.key === "hifzer"
                        ? "bg-[rgba(var(--kw-accent-rgb),0.1)]"
                        : "bg-[color:var(--kw-fill)]",
                    ].join(" ")}
                  >
                    <div className="min-w-0">
                      <p className="text-[0.84rem] font-semibold text-[color:var(--kw-faint)]">
                        {column.label}
                      </p>
                      <p className="mt-0.5 text-[0.98rem] font-medium text-[color:var(--kw-ink)]">
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
        className="mt-10 hidden md:block"
      >
        <Card className="overflow-x-auto rounded-[28px]! border-0! p-7! shadow-none! md:p-9!">
          <table className="w-full text-[0.98rem]">
            <thead>
              <tr className="border-b border-[color:var(--kw-border-2)]">
                <th className="pb-4 pr-4 text-left text-[0.84rem] font-semibold text-[color:var(--kw-faint)]">
                  Feature
                </th>
                <th className="px-3 pb-4 text-center text-[0.84rem] font-semibold text-[color:var(--kw-faint)]">
                  Teacher-only
                </th>
                <th className="px-3 pb-4 text-center text-[0.84rem] font-semibold text-[color:var(--kw-faint)]">
                  Anki / Flashcards
                </th>
                <th className="pb-4 pl-3 text-center">
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
                  <td className="py-4 pr-4 font-medium text-[color:var(--kw-ink)]">
                    {row.feature}
                  </td>
                  <td className="px-3 py-4 text-center">
                    <div className="flex justify-center">
                      <CellIcon value={row.teacher} />
                      <span className="sr-only">{getCellLabel(row.teacher)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <div className="flex justify-center">
                      <CellIcon value={row.generic} />
                      <span className="sr-only">{getCellLabel(row.generic)}</span>
                    </div>
                  </td>
                  <td className="py-4 pl-3 text-center">
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
        className="mt-16 flex flex-col items-center gap-4 text-center"
      >
        <p className="text-[1.15rem] leading-[1.45] tracking-[-0.012em] text-[color:var(--kw-muted)]">
          Try the system that combines all three.
        </p>
        <Button asChild size="lg" className="gap-2">
          <Link href="/signup" prefetch={false}>
            Get started free <ArrowRight size={16} />
          </Link>
        </Button>
      </motion.div>
    </section>
  );
}
