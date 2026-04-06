"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookMarked, BookOpenText, MoonStar, NotebookPen } from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";

/* ─────────────────────────────────────────────────────────────────────────────
   Four product pillars — each with its own accent treatment.
   Colors are hardcoded per-pillar so Tailwind doesn't purge them.
   In dark mode the CSS variables automatically adjust to lighter values.
───────────────────────────────────────────────────────────────────────────── */
const PILLARS = [
  {
    id: "hifz",
    icon: BookMarked,
    label: "Hifz",
    headline: "Memorize, and actually keep it.",
    body: "SRS scheduling tuned to Sabaq, Sabqi, and Manzil — the same method a teacher uses. Quality gates block false progress. Your Hifz compounds session by session.",
    tags: ["Quality gates", "Per-ayah grading", "Adaptive scheduling"],
    // teal treatment
    cardBg: "bg-[rgba(10,138,119,0.06)] border-[rgba(10,138,119,0.18)]",
    iconBg: "bg-[rgba(10,138,119,0.14)] border-[rgba(10,138,119,0.28)] text-[color:var(--kw-teal-700)]",
    tagStyle: "border-[rgba(10,138,119,0.22)] bg-[rgba(10,138,119,0.08)] text-[color:var(--kw-teal-700)]",
    href: "/signup",
  },
  {
    id: "quran",
    icon: BookOpenText,
    label: "Qur'an",
    headline: "Every mode your day needs.",
    body: "Tracked reading, private anonymous windows, full listening mode with auto-advance, and khatmah rhythm for 30, 90, or 365-day cycles. Four ways to return to the Book.",
    tags: ["4 reading modes", "Audio on every ayah", "Khatmah tracking"],
    // cobalt treatment
    cardBg: "bg-[rgba(31,54,217,0.05)] border-[rgba(31,54,217,0.14)]",
    iconBg: "bg-[rgba(31,54,217,0.12)] border-[rgba(31,54,217,0.24)] text-[color:var(--kw-cobalt-700)]",
    tagStyle: "border-[rgba(31,54,217,0.2)] bg-[rgba(31,54,217,0.07)] text-[color:var(--kw-cobalt-700)]",
    href: "/signup",
  },
  {
    id: "dua",
    icon: MoonStar,
    label: "Dua & Dhikr",
    headline: "Guided practice, every day.",
    body: "Structured dua journeys for Laylat al-Qadr, morning and evening athkar. Add your own personal duas and carry them through every session with authentic sources.",
    tags: ["Guided journeys", "Laylat al-Qadr", "Personal duas"],
    // ember treatment
    cardBg: "bg-[rgba(194,65,12,0.05)] border-[rgba(194,65,12,0.14)]",
    iconBg: "bg-[rgba(194,65,12,0.12)] border-[rgba(194,65,12,0.24)] text-[color:var(--kw-ember-600)]",
    tagStyle: "border-[rgba(194,65,12,0.2)] bg-[rgba(194,65,12,0.07)] text-[color:var(--kw-ember-600)]",
    href: "/signup",
  },
  {
    id: "journal",
    icon: NotebookPen,
    label: "Journal",
    headline: "Reflect on what you practice.",
    body: "Capture thoughts after recitation, log what was difficult, track what resonates. A spiritual journal that turns daily practice into long-term growth.",
    tags: ["Session reflections", "Personal notes", "Spiritual growth"],
    // neutral treatment
    cardBg: "bg-[color:var(--kw-card)] border-[color:var(--kw-border)]",
    iconBg: "bg-[color:var(--kw-hover-strong)] border-[color:var(--kw-border-2)] text-[color:var(--kw-ink-2)]",
    tagStyle: "border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] text-[color:var(--kw-muted)]",
    href: "/signup",
  },
] as const;

export function FeaturePillars() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-12 md:py-16">
      {/* Section header */}
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--kw-faint)]">
          Everything in one place
        </p>
        <h2 className="kw-marketing-display mt-3 text-balance text-3xl leading-tight text-[color:var(--kw-ink)] sm:text-4xl">
          Hifz. Qur&apos;an.{" "}
          <span className="text-[rgba(var(--kw-accent-rgb),1)]">Dua. Progress.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-[48ch] text-sm leading-7 text-[color:var(--kw-muted)]">
          Not a feature list — a daily practice suite. Each pillar connects so your spiritual
          life grows as a whole, not in isolated sprints.
        </p>
      </div>

      {/* 2×2 bento grid — each cell has its own identity */}
      <div className="grid gap-4 md:grid-cols-2">
        {PILLARS.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <motion.div
              key={pillar.id}
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: reduceMotion ? 0 : 0.45, delay: idx * 0.06 }}
            >
              <PublicAuthLink
                signedInHref="/dashboard"
                signedOutHref={pillar.href}
                className={[
                  "group flex h-full flex-col rounded-[var(--kw-radius-xl)] border px-6 py-6 transition-all duration-200",
                  "hover:shadow-[var(--kw-shadow)] hover:-translate-y-[2px]",
                  pillar.cardBg,
                ].join(" ")}
              >
                {/* Icon + label row */}
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={[
                      "grid h-12 w-12 place-items-center rounded-2xl border",
                      pillar.iconBg,
                    ].join(" ")}
                  >
                    <Icon size={24} />
                  </span>
                  <span
                    className={[
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-none tracking-[0.05em]",
                      pillar.tagStyle,
                    ].join(" ")}
                  >
                    {pillar.label}
                  </span>
                </div>

                {/* Headline */}
                <p className="mt-5 text-xl font-semibold leading-snug tracking-tight text-[color:var(--kw-ink)]">
                  {pillar.headline}
                </p>

                {/* Body */}
                <p className="mt-2.5 text-sm leading-7 text-[color:var(--kw-muted)]">
                  {pillar.body}
                </p>

                {/* Feature tags */}
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {pillar.tags.map((tag) => (
                    <span
                      key={tag}
                      className={[
                        "rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
                        pillar.tagStyle,
                      ].join(" ")}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </PublicAuthLink>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

