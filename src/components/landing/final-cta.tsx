"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { WindLines } from "@/components/brand/wind-lines";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { trackGaEvent } from "@/lib/ga/client";

export function FinalCta() {
  const reduceMotion = useReducedMotion();
  const { isSignedIn } = usePublicAuth();

  return (
    <section id="promise" className="py-10 md:py-14">
      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
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
            Begin today
          </p>

          <h2 className="kw-marketing-display mt-4 text-balance text-4xl font-bold leading-[1.0] text-[rgba(248,250,252,0.94)] sm:text-5xl">
            Your return to the Book{" "}
            <span className="text-[#2dd4bf]">starts here.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-[46ch] text-base leading-[1.8] text-[rgba(248,250,252,0.58)]">
            No complicated setup. No flashcard grind. Open the app, follow today&apos;s session,
            and let Hifzer handle the rest.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="sm:w-auto">
              <PublicAuthLink
                signedInHref="/dashboard"
                signedOutHref="/signup"
                onClick={() => {
                  trackGaEvent("landing.primary_open_app_click", { placement: "final-cta", state: isSignedIn ? "signed_in" : "signed_out" });
                }}
              >
                {isSignedIn ? "Open app" : "Create free account"} <ArrowRight size={17} />
              </PublicAuthLink>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <PublicAuthLink
                signedInHref="/quran-preview"
                signedOutHref="/quran-preview"
                onClick={() => {
                  trackGaEvent("landing.preview_click", { placement: "final-cta", state: isSignedIn ? "signed_in" : "signed_out" });
                }}
              >
                See Qur&apos;an preview <ArrowRight size={17} />
              </PublicAuthLink>
            </Button>
          </div>

          <p className="mt-5 text-xs text-[rgba(248,250,252,0.32)]">
            Browser first · no card required · install only if it earns the space
          </p>

          {/* Qur'anic closing — earned position, not repeated from above */}
          <p className="mt-10 border-t border-[rgba(255,255,255,0.08)] pt-8 text-sm italic text-[rgba(248,250,252,0.4)]">
            &ldquo;Your return is never lost.&rdquo;
            <span className="ml-2 not-italic text-[11px] tracking-wide text-[rgba(248,250,252,0.25)]">
              Adapted from Sahih Muslim 798a
            </span>
          </p>
        </div>
      </motion.div>
    </section>
  );
}

