"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

const FAQS = [
  {
    q: "What is Hifzer?",
    a: "Hifzer brings Hifz, Qur'an reading, dua, and private reflection into one place. It helps you keep up with review so memorisation does not quietly fade.",
  },
  {
    q: "How does the review system work?",
    a: "Ayahs that feel shaky come back sooner. Ayahs you know well appear less often. You do the recitation, and Hifzer handles the timing.",
  },
  {
    q: "What makes Hifzer different from other Qur'an apps?",
    a: "Most Qur'an apps help you track progress. Hifzer also helps protect it. It slows new memorisation when review is weak and keeps your routine focused on retention.",
  },
  {
    q: "Is it free?",
    a: "Yes. The core Hifz flow, Qur'an reading, guided duas, and journal are free.",
  },
  {
    q: "Can I use it alongside a teacher?",
    a: "Yes. Your teacher guides recitation and tajweed. Hifzer helps with routine, review, and consistency between lessons.",
  },
  {
    q: "What happens if I miss a few days?",
    a: "Hifzer adjusts for you. It brings review forward and reduces new memorisation until you are steady again.",
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
            Questions
          </p>
          <h2 className="kw-marketing-display mt-3 text-balance text-3xl leading-tight text-[color:var(--kw-ink)] sm:text-4xl">
            Good questions, honest answers.
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
              &ldquo;I memorised with a teacher, but I still needed structure between lessons. Hifzer is the system I wish I had earlier.&rdquo;
            </p>
            <footer className="mt-4 text-xs font-semibold text-[color:var(--kw-faint)]">
              Akmal, founder
            </footer>
          </blockquote>
        </motion.div>
      </div>
    </section>
  );
}
