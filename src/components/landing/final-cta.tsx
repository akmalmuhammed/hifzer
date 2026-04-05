"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Download, Share, HandHeart, Sparkles, ShieldCheck, LockKeyhole, Mail } from "lucide-react";
import { WindLines } from "@/components/brand/wind-lines";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { useInstallApp } from "@/components/pwa/use-install-app";
import { trackGaEvent } from "@/lib/ga/client";
import styles from "./landing.module.css";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@hifzer.com";

const PROMISES = [
  {
    title: "The core app stays free to use",
    body: [
      "No subscription tiers across the main experience",
      "No free-trial countdown pretending to be generosity",
      "No paid wall before reading, Hifz, or dua can help you",
    ],
    promise: "Optional one-time support exists if you want to help fund the work. Help is not withheld until you pay.",
    icon: HandHeart,
  },
  {
    title: "We will not gamify your faith",
    body: [
      "No meaningless badges",
      "No noisy streak guilt loops",
      "No social comparison pretending to measure sincerity",
    ],
    promise: "Your progress is between you and Allah.",
    icon: Sparkles,
  },
  {
    title: "We will not force one path on you",
    body: [
      "No rigid onboarding tunnel",
      "No single correct workflow to obey",
      "No pressure to use every feature before any feature can help",
    ],
    promise: "Open it. Explore it. Build your own way of returning.",
    icon: ShieldCheck,
  },
  {
    title: "We will not stop building with you",
    body: [
      "No closed roadmap decided in secret",
      "No worship features dropped just because a metric cooled down",
      "No pretending the current version is the final one",
    ],
    promise: "If people need something that serves worship, it stays on the table.",
    icon: Mail,
  },
  {
    title: "We will not sell your spirituality",
    body: [
      "No ads in the middle of devotion",
      "No selling personal data",
      "No spam disguised as care",
    ],
    promise: "Privacy, trust, and restraint have to remain visible.",
    icon: LockKeyhole,
  },
] as const;

const TRUST_SIGNALS = [
  {
    title: "Core app free to use",
    body: "Reading, Hifz, and dua do not sit behind a subscription gate.",
  },
  {
    title: "Optional support is one-time",
    body: "If you want to help keep Hifzer going, support is never required first.",
  },
  {
    title: "Browser first",
    body: "Use it on the web first. Add it to your home screen only if it earns the place.",
  },
  {
    title: "Open roadmap",
    body: "Requests and product direction stay visible instead of disappearing into a black box.",
  },
] as const;

export function FinalCta() {
  const reduceMotion = useReducedMotion();
  const { isSignedIn } = usePublicAuth();
  const install = useInstallApp();
  const { pushToast } = useToast();
  const featureRequestHref = `mailto:${SUPPORT_EMAIL}?subject=Hifzer+feature+request`;

  const onInstallNow = async () => {
    trackGaEvent("landing.install_primary_click", { placement: "final-cta" });
    const result = await install.requestInstall();

    if (result === "accepted") {
      trackGaEvent("landing.install_result.accepted", { placement: "final-cta" });
      pushToast({
        tone: "success",
        title: "Installed",
        message: "Hifzer was added to your home screen.",
      });
      return;
    }

    trackGaEvent("landing.install_result.dismissed", { placement: "final-cta", reason: result });

    if (result === "ios_instructions") {
      pushToast({
        tone: "warning",
        title: "iPhone install",
        message: "Safari requires Share, then Add to Home Screen.",
      });
      return;
    }

    pushToast({
      tone: "warning",
      title: "Install prompt not ready",
      message: "Try opening hifzer.com in Chrome or Safari and using the menu to install.",
    });
  };

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
            <Button
              type="button"
              size="lg"
              onClick={() => {
                void onInstallNow();
              }}
              className="sm:w-auto"
            >
              <InstallIcon size={17} />
              Add to Home Screen
            </Button>
            <Button asChild size="lg" variant="secondary">
              <PublicAuthLink
                signedInHref="/today"
                signedOutHref="/signup"
                onClick={() => {
                  trackGaEvent("landing.secondary_start_free_click", { placement: "final-cta" });
                }}
              >
                {isSignedIn ? "Open app" : "Start free in browser"} <ArrowRight size={17} />
              </PublicAuthLink>
            </Button>
          </div>

          <p className="mt-5 text-xs text-[rgba(248,250,252,0.32)]">
            Free to start · No card required
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
