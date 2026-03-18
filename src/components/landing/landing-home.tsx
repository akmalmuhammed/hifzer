"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpenText,
  Bookmark,
  HandHeart,
  Headphones,
  Play,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";
import { WindLines } from "@/components/brand/wind-lines";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import styles from "./landing-home.module.css";

type Tone = "brand" | "accent" | "warn";

type ShowcaseMode = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  pill: string;
  tone: Tone;
  icon: LucideIcon;
  signals: string[];
  metrics: Array<{ label: string; value: string }>;
  laneTitle: string;
  laneBody: string;
  laneTags: string[];
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const SHOWCASE_MODES: ShowcaseMode[] = [
  {
    id: "quran",
    label: "Qur'an",
    eyebrow: "Reading lane",
    title: "Continue from the ayah you left yesterday.",
    body: "Saved place, translation, audio, and bookmarks stay close without making the page feel crowded.",
    pill: "Quiet reading",
    tone: "accent",
    icon: BookOpenText,
    signals: ["Resume in one tap", "Listen with trusted reciters", "Keep your bookmarks nearby"],
    metrics: [
      { label: "Saved place", value: "1 tap" },
      { label: "Audio ready", value: "Always" },
      { label: "Bookmarks", value: "Close" },
    ],
    laneTitle: "Read without resetting yourself.",
    laneBody: "Open the reader, continue naturally, and keep the translation or audio nearby only when you need it.",
    laneTags: ["Resume where you stopped", "Audio and translation", "Quiet bookmarks"],
  },
  {
    id: "hifz",
    label: "Hifz",
    eyebrow: "Memorization lane",
    title: "Protect review before adding more memorization.",
    body: "Hifzer keeps Sabaq, Sabqi, and Manzil clear so your revision stays honest and your next step stays realistic.",
    pill: "Review first",
    tone: "brand",
    icon: RefreshCcw,
    signals: ["Keep Sabaq, Sabqi, Manzil distinct", "Catch slips earlier", "Return gently after missed days"],
    metrics: [
      { label: "Review flow", value: "Steady" },
      { label: "Catch-up", value: "Gentle" },
      { label: "Focus", value: "Clear" },
    ],
    laneTitle: "Memorize with calmer structure.",
    laneBody: "The hifz flow stays clear enough to guide you without becoming a harsh dashboard or guilt machine.",
    laneTags: ["Traditional lanes", "Catch-up support", "Progress that stays honest"],
  },
  {
    id: "dua",
    label: "Dua",
    eyebrow: "Dua lane",
    title: "Keep taught words close when the day feels heavy.",
    body: "Carry duas, transliteration, and your own quiet reflections in one place that belongs to your account.",
    pill: "Daily duas",
    tone: "warn",
    icon: HandHeart,
    signals: ["Arabic, transliteration, translation", "Private notes tied to your account", "A calmer place to return"],
    metrics: [
      { label: "Words nearby", value: "Ready" },
      { label: "Private notes", value: "Synced" },
      { label: "Tone", value: "Quiet" },
    ],
    laneTitle: "Carry words you can come back to.",
    laneBody: "Daily duas and private reflection stay close without turning a sincere moment into another noisy feed.",
    laneTags: ["Authentic duas", "Private journal", "Saved to your profile"],
  },
];

const FACTS = [
  {
    title: "Core app free",
    body: "Reading, hifz, and dua stay usable without a subscription wall.",
    icon: ShieldCheck,
  },
  {
    title: "Your place stays with you",
    body: "Sign in when you want progress, journal, and preferences on any device.",
    icon: Bookmark,
  },
  {
    title: "Browser first",
    body: "Start on the web. Install later only if it earns space on your home screen.",
    icon: Headphones,
  },
] as const;

const FLOW = [
  {
    step: "01",
    title: "Open the lane you need today",
    body: "Read, review, or make dua. The first move should feel obvious without studying the product first.",
  },
  {
    step: "02",
    title: "Do one honest thing",
    body: "A page resumed, a review protected, or a dua revisited is enough to keep the return alive.",
  },
  {
    step: "03",
    title: "Leave with your place saved",
    body: "When you come back tomorrow, Hifzer should remember the thread so you do not have to start from shame again.",
  },
] as const;

