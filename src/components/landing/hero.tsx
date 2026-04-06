"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { WindLines } from "@/components/brand/wind-lines";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { trackGaEvent } from "@/lib/ga/client";
import styles from "./landing.module.css";

export function Hero() {
  const reduceMotion = useReducedMotion();
  const { isSignedIn } = usePublicAuth();
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

  return (
    <section
      ref={sectionRef}
      className={`${styles.publicHero} relative flex flex-col items-center overflow-hidden`}
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
        className={`${styles.publicHeroText} relative z-10 mx-auto flex w-full flex-col items-center text-center`}
      >
        {/* Staggered entrance for all text children */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } }}
          className="flex flex-col items-center gap-6"
        >
          {/* Headline — gradient on H1 only, very large */}
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } } }}
            className={`${styles.publicHeroTitle} kw-marketing-display kw-gradient-headline mx-auto text-balance leading-[0.92]`}
            style={{ fontWeight: 800 }}
          >
            Recite the Qur&apos;an. It will intercede for you.
          </motion.h1>

          {/* Subheadline — single line */}
          <motion.p
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }}
            className={`${styles.publicHeroSummary} mx-auto text-center text-base leading-[1.7] text-[color:var(--kw-muted)] md:text-lg`}
          >
            Hifz, Qur&apos;an reading, dua, and private reflection in one calm daily system.
          </motion.p>

          {/* CTA row */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } }}
            className={`${styles.publicHeroActions} flex flex-wrap items-center justify-center`}
          >
            <Button asChild size="lg">
              <PublicAuthLink
                signedInHref="/dashboard"
                signedOutHref="/signup"
                onClick={() => trackGaEvent("landing.primary_open_app_click", { placement: "hero", state: isSignedIn ? "signed_in" : "signed_out" })}
              >
                {isSignedIn ? "Open app" : "Create free account"} <ArrowRight size={17} />
              </PublicAuthLink>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <PublicAuthLink
                signedInHref="/quran-preview"
                signedOutHref="/quran-preview"
                onClick={() => trackGaEvent("landing.preview_click", { placement: "hero", state: isSignedIn ? "signed_in" : "signed_out" })}
              >
                See Qur&apos;an preview <ArrowRight size={17} />
              </PublicAuthLink>
            </Button>
          </motion.div>

          {/* Trust line */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
          >
            <p className="text-xs text-[color:var(--kw-faint)]">
              Start in the browser first. Install later if it earns a place on your phone.
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
        className={`${styles.publicHeroVisual} relative z-10`}
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
        className={`${styles.publicHeroIndicator} absolute left-1/2 z-20 -translate-x-1/2`}
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

