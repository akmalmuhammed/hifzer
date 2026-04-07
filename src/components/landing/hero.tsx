"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { WindLines } from "@/components/brand/wind-lines";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { Button } from "@/components/ui/button";
import styles from "./landing.module.css";

export function Hero() {
  const reduceMotion = useReducedMotion();
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
          initial={false}
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
            One place for Qur&apos;an reading, review, duas, and notes.
          </motion.h1>

          {/* Subheadline — single line */}
          <motion.p
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }}
            className={`${styles.publicHeroSummary} mx-auto text-center text-base leading-[1.7] text-[color:var(--kw-muted)] md:text-lg`}
          >
            Read where you left off, keep review visible, open your daily adhkar, and write
            private reflections without stitching the routine together across different apps.
          </motion.p>

          {/* CTA row */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } }}
            className={`${styles.publicHeroActions} flex flex-wrap items-center justify-center`}
          >
            <Button asChild size="lg">
              <TrackedLink
                href="/signup"
                telemetryName="landing.primary_open_app_click"
                telemetryMeta={{ placement: "hero" }}
              >
                Create free account <ArrowRight size={17} />
              </TrackedLink>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <TrackedLink
                href="/quran-preview"
                telemetryName="landing.preview_click"
                telemetryMeta={{ placement: "hero" }}
              >
                See Qur&apos;an preview <ArrowRight size={17} />
              </TrackedLink>
            </Button>
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } }}
            className="w-full max-w-3xl"
          >
            <div className={`${styles.heroSignalCard} px-4 py-4 text-left sm:px-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[color:var(--kw-faint)]">
                    AI insights in the reader
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)] sm:text-[1rem]">
                    Get a quick explanation when an ayah needs more context.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(var(--kw-accent-rgb),0.2)] bg-[rgba(var(--kw-accent-rgb),0.08)] px-3 py-1 text-[11px] font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                  <Sparkles size={13} />
                  Smart help
                </span>
              </div>

              <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                Open AI insights for explanation notes, tafsir-backed takeaways, and word notes
                without leaving the ayah you are reading.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {["Explanation insights", "Tafsir insights", "Word notes"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[color:var(--kw-border-2)] bg-white/80 px-3 py-1 text-[11px] font-semibold text-[color:var(--kw-ink-2)]"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <TrackedLink
                href="/quran-preview"
                telemetryName="landing.ai_spotlight_preview_click"
                telemetryMeta={{ placement: "hero_ai_spotlight" }}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline"
              >
                See it in the Qur&apos;an preview <ArrowRight size={15} />
              </TrackedLink>
            </div>
          </motion.div>

          {/* Trust line */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
          >
            <p className="text-xs text-[color:var(--kw-faint)]">
              Start in the browser first. Install only if you want quicker access later.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── SCREENSHOT — parallax, peeks below fold ── */}
      <motion.div
        style={{ y: screenshotY, scale: screenshotScale }}
        initial={false}
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
            alt="Hifzer dashboard showing Qur'an reading, review, and private notes"
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
