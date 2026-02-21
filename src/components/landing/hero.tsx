"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Download, Share, Sparkles } from "lucide-react";
import { WindLines } from "@/components/brand/wind-lines";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useInstallApp } from "@/components/pwa/use-install-app";
import { trackGaEvent } from "@/lib/ga/client";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function Hero(props: { primaryIntent?: "install" | "signup" }) {
  const primaryIntent = props.primaryIntent ?? "install";
  const reduceMotion = useReducedMotion();
  const install = useInstallApp();
  const { pushToast } = useToast();
  const InstallIcon = install.canPrompt ? Download : Share;

  const onInstallNow = async () => {
    trackGaEvent("landing.install_primary_click", { placement: "hero" });
    const result = await install.requestInstall();

    if (result === "accepted") {
      trackGaEvent("landing.install_result.accepted", { placement: "hero" });
      pushToast({
        tone: "success",
        title: "Installed",
        message: "Hifzer was added to your home screen.",
      });
      return;
    }

    trackGaEvent("landing.install_result.dismissed", { placement: "hero", reason: result });

    if (result === "ios_instructions") {
      pushToast({
        tone: "warning",
        title: "iPhone install",
        message: "Tap Share, then Add to Home Screen.",
      });
      return;
    }

    pushToast({
      tone: "warning",
      title: "Install prompt not ready",
      message: "Use the install steps below to add Hifzer to your home screen.",
    });
  };

  return (
    <section className="relative overflow-hidden py-14 md:py-20">
      <div className="pointer-events-none absolute inset-x-0 -top-16 h-[340px] opacity-90">
        <WindLines className="opacity-70" animated />
      </div>

      <motion.div
        className="relative mx-auto grid max-w-[920px] gap-6 text-center"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        <motion.p
          variants={fadeUp}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-[rgba(var(--kw-accent-rgb),0.2)] bg-white/65 px-3 py-1 text-xs font-semibold text-[rgba(var(--kw-accent-rgb),1)] shadow-[var(--kw-shadow-soft)]"
        >
          <Sparkles size={14} />
          Install-first Hifz workflow for busy learners
        </motion.p>

        <motion.h1
          variants={fadeUp}
          className="mx-auto max-w-[11ch] text-balance font-[family-name:var(--font-kw-display)] text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.92] tracking-tight text-[color:var(--kw-ink)]"
        >
          Keep your Hifz stable every day.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mx-auto max-w-[56ch] text-pretty text-base leading-7 text-[color:var(--kw-muted)] md:text-lg"
        >
          Hifzer gives you one clear daily flow: review first, unlock new only when recall is strong,
          and keep recitation progress in sync.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-1 flex flex-wrap items-center justify-center gap-3">
          {primaryIntent === "signup" ? (
            <Button asChild size="lg">
              <PublicAuthLink
                signedInHref="/today"
                signedOutHref="/signup"
                onClick={() => {
                  trackGaEvent("landing.secondary_start_free_click", { placement: "hero-primary" });
                }}
              >
                Start free in browser <ArrowRight size={18} />
              </PublicAuthLink>
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={() => {
                void onInstallNow();
              }}
            >
              <InstallIcon size={18} />
              Add to Home Screen now
            </Button>
          )}
        </motion.div>

        <motion.div variants={fadeUp}>
          <PublicAuthLink
            signedInHref="/today"
            signedOutHref="/signup"
            onClick={() => {
              trackGaEvent("landing.secondary_start_free_click", { placement: "hero-secondary" });
            }}
            className="text-sm font-semibold text-[color:var(--kw-muted)] underline underline-offset-2 transition hover:text-[color:var(--kw-ink)]"
          >
            Start free in browser
          </PublicAuthLink>
        </motion.div>

        {!reduceMotion ? (
          <motion.p variants={fadeUp} className="text-xs text-[color:var(--kw-faint)]">
            Works on Android and iPhone with home-screen install.
          </motion.p>
        ) : null}
      </motion.div>
    </section>
  );
}