export function LandingHome() {
  const reduceMotion = useReducedMotion();
  const { isSignedIn } = usePublicAuth();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const timerId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % SHOWCASE_MODES.length);
    }, 4800);

    return () => {
      window.clearInterval(timerId);
    };
  }, [reduceMotion]);

  const activeMode = SHOWCASE_MODES[activeIndex] ?? SHOWCASE_MODES[0];

  return (
    <div className={styles.page}>
      <section className="pt-4 md:pt-6">
        <motion.div
          className={styles.heroShell}
          initial="hidden"
          animate="show"
          variants={{
            show: {
              transition: {
                staggerChildren: reduceMotion ? 0 : 0.08,
              },
            },
          }}
        >
          <div className={styles.heroGrid}>
            <div className="min-w-0">
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
                <Pill tone="brand">Core app free</Pill>
                <Pill tone="accent">Reading, hifz, dua</Pill>
                <Pill tone="neutral">Built for a calmer return</Pill>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="kw-marketing-display mt-6 max-w-[11ch] text-balance text-[clamp(3rem,7vw,5.8rem)] leading-[0.9] tracking-[-0.06em] text-[color:var(--kw-ink)]"
              >
                A quieter place to keep up with Qur&apos;an.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-5 max-w-[35rem] text-pretty text-base leading-8 text-[color:var(--kw-muted)] md:text-[1.05rem]"
              >
                Read where you left off, keep hifz review steady, and carry daily duas in one calm space that stays useful instead of loud.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <PublicAuthLink signedInHref="/today" signedOutHref="/signup">
                    {isSignedIn ? "Return to today" : "Begin free"} <ArrowRight size={18} />
                  </PublicAuthLink>
                </Button>

                <Button asChild size="lg" variant="secondary">
                  <TrackedLink href="/quran-preview" telemetryName="landing.preview-reader">
                    Preview the reader <Play size={18} />
                  </TrackedLink>
                </Button>
              </motion.div>

              <motion.p
                variants={fadeUp}
                className="mt-4 text-sm leading-7 text-[color:var(--kw-muted)]"
              >
                Start in the browser. Sign in when you want your place, progress, and private journal saved to your account across devices.
              </motion.p>

              <motion.div variants={fadeUp} className={styles.factGrid}>
                {FACTS.map((fact) => {
                  const Icon = fact.icon;

                  return (
                    <div key={fact.title} className={styles.factCard}>
                      <span className={styles.factIcon}>
                        <Icon size={18} />
                      </span>
                      <p className="mt-4 text-sm font-semibold text-[color:var(--kw-ink)]">
                        {fact.title}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                        {fact.body}
                      </p>
                    </div>
                  );
                })}
              </motion.div>
            </div>

            <motion.div variants={fadeUp} className={styles.previewShell}>
              <div className={styles.previewGlow} aria-hidden />
              <WindLines className={styles.previewLines} animated={!reduceMotion} />

              <div className={styles.modeRail} role="tablist" aria-label="Hifzer lanes">
                {SHOWCASE_MODES.map((mode, index) => (
                  <button
                    key={mode.id}
                    type="button"
                    role="tab"
                    aria-selected={index === activeIndex}
                    onClick={() => setActiveIndex(index)}
                    className={clsx(
                      styles.modeButton,
                      index === activeIndex && styles.modeButtonActive,
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMode.id}
                  className={styles.previewCard}
                  initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
                  transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--kw-faint)]">
                        {activeMode.eyebrow}
                      </p>
                      <h2 className="mt-3 max-w-[13ch] text-balance text-[clamp(1.7rem,4vw,2.4rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-[color:var(--kw-ink)]">
                        {activeMode.title}
                      </h2>
                    </div>

                    <Pill tone={activeMode.tone}>{activeMode.pill}</Pill>
                  </div>

                  <p className="mt-4 max-w-[34rem] text-sm leading-7 text-[color:var(--kw-muted)] md:text-[0.98rem]">
                    {activeMode.body}
                  </p>

                  <div className={styles.signalGrid}>
                    {activeMode.signals.map((signal) => (
                      <div key={signal} className={styles.signalCard}>
                        <span className={styles.signalDot} aria-hidden />
                        <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{signal}</p>
                      </div>
                    ))}
                  </div>

                  <div className={styles.metricGrid}>
                    {activeMode.metrics.map((metric) => (
                      <div key={metric.label} className={styles.metricCard}>
                        <p className="text-xl font-semibold tracking-[-0.04em] text-[color:var(--kw-ink)]">
                          {metric.value}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                          {metric.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <motion.div
                className={styles.floatingChip}
                animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
                transition={{
                  duration: 7.2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                Browser first
              </motion.div>

              <motion.div
                className={styles.floatingChipAlt}
                animate={reduceMotion ? undefined : { y: [0, 7, 0] }}
                transition={{
                  duration: 8.4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                Sync with your account
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section id="experience" className={styles.section}>
        <div className={styles.sectionLead}>
          <Pill tone="neutral">Three clear lanes</Pill>
          <h2 className="kw-marketing-display mt-4 text-balance text-[clamp(2.2rem,4.8vw,4rem)] leading-[0.94] tracking-[-0.05em] text-[color:var(--kw-ink)]">
            Open what you need today.
          </h2>
          <p className="mt-4 max-w-[42rem] text-base leading-8 text-[color:var(--kw-muted)]">
            Hifzer keeps reading, memorization, and dua distinct, so the page stays simple and you can stay with the part of worship you came for.
          </p>
        </div>

        <div className={styles.laneGrid}>
          {SHOWCASE_MODES.map((mode) => {
            const Icon = mode.icon;

            return (
              <motion.article
                key={mode.id}
                className={styles.laneCard}
                data-tone={mode.tone}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="flex items-center gap-3">
                  <span className={styles.laneIcon}>
                    <Icon size={18} />
                  </span>
                  <Pill tone={mode.tone}>{mode.label}</Pill>
                </div>

                <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--kw-ink)]">
                  {mode.laneTitle}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)] md:text-[0.98rem]">
                  {mode.laneBody}
                </p>

                <div className={styles.tagRail}>
                  {mode.laneTags.map((tag) => (
                    <span key={tag} className={styles.tagChip}>
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section id="flow" className={styles.section}>
        <div className={styles.flowShell}>
          <div className={styles.sectionLead}>
            <Pill tone="accent">Keep the routine small</Pill>
            <h2 className="kw-marketing-display mt-4 text-balance text-[clamp(2.2rem,4.6vw,3.7rem)] leading-[0.95] tracking-[-0.05em] text-[color:var(--kw-ink)]">
              A daily flow that feels possible.
            </h2>
            <p className="mt-4 max-w-[42rem] text-base leading-8 text-[color:var(--kw-muted)]">
              Your routine does not need more pressure. It just needs the next honest step to stay obvious: open, continue, leave with your place saved.
            </p>
          </div>

          <div className={styles.flowGrid}>
            {FLOW.map((item) => (
              <motion.article
                key={item.step}
                className={styles.flowCard}
                whileHover={reduceMotion ? undefined : { y: -3 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <span className={styles.flowIndex}>{item.step}</span>
                <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-[color:var(--kw-ink)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)] md:text-[0.98rem]">
                  {item.body}
                </p>
              </motion.article>
            ))}
          </div>

          <div className={styles.flowQuote}>
            <Sparkles size={16} />
            <p className="text-sm leading-7 text-[color:var(--kw-muted)]">
              Hifzer is built to keep the next sincere step close: a page to resume, a review to protect, and a dua to carry.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <motion.div
          className={styles.finalShell}
          initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className={styles.finalGrid}>
            <div>
              <Pill tone="brand">Start quietly</Pill>
              <h2 className="kw-marketing-display mt-4 max-w-[12ch] text-balance text-[clamp(2.2rem,4.6vw,3.9rem)] leading-[0.95] tracking-[-0.05em] text-[color:var(--kw-ink)]">
                Keep the next step small enough to keep.
              </h2>
              <p className="mt-4 max-w-[40rem] text-base leading-8 text-[color:var(--kw-muted)]">
                Begin in the browser. Create your free space when you want Hifzer to keep your place, progress, and private journal with your profile on every device.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <PublicAuthLink signedInHref="/today" signedOutHref="/signup">
                  {isSignedIn ? "Return to today" : "Create my free space"}{" "}
                  <ArrowRight size={18} />
                </PublicAuthLink>
              </Button>

              <Button asChild size="lg" variant="secondary">
                <TrackedLink href="/quran-preview" telemetryName="landing.final.preview">
                  Preview first
                </TrackedLink>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
