"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookOpenText, Quote } from "lucide-react";
import { CardSoft } from "@/components/ui/card";

const PRINCIPLES = [
  {
    quote: "Retrieval beats re-reading. Retention is built by reciting from memory, not by repeatedly looking at the text.",
    source: "Principle 1 — Active Recall",
    tone: "brand" as const,
  },
  {
    quote: "Review dominates new. Most daily time must go to reviewing previously learned material, otherwise forgetting wins.",
    source: "Principle 2 — Review Floor",
    tone: "accent" as const,
  },
  {
    quote: "When review debt grows, new memorization must slow down or stop. The system uses minutes-based debt, not item count.",
    source: "Principle 4 — Backlog Control",
    tone: "warn" as const,
  },
  {
    quote: "Most 'I forgot' events occur at the seams — from one ayah to the next. Transitions are trained as explicit steps.",
    source: "Principle 5 — Linking",
    tone: "brand" as const,
  },
] as const;

export function SocialProof() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            Methodology
          </p>
          <h2 className="mt-3 max-w-2xl text-balance font-[family-name:var(--font-kw-display)] text-3xl leading-tight tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
            Built on Hifz tradition.
            <span className="block text-[rgba(var(--kw-accent-rgb),1)]">Verified by memory science.</span>
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-[color:var(--kw-muted)]">
          Traditional Hifz methodology (Sabaq / Sabqi / Manzil) and modern memory science converge on the
          same fundamentals. Hifzer encodes both into its engine.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {PRINCIPLES.map((p, idx) => (
          <motion.div
            key={p.source}
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, delay: idx * 0.05 }}
          >
            <CardSoft className="h-full">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                  <Quote size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-7 text-[color:var(--kw-ink)]">
                    &ldquo;{p.quote}&rdquo;
                  </p>
                  <p className="mt-2 text-xs font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                    {p.source}
                  </p>
                </div>
              </div>
            </CardSoft>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-[color:var(--kw-faint)]">
        <BookOpenText size={14} />
        <span>Based on the Hifz OS Core System — a shareable spec for research-aligned Qur&apos;an memorization.</span>
      </div>
    </section>
  );
}
