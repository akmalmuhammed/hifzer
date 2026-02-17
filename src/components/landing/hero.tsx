"use client";

import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { ArrowRight, CalendarCheck2, Headphones, ShieldCheck, Sparkles } from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { WindLines } from "@/components/brand/wind-lines";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardKpi, CardSoft, CardTitle } from "@/components/ui/card";
import { DonutProgress } from "@/components/charts/donut-progress";
import { HeatStrip } from "@/components/charts/heat-strip";
import { KW_EASE_OUT } from "@/lib/motion";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  const reduceMotion = useReducedMotion();
  const streakDays = Array.from({ length: 28 }, (_, idx) => {
    const base = new Date();
    base.setDate(base.getDate() - (27 - idx));
    const values = [0.6, 0.9, 0.2, 0.8, 1, 0.7, 0.95, 0.4, 0.9, 0.85, 1, 0.2];
    const v = values[idx % values.length] ?? 0;
    return { date: base.toISOString(), value: Math.round(v * 10) };
  });

  return (
    <section className="relative overflow-hidden pb-10 pt-10 md:pb-16 md:pt-14">
      <div className="pointer-events-none absolute inset-x-0 -top-10 h-[360px] opacity-70">
        <WindLines className="opacity-60" />
      </div>

      <div className="grid items-center gap-10 md:grid-cols-[1.2fr_0.8fr]">
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
            A calm system for consistent hifz
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="mt-5 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl"
          >
            Keep what you memorize.
            <span className="block text-[rgba(var(--kw-accent-rgb),1)]">
              Without feeling rushed.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-xl text-pretty text-base leading-7 text-[color:var(--kw-muted)]"
          >
            Hifzer helps you practice with intention: a daily plan that balances new ayahs and
            review, and a simple per-ayah grade that becomes durable scheduling data.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center gap-3">
            <PublicAuthLink signedInHref="/today" signedOutHref="/login">
              <Button size="lg">
                Get started <ArrowRight size={18} />
              </Button>
            </PublicAuthLink>
            <PublicAuthLink signedInHref="/quran" signedOutHref="/quran-preview">
              <Button variant="secondary" size="lg">
                Browse Qur&apos;an
              </Button>
            </PublicAuthLink>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-9 grid gap-3 sm:grid-cols-3">
            {[
              { icon: <CalendarCheck2 size={16} />, label: "Daily plan", value: "Sabaq + review" },
              { icon: <ShieldCheck size={16} />, label: "SRS-ready", value: "Per-ayah grades" },
              { icon: <Headphones size={16} />, label: "Audio-first", value: "Repeat + speed" },
            ].map((stat) => (
              <CardSoft key={stat.label} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[color:var(--kw-ink)]">
                      {stat.value}
                    </p>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                    {stat.icon}
                  </span>
                </div>
              </CardSoft>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, ease: KW_EASE_OUT }}
          className="relative"
        >
          <div className="absolute -inset-6 -z-10 rounded-[32px] bg-[radial-gradient(closest-side,rgba(var(--kw-accent-rgb),0.18),transparent_68%)] blur-2xl" />
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[rgba(10,138,119,0.16)] blur-3xl kw-float" />
            <div className="pointer-events-none absolute -bottom-12 -left-10 h-56 w-56 rounded-full bg-[rgba(234,88,12,0.12)] blur-3xl kw-float" />

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
                    <DonutProgress value={0.82} size={44} />
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
                    { t: "Sabaq", c: "brand", title: "New", meta: "5 ayahs - linking on" },
                    { t: "Sabqi", c: "accent", title: "Recent review", meta: "12 due today" },
                    { t: "Manzil", c: "warn", title: "Long review", meta: "8 due this week" },
                  ].map((s) => (
                    <li
                      key={s.title}
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
                              : "border-[rgba(234,88,12,0.26)] bg-[rgba(234,88,12,0.12)] text-[color:var(--kw-ember-600)]",
                        )}
                      >
                        {s.t}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-[260px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(10,138,119,0.18),transparent_68%)] blur-3xl" />
    </section>
  );
}
