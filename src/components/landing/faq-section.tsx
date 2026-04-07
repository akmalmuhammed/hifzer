"use client";

import { useId, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

const FAQS = [
  {
    q: "Who is Hifzer for?",
    a: "For readers who want continuity and hifz students who need structure. It works for both, and the same app keeps reading, review, dua, and notes together.",
  },
  {
    q: "Why create an account?",
    a: "An account keeps your place, review, duas, and notes tied to you so the routine follows you across sessions and devices.",
  },
  {
    q: "What happens after signup?",
    a: "You land in the app with your current reading place, the dashboard, and the core tools ready so you can continue instead of setting everything up again.",
  },
  {
    q: "Why switch from another Qur'an app?",
    a: "Most apps help you read. Hifzer also keeps hifz review, dua, and private notes in the same flow, which is better when you want the practice to feel connected.",
  },
  {
    q: "Is Hifzer only for hifz students?",
    a: "No. It works for anyone building a daily Qur'an habit. Hifz students get the most structure, but readers, revisers, and people using dua and journaling can all use it well.",
  },
  {
    q: "Can I still use it with a teacher?",
    a: "Yes. Hifzer is for keeping your practice organized between lessons. Your teacher still guides recitation and tajweed.",
  },
  {
    q: "Are my notes and reflections private?",
    a: "Yes. Journal entries and private reflections stay in your own space and are not used like a social feed.",
  },
] as const;

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const buttonId = `${baseId}-button`;
  const panelId = `${baseId}-panel`;

  return (
    <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 shadow-[var(--kw-shadow-soft)]">
      <h3 className="m-0">
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-start justify-between gap-3 rounded-[22px] px-5 py-4 text-left transition hover:bg-white/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(var(--kw-accent-rgb),0.16)]"
        >
          <span className="text-sm font-semibold text-[color:var(--kw-ink)]">{q}</span>
          <span
            className={clsx(
              "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] transition-transform",
              open && "rotate-180",
            )}
          >
            <ChevronDown size={14} />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={reduceMotion ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
            className="overflow-hidden px-5 pb-4"
          >
            <p className="text-sm leading-7 text-[color:var(--kw-muted)]">{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
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
            Questions before you try it?
          </h2>
        </div>

        <div className="mt-8 space-y-3">
          {FAQS.map((faq, idx) => (
            <motion.div
              key={faq.q}
              initial={false}
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
