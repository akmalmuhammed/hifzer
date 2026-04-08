"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { MacbookFrame } from "@/components/landing/feature-showcase";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { Button } from "@/components/ui/button";
import styles from "./landing.module.css";

const HERO_POINTS = [
  {
    label: "Hifz",
    body: "Keep your lesson, recent revision, and longer-cycle review visible so memorisation stays structured.",
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

const MOBILE_HERO_QUERY = "(max-width: 1023px)";

export function Hero() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(MOBILE_HERO_QUERY);
    const syncLayout = () => setIsMobileLayout(mediaQuery.matches);

    syncLayout();
    mediaQuery.addEventListener("change", syncLayout);
    return () => mediaQuery.removeEventListener("change", syncLayout);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const disableScrollMotion = reduceMotion || isMobileLayout;
  const stageScale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    disableScrollMotion ? [1, 1, 1] : [1.14, 1.02, 0.86],
  );
  const stageY = useTransform(scrollYProgress, [0, 1], disableScrollMotion ? [0, 0] : [0, -92]);
  const frameY = useTransform(scrollYProgress, [0, 1], disableScrollMotion ? [0, 0] : [0, -36]);
  const frameScale = useTransform(
    scrollYProgress,
    [0, 0.55, 1],
    disableScrollMotion ? [1, 1, 1] : [1.18, 1.04, 0.88],
  );
  const copyY = useTransform(scrollYProgress, [0, 1], disableScrollMotion ? [0, 0] : [0, -26]);
  const valuesOpacity = useTransform(scrollYProgress, [0, 0.18], disableScrollMotion ? [1, 1] : [0.62, 1]);

  return (
    <section ref={sectionRef} className={styles.fitnessHeroSection} style={{ position: "relative" }}>
      <div className={styles.fitnessHeroSticky}>
        <motion.div style={{ scale: stageScale, y: stageY }} className={styles.fitnessHeroShell}>
          <motion.div style={{ y: copyY }} className={styles.fitnessHeroCopy}>
            <p className={styles.fitnessHeroEyebrow}>Hifzer</p>
            <h1 className={styles.fitnessHeroTitle}>The all-in-one app for Qur&apos;an, hifz, dua, and notes.</h1>
            <p className={styles.fitnessHeroSummary}>
              For Muslims building a daily Qur&apos;an habit, Hifzer replaces the mix of a Qur&apos;an
              app, adhkar list, and notes app with one place to read, revise, ask, and reflect.
            </p>

            <div className={styles.fitnessHeroActions}>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <TrackedLink
                  href="/signup"
                  telemetryName="landing.primary_open_app_click"
                  telemetryMeta={{ placement: "hero" }}
                >
                  Start your routine free <ArrowRight size={17} />
                </TrackedLink>
              </Button>
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                <TrackedLink
                  href="#core-features"
                  telemetryName="landing.hero_full_product_click"
                  telemetryMeta={{ placement: "hero" }}
                >
                  See the full flow <ArrowRight size={17} />
                </TrackedLink>
              </Button>
            </div>

            <p className={styles.fitnessHeroMicro}>
              No card required. Start in the browser and keep everything in one place.
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
