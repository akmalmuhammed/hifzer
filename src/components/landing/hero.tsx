"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpenText,
  Bookmark,
  Download,
  HandHeart,
  MoonStar,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
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

const HERO_SIGNALS = [
  {
    title: "For the one who keeps restarting",
    body: "Reopen without hunting for your place or trying to rebuild motivation from zero.",
  },
  {
    title: "For the busy and interrupted",
    body: "The next meaningful step appears first, even when you only have a few sincere minutes.",
  },
  {
    title: "For the quiet return",
    body: "Hifz, Qur'an reading, and dua stay distinct so each act of worship keeps its own intention.",
  },
] as const;

const HERO_FLOWS = [
  {
    label: "Qur'an",
    title: "Resume from the exact ayah you left.",
    body: "Your place, reader view, and reciter stay nearby so returning feels softer.",
    icon: BookOpenText,
    tone: "accent" as const,
  },
  {
    label: "Hifz",
    title: "Protect what you already memorized.",
    body: "Warm-up, review, and new portions appear in an order that respects retention.",
    icon: Bookmark,
    tone: "brand" as const,
  },
  {
    label: "Dua",
    title: "Keep taught words close.",
    body: "Open sourced duas and guided worship modules when the day feels heavy or scattered.",
    icon: HandHeart,
    tone: "warn" as const,
  },
  {
    label: "Rhythm",
    title: "Stay close through reminders and seasons.",
    body: "Gentle nudges, progress, and Ramadan surfaces help the return stay lived, not imagined.",
    icon: MoonStar,
    tone: "neutral" as const,
  },
] as const;

const HERO_HADITHS = [
  {
    label: "For consistency",
    quote: "The most beloved deeds to Allah are those done regularly, even if they are small.",
    source: "Bukhari & Muslim",
  },
  {
    label: "For the Qur'an",
    quote: "Recite the Qur'an, for it will come on the Day of Resurrection as an intercessor for its companions.",
    source: "Sahih Muslim",
  },
  {
    label: "For one letter at a time",
    quote: "Whoever recites a letter from the Book of Allah receives a good deed, and that good deed is multiplied by ten.",
    source: "Tirmidhi",
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
      setHadithIndex((current) => (current + 1) % HERO_HADITHS.length);
    }, 5200);

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

  const activeHadith = HERO_HADITHS[hadithIndex] ?? HERO_HADITHS[0];

  return (
    <section id="hero" className="py-8 md:py-12">
      <motion.div
        className={`${styles.heroShell} px-5 py-6 md:px-7 md:py-7`}
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } } }}
      >
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.04fr)_420px] xl:items-start">
          <div className="min-w-0">
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
              <Pill tone="brand">
                <Sparkles size={14} />
                Qur&apos;an-first
              </Pill>
              <Pill tone="accent">Built by Muslims</Pill>
              <Pill tone="neutral">Quiet by design</Pill>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="kw-marketing-display mt-5 max-w-[14ch] text-balance text-[clamp(2.6rem,6vw,5.4rem)] leading-[0.92] tracking-[-0.05em] text-[color:var(--kw-ink)]"
            >
              The Qur&apos;an you keep meaning to return to is still waiting.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-[62ch] text-pretty text-base leading-8 text-[color:var(--kw-muted)] md:text-[1.05rem]"
            >
              Hifz, Qur&apos;an reading, guided duas, recitation audio, Ramadan support, and gentle
              reminders in one calm companion that helps you come back today, not just promise
              yourself you will start tomorrow.
            </motion.p>

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
                  {isSignedIn ? "Return to today's page" : "Start your return"} <ArrowRight size={18} />
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
              <motion.div variants={fadeUp} className="mt-4">
                <PublicAuthLink
                  signedInHref="/today"
                  signedOutHref="/quran-preview"
                  onClick={() => {
                    trackGaEvent("landing.secondary_start_free_click", { placement: "hero-secondary" });
                  }}
                  className="text-sm font-semibold text-[color:var(--kw-muted)] underline underline-offset-4 transition hover:text-[color:var(--kw-ink)]"
                >
                  Preview the Qur&apos;an reader first
                </PublicAuthLink>
              </motion.div>
            ) : null}

            <motion.p
              variants={fadeUp}
              className="mt-4 text-sm leading-7 text-[color:var(--kw-muted)]"
            >
              No ads. No noise. Just you, your intention, and a clearer next step.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-7 grid gap-3 md:grid-cols-3">
              {HERO_SIGNALS.map((item) => (
                <div key={item.title} className={`${styles.heroSignalCard} px-4 py-4`}>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">{item.body}</p>
                </div>
              ))}
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-6 rounded-[24px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card-strong)] px-4 py-4 shadow-[var(--kw-shadow-soft)] backdrop-blur"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="neutral">{activeHadith.label}</Pill>
                <Pill tone="accent">Words that steady the heart</Pill>
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                  What waits inside
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                  A companion that helps you return without starting from shame.
                </p>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-[18px] border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.1)] text-[rgba(var(--kw-accent-rgb),1)]">
                <ShieldCheck size={18} />
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {HERO_FLOWS.map((item) => {
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
                        <p className="mt-3 text-base font-semibold tracking-tight text-[color:var(--kw-ink)]">
                          {item.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">{item.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-[22px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                A quieter promise
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Hifzer is only the tool. Allah is the Guide. Our job is to reduce friction, protect
                your place, and make the next return gentler than the last.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
