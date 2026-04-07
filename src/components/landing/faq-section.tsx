"use client";

import { useId, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

const FAQS = [
  {
    q: "Who is Hifzer for?",
    a: "For anyone who wants one place for Qur'an reading, review, guided duas, and private notes. If you memorise, the review side becomes even more useful.",
  },
  {
    q: "Do I need to be memorising to use it?",
    a: "No. You can use Hifzer for reading, adhkar, and private reflection on its own. Review is there when you want to revise or memorise seriously.",
  },
  {
    q: "What makes Hifzer different from other Qur'an apps?",
    a: "Most Qur'an apps help you read. Hifzer also keeps your place, your review, your duas, and your notes together so you do not rebuild the same routine across multiple tools.",
  },
  {
    q: "Can I use it with a teacher?",
    a: "Yes. A teacher still guides recitation and tajweed. Hifzer helps you stay organised between lessons and keep review visible.",
  },
  {
    q: "Are my notes and reflections private?",
    a: "Yes. Journal entries and private reflections stay in your own space. They are meant to support your practice, not turn it into a feed.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. It works in the browser first. Add it to your phone later only if you want quicker access.",
  },
  {
    q: "Is it free?",
    a: "Yes. Qur'an reading, review tools, guided duas, and the journal are free.",
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
            Questions before you start?
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
