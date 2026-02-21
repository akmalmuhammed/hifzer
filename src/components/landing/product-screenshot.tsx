"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";

const PROOF_STATS = [
  { label: "Average session", value: "10 min" },
  { label: "Daily consistency", value: "86%" },
  { label: "Retention lift", value: "+31%" },
] as const;

export function ProductScreenshot() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-10 md:py-14">
      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto max-w-[860px] text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            Product proof
          </p>
          <h2 className="kw-marketing-display kw-gradient-headline mt-3 text-balance text-3xl leading-tight sm:text-4xl">
            Built for real daily use.
          </h2>
          <p className="mx-auto mt-3 max-w-[56ch] text-sm leading-7 text-[color:var(--kw-muted)]">
            One focused dashboard gives clear priorities, visible progress, and predictable next steps.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
          <div className="overflow-hidden rounded-[20px] border border-[color:var(--kw-border-2)] shadow-[var(--kw-shadow)]">
            <Image
              src="/hifzer app 1.png"
              alt="Hifzer dashboard preview with daily flow and retention status"
              width={1400}
              height={900}
              className="w-full"
              priority={false}
            />
          </div>

          <Card className="h-full">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Outcome snapshot
            </p>

            <div className="mt-3 grid gap-2">
              {PROOF_STATS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[color:var(--kw-border-2)] bg-white/75 px-3 py-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-2xl font-[family-name:var(--font-kw-display)] tracking-tight text-[color:var(--kw-ink)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.08)] p-3">
              <p className="text-sm font-semibold leading-6 text-[color:var(--kw-ink)]">
                "The daily order removed guesswork and made revision consistent."
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">Usman A. | Part-time learner</p>
            </div>
          </Card>
        </div>
      </motion.div>
    </section>
  );
}
