"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Lock, ShieldCheck } from "lucide-react";
import { PricingAuthCta } from "@/components/landing/pricing-auth-cta";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    note: "Build the habit",
    highlight: false,
    ramadan: false,
    bullets: [
      "Guided daily session with clear next steps",
      "Adaptive review scheduling to protect retention",
      "Arabic + English Qur'an browsing with progress tracking",
      "Per-ayah grading with built-in audio playback",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$7",
    note: "Free for a limited time",
    highlight: true,
    ramadan: true,
    bullets: [
      "Personalized insights on weak ayahs and transitions",
      "Smarter pacing tuned to your recent recall quality",
      "Accountability tools for consistent weekly momentum",
      "Theme and reciter extras as bundled additions",
    ],
  },
] as const;

function planAction(planKey: "free" | "pro", ramadan: boolean) {
  if (planKey === "free") {
    return {
      label: "Start free",
      signedInHref: "/today",
      signedOutHref: "/signup",
      note: "Next: create your account, complete onboarding, and start your first 10-minute session.",
      disabled: false,
      variant: "secondary" as const,
    };
  }

  if (ramadan) {
    return {
      label: "Claim free Pro access",
      signedInHref: "/today",
      signedOutHref: "/signup",
      note: "Next: sign up and unlock Pro features immediately during the Ramadan gift period.",
      disabled: false,
      variant: "primary" as const,
    };
  }

  return {
    label: "Free for all users",
    signedInHref: "/today",
    signedOutHref: "/signup",
    note: "Payments are currently paused. Pro features are available free during this period.",
    disabled: true,
    variant: "secondary" as const,
  };
}

export default function PricingPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Pill tone="neutral">Pricing</Pill>
          <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
            Choose your plan in under a minute.
            <span className="block text-[rgba(var(--kw-accent-rgb),1)]">Start free, upgrade when ready.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
            Free includes the full daily memorization loop. Pro adds deeper personalization and advanced progress views.
            Every action below has a clear next step.
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <PricingAuthCta />
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {PLANS.map((p, idx) => {
          const action = planAction(p.key, p.ramadan);

          return (
            <motion.div
              key={p.name}
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: reduceMotion ? 0 : 0.45, delay: idx * 0.05 }}
            >
              <Card className={p.highlight ? "relative overflow-hidden" : ""}>
                {p.highlight ? (
                  <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(var(--kw-accent-rgb),0.22),transparent_68%)] blur-2xl" />
                ) : null}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{p.name}</p>
                    <p className="mt-1 text-xs text-[color:var(--kw-muted)]">{p.note}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.ramadan ? <Pill tone="brand">Ramadan gift</Pill> : null}
                    {p.highlight ? <Pill tone="accent">Recommended</Pill> : <Pill tone="neutral">Core</Pill>}
                  </div>
                </div>

                <p className="mt-5 font-[family-name:var(--font-kw-display)] text-4xl tracking-tight text-[color:var(--kw-ink)]">
                  {p.ramadan ? (
                    <>
                      <span className="relative inline-block text-[color:var(--kw-faint)]">
                        {p.price}<span className="ml-1 text-sm font-semibold">/ month</span>
                        <span className="kw-strike-line absolute left-0 top-1/2 h-[2px] w-full origin-left bg-[color:var(--kw-ember-500)]" />
                      </span>
                      <span className="kw-price-reveal ml-3 text-2xl font-semibold text-[rgba(var(--kw-accent-rgb),1)]">Free</span>
                    </>
                  ) : (
                    p.price
                  )}
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
                  <Button asChild variant={action.variant} className="w-full" disabled={action.disabled}>
                    <PublicAuthLink signedInHref={action.signedInHref} signedOutHref={action.signedOutHref}>
                      {action.disabled ? (
                        <span className="inline-flex items-center gap-2">
                          <Lock size={16} />
                          {action.label}
                        </span>
                      ) : (
                        action.label
                      )}
                    </PublicAuthLink>
                  </Button>
                  <p className="mt-2 text-xs text-[color:var(--kw-faint)]">What happens next: {action.note}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Trust and reliability</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Account auth runs on Clerk, billing on Paddle, and runtime monitoring on Sentry. We keep legal,
                refund, and source attribution pages public and current.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone="neutral">Clerk auth</Pill>
            <Pill tone="neutral">Billing paused</Pill>
            <Pill tone="neutral">Sentry monitoring</Pill>
            <Link href="/roadmap" className="text-xs font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline">Public roadmap</Link>
            <Link href="/changelog" className="text-xs font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline">Changelog</Link>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Early user confidence notes</p>
          <div className="mt-3 space-y-3 text-sm leading-6 text-[color:var(--kw-muted)]">
            <p>
              &ldquo;The warm-up gate stopped me from pretending progress. I now know what to review before moving forward.&rdquo;
              <span className="block text-xs text-[color:var(--kw-faint)]">- Beta learner (self-paced)</span>
            </p>
            <p>
              &ldquo;The daily queue made my revision predictable again after I fell behind.&rdquo;
              <span className="block text-xs text-[color:var(--kw-faint)]">- Beta learner (with teacher)</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Donation block intentionally hidden while donations are paused. */}

      <div className="mt-8">
        <Card>
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Required legal links</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Payments are subject to our policies:
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <Link href="/legal/terms" className="font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline">
              Terms of service
            </Link>
            <Link href="/legal/privacy" className="font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline">
              Privacy policy
            </Link>
            <Link
              href="/legal/refund-policy"
              className="font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline"
            >
              Refund policy
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
