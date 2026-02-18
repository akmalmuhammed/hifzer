"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpenText, Eye, EyeOff, Headphones, Link2 } from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const TEACHING_LOOP = [
  {
    step: 1,
    label: "Listen",
    desc: "Hear the recitation with text visible. Set the baseline.",
    icon: <Headphones size={18} />,
    detail: "Text on",
  },
  {
    step: 2,
    label: "Guided recall",
    desc: "Recite along with the audio. Text still visible for support.",
    icon: <Eye size={18} />,
    detail: "Text on",
  },
  {
    step: 3,
    label: "Blind recall",
    desc: "Recite from memory. Text is hidden. This is where encoding happens.",
    icon: <EyeOff size={18} />,
    detail: "Text off",
  },
  {
    step: 4,
    label: "Link step",
    desc: "Recite previous ayah → current ayah as one chain. Transitions break first.",
    icon: <Link2 size={18} />,
    detail: "Transition",
  },
] as const;

const SESSION_FLOW = [
  { label: "Warm-up gate", meta: "Yesterday's Sabaq", tone: "brand" as const },
  { label: "Sabqi reviews", meta: "Recent fragile window", tone: "accent" as const },
  { label: "Manzil reviews", meta: "Long-term rotation", tone: "warn" as const },
  { label: "Link repairs", meta: "Weak transition edges", tone: "neutral" as const },
  { label: "New (Sabaq)", meta: "Today's new ayahs", tone: "brand" as const },
] as const;

export function SessionWalkthrough() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-10 md:py-14">
      <div className="grid gap-10 md:grid-cols-[1fr_1fr] md:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            How it works
          </p>
          <h2 className="mt-3 text-balance font-[family-name:var(--font-kw-display)] text-3xl leading-tight tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
            Every session is a system.
            <span className="block text-[rgba(var(--kw-accent-rgb),1)]">Not a random review.</span>
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--kw-muted)]">
            The engine builds your daily queue in a fixed order: warm-up first, then reviews by urgency,
            then new material. You grade each ayah (Again / Hard / Good / Easy) and the schedule updates itself.
          </p>

          <div className="mt-6 space-y-2">
            {SESSION_FLOW.map((item, idx) => (
              <motion.div
                key={item.label}
                initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: reduceMotion ? 0 : 0.35, delay: idx * 0.05 }}
                className="flex items-center gap-3 rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2.5 shadow-[var(--kw-shadow-soft)]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--kw-border-2)] bg-white/80 text-xs font-semibold text-[color:var(--kw-ink-2)]">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{item.label}</p>
                </div>
                <Pill tone={item.tone}>{item.meta}</Pill>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: reduceMotion ? 0 : 0.5 }}
        >
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[rgba(var(--kw-accent-rgb),0.12)] blur-3xl" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <Pill tone="accent">New ayah loop</Pill>
                <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                  The 3×3 teaching loop
                </p>
                <p className="mt-1 text-sm text-[color:var(--kw-muted)]">
                  For each new ayah, four steps that build encoding + linking
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                <BookOpenText size={18} />
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {TEACHING_LOOP.map((step, idx) => (
                <div
                  key={step.label}
                  className="flex items-start gap-3 rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/80 px-4 py-3"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.10)] text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                    {step.step}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{step.label}</p>
                      <span className="rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                        {step.detail}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--kw-muted)]">{step.desc}</p>
                  </div>
                  {idx < TEACHING_LOOP.length - 1 && (
                    <ArrowRight size={14} className="mt-1.5 shrink-0 text-[color:var(--kw-faint)]" />
                  )}
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-[color:var(--kw-faint)]">
              Why linking matters: most &quot;I forgot&quot; events happen at the transition between ayahs, not
              within them.
            </p>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: reduceMotion ? 0 : 0.4 }}
        className="mt-10 flex flex-col items-center gap-3 text-center"
      >
        <p className="text-sm leading-7 text-[color:var(--kw-muted)]">
          Ready to try it? Your first session takes 10 minutes.
        </p>
        <PublicAuthLink signedInHref="/session" signedOutHref="/signup">
          <Button size="lg" className="gap-2">
            Start your first session <ArrowRight size={16} />
          </Button>
        </PublicAuthLink>
      </motion.div>
    </section>
  );
}
