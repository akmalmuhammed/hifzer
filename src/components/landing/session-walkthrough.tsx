"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Clock3 } from "lucide-react";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const TODAY_STEPS = [
  {
    step: 1,
    title: "Resume the exact place you left",
    time: "30s",
    copy: "Continue from the ayah, lane, or module you last touched instead of rebuilding context.",
  },
  {
    step: 2,
    title: "Give attention where it is due",
    time: "5-15m",
    copy: "Read, review, or revise with clearer priorities so weak places do not quietly pile up.",
  },
  {
    step: 3,
    title: "Leave without losing your place",
    time: "1 tap",
    copy: "Close the app knowing tomorrow's return can begin from something real instead of from zero.",
  },
] as const;

export function SessionWalkthrough() {
  const reduceMotion = useReducedMotion();
  const { isSignedIn } = usePublicAuth();

  return (
    <section id="daily-flow" className="py-10 md:py-14">
      <div className="grid gap-8 md:grid-cols-2 md:items-stretch">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            What returning today can feel like
          </p>
          <h2 className="kw-marketing-display mt-3 text-balance text-3xl leading-tight tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
            Open Hifzer and the next step is already waiting.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--kw-muted)]">
            No setup maze. No blank dashboard. Just a gentler path back into recitation, review, and
            worship.
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
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Built for real days</p>
                  <p className="mt-1 text-sm text-[color:var(--kw-muted)]">
                    You do not need a perfect routine for the app to still feel useful.
                  </p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                  <Clock3 size={18} />
                </span>
              </div>

              <div className="mt-5 rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                Hifzer is designed for interrupted mornings, busy workdays, and tired evenings. It
                remembers enough for you to resume with less resistance and more presence.
              </div>

              <div className="mt-4 grid gap-2">
                {[
                  "Clear next step instead of decision fatigue",
                  "Honest progress instead of inflated streaks",
                  "Calmer return instead of rebuilding your place",
                ].map((line) => (
                  <div
                    key={line}
                    className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/72 px-3 py-2.5 text-sm text-[color:var(--kw-ink-2)]"
                  >
                    {line}
                  </div>
                ))}
              </div>

              <div className="mt-6 md:mt-auto">
                <Button asChild size="lg" className="w-full gap-2">
                  <PublicAuthLink signedInHref="/today" signedOutHref="/quran-preview">
                    {isSignedIn ? "Open today in app" : "Preview today's flow"} <ArrowRight size={16} />
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
