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

export function ChangelogClient() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="mx-auto w-full max-w-[1160px] px-[1.4rem] pb-24 pt-14 text-center md:pb-32 md:pt-24">
      <Pill tone="neutral">Changelog</Pill>
      <h1 className="mx-auto mt-5 max-w-[56rem] text-balance font-[family-name:var(--font-kw-display)] text-[clamp(2.6rem,5.8vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-[color:var(--kw-ink)]">
        What changed.
        <span className="block text-[color:var(--kw-faint)]">And why it matters.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-[clamp(1.1rem,1.6vw,1.3rem)] leading-[1.42] tracking-[-0.014em] text-[color:var(--kw-muted)]">
        A lightweight log of visible prototype milestones.
      </p>

      <div className="mx-auto mt-14 max-w-[52rem] space-y-4 text-left">
        {ENTRIES.map((entry, index) => (
          <motion.div
            key={`${entry.date}-${entry.title}`}
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, delay: index * 0.04 }}
          >
            <Card className="rounded-[28px]! border-0! p-7! shadow-none! md:p-9!">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[0.84rem] font-semibold tabular-nums text-[color:var(--kw-faint)]">
                    {entry.date}
                  </p>
                  <p className="mt-2 text-[1.4rem] font-semibold leading-[1.15] tracking-[-0.022em] text-[color:var(--kw-ink)]">{entry.title}</p>
                  <p className="mt-2.5 max-w-2xl text-[1.02rem] leading-[1.55] text-[color:var(--kw-muted)]">
                    {entry.body}
                  </p>
                </div>
                <Pill tone={entry.tone}>{entry.tag}</Pill>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
