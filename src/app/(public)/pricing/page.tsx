"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, HeartHandshake, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    note: "Build the habit",
    highlight: false,
    bullets: [
      "Daily plan and session flow",
      "Per-ayah grading (Again/Hard/Good/Easy)",
      "Standard theme + dark mode toggle",
      "Default reciter audio (when configured)",
    ],
  },
  {
    name: "Paid",
    price: "$7",
    note: "More personalization",
    highlight: true,
    bullets: [
      "Theme presets (Paper + future seasonal)",
      "Accent presets (more combinations)",
      "Extra reciters (selection and preview)",
      "Advanced progress views (coming soon)",
    ],
  },
] as const;

function isPaddleConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN);
}

export default function PricingPage() {
  const reduceMotion = useReducedMotion();
  const paddleReady = useMemo(() => isPaddleConfigured(), []);
  const [donation, setDonation] = useState("10");

  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Pill tone="neutral">Pricing</Pill>
          <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
            Two tiers.
            <span className="block text-[rgba(var(--kw-accent-rgb),1)]">No gimmicks.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
            Free keeps the core practice loop accessible. Paid unlocks personalization and deeper
            progress views. Billing is handled by Paddle.
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Link href="/welcome" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">
              Get started
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Sign in
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {PLANS.map((p, idx) => (
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
                {p.highlight ? <Pill tone="accent">Recommended</Pill> : <Pill tone="neutral">Core</Pill>}
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
                <Button variant={p.highlight ? "primary" : "secondary"} className="w-full" disabled={!paddleReady && p.name === "Paid"}>
                  {p.name === "Paid" ? (
                    <span className="inline-flex items-center gap-2">
                      {!paddleReady ? <Lock size={16} /> : null}
                      Upgrade with Paddle
                    </span>
                  ) : (
                    "Start free"
                  )}
                </Button>
                {!paddleReady && p.name === "Paid" ? (
                  <p className="mt-2 text-xs text-[color:var(--kw-faint)]">
                    Paddle is not configured yet. Set <code>NEXT_PUBLIC_PADDLE_CLIENT_TOKEN</code> to
                    enable checkout.
                  </p>
                ) : null}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-10">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Support the work</p>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
                If Hifzer helps you stay consistent, you can optionally make a one-time donation.
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
              <HeartHandshake size={18} />
            </span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Amount (USD)
              </p>
              <div className="mt-2 flex max-w-sm items-center gap-2">
                <Input
                  inputMode="decimal"
                  value={donation}
                  onChange={(e) => setDonation(e.target.value)}
                  placeholder="10"
                />
                <span className="text-sm font-semibold text-[color:var(--kw-muted)]">USD</span>
              </div>
              <p className="mt-2 text-xs text-[color:var(--kw-faint)]">
                Donation checkout will use Paddle once configured.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="lg" disabled={!paddleReady}>
                Donate
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Required legal links</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Payments are subject to our policies:
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <Link href="/legal/terms" className="font-semibold text-[rgba(31,54,217,1)] hover:underline">
              Terms of service
            </Link>
            <Link href="/legal/privacy" className="font-semibold text-[rgba(31,54,217,1)] hover:underline">
              Privacy policy
            </Link>
            <Link
              href="/legal/refund-policy"
              className="font-semibold text-[rgba(31,54,217,1)] hover:underline"
            >
              Refund policy
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
