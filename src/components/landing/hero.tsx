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
    body: "Memorize with confidence through a method rooted in traditional hifz and strengthened by science-backed recall, so you return with clarity, revise with purpose, and retain what you learn.",
  },
  {
    label: "Qur'an",
    body: "Pick up exactly where you left off, listen to the recitation that moves you, and turn to trusted guidance that helps you reflect, understand, and stay present with every ayah.",
  },
  {
    label: "Dua",
    body: "Learn before you pray, then step into dua with understanding and presence through a guided experience that makes each supplication feel more personal, meaningful, and real.",
  },
  {
    label: "Journaling",
    body: "Keep your spiritual journey close by writing reflections, lessons, and private moments in a personal space that connects your thoughts with ayah and dua.",
  },
  {
    label: "Noor AI",
    body: "Grounded Qur'anic guidance you can trust. Ask freely and receive answers rooted in verified Qur'anic sources, trusted translations, and tafsir, not generic AI guesswork.",
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
            <h1 className={styles.fitnessHeroTitle}>Reconnect with the Qur&apos;an and stay connected.</h1>
            <p className={styles.fitnessHeroSummary}>
              A modern Qur&apos;an companion for memorization, trusted AI Qur&apos;an guidance,
              practicing duas, and writing personal reflections.
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
