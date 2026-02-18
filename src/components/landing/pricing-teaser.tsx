"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Moon } from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    note: "Everything you need to start",
    highlight: false,
    bullets: [
      "Guided daily session with new + review",
      "Adaptive schedule that protects retention",
      "Qur'an browsing and progress tracking",
    ],
    cta: "Start free",
    ctaHrefSignedIn: "/today",
    ctaHrefSignedOut: "/signup",
    next: "Next: create your account and run your first session.",
    footnote: null,
  },
  {
    name: "Pro",
    price: "$7",
    note: "For stronger consistency and coaching",
    highlight: true,
    bullets: [
      "Personalized insights for weaker ayahs and links",
      "Smarter pacing from your recent grade trends",
      "Accountability tools for long-term consistency",
    ],
    cta: "Claim free Pro access",
    ctaHrefSignedIn: "/today",
    ctaHrefSignedOut: "/signup",
    next: "Next: sign up and unlock Pro features during the Ramadan period.",
    footnote: "Theme and reciter extras are included as they roll out.",
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
            Simple plans.
            <span className="block text-[rgba(var(--kw-accent-rgb),1)]">Start free and upgrade later.</span>
          </h2>
        </div>
        <Link href="/pricing" className="text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline">
          View pricing <ArrowRight className="inline" size={16} />
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
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
                {p.highlight ? (
                  <span className="kw-ramadan-badge inline-flex items-center gap-1.5 rounded-full border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.10)] px-2.5 py-1 text-xs font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                    <Moon size={12} />
                    Ramadan Gift
                  </span>
                ) : (
                  <Pill tone="neutral">Core</Pill>
                )}
              </div>

                {p.name === "Pro" ? (
                  <div className="mt-5">
                    <div className="relative inline-block">
                    <span className="font-[family-name:var(--font-kw-display)] text-4xl tracking-tight text-[color:var(--kw-muted)]">
                      $7
                    </span>
                    <span className="ml-2 text-sm font-semibold text-[color:var(--kw-muted)]">
                      / month
                    </span>
                    {/* Animated strikethrough line */}
                    <span
                      className="kw-strike-line pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center"
                      aria-hidden="true"
                    >
                      <span className="h-[2px] w-full rounded-full bg-[rgba(var(--kw-accent-rgb),0.7)]" />
                    </span>
                  </div>
                  <div className="kw-price-reveal mt-2 flex items-baseline gap-2">
                    <span className="font-[family-name:var(--font-kw-display)] text-4xl tracking-tight text-[rgba(var(--kw-accent-rgb),1)]">
                      Free
                    </span>
                    <span className="text-xs font-semibold text-[color:var(--kw-muted)]">
                      for a limited time
                    </span>
                  </div>
                  </div>
                ) : (
                  <p className="mt-5 font-[family-name:var(--font-kw-display)] text-4xl tracking-tight text-[color:var(--kw-ink)]">
                    {p.price}
                  </p>
                )}

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
                <Button asChild variant={p.highlight ? "primary" : "secondary"} className="w-full">
                  <PublicAuthLink signedInHref={p.ctaHrefSignedIn} signedOutHref={p.ctaHrefSignedOut}>
                    {p.cta}
                  </PublicAuthLink>
                </Button>
                <p className="mt-2 text-xs text-[color:var(--kw-faint)]">{p.next}</p>
                {p.footnote ? (
                  <p className="mt-1 text-xs text-[color:var(--kw-faint)]">{p.footnote}</p>
                ) : null}
              </div>
            </Card>
          </motion.div>
        ))}

      </div>
    </section>
  );
}
