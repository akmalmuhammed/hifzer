"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Download, HandHeart, MoonStar, Sparkles } from "lucide-react";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { useInstallApp } from "@/components/pwa/use-install-app";
import { trackGaEvent } from "@/lib/ga/client";
import styles from "./landing.module.css";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const HADITHS = [
  {
    label: "Use your time well",
    quote: "Take advantage of five before five: your youth before your old age, your health before your sickness, your wealth before your poverty, your free time before your work, and your life before your death.",
    source: "Al-Hakim",
  },
  {
    label: "Stay regular",
    quote: "The most beloved deed to Allah is the most regular and constant, even if it is small.",
    source: "Bukhari & Muslim",
  },
  {
    label: "One letter at a time",
    quote: "Whoever recites a letter from the Book of Allah will receive a good deed, and the good deed will be multiplied by ten.",
    source: "Tirmidhi",
  },
  {
    label: "Think beyond this life",
    quote: "When a man dies, his deeds come to an end except for three things: ongoing charity, beneficial knowledge, or a righteous child who prays for him.",
    source: "Sahih Muslim",
  },
] as const;

const WAYS_TO_USE = [
  {
    label: "For Hifz",
    body: "Use it as the place that keeps review honest and lets new memorization arrive with more calm.",
    icon: Sparkles,
    tone: "brand" as const,
  },
  {
    label: "For reading",
    body: "Use it as the home that keeps your place in the mushaf ready whenever you come back.",
    icon: MoonStar,
    tone: "accent" as const,
  },
  {
    label: "For dua",
    body: "Use it when you need taught words close and quieter worship space without the noise.",
    icon: HandHeart,
    tone: "warn" as const,
  },
] as const;

export function Hero(props: { primaryIntent?: "install" | "signup" }) {
  const primaryIntent = props.primaryIntent ?? "install";
  const reduceMotion = useReducedMotion();
  const { isSignedIn } = usePublicAuth();
  const install = useInstallApp();
  const { pushToast } = useToast();
  const [hadithIndex, setHadithIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const timerId = window.setInterval(() => {
      setHadithIndex((current) => (current + 1) % HADITHS.length);
    }, 5600);

    return () => {
      window.clearInterval(timerId);
    };
  }, [reduceMotion]);

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
      message: "Use the install guidance below to add Hifzer to your home screen.",
    });
  };

  const activeHadith = HADITHS[hadithIndex] ?? HADITHS[0];

  return (
    <section id="hero" className="py-8 md:py-12">
      <motion.div
        className={`${styles.heroShell} px-5 py-6 md:px-7 md:py-7`}
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } } }}
      >
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_400px] xl:items-start">
          <div className="min-w-0">
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
              <Pill tone="brand">Core app free to use</Pill>
              <Pill tone="accent">Optional one-time support</Pill>
              <Pill tone="neutral">Quiet by design</Pill>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="kw-marketing-display mt-5 max-w-[15ch] text-balance text-[clamp(2.6rem,6vw,5.2rem)] leading-[0.92] tracking-[-0.05em] text-[color:var(--kw-ink)]"
            >
              Tomorrow. Next week. After Ramadan. When things calm down.
              <span className="mt-3 block text-[rgba(var(--kw-accent-rgb),1)]">
                What if today was the day you stopped delaying?
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-[62ch] text-pretty text-base leading-8 text-[color:var(--kw-muted)] md:text-[1.05rem]"
            >
              Hifz. Qur&apos;an reading. Daily duas. Recitation audio. Progress and reminders - all
              in one place. Yours to explore, build, and use however you need. Free to use.
            </motion.p>

            <motion.div variants={fadeUp} className={`${styles.returnBanner} mt-6 px-4 py-4`}>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                No subscription. No trial. Core app free to use.
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Optional one-time support helps fund hosting, audio, and continued product work. The
                main experience does not hide behind a paid wall.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center gap-3">
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
                  {isSignedIn ? "Return" : "It&apos;s Free - Begin"} <ArrowRight size={18} />
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

            <motion.p variants={fadeUp} className="mt-4 text-sm leading-7 text-[color:var(--kw-muted)]">
              No payment wall. Create your space and start.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-3">
              <PublicAuthLink
                signedInHref="/today"
                signedOutHref="/login"
                className="text-sm font-semibold text-[color:var(--kw-muted)] underline underline-offset-4 transition hover:text-[color:var(--kw-ink)]"
              >
                Already using it? Return to your space
              </PublicAuthLink>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-6 rounded-[24px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card-strong)] px-4 py-4 shadow-[var(--kw-shadow-soft)] backdrop-blur"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="neutral">{activeHadith.label}</Pill>
                <Pill tone="accent">Hadith reminder</Pill>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeHadith.source}
                  initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
                  transition={{ duration: reduceMotion ? 0 : 0.22 }}
                >
                  <p className="mt-4 text-sm font-semibold leading-7 text-[color:var(--kw-ink)]">
                    &quot;{activeHadith.quote}&quot;
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-faint)]">
                    {activeHadith.source}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className={`${styles.heroPanel} px-4 py-4 sm:px-5 sm:py-5`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                  We built it. You own it.
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                  There is no single correct way to use Hifzer.
                </p>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-[18px] border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.1)] text-[rgba(var(--kw-accent-rgb),1)]">
                <Sparkles size={18} />
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {WAYS_TO_USE.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] text-[color:var(--kw-ink-2)]">
                        <Icon size={18} />
                      </span>
                      <div className="min-w-0">
                        <Pill tone={item.tone}>{item.label}</Pill>
                        <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{item.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-[22px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-4 py-4">
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                We built the space. You decide what it becomes for you.
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Explore every corner. Keep only what serves your worship. Ask for what is missing.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
