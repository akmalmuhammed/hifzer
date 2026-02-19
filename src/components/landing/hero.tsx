"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { WindLines } from "@/components/brand/wind-lines";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardKpi, CardTitle } from "@/components/ui/card";
import { DonutProgress } from "@/components/charts/donut-progress";
import { HeatStrip } from "@/components/charts/heat-strip";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const HERO_BULLETS = [
  "10-minute guided sessions",
  "Adaptive review timing",
] as const;

const QUICK_PROOF = [
  "2,300+ weekly active learners",
  "Average 81% retention consistency",
  "No card required to start",
] as const;

export function Hero() {
  const reduceMotion = useReducedMotion();
  const [donutReady, setDonutReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDonutReady(true), 600);
    return () => clearTimeout(id);
  }, []);

  const streakDays = Array.from({ length: 28 }, (_, idx) => {
    const base = new Date();
    base.setDate(base.getDate() - (27 - idx));
    const values = [0.6, 0.9, 0.2, 0.8, 1, 0.7, 0.95, 0.4, 0.9, 0.85, 1, 0.2];
    const v = values[idx % values.length] ?? 0;
    return { date: base.toISOString(), value: Math.round(v * 10) };
  });

  return (
    <section className="relative overflow-hidden pb-10 pt-10 md:pb-16 md:pt-14">
      <div className="pointer-events-none absolute inset-x-0 -top-10 h-[360px] overflow-visible opacity-95">
        <WindLines className="opacity-90" animated />
      </div>

      <div className="grid items-center gap-10 md:grid-cols-[1.25fr_0.75fr]">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        >
          <motion.p
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--kw-accent-rgb),0.18)] bg-white/60 px-3 py-1 text-xs font-semibold text-[rgba(var(--kw-accent-rgb),1)] shadow-[var(--kw-shadow-soft)] backdrop-blur"
          >
            <Sparkles size={14} />
            For students and busy professionals preserving Qur&apos;an memorization
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="mt-5 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl"
          >
            Never lose what you memorized.
            <span className="block text-[rgba(var(--kw-accent-rgb),1)]">
              Build stable Qur&apos;an retention in 10 focused minutes a day.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-xl text-pretty text-base leading-7 text-[color:var(--kw-muted)]"
          >
            Hifzer gives you one clear daily plan: review first, then new ayahs only when recall quality is
            strong. This keeps progress real and prevents silent decay.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-5 grid max-w-xl gap-2 sm:grid-cols-2">
            {HERO_BULLETS.map((tab) => (
              <span
                key={tab}
                className="rounded-2xl border border-[color:var(--kw-border-2)] bg-white/75 px-3 py-2 text-center text-xs font-semibold text-[color:var(--kw-ink-2)]"
              >
                {tab}
              </span>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <PublicAuthLink signedInHref="/today" signedOutHref="/signup">
                Start your first session <ArrowRight size={18} />
              </PublicAuthLink>
            </Button>
            <PublicAuthLink
              signedInHref="/pricing"
              signedOutHref="/pricing"
              className="text-sm font-medium text-[color:var(--kw-muted)] underline-offset-2 hover:text-[color:var(--kw-ink)] hover:underline"
            >
              View pricing
            </PublicAuthLink>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[color:var(--kw-faint)]">
            {QUICK_PROOF.map((line) => (
              <span key={line} className="rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2.5 py-1">
                {line}
              </span>
            ))}
            <Link href="/legal/terms" className="font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline">
              Terms + privacy
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-5 max-w-xl rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.08)] p-3"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-[color:var(--kw-ink)]">
              <Star size={14} className="text-[rgba(var(--kw-accent-rgb),1)]" />
              &ldquo;The daily flow removed guesswork and fixed my revision consistency in two weeks.&rdquo;
            </p>
            <p className="mt-1 text-xs text-[color:var(--kw-muted)]">Usman A. • Part-time learner</p>
          </motion.div>
        </motion.div>

        <div className="relative md:translate-y-2">
          <div className="absolute -inset-6 -z-10 rounded-[32px] bg-[radial-gradient(closest-side,rgba(var(--kw-accent-rgb),0.1),transparent_68%)] blur-2xl" />
          <Card className="relative overflow-hidden border border-[color:var(--kw-border-2)] bg-white/85 shadow-[var(--kw-shadow-soft)]">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[rgba(10,138,119,0.1)] blur-3xl kw-float" />
            <div className="pointer-events-none absolute -bottom-12 -left-10 h-56 w-56 rounded-full bg-[rgba(234,88,12,0.08)] blur-3xl kw-float" />

            <CardHeader>
              <div>
                <CardTitle>Today&apos;s plan</CardTitle>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  Balanced practice - 18 minutes
                </p>
              </div>
              <span className="rounded-full border border-[rgba(10,138,119,0.26)] bg-[rgba(10,138,119,0.10)] px-2.5 py-1 text-xs font-semibold text-[color:var(--kw-teal-800)]">
                Ready
              </span>
            </CardHeader>

            <div className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    Retention
                  </p>
                  <CardKpi>
                    <p className="font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)]">
                      82%
                    </p>
                    <DonutProgress
                      value={donutReady ? 0.82 : 0}
                      size={44}
                      className="kw-donut-animate"
                    />
                  </CardKpi>
                </div>
                <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    Streak
                  </p>
                  <CardKpi>
                    <p className="font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)]">
                      9
                    </p>
                    <div className="w-28">
                      <HeatStrip
                        days={streakDays}
                        tone="brand"
                        ariaLabel="Practice streak"
                        animate
                      />
                    </div>
                  </CardKpi>
                </div>
              </div>

              <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Flow
                </p>
                <ul className="mt-2 space-y-2 text-sm">
                  {[
                    { t: "New", c: "brand", title: "New memorization", meta: "Small guided ayah set" },
                    { t: "Recent", c: "accent", title: "Recent review", meta: "Due first in every session" },
                    { t: "Long-term", c: "warn", title: "Long-term review", meta: "Rotating retention queue" },
                    { t: "Repair", c: "neutral", title: "Weak links", meta: "Fix transition trouble spots" },
                  ].map((s, i) => (
                    <motion.li
                      key={s.title}
                      initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : 1.2 + i * 0.15 }}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-[color:var(--kw-border-2)] bg-white/80 px-3 py-2"
                    >
                      <div>
                        <p className="font-semibold text-[color:var(--kw-ink)]">{s.title}</p>
                        <p className="mt-0.5 text-xs text-[color:var(--kw-muted)]">{s.meta}</p>
                      </div>
                      <span
                        className={clsx(
                          "shrink-0 rounded-full border px-2 py-1 text-xs font-semibold",
                          s.c === "brand"
                            ? "border-[rgba(10,138,119,0.26)] bg-[rgba(10,138,119,0.12)] text-[color:var(--kw-teal-800)]"
                            : s.c === "accent"
                              ? "border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
                              : s.c === "warn"
                                ? "border-[rgba(234,88,12,0.26)] bg-[rgba(234,88,12,0.12)] text-[color:var(--kw-ember-600)]"
                                : "border-[color:var(--kw-border-2)] bg-white/75 text-[color:var(--kw-ink-2)]",
                        )}
                      >
                        {s.t}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-[260px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(10,138,119,0.18),transparent_68%)] blur-3xl" />
    </section>
  );
}
