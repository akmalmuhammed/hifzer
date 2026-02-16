"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const ENTRIES = [
  {
    date: "2026-02-16",
    title: "Hifzer prototype pivot",
    body:
      "Rebranded the UI and started the Hifzer information architecture: public pages, legal sources, and Qur'an browser foundations.",
    tag: "Product",
    tone: "accent" as const,
  },
  {
    date: "2026-02-16",
    title: "Qur'an seed + surah index",
    body:
      "Bundled the 6,236-ayah seed locally (global ayah IDs) and generated a typed surah index from Tanzil metadata.",
    tag: "Data",
    tone: "brand" as const,
  },
  {
    date: "2026-02-16",
    title: "Audio player shell (R2-ready)",
    body:
      "Added per-ayah audio player UI with repeat and speed controls. Safe fallback when base URL is not configured.",
    tag: "Audio",
    tone: "warn" as const,
  },
] as const;

export default function ChangelogPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Pill tone="neutral">Changelog</Pill>
      <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
        What changed.
        <span className="block text-[rgba(var(--kw-accent-rgb),1)]">And why it matters.</span>
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--kw-muted)]">
        A lightweight log of visible prototype milestones.
      </p>

      <div className="mt-10 space-y-4">
        {ENTRIES.map((e, idx) => (
          <motion.div
            key={e.date}
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, delay: idx * 0.04 }}
          >
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    {e.date}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--kw-ink)]">{e.title}</p>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
                    {e.body}
                  </p>
                </div>
                <Pill tone={e.tone}>{e.tag}</Pill>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
