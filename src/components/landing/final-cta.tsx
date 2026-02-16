"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export function FinalCta() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="py-10 md:py-14">
      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: reduceMotion ? 0 : 0.5 }}
      >
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(10,138,119,0.18),transparent_68%)] blur-2xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(var(--kw-accent-rgb),0.16),transparent_68%)] blur-2xl" />

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <Pill tone="brand">Start today</Pill>
              <h3 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-3xl leading-tight tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
                A plan you can keep.
                <span className="block text-[rgba(var(--kw-accent-rgb),1)]">A review queue you can trust.</span>
              </h3>
              <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                Choose your starting point. Practice with audio and a simple grade per ayah. Let the
                schedule handle the rest.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto">
              <Link href="/welcome">
                <Button size="lg" className="w-full sm:w-auto">
                  Get started <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  See pricing
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-2 md:grid-cols-3">
            {[
              { k: "Simple grading", v: "Again / Hard / Good / Easy" },
              { k: "Recovery protocol", v: "Adjusts after missed days" },
              { k: "Audio everywhere", v: "Repeat + speed controls" },
            ].map((row) => (
              <div
                key={row.k}
                className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  {row.k}
                </p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">{row.v}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </section>
  );
}
