"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, ChevronDown, Download, Share } from "lucide-react";
import { WindLines } from "@/components/brand/wind-lines";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useInstallApp } from "@/components/pwa/use-install-app";
import { trackGaEvent } from "@/lib/ga/client";

export function Hero(props: { primaryIntent?: "install" | "signup" }) {
  const primaryIntent = props.primaryIntent ?? "install";
  const reduceMotion = useReducedMotion();
  const { isSignedIn } = usePublicAuth();
  const install = useInstallApp();
  const { pushToast } = useToast();
  const InstallIcon = install.canPrompt ? Download : Share;
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll out of hero — drives all exit transforms
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Text block floats up and fades as you scroll away
  const textY = useTransform(scrollYProgress, [0, 0.6], reduceMotion ? [0, 0] : [0, -80]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.45], reduceMotion ? [1, 1] : [1, 0]);

  // Screenshot rises slowly — parallax depth
  const screenshotY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -100]);
  const screenshotScale = useTransform(scrollYProgress, [0, 1], reduceMotion ? [1, 1] : [1, 0.95]);

  // Scroll indicator fades out almost immediately
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.12], reduceMotion ? [1, 1] : [1, 0]);

  const onInstallNow = async () => {
    trackGaEvent("landing.install_primary_click", { placement: "hero" });
    const result = await install.requestInstall();

    if (result === "accepted") {
      trackGaEvent("landing.install_result.accepted", { placement: "hero" });
      pushToast({ tone: "success", title: "Installed", message: "Hifzer was added to your home screen." });
      return;
    }

    trackGaEvent("landing.install_result.dismissed", { placement: "hero", reason: result });

    if (result === "ios_instructions") {
      pushToast({ tone: "warning", title: "iPhone install", message: "Tap Share, then Add to Home Screen." });
      return;
    }

    pushToast({ tone: "warning", title: "Install prompt not ready", message: "Use the install steps below to add Hifzer to your home screen." });
  };

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100dvh] flex-col items-center overflow-hidden"
    >
      {/* Full-bleed ambient background — static, no animation to keep paint cost low */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[120%]">
        <WindLines className="h-full w-full opacity-40 md:opacity-55" />
      </div>

      {/* Deep radial glow — teal bloom above fold */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[80vh]"
        style={{
          background: "radial-gradient(ellipse 900px 600px at 50% 15%, rgba(10,138,119,0.16), transparent 65%)",
        }}
      />

      {/* ── TEXT BLOCK — fades + floats out on scroll ── */}
      <motion.div
        style={{ opacity: textOpacity, y: textY }}
        className="relative z-10 mx-auto flex w-full max-w-[860px] flex-col items-center px-4 pt-24 text-center md:pt-32"
      >
        {/* Staggered entrance for all text children */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } }}
          className="flex flex-col items-center gap-7"
        >
          {/* Eyebrow pill */}
          <motion.p
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } }}
            className="inline-flex items-center rounded-full border border-[rgba(var(--kw-accent-rgb),0.24)] bg-white/75 px-4 py-1.5 text-xs font-semibold tracking-[0.05em] text-[rgba(var(--kw-accent-rgb),1)] shadow-[var(--kw-shadow-soft)]"
          >
            Your Islamic companion
          </motion.p>

          {/* Headline — gradient on H1 only, very large */}
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } } }}
            className="kw-marketing-display kw-gradient-headline mx-auto max-w-[13ch] text-balance text-[clamp(2.6rem,7.5vw,5.4rem)] leading-[0.92]" style={{ fontWeight: 800 }}
          >
            Recite the Qur&apos;an. It will intercede for you.
          </motion.h1>

          {/* Subheadline — single line */}
          <motion.p
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }}
            className="mx-auto max-w-[42ch] text-center text-base leading-[1.7] text-[color:var(--kw-muted)] md:text-lg"
          >
            Your complete companion for Hifz, Qur&apos;an reading, duas, and daily reflection.
          </motion.p>

          {/* CTA row */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {primaryIntent === "signup" ? (
              <Button asChild size="lg">
                <PublicAuthLink
                  signedInHref="/today"
                  signedOutHref="/signup"
                  onClick={() => trackGaEvent("landing.secondary_start_free_click", { placement: "hero-primary" })}
                >
                  Start free <ArrowRight size={17} />
                </PublicAuthLink>
              </Button>
            ) : (
              <Button type="button" size="lg" onClick={() => { void onInstallNow(); }}>
                <InstallIcon size={17} />
                Add to Home Screen
              </Button>
            )}
            <Button asChild size="lg" variant="secondary">
              <PublicAuthLink
                signedInHref="/today"
                signedOutHref="/signup"
                onClick={() => trackGaEvent("landing.secondary_start_free_click", { placement: "hero-auth-cta", state: isSignedIn ? "signed_in" : "signed_out" })}
              >
                {isSignedIn ? "Open app" : "Start free in browser"} <ArrowRight size={17} />
              </PublicAuthLink>
            </Button>
          </motion.div>

          {/* Trust line */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
          >
            <p className="text-xs text-[color:var(--kw-faint)]">
              Free to start · No card required · Works on Android and iPhone
            </p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── SCREENSHOT — parallax, peeks below fold ── */}
      <motion.div
        style={{ y: screenshotY, scale: screenshotScale }}
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mt-14 w-full max-w-[1100px] px-4 md:px-8"
      >
        {/* Screenshot glow bloom */}
        <div
          className="pointer-events-none absolute inset-x-12 -bottom-16 -top-6 -z-10 rounded-[60px] opacity-70 blur-2xl"
          style={{
            background: "radial-gradient(ellipse 70% 55% at 50% 65%, rgba(10,138,119,0.2), transparent 70%)",
          }}
        />
        {/* Clip the bottom so it "peeks" over the fold */}
        <div className="overflow-hidden rounded-t-[20px] border border-b-0 border-[color:var(--kw-border-2)] shadow-[0_32px_80px_rgba(11,18,32,0.18)]">
          <Image
            src="/hifzer app 1.png"
            alt="Hifzer app dashboard — daily session, retention scores, Qur'an reading"
            width={1400}
            height={900}
            className="w-full"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1100px"
            priority
          />
        </div>
      </motion.div>

      {/* ── SCROLL INDICATOR — fades out as you scroll ── */}
      <motion.div
        style={{ opacity: indicatorOpacity }}
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
        aria-hidden="true"
      >
        <motion.div
          animate={reduceMotion ? {} : { y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="flex flex-col items-center gap-1.5"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-faint)]">
            Scroll
          </span>
          <ChevronDown size={14} className="text-[color:var(--kw-faint)]" />
        </motion.div>
      </motion.div>
    </section>
  );
}
