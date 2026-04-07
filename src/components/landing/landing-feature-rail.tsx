"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookOpenText, HandHeart, NotebookPen } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type CompanionCard = {
  title: string;
  body: string;
  icon: LucideIcon;
  accentClass: string;
};

const CARDS: CompanionCard[] = [
  {
    title: "Return to the exact ayah",
    body: "Resume where you stopped, keep bookmarks nearby, and move through the Qur'an without hunting for your place.",
    icon: BookOpenText,
    accentClass:
      "border-[rgba(var(--kw-accent-rgb),0.18)] bg-[radial-gradient(circle_at_top_left,rgba(var(--kw-accent-rgb),0.12),transparent_36%),linear-gradient(180deg,var(--kw-surface),var(--kw-surface-soft))]",
  },
  {
    title: "Keep review from quietly slipping",
    body: "Review stays visible inside the same flow, so the parts that need attention come forward before they drift.",
    icon: NotebookPen,
    accentClass:
      "border-[rgba(10,138,119,0.18)] bg-[radial-gradient(circle_at_top_right,rgba(10,138,119,0.12),transparent_36%),linear-gradient(180deg,var(--kw-surface),var(--kw-surface-soft))]",
  },
  {
    title: "Keep duas and notes nearby",
    body: "Open your adhkar, write private reflections, and save what matters without leaving the rest of your practice.",
    icon: HandHeart,
    accentClass:
      "border-[rgba(234,88,12,0.18)] bg-[radial-gradient(circle_at_bottom_right,rgba(234,88,12,0.12),transparent_36%),linear-gradient(180deg,var(--kw-surface),var(--kw-surface-soft))]",
  },
];

export function LandingFeatureRail() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-4 md:px-8 md:py-6">
      <div className="rounded-[34px] border border-[rgba(var(--kw-accent-rgb),0.12)] bg-[radial-gradient(circle_at_top_left,rgba(10,138,119,0.08),transparent_30%),radial-gradient(circle_at_top_right,rgba(var(--kw-accent-rgb),0.08),transparent_28%),linear-gradient(180deg,var(--kw-surface),var(--kw-surface-soft))] px-5 py-6 shadow-[var(--kw-shadow)] md:px-8 md:py-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--kw-faint)]">
            What stays together
          </p>
          <h2 className="kw-marketing-display mt-3 text-balance text-3xl leading-tight text-[color:var(--kw-ink)] sm:text-4xl">
            The routine makes more sense when it lives in one place.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[color:var(--kw-muted)]">
            Hifzer keeps the pieces people usually split across multiple tools together: your
            reading place, your review, your duas, and your private notes.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {CARDS.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.title}
                initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: reduceMotion ? 0 : 0.35, delay: index * 0.05 }}
                className={[
                  "flex h-full flex-col overflow-hidden rounded-[28px] border px-5 py-5 shadow-[var(--kw-shadow-soft)] backdrop-blur-xl",
                  card.accentClass,
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] text-[rgba(var(--kw-accent-rgb),1)] shadow-[var(--kw-shadow-soft)]">
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[color:var(--kw-faint)]">
                    Hifzer
                  </span>
                </div>

                <p className="mt-5 text-xl font-bold tracking-tight text-[color:var(--kw-ink)]">
                  {card.title}
                </p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{card.body}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
