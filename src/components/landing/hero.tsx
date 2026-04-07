"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { MacbookFrame } from "@/components/landing/feature-showcase";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { Button } from "@/components/ui/button";
import styles from "./landing.module.css";

const HERO_POINTS = [
  {
    label: "Hifz",
    body: "Keep Sabaq, Sabqi, and Manzil visible so memorisation stays structured and deliberate.",
  },
  {
    label: "Qur'an",
    body: "Return to the exact ayah and continue reading without rebuilding your place every time.",
  },
  {
    label: "Dua",
    body: "Keep daily adhkar close so asking Allah stays part of the same routine, not another app.",
  },
  {
    label: "Journaling",
    body: "Save faith-based reflections, lessons, and personal notes in your own private space.",
  },
] as const;

export function Hero() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const stageScale = useTransform(scrollYProgress, [0, 0.5, 1], reduceMotion ? [1, 1, 1] : [1.14, 1.02, 0.86]);
  const stageY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -92]);
  const frameY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -36]);
  const frameScale = useTransform(scrollYProgress, [0, 0.55, 1], reduceMotion ? [1, 1, 1] : [1.18, 1.04, 0.88]);
  const copyY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -26]);
  const valuesOpacity = useTransform(scrollYProgress, [0, 0.18], reduceMotion ? [1, 1] : [0.62, 1]);

  return (
    <section ref={sectionRef} className={styles.fitnessHeroSection} style={{ position: "relative" }}>
      <div className={styles.fitnessHeroSticky}>
        <motion.div style={{ scale: stageScale, y: stageY }} className={styles.fitnessHeroShell}>
          <motion.div style={{ y: copyY }} className={styles.fitnessHeroCopy}>
            <p className={styles.fitnessHeroEyebrow}>Hifzer</p>
            <h1 className={styles.fitnessHeroTitle}>Keep your Qur&apos;an routine in one place.</h1>
            <p className={styles.fitnessHeroSummary}>
              Read where you left off, revise hifz with structure, keep daily adhkar close, and
              save private faith-based reflections in one app.
            </p>

            <div className={styles.fitnessHeroActions}>
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
            </div>

            <p className={styles.fitnessHeroMicro}>
              Browser first. No card required. Install later only if you want faster access.
            </p>
          </motion.div>

          <motion.div style={{ y: frameY, scale: frameScale }} className={styles.fitnessHeroVisual}>
            <MacbookFrame
              src="/landing/showcase/dashboard.png"
              alt="Hifzer dashboard showing daily Qur'an progress, review, and practice surfaces"
              priority
            />
          </motion.div>

          <motion.div style={{ opacity: valuesOpacity }} className={styles.fitnessHeroValues}>
            {HERO_POINTS.map((point) => (
              <div key={point.label} className={styles.fitnessHeroValue}>
                <p className={styles.fitnessHeroValueLabel}>{point.label}</p>
                <p className={styles.fitnessHeroValueBody}>{point.body}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
