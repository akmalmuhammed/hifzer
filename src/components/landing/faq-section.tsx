"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

const FAQS = [
  {
    q: "What is Hifzer?",
    a: "Hifzer is your daily Islamic companion. It helps you memorise the Qur'an without forgetting, build a reading habit, make dua with intention and journal your spiritual growth. Not a reader. Not a flashcard app. A complete practice built around how the mind actually retains what it learns.",
  },
  {
    q: "How does the review system work?",
    a: "Every ayah you memorise gets its own review schedule. Miss a review and it comes back sooner. Get it right consistently and the gaps grow longer, from hours to days to weeks to months. The app decides when to surface each ayah. You just show up and grade yourself honestly.",
  },
  {
    q: "What makes Hifzer different from other Qur'an apps?",
    a: "Most apps let you keep adding new material even when you are forgetting what came before. Hifzer does not. It checks your retention before unlocking anything new, runs a weekly check on older material and adjusts your daily load automatically when something is slipping.",
  },
  {
    q: "Is it free?",
    a: "Yes, core features are completely free. You get the full daily Hifz loop, Qur'an reading tracker, guided duas and journal. Pro features are available and currently free during our early access period.",
  },
  {
    q: "Can I use it alongside a teacher?",
    a: "Absolutely. Many learners use Hifzer alongside a sheikh or teacher. Your teacher handles recitation quality, tajweed and oral feedback. Hifzer handles the scheduling, review structure and daily consistency.",
  },
  {
    q: "What happens if I miss a few days?",
    a: "The app adapts without you needing to do anything. Miss a day and it prioritises review over new material. Miss several days and it pauses new memorisation entirely until your existing material is stable again. No guilt, no manual resetting.",
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
              &ldquo;I memorised with a teacher but had no system for what came after. Without structured review,
              what I learned started slipping and I had no way to know which ayahs were fading until they were already gone.
              Hifzer is the system I needed but never had.&rdquo;
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
