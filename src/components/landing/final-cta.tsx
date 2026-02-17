"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="py-10 md:py-14">
      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: reduceMotion ? 0 : 0.5 }}
        className="relative overflow-hidden rounded-[28px] border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[radial-gradient(ellipse_at_top,rgba(var(--kw-accent-rgb),0.10)_0%,transparent_60%)] px-6 py-16 text-center md:px-12 md:py-20"
      >
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(10,138,119,0.16),transparent_68%)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(var(--kw-accent-rgb),0.12),transparent_68%)] blur-3xl" />

        <div className="relative mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgba(var(--kw-accent-rgb),1)]">
            Your Hifz deserves a system
          </p>
          <h3 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-4xl leading-[1.05] tracking-tight text-[color:var(--kw-ink)] sm:text-5xl">
            Everything you&apos;ve memorized
            <span className="block text-[rgba(var(--kw-accent-rgb),1)]">can still be lost.</span>
          </h3>
          <p className="mx-auto mt-5 max-w-md text-base leading-7 text-[color:var(--kw-muted)]">
            Without daily review, retention silently erodes. Hifzer enforces the schedule that keeps
            it solid — automatically, every day.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <PublicAuthLink signedInHref="/today" signedOutHref="/signup">
              <Button size="lg">
                Start protecting your Hifz <ArrowRight size={18} />
              </Button>
            </PublicAuthLink>
          </div>

          <p className="mt-5 text-xs text-[color:var(--kw-faint)]">
            Free forever for core features. No card required.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
