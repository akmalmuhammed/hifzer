"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

export function ProductScreenshot() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-10 md:py-14">
      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--kw-faint)]">
            The app
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-kw-display)] text-3xl leading-tight tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
            Your daily plan, ready in seconds.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[color:var(--kw-muted)]">
            The home screen shows your queue health, mode, and session counts at a glance — nothing
            you don&apos;t need, nothing missing.
          </p>
        </div>

        <div className="relative">
          {/* Glow behind the screenshot */}
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgba(var(--kw-accent-rgb),0.12)_0%,transparent_70%)] blur-2xl" />

          {/* Screenshot frame */}
          <div className="overflow-hidden rounded-[20px] border border-[color:var(--kw-border-2)] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.04)]">
            {/* Fake browser / app chrome bar */}
            <div className="flex items-center gap-2 border-b border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[rgba(0,0,0,0.12)]" />
              <span className="h-3 w-3 rounded-full bg-[rgba(0,0,0,0.08)]" />
              <span className="h-3 w-3 rounded-full bg-[rgba(0,0,0,0.06)]" />
              <div className="mx-auto flex h-6 min-w-[180px] max-w-xs items-center justify-center rounded-md border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] px-3">
                <span className="text-[11px] text-[color:var(--kw-faint)]">hifzer.app/today</span>
              </div>
            </div>

            <Image
              src="/hifzer app 1.png"
              alt="Hifzer Today page — showing queue health, mode, and daily session plan"
              width={1400}
              height={900}
              className="w-full"
              priority={false}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
