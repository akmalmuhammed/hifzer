"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, HeartHandshake } from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    note: "The full Hifz OS",
    highlight: false,
    bullets: [
      "Daily Sabaq plan + SRS engine",
      "Warm-up gate (blocks false progress)",
      "Sabqi + Manzil review tiers",
      "Transition tracking + link repair",
      "Per-ayah grading + audio player",
    ],
  },
  {
    name: "Paid",
    price: "$7",
    note: "Deeper insights + personalization",
    highlight: true,
    bullets: [
      "Weekly consolidation test",
      "Monthly health audit + rebalance",
      "Theme presets + accent options",
      "Extra reciters (coming soon)",
      "AI recitation scoring (coming soon)",
    ],
  },
] as const;

export function PricingTeaser() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            Pricing
          </p>
          <h2 className="mt-3 text-balance font-[family-name:var(--font-kw-display)] text-3xl leading-tight tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
            Free for the core.
            <span className="block text-[rgba(var(--kw-accent-rgb),1)]">Paid for personalization.</span>
          </h2>
        </div>
        <Link href="/pricing" className="text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline">
          View pricing <ArrowRight className="inline" size={16} />
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PLANS.map((p, idx) => (
          <motion.div
            key={p.name}
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, delay: idx * 0.05 }}
          >
            <Card className={p.highlight ? "relative overflow-hidden" : ""}>
              {p.highlight ? (
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(var(--kw-accent-rgb),0.2),transparent_68%)] blur-2xl" />
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{p.name}</p>
                  <p className="mt-1 text-xs text-[color:var(--kw-muted)]">{p.note}</p>
                </div>
                {p.highlight ? <Pill tone="accent">Popular</Pill> : <Pill tone="neutral">Core</Pill>}
              </div>

              <p className="mt-5 font-[family-name:var(--font-kw-display)] text-4xl tracking-tight text-[color:var(--kw-ink)]">
                {p.price}
                {p.name === "Paid" ? <span className="ml-2 text-sm font-semibold text-[color:var(--kw-muted)]">/ month</span> : null}
              </p>

              <ul className="mt-5 space-y-2 text-sm text-[color:var(--kw-muted)]">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                      <Check size={14} />
                    </span>
                    <span className="leading-6">{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                <PublicAuthLink signedInHref="/today" signedOutHref="/signup">
                  <Button variant={p.highlight ? "primary" : "secondary"} className="w-full">
                    Get started
                  </Button>
                </PublicAuthLink>
              </div>
            </Card>
          </motion.div>
        ))}

        <motion.div
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, delay: 0.1 }}
        >
          <Card className="h-full">
            <div className="flex items-start justify-between gap-4">
              <Pill tone="brand">Optional</Pill>
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                <HeartHandshake size={18} />
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
              Donation
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              If Hifzer helps you stay consistent, you can optionally support development with a one-time donation.
            </p>
            <div className="mt-7">
              <Link href="/pricing">
                <Button variant="secondary" className="w-full">
                  Donate
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
