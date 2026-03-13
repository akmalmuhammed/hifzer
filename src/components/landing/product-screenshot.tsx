"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpenText, HeartHandshake, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

const PRODUCT_OUTCOMES = [
  {
    label: "Separate lanes",
    value: "Qur'an and Hifz stay distinct",
    detail: "Reading progress and memorization progress do not overwrite one another.",
    icon: ShieldCheck,
  },
  {
    label: "Resume gently",
    value: "Return to the last ayah you touched",
    detail: "The app keeps your place ready instead of making you hunt for it again.",
    icon: BookOpenText,
  },
  {
    label: "Stay personal",
    value: "Private reading and personal duas stay yours",
    detail: "Tracked and untracked flows are clearly separated so the experience stays intentional.",
    icon: HeartHandshake,
  },
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
            Your return is never lost.
          </h2>
          <p className="mx-auto mt-3 max-w-[56ch] text-sm leading-7 text-[color:var(--kw-muted)]">
            Even when recitation feels difficult, your reward grows. Hifzer keeps your daily return
            visible, measurable, and steady.
            <span className="ml-2 inline-flex items-center rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2 py-0.5 align-middle text-[10px] font-semibold leading-none tracking-[0.08em] text-[color:var(--kw-faint)]">
              Sahih Muslim 798a
            </span>
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
              Why people stay with it
            </p>

            <div className="mt-3 grid gap-2">
              {PRODUCT_OUTCOMES.map((item) => {
                const Icon = item.icon;
                return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[color:var(--kw-border-2)] bg-white/75 px-3 py-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/80 text-[color:var(--kw-ink-2)]">
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                        {item.label}
                      </p>
                      <p className="mt-1 text-base font-semibold tracking-tight text-[color:var(--kw-ink)]">
                        {item.value}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[color:var(--kw-muted)]">{item.detail}</p>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.08)] p-3">
              <p className="text-sm font-semibold leading-6 text-[color:var(--kw-ink)]">
                Hearts find rest in the remembrance of Allah.
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">Qur&apos;an 13:28</p>
            </div>
          </Card>
        </div>
      </motion.div>
    </section>
  );
}
