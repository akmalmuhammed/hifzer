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

const HERO_HIGHLIGHTS = [
  {
    title: "Keep your place",
    copy: "Return to the ayah, lane, or module you last touched instead of starting cold.",
  },
  {
    title: "Keep lanes distinct",
    copy: "Hifz, Qur'an reading, and dua stay separate so progress stays honest.",
  },
  {
    title: "Keep returning daily",
    copy: "Open the app and the next meaningful step is ready without a setup maze.",
  },
] as const;

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
    <section id="hero" className="relative overflow-hidden py-10 md:py-14">
      <motion.div
        className="relative mx-auto grid max-w-[980px] gap-5 text-center"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } } }}
      >
        <motion.p
          variants={fadeUp}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-[rgba(var(--kw-accent-rgb),0.2)] bg-white/65 px-3 py-1 text-xs font-semibold text-[rgba(var(--kw-accent-rgb),1)] shadow-[var(--kw-shadow-soft)]"
        >
          <Sparkles size={14} />
          Calm daily Qur&apos;an companion
        </motion.p>

        <motion.h1
          variants={fadeUp}
          className="kw-marketing-display kw-gradient-headline mx-auto max-w-[15ch] text-balance text-[clamp(2.2rem,5.4vw,4.2rem)] leading-[0.94]"
        >
          A calmer way to return to the Qur&apos;an every day.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mx-auto max-w-[62ch] text-pretty text-base leading-7 text-[color:var(--kw-muted)] md:text-lg"
        >
          Hifzer keeps Hifz, Qur&apos;an reading, and dua in their own clear lanes so you can keep
          your place, protect your rhythm, and come back with intention when life gets crowded.
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

        <motion.div
          variants={fadeUp}
          className="mx-auto max-w-[760px] rounded-[26px] border border-[color:var(--kw-border-2)] bg-white/72 px-5 py-4 text-left shadow-[var(--kw-shadow-soft)] backdrop-blur"
        >
          <p className="text-sm font-semibold leading-7 text-[color:var(--kw-ink)]">
            &quot;Recite the Qur&apos;an, for it will come on the Day of Resurrection as an intercessor for
            its companions.&quot;
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-faint)]">
            Sahih Muslim 804a
          </p>
        </motion.div>

        <motion.p variants={fadeUp} className="text-xs text-[color:var(--kw-faint)]">
          Android supports the direct install prompt. iPhone Safari needs manual Add to Home Screen
          steps.
        </motion.p>

        <motion.div variants={fadeUp} className="grid gap-3 text-left sm:grid-cols-3">
          {HERO_HIGHLIGHTS.map((item) => (
            <div
              key={item.title}
              className="rounded-[24px] border border-[color:var(--kw-border-2)] bg-white/68 px-4 py-4 shadow-[var(--kw-shadow-soft)] backdrop-blur"
            >
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">{item.copy}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
