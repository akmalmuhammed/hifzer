"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import styles from "./landing.module.css";

const OWNERSHIP_POINTS = [
  "Use it as a Hifz tracker.",
  "Or as your Qur'an reading home.",
  "Or as the place that keeps duas nearby.",
  "Or as the steady surface that helps you keep showing up.",
] as const;

export function ProductScreenshot() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="tool" className="py-10 md:py-14">
      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={`${styles.proofShell} px-5 py-6 sm:px-6 sm:py-7`}
      >
        <div className="grid gap-8 xl:grid-cols-[0.96fr_1.04fr] xl:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
              This is your tool
            </p>
            <h2 className="kw-marketing-display mt-4 max-w-[14ch] text-balance text-4xl leading-[0.98] tracking-[-0.05em] text-[color:var(--kw-ink)] sm:text-5xl">
              We built it. You own it.
            </h2>
            <p className="mt-4 max-w-[60ch] text-sm leading-8 text-[color:var(--kw-muted)]">
              Most apps tell you how to use them. Hifzer does not. We built the space. You decide
              what it becomes for you.
            </p>

            <div className="mt-6 grid gap-3">
              {OWNERSHIP_POINTS.map((point) => (
                <div
                  key={point}
                  className="rounded-[22px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]"
                >
                  <p className="text-sm leading-7 text-[color:var(--kw-ink)]">{point}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]">
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                There is no correct way to use Hifzer. There is only your way.
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Explore every corner. Keep what serves worship. Ask for what is missing. We are here
                to hand you the keys and stay close when you need us.
              </p>
            </div>

            <div className="mt-6 rounded-[24px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.08)] text-[rgba(var(--kw-accent-rgb),1)]">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                    The philosophy behind it
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                    We do not believe core Qur&apos;an practice should sit behind subscriptions or
                    manipulative paywalls. The core app stays free to use, and support stays optional.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button asChild size="lg">
                <PublicAuthLink signedInHref="/today" signedOutHref="/signup">
                  Create my free space <ArrowRight size={16} />
                </PublicAuthLink>
              </Button>
            </div>
          </div>

          <div className={`${styles.proofFrame} p-2 sm:p-3`}>
            <div className="relative overflow-hidden rounded-[24px] border border-[color:var(--kw-border)]">
              <Image
                src="/hifzer app 1.png"
                alt="Hifzer dashboard preview showing a calm daily flow across Qur'an reading, Hifz, and progress."
                width={1400}
                height={900}
                className="w-full"
                priority={false}
              />

              <div className={`${styles.proofBadge} left-3 top-3 px-3 py-2 text-xs font-semibold text-[color:var(--kw-ink)] sm:left-5 sm:top-5`}>
                Pick up where you left off
              </div>
              <div className={`${styles.proofBadge} right-3 top-16 px-3 py-2 text-xs font-semibold text-[color:var(--kw-ink)] sm:right-5 sm:top-5`}>
                Review before new
              </div>
              <div className={`${styles.proofBadge} bottom-3 left-3 px-3 py-2 text-xs font-semibold text-[color:var(--kw-ink)] sm:bottom-5 sm:left-5`}>
                Keep duas and progress close
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
