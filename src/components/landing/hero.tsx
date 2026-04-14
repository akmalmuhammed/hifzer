"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { MacbookFrame } from "@/components/landing/feature-showcase";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { Button } from "@/components/ui/button";
import styles from "./landing.module.css";

const HERO_POINTS = [
  {
    label: "Hifz",
    body: "See what deserves your next strong session, what needs revision today, and what is starting to fade before it slips away.",
  },
  {
    label: "Qur'an",
    body: "Return to the exact ayah, with the reciter you want and deeper help close when you need it.",
  },
  {
    label: "Dua",
    body: "Keep daily adhkar close and ready when your heart needs them, not buried in another app.",
  },
  {
    label: "Journaling",
    body: "Keep private reflections, lessons, and duas in one calm personal space.",
  },
] as const;

const MOBILE_HERO_QUERY = "(max-width: 1023px)";

export function Hero() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const { isSignedIn } = usePublicAuth();

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
            <h1 className={styles.fitnessHeroTitle}>Return to the Qur&apos;an daily with one guided place to read, memorize, and reflect.</h1>
            <p className={styles.fitnessHeroSummary}>
              Hifzer helps you keep your place, stay steady with hifz, and come back with less
              friction each day. The deeper tools are there when you want them, but the main
              routine stays simple.
            </p>

            <div className={styles.fitnessHeroActions}>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <PublicAuthLink
                  signedInHref="/dashboard"
                  signedOutHref="/signup"
                  telemetryName="landing.primary_open_app_click"
                  telemetryMeta={{ placement: "hero" }}
                >
                  {isSignedIn ? "Open app" : "Start your routine free"} <ArrowRight size={17} />
                </PublicAuthLink>
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
