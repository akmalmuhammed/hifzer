"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Clock3 } from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const TODAY_STEPS = [
  {
    step: 1,
    title: "Warm-up check",
    time: "30-60s",
    copy: "Quickly recite yesterday's new portion to confirm it is stable before moving on.",
  },
  {
    step: 2,
    title: "Review what's due",
    time: "5-15m",
    copy: "The app prioritizes due ayahs and weak links so review debt does not pile up.",
  },
  {
    step: 3,
    title: "New memorization (optional)",
    time: "2-8m",
    copy: "If gates are passed and time allows, add a small new chunk and lock it in cleanly.",
  },
] as const;

export function SessionWalkthrough() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-10 md:py-14">
      <div className="grid gap-8 md:grid-cols-2 md:items-stretch">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            What happens today
          </p>
          <h2 className="mt-3 text-balance font-[family-name:var(--font-kw-display)] text-3xl leading-tight tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
            A simple daily flow.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--kw-muted)]">
            No setup maze. No complicated decisions. Open the app and follow the next step.
          </p>

          <div className="mt-6 space-y-3">
            {TODAY_STEPS.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: reduceMotion ? 0 : 0.35, delay: idx * 0.05 }}
                className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3 shadow-[var(--kw-shadow-soft)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                      {item.step}. {item.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--kw-muted)]">{item.copy}</p>
                  </div>
                  <Pill tone="neutral">{item.time}</Pill>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reduceMotion ? 0 : 0.45 }}
        >
          <Card className="h-full">
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">First session target</p>
                  <p className="mt-1 text-sm text-[color:var(--kw-muted)]">
                    Most users complete this in around 10 minutes.
                  </p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                  <Clock3 size={18} />
                </span>
              </div>

              <div className="mt-5 rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                You focus on reciting and grading. Hifzer handles sequencing, spacing, and recovery logic
                in the background.
              </div>

              <div className="mt-6 md:mt-auto">
                <Button asChild size="lg" className="w-full gap-2">
                  <PublicAuthLink signedInHref="/session" signedOutHref="/signup">
                    Start your first session <ArrowRight size={16} />
                  </PublicAuthLink>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
