"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { WindLines } from "@/components/brand/wind-lines";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="promise" className="py-10 md:py-14">
      <motion.div
        initial={false}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[28px] bg-[#0b1220] px-6 py-16 md:px-12 md:py-20"
      >
        {/* Decorative wind lines on dark bg — same motif, inverted context */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <WindLines className="h-full w-full opacity-70" animated={!reduceMotion} />
        </div>

        {/* Teal radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(10,138,119,0.22), transparent 65%)",
          }}
        />

        <div className="relative mx-auto max-w-[720px] text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#2dd4bf]">
            Start now
          </p>

          <h2 className="kw-marketing-display mt-4 text-balance text-4xl font-bold leading-[1.0] text-[rgba(248,250,252,0.94)] sm:text-5xl">
            Keep your Qur&apos;an routine{" "}
            <span className="text-[#2dd4bf]">in one place.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-[46ch] text-base leading-[1.8] text-[rgba(248,250,252,0.58)]">
            Create a free account to save your place, keep review visible, and keep your duas and
            private notes close.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="sm:w-auto">
              <TrackedLink
                href="/signup"
                telemetryName="landing.primary_open_app_click"
                telemetryMeta={{ placement: "final-cta" }}
              >
                Create free account <ArrowRight size={17} />
              </TrackedLink>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <TrackedLink
                href="/quran-preview"
                telemetryName="landing.preview_click"
                telemetryMeta={{ placement: "final-cta" }}
              >
                See Qur&apos;an preview <ArrowRight size={17} />
              </TrackedLink>
            </Button>
          </div>

          <p className="mt-5 text-xs text-[rgba(248,250,252,0.32)]">
            Browser first · no card required · install later if you want
          </p>
        </div>
      </motion.div>
    </section>
  );
}
