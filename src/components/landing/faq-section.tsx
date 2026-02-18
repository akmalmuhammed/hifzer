"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

const FAQS = [
  {
    q: "What is Hifzer?",
    a: "Hifzer is a Hifz Operating System - a daily, research-aligned workflow that helps you encode new ayahs correctly and retain them long-term. It is not only a Qur'an reader and not a generic flashcard app.",
  },
  {
    q: "How does the review system work?",
    a: "Each ayah has its own SRS schedule. Early checkpoints run at +4h -> +8h -> +24h, then long-term stations continue (1d -> 2d -> 4d -> 7d -> 14d -> 30d -> 90d). Your Again/Hard/Good/Easy grade moves the item forward or back.",
  },
  {
    q: "What makes Hifzer different from other Quran apps?",
    a: "Quality gates. Most apps let you sprint ahead and forget what is behind. Hifzer blocks new material until warm-up passes, runs weekly consolidation checks, and uses review-debt minutes to protect retention.",
  },
  {
    q: "Is it free?",
    a: "Core features are free, including the full daily loop, warm-up gate, Sabqi + Manzil review, per-ayah grading, and audio. Pro adds advanced features and is currently offered free for a limited Ramadan period.",
  },
  {
    q: "Can I use it with a teacher?",
    a: "Yes. Hifzer complements a teacher. Your teacher handles oral correction and tajweed depth; Hifzer handles scheduling, review debt, and daily structure.",
  },
  {
    q: "What happens if I miss days?",
    a: "The system adapts automatically. After 1 missed day it becomes review-first, after 2 it is review-only, and after 3+ it enters catch-up mode with new blocked until retention stabilizes.",
  },
] as const;

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="w-full rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-5 py-4 text-left shadow-[var(--kw-shadow-soft)] transition hover:bg-white/80"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{q}</p>
        <span
          className={clsx(
            "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] transition-transform",
            open && "rotate-180",
          )}
        >
          <ChevronDown size={14} />
        </span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
            className="overflow-hidden"
          >
            <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

export function FaqSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            FAQ
          </p>
          <h2 className="mt-3 text-balance font-[family-name:var(--font-kw-display)] text-3xl leading-tight tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
            Questions answered.
          </h2>
        </div>

        <div className="mt-8 space-y-3">
          {FAQS.map((faq, idx) => (
            <motion.div
              key={faq.q}
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: reduceMotion ? 0 : 0.35, delay: idx * 0.04 }}
            >
              <FaqItem q={faq.q} a={faq.a} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, delay: 0.2 }}
          className="mt-10 border-t border-[color:var(--kw-border-2)] pt-8"
        >
          <blockquote className="text-center">
            <p className="mx-auto max-w-lg text-sm leading-7 text-[color:var(--kw-muted)]">
              &ldquo;I memorized with a teacher but had no system for what came after. Without structured review,
              what I learned started slipping — and I had no way to know which ayahs were fading until they were already gone.
              Hifzer is the system I needed but didn&apos;t have.&rdquo;
            </p>
            <footer className="mt-4 text-xs font-semibold text-[color:var(--kw-faint)]">
              - Akmal, founder
            </footer>
          </blockquote>
        </motion.div>
      </div>
    </section>
  );
}
