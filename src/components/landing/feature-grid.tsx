"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  AudioLines,
  BookOpenText,
  CalendarDays,
  Link2,
  Map,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const FEATURES = [
  {
    title: "Plan that adapts",
    copy:
      "A daily plan that balances new memorization and review automatically. Miss a day? It shifts to protect what you've already memorized first.",
    icon: <CalendarDays size={18} />,
    pill: { label: "Plan", tone: "brand" as const },
  },
  {
    title: "Per-ayah grading",
    copy:
      "Grade every ayah individually — Again, Hard, Good, Easy. The system learns which ayahs need more repetition and which are solid.",
    icon: <Timer size={18} />,
    pill: { label: "SRS", tone: "accent" as const },
  },
  {
    title: "Transition training",
    copy:
      "Most forgetting happens between ayahs, not within them. Every session includes a link step so transitions become second nature early.",
    icon: <Link2 size={18} />,
    pill: { label: "Flow", tone: "warn" as const },
  },
  {
    title: "Progress you can navigate",
    copy:
      "See what is due, what is weak, what is improving, and where your plan is headed — all in one view, updated daily.",
    icon: <Map size={18} />,
    pill: { label: "Progress", tone: "neutral" as const },
  },
  {
    title: "Full Qur'an built in",
    copy:
      "Arabic text, English translation, and surah metadata are included from day one. No extra apps or downloads needed to start memorizing.",
    icon: <BookOpenText size={18} />,
    pill: { label: "Qur'an", tone: "brand" as const },
  },
  {
    title: "Audio on every ayah",
    copy:
      "Listen, repeat, and adjust speed — every ayah has a built-in player. Hear the correct recitation before and during your practice.",
    icon: <AudioLines size={18} />,
    pill: { label: "Audio", tone: "accent" as const },
  },
] as const;

export function FeatureGrid() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-10 md:py-14">
      <div className="grid gap-10 md:grid-cols-[1fr_1fr] md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            Designed for retention
          </p>
          <h2 className="mt-3 text-balance font-[family-name:var(--font-kw-display)] text-3xl leading-tight tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
            Practice is a system.
            <span className="block text-[rgba(var(--kw-accent-rgb),1)]">Not a sprint.</span>
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--kw-muted)]">
            Hifzer is built to make daily practice feel doable: small, clear steps that compound into
            long-term retention.
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Principle
              </p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--kw-ink)]">
                Every screen earns its place.
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">
                No clutter, no vanity stats. If something doesn&apos;t help you review or memorize better, it&apos;s not in the app.
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]">
              <ShieldCheck size={18} />
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              { label: "Clarity", value: "What is due and why" },
              { label: "Continuity", value: "Recovery when life happens" },
              { label: "Signal", value: "Per-ayah grades" },
              { label: "Flow", value: "Linking as a habit" },
            ].map((row) => (
              <div
                key={row.label}
                className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  {row.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">
                  {row.value}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {FEATURES.map((f, idx) => (
          <motion.div
            key={f.title}
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, delay: idx * 0.04 }}
          >
            <Card className="h-full">
              <div className="flex items-start justify-between gap-4">
                <Pill tone={f.pill.tone}>{f.pill.label}</Pill>
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                  {f.icon}
                </span>
              </div>
              <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {f.title}
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{f.copy}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
