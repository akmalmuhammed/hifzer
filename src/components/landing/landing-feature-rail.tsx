"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpenText, HandHeart, NotebookPen, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TrackedLink } from "@/components/telemetry/tracked-link";

type CompanionCard = {
  title: string;
  body: string;
  icon: LucideIcon;
  accentClass: string;
};

const CARDS: CompanionCard[] = [
  {
    title: "Ask for ayah insights without leaving the reader",
    body: "Open AI help for a quick explanation, tafsir-backed insights, and word notes right where you are reading.",
    icon: Sparkles,
    accentClass:
      "border-[rgba(var(--kw-accent-rgb),0.22)] bg-[radial-gradient(circle_at_top_left,rgba(var(--kw-accent-rgb),0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(10,138,119,0.10),transparent_40%),linear-gradient(180deg,var(--kw-surface),var(--kw-surface-soft))]",
  },
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

        <div className="mt-8 rounded-[30px] border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[radial-gradient(circle_at_top_left,rgba(var(--kw-accent-rgb),0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(10,138,119,0.10),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,255,255,0.72))] px-5 py-5 shadow-[var(--kw-shadow-soft)] sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(var(--kw-accent-rgb),1)]">
                AI insights
              </p>
              <h3 className="mt-2 text-balance text-2xl font-bold tracking-tight text-[color:var(--kw-ink)]">
                A helpful entry point when an ayah feels hard to unpack.
              </h3>
              <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                Instead of leaving the reader to search around, open AI insights for a quick
                explanation, tafsir-backed takeaways, and word notes for the ayah in front of you.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[23rem] lg:grid-cols-1">
              {[
                "Explanation insights",
                "Tafsir insights",
                "Word notes",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[18px] border border-[rgba(var(--kw-accent-rgb),0.14)] bg-white/80 px-4 py-3 text-sm font-semibold text-[color:var(--kw-ink)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <TrackedLink
            href="/quran-preview"
            telemetryName="landing.ai_highlight_preview_click"
            telemetryMeta={{ placement: "feature_rail_ai_highlight" }}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline"
          >
            Preview the reader experience <ArrowRight size={15} />
          </TrackedLink>
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
