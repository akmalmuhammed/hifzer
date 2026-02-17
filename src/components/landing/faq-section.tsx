"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { Card } from "@/components/ui/card";

const FAQS = [
  {
    q: "What is Hifzer?",
    a: "Hifzer is a Hifz Operating System — a daily, research-aligned workflow that helps you encode new ayahs correctly and retain everything long-term. It's not a Quran reader and not a generic flashcard app. It's an enforcement system for Qur'an memorization.",
  },
  {
    q: "How does the review system work?",
    a: "Every ayah has its own SRS schedule. After learning, it goes through early checkpoints (+4h → +8h → +24h) and then long-term stations (1d → 2d → 4d → 7d → 14d → 30d → 90d). When you grade an ayah (Again / Hard / Good / Easy), it moves forward or back through the stations. The system also tracks review debt in minutes and automatically shifts between Normal, Consolidation, and Catch-up modes.",
  },
  {
    q: "What makes Hifzer different from other Quran apps?",
    a: "Quality gates. Most apps let you sprint ahead and forget everything behind you. Hifzer blocks new material until yesterday's Sabaq passes a warm-up test. It runs weekly consolidation checks. And it measures review debt in minutes, not just items — so when debt grows, new memorization automatically pauses until retention is stable.",
  },
  {
    q: "Is it free?",
    a: "The full Hifz OS is free — daily Sabaq plan, warm-up gate, Sabqi + Manzil review, transition tracking, per-ayah grading, and audio. The paid tier ($7/month) adds weekly consolidation tests, monthly health audits, extra themes, and upcoming features like AI recitation scoring.",
  },
  {
    q: "Can I use it with a teacher?",
    a: "Yes. Hifzer is designed to complement a teacher, not replace one. The assessment captures whether you have a teacher, and the system adapts. Your teacher handles tajweed and oral correction; Hifzer handles scheduling, review debt, and daily plan structure.",
  },
  {
    q: "What happens if I miss days?",
    a: "The system adapts automatically. After 1 missed day, it's review-first. After 2, it's review-only. After 3+, it enters a structured Catch-up mode with new material blocked until retention is stable. No guilt loops — the plan just adjusts.",
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
      </div>
    </section>
  );
}
