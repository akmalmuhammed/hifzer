"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpenText, HeartHandshake, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import styles from "./landing.module.css";

const PRODUCT_OUTCOMES = [
  {
    label: "It remembers when you forget",
    value: "Your place, reciter, and next step stay warm.",
    detail: "Return to the ayah you left, the listening setup you trust, and the lane that needs you today.",
    icon: BookOpenText,
  },
  {
    label: "It waits when you disappear",
    value: "The app is built for ordinary lapses, not ideal weeks.",
    detail: "Missed days are handled with gentler structure so the return feels possible again.",
    icon: HeartHandshake,
  },
  {
    label: "It keeps trust visible",
    value: "Qur'an, Hifz, and dua stay in distinct lanes.",
    detail: "Private worship stays private and sourced guidance stays close when it matters.",
    icon: ShieldCheck,
  },
] as const;

export function ProductScreenshot() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="companion" className="py-10 md:py-14">
      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={`${styles.proofShell} px-5 py-6 sm:px-6 sm:py-7`}
      >
        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
              More than an app
            </p>
            <h2 className="kw-marketing-display mt-4 max-w-[14ch] text-balance text-4xl leading-[0.98] tracking-[-0.05em] text-[color:var(--kw-ink)] sm:text-5xl">
              More than a tool. A quiet companion for your return.
            </h2>
            <p className="mt-4 max-w-[60ch] text-sm leading-8 text-[color:var(--kw-muted)]">
              On the strong days, Hifzer gives structure. On the scattered days, it remembers what
              mattered last. We are just the tool. Allah is the Guide. The product should only make
              it easier to walk back toward what already calls your heart.
            </p>

            <div className="mt-6 grid gap-4">
              {PRODUCT_OUTCOMES.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.label} className={`${styles.outcomeCard} h-full px-4 py-4`}>
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] text-[color:var(--kw-ink-2)]">
                        <Icon size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                          {item.label}
                        </p>
                        <p className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                          {item.value}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">{item.detail}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}

              <Card className={`${styles.outcomeCard} px-4 py-4`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="brand">Built by Muslims</Pill>
                  <Pill tone="neutral">Trust before polish</Pill>
                </div>
                <p className="mt-4 text-lg font-semibold leading-7 text-[color:var(--kw-ink)]">
                  The page should feel like a bridge back, not another distraction on the way there.
                </p>
              </Card>
            </div>
          </div>

          <div className={`${styles.proofFrame} p-2 sm:p-3`}>
            <div className="relative overflow-hidden rounded-[24px] border border-[color:var(--kw-border)]">
              <Image
                src="/hifzer app 1.png"
                alt="Hifzer dashboard preview showing a calm daily flow across Qur'an reading, Hifz, and progress."
                width={1400}
                height={900}
                className="w-full"
                priority={false}
              />

              <div className={`${styles.proofBadge} left-3 top-3 px-3 py-2 text-xs font-semibold text-[color:var(--kw-ink)] sm:left-5 sm:top-5`}>
                Return to your last ayah
              </div>
              <div className={`${styles.proofBadge} right-3 top-16 px-3 py-2 text-xs font-semibold text-[color:var(--kw-ink)] sm:right-5 sm:top-5`}>
                Review comes before new
              </div>
              <div className={`${styles.proofBadge} bottom-3 left-3 px-3 py-2 text-xs font-semibold text-[color:var(--kw-ink)] sm:bottom-5 sm:left-5`}>
                Guided duas stay nearby
              </div>
            </div>
            <div className="mt-4 rounded-[24px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                A simple intention
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Let the interface disappear quickly, so your attention can stay with Qur&apos;an,
                review, and remembrance rather than with the app itself.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
