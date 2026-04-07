"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookOpenText, HandHeart, NotebookPen, RefreshCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type CompanionCard = {
  title: string;
  body: string;
  icon: LucideIcon;
  accentClass: string;
};

const FIT_REASONS = [
  "You keep losing your place between sessions",
  "You want hifz review to stop living in your head",
  "You want duas and private notes close to the Qur'an",
] as const;

const CARDS: CompanionCard[] = [
  {
    title: "Read from the exact ayah you left",
    body: "Resume where you stopped, keep bookmarks nearby, and move through the Qur'an without hunting for your place.",
    icon: BookOpenText,
    accentClass:
      "border-[rgba(var(--kw-accent-rgb),0.18)] bg-[radial-gradient(circle_at_top_left,rgba(var(--kw-accent-rgb),0.12),transparent_36%),linear-gradient(180deg,var(--kw-surface),var(--kw-surface-soft))]",
  },
  {
    title: "Keep hifz review visible every day",
    body: "Sabaq, recent review, and what needs attention stay in view so weak areas surface before they drift.",
    icon: RefreshCcw,
    accentClass:
      "border-[rgba(10,138,119,0.18)] bg-[radial-gradient(circle_at_top_right,rgba(10,138,119,0.12),transparent_36%),linear-gradient(180deg,var(--kw-surface),var(--kw-surface-soft))]",
  },
  {
    title: "Open your daily duas in the same routine",
    body: "Keep adhkar close when you need them, with Arabic, transliteration, and translation ready together.",
    icon: HandHeart,
    accentClass:
      "border-[rgba(234,88,12,0.18)] bg-[radial-gradient(circle_at_bottom_right,rgba(234,88,12,0.12),transparent_36%),linear-gradient(180deg,var(--kw-surface),var(--kw-surface-soft))]",
  },
  {
    title: "Save private reflections without another app",
    body: "Write notes next to the ayah or moment that mattered instead of scattering them across different tools.",
    icon: NotebookPen,
    accentClass:
      "border-[rgba(var(--kw-accent-rgb),0.16)] bg-[radial-gradient(circle_at_bottom_left,rgba(var(--kw-accent-rgb),0.12),transparent_36%),linear-gradient(180deg,var(--kw-surface),var(--kw-surface-soft))]",
  },
];

export function LandingFeatureRail() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-4 md:px-8 md:py-6">
      <div className="rounded-[34px] border border-[rgba(var(--kw-accent-rgb),0.12)] bg-[radial-gradient(circle_at_top_left,rgba(10,138,119,0.08),transparent_30%),radial-gradient(circle_at_top_right,rgba(var(--kw-accent-rgb),0.08),transparent_28%),linear-gradient(180deg,var(--kw-surface),var(--kw-surface-soft))] px-5 py-6 shadow-[var(--kw-shadow)] md:px-8 md:py-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--kw-faint)]">
            What Hifzer is
          </p>
          <h2 className="kw-marketing-display mt-3 text-balance text-3xl leading-tight text-[color:var(--kw-ink)] sm:text-4xl">
            A calm daily Qur&apos;an companion for reading, hifz review, duas, and private notes.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[color:var(--kw-muted)]">
            Hifzer is for the Muslim who wants one place to return to. Instead of splitting your
            routine across a Qur&apos;an app, adhkar list, notes app, and memory alone, Hifzer keeps
            the core parts together in one clear flow.
          </p>
        </div>

        <div className="mt-8 rounded-[30px] border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[radial-gradient(circle_at_top_left,rgba(var(--kw-accent-rgb),0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(10,138,119,0.10),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,255,255,0.72))] px-5 py-5 shadow-[var(--kw-shadow-soft)] sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(var(--kw-accent-rgb),1)]">
                Useful if
              </p>
              <h3 className="mt-2 text-balance text-2xl font-bold tracking-tight text-[color:var(--kw-ink)]">
                You want the routine to feel easier to return to.
              </h3>
              <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                Hifzer is most helpful when your practice already matters to you, but continuity
                keeps breaking because the key parts live in different places.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[23rem] lg:grid-cols-1">
              {FIT_REASONS.map((item) => (
                <div
                  key={item}
                  className="rounded-[18px] border border-[rgba(var(--kw-accent-rgb),0.14)] bg-white/80 px-4 py-3 text-sm font-semibold text-[color:var(--kw-ink)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CARDS.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.title}
                initial={false}
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
