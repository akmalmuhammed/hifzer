"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Download, Sparkles } from "lucide-react";
import { usePublicAuth } from "@/components/landing/public-auth-context";
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
  const { isSignedIn } = usePublicAuth();
  const install = useInstallApp();
  const { pushToast } = useToast();

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
        message: "Safari requires Share, then Add to Home Screen.",
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
          Authentic daily rhythm for recitation and retention
        </motion.p>

        <motion.h1
          variants={fadeUp}
          className="kw-marketing-display kw-gradient-headline mx-auto max-w-[11ch] text-balance text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.9]"
        >
          Recite the Qur&apos;an. It will intercede for you.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mx-auto max-w-[56ch] text-pretty text-base leading-7 text-[color:var(--kw-muted)] md:text-lg"
        >
          Return to the Book every day. In the remembrance of Allah, hearts find rest, and
          consistent recitation keeps your Hifz steady.
          <span className="ml-2 inline-flex items-center rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2 py-0.5 align-middle text-[10px] font-semibold leading-none tracking-[0.08em] text-[color:var(--kw-faint)]">
            Sahih Muslim 804a
          </span>
          <span className="ml-2 inline-flex items-center rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2 py-0.5 align-middle text-[10px] font-semibold leading-none tracking-[0.08em] text-[color:var(--kw-faint)]">
            Qur&apos;an 13:28
          </span>
        </motion.p>

        <motion.div variants={fadeUp} className="mt-1 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <PublicAuthLink
              signedInHref="/today"
              signedOutHref="/signup"
              onClick={() => {
                trackGaEvent("landing.secondary_start_free_click", {
                  placement: "hero-primary",
                  state: isSignedIn ? "signed_in" : "signed_out",
                });
              }}
            >
              {isSignedIn ? "Continue in app" : "Start free in browser"} <ArrowRight size={18} />
            </PublicAuthLink>
          </Button>
          {primaryIntent === "install" && install.canShowCta ? (
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={() => {
                void onInstallNow();
              }}
            >
              <Download size={18} />
              Install on Android
            </Button>
          ) : null}
        </motion.div>

        {!isSignedIn ? (
        <motion.div variants={fadeUp}>
          <PublicAuthLink
            signedInHref="/today"
            signedOutHref="/quran-preview"
            onClick={() => {
              trackGaEvent("landing.secondary_start_free_click", { placement: "hero-secondary" });
            }}
            className="text-sm font-semibold text-[color:var(--kw-muted)] underline underline-offset-2 transition hover:text-[color:var(--kw-ink)]"
          >
            Preview the reading flow
          </PublicAuthLink>
        </motion.div>
        ) : null}

        {!reduceMotion ? (
          <motion.p variants={fadeUp} className="text-xs text-[color:var(--kw-faint)]">
            Android supports the direct install prompt. iPhone Safari needs manual Add to Home Screen steps.
          </motion.p>
        ) : null}
      </motion.div>
    </section>
  );
}
