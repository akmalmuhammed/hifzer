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
    label: "Resume reading",
    body: "Return to the exact ayah without rebuilding your place every time you come back.",
  },
  {
    label: "Keep review visible",
    body: "Protect Sabaq, Sabqi, and Manzil in one flow instead of keeping review in your head.",
  },
  {
    label: "Keep duas and notes close",
    body: "Open daily adhkar and save private reflections without jumping to separate tools.",
  },
] as const;

export function Hero() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const stageScale = useTransform(scrollYProgress, [0, 0.5, 1], reduceMotion ? [1, 1, 1] : [1.08, 1.01, 0.95]);
  const stageY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -68]);
  const frameY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -24]);
  const frameScale = useTransform(scrollYProgress, [0, 0.55, 1], reduceMotion ? [1, 1, 1] : [1.1, 1.02, 0.98]);
  const copyY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -18]);
  const valuesOpacity = useTransform(scrollYProgress, [0, 0.18], reduceMotion ? [1, 1] : [0.62, 1]);

  return (
    <section ref={sectionRef} className={styles.fitnessHeroSection} style={{ position: "relative" }}>
      <div className={styles.fitnessHeroSticky}>
        <motion.div style={{ scale: stageScale, y: stageY }} className={styles.fitnessHeroShell}>
          <motion.div style={{ y: copyY }} className={styles.fitnessHeroCopy}>
            <p className={styles.fitnessHeroEyebrow}>Hifzer</p>
            <h1 className={styles.fitnessHeroTitle}>Keep your Qur&apos;an routine in one place.</h1>
            <p className={styles.fitnessHeroSummary}>
              Read where you left off, keep hifz review visible, open your daily adhkar, and save
              private reflections in one calm app.
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
