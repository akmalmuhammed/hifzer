"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpenText,
  Bookmark,
  HandHeart,
  Headphones,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  SquarePen,
} from "lucide-react";
import clsx from "clsx";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import styles from "./landing-home.module.css";

type Tone = "brand" | "accent" | "warn";

type LaneShowcase = {
  id: string;
  label: string;
  eyebrow: string;
  tone: Tone;
  icon: LucideIcon;
  heroTitle: string;
  heroBody: string;
  signals: string[];
  guideTitle: string;
  guideBody: string;
  laneTitle: string;
  laneBody: string;
  lanePoints: string[];
  note: string;
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

const LANES: LaneShowcase[] = [
  {
    id: "quran",
    label: "Qur'an",
    eyebrow: "Reading lane",
    tone: "accent",
    icon: BookOpenText,
    heroTitle: "Return to the ayah that was waiting for you.",
    heroBody:
      "Saved place, translation, recitation audio, and bookmarks stay nearby without pulling you into a crowded study dashboard.",
    signals: [
      "Resume in one tap",
      "Trusted reciters nearby",
      "Bookmarks and translation stay close",
    ],
    guideTitle: "When you open it",
    guideBody:
      "The reader remembers your thread first, then keeps audio and translation close enough to help without competing for attention.",
    laneTitle: "A reading space that remembers your thread.",
    laneBody:
      "Continue naturally from where you stopped, keep your reciter close, and avoid the friction of rebuilding your place every day.",
    lanePoints: ["Saved place", "Translation on demand", "Audio and bookmarks"],
    note: "Quiet enough for recitation, practical enough for real life.",
  },
  {
    id: "hifz",
    label: "Hifz",
    eyebrow: "Memorization lane",
    tone: "brand",
    icon: RefreshCcw,
    heroTitle: "Protect review before adding more.",
    heroBody:
      "Sabaq, Sabqi, and Manzil stay distinct so your memorization can be steady without turning into a guilt-driven scoreboard.",
    signals: [
      "Traditional lanes stay clear",
      "Catch slips before they spread",
      "Catch-up stays gentle after missed days",
    ],
    guideTitle: "When routine breaks",
    guideBody:
      "The next honest revision still stays obvious, so a missed day does not make the whole path feel lost.",
    laneTitle: "Memorization with structure, not pressure.",
    laneBody:
      "Hifzer keeps the classic review lanes visible, helps you return after gaps, and avoids turning sacred work into noisy productivity theatre.",
    lanePoints: ["Sabaq / Sabqi / Manzil", "Gentle catch-up", "Honest progress"],
    note: "Designed to support discipline without harshness.",
  },
  {
    id: "dua",
    label: "Dua",
    eyebrow: "Dua lane",
    tone: "warn",
    icon: HandHeart,
    heroTitle: "Keep taught words near when the day feels heavy.",
    heroBody:
      "Daily duas, transliteration, and private notes can live together without making the page feel like another endless feed.",
    signals: [
      "Arabic, transliteration, translation",
      "Private notes tied to your account",
      "A calmer place to return at night",
    ],
    guideTitle: "When words feel far away",
    guideBody:
      "The duas you revisit and the reflections you save stay close without pretending to replace sincerity or presence.",
    laneTitle: "A quieter home for dua and reflection.",
    laneBody:
      "Carry taught words, save the ones you revisit, and keep a private journal nearby when you want to remember what the heart was holding.",
    lanePoints: ["Authentic duas", "Private journal", "Saved to your profile"],
    note: "Honest about privacy and built for return, not performance.",
  },
];

const PROMISES: Array<{
  title: string;
  body: string;
  icon: LucideIcon;
}> = [
  {
    title: "Core app free",
    body: "Reading, hifz, and dua stay useful without a subscription wall around the basics.",
    icon: ShieldCheck,
  },
  {
    title: "Your place stays with you",
    body: "Sign in when you want your reader progress, preferences, and journal across devices.",
    icon: Bookmark,
  },
  {
    title: "Private reflection nearby",
    body: "Keep notes close to your account without turning the whole experience into social noise.",
    icon: LockKeyhole,
  },
] as const;

const RHYTHM = [
  {
    step: "01",
    title: "Open the lane that matches today",
    body: "Reading, memorization, and dua stay distinct so the first choice feels obvious instead of mentally expensive.",
  },
  {
    step: "02",
    title: "Do one honest thing",
    body: "Resume a page, protect a review, or revisit a dua. The routine only has to be real, not theatrical.",
  },
  {
    step: "03",
    title: "Leave with the thread intact",
    body: "Tomorrow should feel like a return, not a reset. Hifzer keeps enough context that you can come back gently.",
  },
] as const;

const COMPANION_NOTES: Array<{
  title: string;
  body: string;
  icon: LucideIcon;
}> = [
  {
    title: "Continue reading",
    body: "Saved place, translation, and trusted reciters stay close.",
    icon: BookOpenText,
  },
  {
    title: "Protect review",
    body: "Sabaq, Sabqi, and Manzil remain visibly separate.",
    icon: RefreshCcw,
  },
  {
    title: "Carry dua and reflection",
    body: "Duas and private notes remain nearby when the day changes tone.",
    icon: SquarePen,
  },
  {
    title: "Start in the browser",
    body: "No fake install pressure. Add it later if it truly earns a place.",
    icon: Headphones,
  },
] as const;

export function LandingHome() {
  const reduceMotion = useReducedMotion();
  const { isSignedIn } = usePublicAuth();
  const [activeIndex, setActiveIndex] = useState(0);

  const activeLane = LANES[activeIndex] ?? LANES[0];
  const secondaryHref = isSignedIn ? "/quran" : "/quran-preview";
  const secondaryLabel = isSignedIn ? "Open the reader" : "Preview the reader";

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
            <div className={styles.heroCopy}>
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
                <Pill tone="brand">Core app free</Pill>
                <Pill tone="accent">Reading, hifz, dua</Pill>
                <Pill tone="neutral">Built for a calmer return</Pill>
              </motion.div>

              <motion.p variants={fadeUp} className={styles.eyebrow}>
                A quieter Qur&apos;an companion for real days.
              </motion.p>

              <motion.h1
                variants={fadeUp}
                className="kw-marketing-display mt-5 max-w-[11ch] text-balance text-[clamp(3.2rem,7vw,6.2rem)] leading-[0.88] tracking-[-0.065em] text-[color:var(--kw-ink)]"
              >
                The gentlest way back to Qur&apos;an on a full day.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-5 max-w-[39rem] text-pretty text-base leading-8 text-[color:var(--kw-muted)] md:text-[1.06rem]"
              >
                Read where you stopped, protect review before adding more, and keep daily duas plus private reflection in one clear place that stays calm instead of crowded.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <PublicAuthLink signedInHref="/today" signedOutHref="/signup">
                    {isSignedIn ? "Return to today" : "Begin free"} <ArrowRight size={18} />
                  </PublicAuthLink>
                </Button>

                <Button asChild size="lg" variant="secondary">
                  <TrackedLink href={secondaryHref} telemetryName="landing.hero.secondary-reader">
                    {secondaryLabel}
                  </TrackedLink>
                </Button>
              </motion.div>

              <motion.p variants={fadeUp} className={styles.heroCaption}>
                {isSignedIn
                  ? "Your reader, review flow, and journal are ready when you are."
                  : "Start in the browser. Sign in when you want your place, progress, and private journal kept across devices."}
              </motion.p>

              <motion.div variants={fadeUp} className={styles.promiseGrid}>
                {PROMISES.map((promise) => {
                  const Icon = promise.icon;

                  return (
                    <article key={promise.title} className={styles.promiseCard}>
                      <span className={styles.promiseIcon}>
                        <Icon size={18} />
                      </span>
                      <h2 className={styles.promiseTitle}>{promise.title}</h2>
                      <p className={styles.promiseBody}>{promise.body}</p>
                    </article>
                  );
                })}
              </motion.div>
            </div>

            <motion.div variants={fadeUp} className={styles.studioShell}>
              <div className={styles.studioAura} aria-hidden />
              <div className={styles.studioHeader}>
                <div>
                  <p className={styles.studioEyebrow}>Today&apos;s return</p>
                  <h2 className={styles.studioHeading}>Choose the lane that fits the moment.</h2>
                </div>
                <Pill tone={activeLane.tone}>{activeLane.label}</Pill>
              </div>

              <div className={styles.modeRail} role="tablist" aria-label="Hifzer lanes">
                {LANES.map((lane, index) => (
                  <button
                    key={lane.id}
                    type="button"
                    role="tab"
                    aria-selected={activeIndex === index}
                    onClick={() => setActiveIndex(index)}
                    className={clsx(
                      styles.modeButton,
                      activeIndex === index && styles.modeButtonActive,
                    )}
                  >
                    {lane.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.article
                  key={activeLane.id}
                  className={styles.manuscriptCard}
                  initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -18 }}
                  transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }}
                >
                  <div className={styles.manuscriptMeta}>
                    <span>{activeLane.eyebrow}</span>
                    <span>Quiet by design</span>
                  </div>

                  <h3 className={styles.manuscriptTitle}>{activeLane.heroTitle}</h3>
                  <p className={styles.manuscriptBody}>{activeLane.heroBody}</p>

                  <div className={styles.threadList}>
                    {activeLane.signals.map((signal) => (
                      <div key={signal} className={styles.threadRow}>
                        <span className={styles.threadMarker} aria-hidden />
                        <p>{signal}</p>
                      </div>
                    ))}
                  </div>
                </motion.article>
              </AnimatePresence>

              <div className={styles.compassGrid}>
                <article className={styles.compassCard}>
                  <p className={styles.compassLabel}>{activeLane.guideTitle}</p>
                  <p className={styles.compassBody}>{activeLane.guideBody}</p>
                </article>

                <article className={styles.compassCard}>
                  <p className={styles.compassLabel}>Quiet promise</p>
                  <p className={styles.compassBody}>{activeLane.note}</p>
                </article>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section id="experience" className={styles.section}>
        <div className={styles.sectionLead}>
          <Pill tone="neutral">Three clear doors</Pill>
          <h2 className="kw-marketing-display mt-4 max-w-[12ch] text-balance text-[clamp(2.3rem,4.9vw,4.3rem)] leading-[0.93] tracking-[-0.055em] text-[color:var(--kw-ink)]">
            One companion, three distinct ways to return.
          </h2>
          <p className="mt-4 max-w-[43rem] text-base leading-8 text-[color:var(--kw-muted)]">
            Hifzer does not blur reading, memorization, and dua into one vague system. Each lane has a different emotional weight, so each one gets its own calm shape.
          </p>
        </div>

        <div className={styles.experienceGrid}>
          {LANES.map((lane) => {
            const Icon = lane.icon;

            return (
              <motion.article
                key={lane.id}
                className={styles.laneCard}
                data-tone={lane.tone}
                whileHover={reduceMotion ? undefined : { y: -5 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className={styles.laneTop}>
                  <span className={styles.laneIcon}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className={styles.laneEyebrow}>{lane.eyebrow}</p>
                    <h3 className={styles.laneTitle}>{lane.laneTitle}</h3>
                  </div>
                </div>

                <p className={styles.laneBody}>{lane.laneBody}</p>

                <div className={styles.tagRail}>
                  {lane.lanePoints.map((point) => (
                    <span key={point} className={styles.tagChip}>
                      {point}
                    </span>
                  ))}
                </div>

                <p className={styles.laneNote}>{lane.note}</p>
              </motion.article>
            );
          })}
        </div>

        <div className={styles.accountStrip}>
          {COMPANION_NOTES.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className={styles.accountCard}>
                <span className={styles.accountIcon}>
                  <Icon size={16} />
                </span>
                <div>
                  <p className={styles.accountTitle}>{item.title}</p>
                  <p className={styles.accountBody}>{item.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="flow" className={styles.section}>
        <div className={styles.flowShell}>
          <div className={styles.sectionLead}>
            <Pill tone="accent">Keep the return small</Pill>
            <h2 className="kw-marketing-display mt-4 max-w-[12ch] text-balance text-[clamp(2.2rem,4.7vw,4rem)] leading-[0.94] tracking-[-0.055em] text-[color:var(--kw-ink)]">
              A daily rhythm shaped for ordinary life.
            </h2>
            <p className="mt-4 max-w-[42rem] text-base leading-8 text-[color:var(--kw-muted)]">
              The goal is not to perform spiritual ambition on a dashboard. It is to keep the next sincere step visible enough that you can keep returning.
            </p>
          </div>

          <div className={styles.flowGrid}>
            {RHYTHM.map((item) => (
              <motion.article
                key={item.step}
                className={styles.flowCard}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <span className={styles.flowIndex}>{item.step}</span>
                <h3 className={styles.flowTitle}>{item.title}</h3>
                <p className={styles.flowBody}>{item.body}</p>
              </motion.article>
            ))}

            <aside className={styles.memoryCard}>
              <Pill tone="brand">What Hifzer protects</Pill>
              <h3 className={styles.memoryTitle}>Enough memory to make tomorrow easier.</h3>
              <p className={styles.memoryLead}>
                Saved place, review structure, duas, and reflection stay close so you do not have to rebuild the relationship from zero every time.
              </p>

              <div className={styles.memoryList}>
                {COMPANION_NOTES.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className={styles.memoryItem}>
                      <span className={styles.memoryIcon}>
                        <Icon size={16} />
                      </span>
                      <div>
                        <p className={styles.memoryItemTitle}>{item.title}</p>
                        <p className={styles.memoryItemBody}>{item.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
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
              <Pill tone={isSignedIn ? "brand" : "accent"}>
                {isSignedIn ? "Continue gently" : "Begin quietly"}
              </Pill>
              <h2 className="kw-marketing-display mt-4 max-w-[11ch] text-balance text-[clamp(2.3rem,4.8vw,4rem)] leading-[0.94] tracking-[-0.055em] text-[color:var(--kw-ink)]">
                {isSignedIn ? "Keep the thread alive today." : "Keep the next step small enough to keep."}
              </h2>
              <p className="mt-4 max-w-[40rem] text-base leading-8 text-[color:var(--kw-muted)]">
                {isSignedIn
                  ? "Return to your saved place, protected review, and private journal without stepping back into marketing noise."
                  : "Begin in the browser, then let Hifzer keep your place, progress, and private reflection whenever you decide it has earned room in your routine."}
              </p>
            </div>

            <div className={styles.finalActions}>
              <Button asChild size="lg">
                <PublicAuthLink signedInHref="/today" signedOutHref="/signup">
                  {isSignedIn ? "Return to today" : "Create my free space"}{" "}
                  <ArrowRight size={18} />
                </PublicAuthLink>
              </Button>

              <Button asChild size="lg" variant="secondary">
                <TrackedLink href={secondaryHref} telemetryName="landing.final.secondary-reader">
                  {isSignedIn ? "Open the reader" : "Preview first"}
                </TrackedLink>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
