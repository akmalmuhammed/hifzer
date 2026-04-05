"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";

const PROOF_STATS = [
  { label: "Practitioners", value: "2,400+" },
  { label: "Avg weekly sessions", value: "10.8" },
  { label: "Daily use countries", value: "40+" },
] as const;

export function ProductScreenshot() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-12 md:py-16">
      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto max-w-[860px] text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            In practice
          </p>
          <h2 className="kw-marketing-display mt-3 text-balance text-3xl leading-tight text-[color:var(--kw-ink)] sm:text-4xl">
            Your progress, visible{" "}
            <span className="text-[rgba(var(--kw-accent-rgb),1)]">every day.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-[52ch] text-sm leading-7 text-[color:var(--kw-muted)]">
            Every session updates your retention score. You always know what is due, what is
            weak, and what is holding steady.
          </p>
        </div>

        {/* Full-width screenshot — the product speaks for itself */}
        <div className="mt-8 overflow-hidden rounded-[20px] border border-[color:var(--kw-border-2)] shadow-[var(--kw-shadow)]">
          <Image
            src="/hifzer app 1.png"
            alt="Hifzer dashboard showing daily flow, retention scores, and review queue"
            width={1400}
            height={900}
            className="w-full"
            priority={false}
          />
        </div>

        {/* Stats row below screenshot, not crammed into a sidebar */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PROOF_STATS.map((item) => (
            <Card key={item.label}>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                {item.label}
              </p>
              <p className="mt-1.5 text-2xl font-[family-name:var(--font-kw-display)] tracking-tight text-[color:var(--kw-ink)]">
                {item.value}
              </p>
            </Card>
          ))}
        </div>

        {/* Qur'anic anchor — placed with intention, not as filler */}
        <div className="mt-4 rounded-[var(--kw-radius-xl)] border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.06)] px-5 py-4 text-center">
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
            Hearts find rest in the remembrance of Allah.
          </p>
          <p className="mt-1 text-xs text-[color:var(--kw-muted)]">Qur&apos;an 13:28</p>
        </div>
      </motion.div>
    </section>
  );
}
