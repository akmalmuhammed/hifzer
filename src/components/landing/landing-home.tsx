"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  AudioLines,
  BookOpenText,
  Globe2,
  HandHeart,
  LockKeyhole,
  NotebookPen,
  RefreshCcw,
  ScrollText,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import clsx from "clsx";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { QURAN_TRANSLATION_OPTIONS } from "@/hifzer/quran/translation-prefs";
import styles from "./landing-home.module.css";

type Tone = "brand" | "accent" | "warn" | "neutral";

type HeroDetail = {
  title: string;
  body: string;
  icon: LucideIcon;
};

type ModuleCard = {
  id: string;
  label: string;
  headline: string;
  body: string;
  tags: string[];
  icon: LucideIcon;
  tone: Tone;
  featured?: boolean;
};

type PrincipleCard = {
  title: string;
  body: string;
};

type PromiseCard = {
  title: string;
  body: string;
  icon: LucideIcon;
  tone: Tone;
  showTranslationRail?: boolean;
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const HERO_DETAILS: HeroDetail[] = [
  {
    title: "Qur'an reading",
    body: "Saved place, trusted reciters, bookmarks, and 7 translation options stay ready.",
    icon: AudioLines,
  },
  {
    title: "Hifz structure",
    body: "Sabaq, Sabqi, and Manzil stay separate so review stays honest before you add more.",
    icon: RefreshCcw,
  },
  {
    title: "Dua and journal",
    body: "Taught duas and private reflection stay close without turning into another feed.",
    icon: HandHeart,
  },
  {
    title: "Return on any device",
    body: "Begin in the browser now, then add Hifzer to your phone only if it earns the space.",
    icon: Smartphone,
  },
];

const MODULES: ModuleCard[] = [
  {
    id: "hifz",
    label: "Memorization",
    headline: "Protect review before adding more.",
    body:
      "The traditional Sabaq, Sabqi, and Manzil method, supported by per-ayah review across all 6,236 ayahs. Hifzer keeps the lanes clear, catches slips early, and adapts when review debt starts growing.",
    tags: ["Sabaq / Sabqi / Manzil", "Per-ayah tracking", "Adaptive modes"],
    icon: RefreshCcw,
    tone: "brand",
    featured: true,
  },
  {
    id: "quran",
    label: "Reading",
    headline: "Return to the ayah that was waiting for you.",
    body:
      "Saved place, trusted reciters, bookmarks, and translation stay close but never crowded. Resume in one tap from wherever you stopped.",
    tags: ["7 translations", "Audio", "Bookmarks", "Reading progress"],
    icon: BookOpenText,
    tone: "accent",
  },
  {
    id: "dua",
    label: "Supplications",
    headline: "Keep taught words near when the day gets heavy.",
    body:
      "Categorized duas for the moments you actually revisit. Arabic, transliteration, and translation stay together, with custom decks and private notes nearby.",
    tags: ["Categorized", "Custom decks", "Private notes"],
    icon: HandHeart,
    tone: "warn",
  },
  {
    id: "guides",
    label: "Islamic guides",
    headline: "The basics you needed someone to just show you.",
    body:
      "A growing how-to space for practical worship questions and guided practice moments, written to stay clear, calm, and easy to revisit.",
    tags: ["Practical", "Clear", "Growing library"],
    icon: ScrollText,
    tone: "neutral",
  },
  {
    id: "journal",
    label: "Personal",
    headline: "A place to put what the heart is holding.",
    body:
      "Write intentions, gratitude, and reflections. Link entries to specific duas, keep them tied to your account, and return to them without sharing them publicly.",
    tags: ["Private", "Linked to duas", "Synced"],
    icon: NotebookPen,
    tone: "accent",
  },
];

const PRINCIPLES: PrincipleCard[] = [
  {
    title: "Active Recall",
    body:
      "Retrieval beats re-reading. Retention is built by reciting from memory, not repeatedly looking at the text.",
  },
  {
    title: "Review Floor",
    body:
      "Review dominates new. Most daily time must protect what was already learned, or forgetting starts to win.",
  },
  {
    title: "Backlog Control",
    body:
      "When review debt grows, new memorization has to slow down. The system protects what is already fragile before asking for more.",
  },
  {
    title: "Linking",
    body:
      "Most \"I forgot\" moments happen at the seam between one ayah and the next. Hifzer trains those transitions explicitly.",
  },
];

const PROMISES: PromiseCard[] = [
  {
    title: "Core practice stays open",
    body:
      "Reading, hifz, duas, and the first layer of your private space should stay useful without a subscription wall around the basics.",
    icon: ShieldCheck,
    tone: "brand",
  },
  {
    title: "Your journal is yours",
    body:
      "Private reflections stay attached to your account and are never turned into a public feed or shared surface.",
    icon: LockKeyhole,
    tone: "accent",
  },
  {
    title: "Works on any device",
    body:
      "Use it in the browser first. When it earns a place, add it to your home screen on phone or tablet without needing an app store.",
    icon: Smartphone,
    tone: "neutral",
  },
  {
    title: "Built for the global ummah",
    body:
      "The reader already supports the languages people actually return with, and the translation layer keeps growing carefully.",
    icon: Globe2,
    tone: "warn",
    showTranslationRail: true,
  },
];

const TRANSLATION_LABELS = QURAN_TRANSLATION_OPTIONS.map((option) => option.label.split(" - ")[0] ?? option.label);
const SCROLLING_TRANSLATIONS = [...TRANSLATION_LABELS, ...TRANSLATION_LABELS];

export function LandingHome() {
  const reduceMotion = useReducedMotion();
  const { isSignedIn } = usePublicAuth();
  const previewHref = isSignedIn ? "/quran" : "/quran-preview";

  return (
    <div className={styles.page}>
      <section className={styles.heroSection}>
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
              <motion.div variants={fadeUp} className={styles.heroIntro}>
                <Pill tone="brand">Five modules. One daily practice.</Pill>
                <span className={styles.heroMeta}>Calm by design</span>
              </motion.div>

              <motion.h1 variants={fadeUp} className={styles.heroTitle}>
                Your Qur&apos;an, your hifz, your dua, and your Islamic journal in one place.
              </motion.h1>

              <motion.p variants={fadeUp} className={styles.heroSummary}>
                Hifzer brings together Qur&apos;an reading, memorization, daily duas, Islamic
                guides, and a personal journal in one space that feels clear instead of stacked.
              </motion.p>

              <motion.div variants={fadeUp} className={styles.heroActions}>
                <Button asChild size="lg">
                  <PublicAuthLink signedInHref="/today" signedOutHref="/signup">
                    Open App <ArrowRight size={18} />
                  </PublicAuthLink>
                </Button>

                <Button asChild size="lg" variant="secondary">
                  <TrackedLink href={previewHref} telemetryName="landing.hero.preview-reader">
                    {isSignedIn ? "Open the reader" : "Preview the reader"}
                  </TrackedLink>
                </Button>
              </motion.div>

              <motion.p variants={fadeUp} className={styles.heroMicro}>
                No subscription. No card required. Begin in the browser, then add it to your phone
                when it genuinely earns the place.
              </motion.p>
            </div>

            <motion.aside variants={fadeUp} className={styles.heroPanel}>
              <div className={styles.heroPanelHeader}>
                <p className={styles.eyebrow}>A calmer home for daily return</p>
                <h2 className={styles.heroPanelTitle}>
                  Each lane stays separate enough to feel simple when life is full.
                </h2>
              </div>

              <div className={styles.heroStatGrid}>
                <div className={styles.heroStatCard}>
                  <p className={styles.heroStatValue}>5</p>
                  <p className={styles.heroStatLabel}>modules</p>
                </div>
                <div className={styles.heroStatCard}>
                  <p className={styles.heroStatValue}>7</p>
                  <p className={styles.heroStatLabel}>translation options</p>
                </div>
                <div className={styles.heroStatCard}>
                  <p className={styles.heroStatValue}>6,236</p>
                  <p className={styles.heroStatLabel}>ayahs tracked</p>
                </div>
              </div>

              <div className={styles.heroDetailList}>
                {HERO_DETAILS.map((detail) => {
                  const Icon = detail.icon;

                  return (
                    <article key={detail.title} className={styles.heroDetailCard}>
                      <span className={styles.heroDetailIcon}>
                        <Icon size={16} />
                      </span>
                      <div>
                        <p className={styles.heroDetailTitle}>{detail.title}</p>
                        <p className={styles.heroDetailBody}>{detail.body}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </motion.aside>
          </div>
        </motion.div>
      </section>

      <section id="companion" className={styles.section}>
        <div className={styles.sectionLead}>
          <Pill tone="accent">Five modules. One daily practice.</Pill>
          <h2 className={styles.sectionTitle}>
            Everything you need for a consistent deen. Nothing you don&apos;t.
          </h2>
          <p className={styles.sectionText}>
            Each module carries a different weight, so each one gets its own space. Nothing has to
            compete for your attention.
          </p>
        </div>

        <div className={styles.moduleGrid}>
          {MODULES.map((module) => {
            const Icon = module.icon;

            return (
              <motion.article
                key={module.id}
                className={clsx(styles.moduleCard, module.featured && styles.moduleCardFeatured)}
                data-tone={module.tone}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className={styles.moduleHeader}>
                  <span className={styles.moduleIcon}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className={styles.moduleLabel}>{module.label}</p>
                    <h3 className={styles.moduleTitle}>{module.headline}</h3>
                  </div>
                </div>

                <p className={styles.moduleBody}>{module.body}</p>

                <div className={styles.moduleTags}>
                  {module.tags.map((tag) => (
                    <span key={`${module.id}-${tag}`} className={styles.moduleTag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.gapShell}>
          <Pill tone="brand">Why Hifzer exists</Pill>
          <h2 className={styles.gapTitle}>The gap between who you are and who you want to be.</h2>
          <p className={styles.gapBody}>
            It is not about ability. It is about consistency. And consistency gets easier when
            returning feels less costly than delaying.
          </p>
        </div>
      </section>

      <section id="method" className={styles.section}>
        <div className={styles.sectionLead}>
          <Pill tone="neutral">Built on tradition. Verified by science.</Pill>
          <h2 className={styles.sectionTitle}>Hifz done the right way, and the research agrees.</h2>
          <p className={styles.sectionText}>
            Traditional hifz methodology and modern memory science arrive at the same foundations.
            Hifzer is built to respect both.
          </p>
        </div>

        <div className={styles.principleGrid}>
          {PRINCIPLES.map((principle, index) => (
            <motion.article
              key={principle.title}
              className={styles.principleCard}
              whileHover={reduceMotion ? undefined : { y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <span className={styles.principleIndex}>0{index + 1}</span>
              <h3 className={styles.principleTitle}>{principle.title}</h3>
              <p className={styles.principleBody}>{principle.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionLead}>
          <Pill tone="warn">Our commitments</Pill>
          <h2 className={styles.sectionTitle}>Built around trust, not retention metrics.</h2>
        </div>

        <div className={styles.promiseGridNew}>
          {PROMISES.map((promise) => {
            const Icon = promise.icon;

            return (
              <article key={promise.title} className={styles.promiseCardNew} data-tone={promise.tone}>
                <div className={styles.promiseHeaderNew}>
                  <span className={styles.promiseIconNew}>
                    <Icon size={17} />
                  </span>
                  <h3 className={styles.promiseTitleNew}>{promise.title}</h3>
                </div>

                <p className={styles.promiseBodyNew}>{promise.body}</p>

                {promise.showTranslationRail ? (
                  <div className={styles.translationRail} aria-label="Supported translation languages">
                    <div className={styles.translationTrack}>
                      {SCROLLING_TRANSLATIONS.map((label, index) => (
                        <span key={`${label}-${index}`} className={styles.translationChip}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <motion.div
          className={styles.finalShell}
          initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className={styles.finalGrid}>
            <div>
              <Pill tone={isSignedIn ? "brand" : "accent"}>Begin today. Hifzer is yours.</Pill>
              <h2 className={styles.finalTitle}>Start the routine you&apos;ve been putting off.</h2>
              <p className={styles.finalBody}>
                Begin in the browser. Your place, your progress, and your private journal stay ready
                whenever you return. Your deen. Your pace. No drama.
              </p>
              <p className={styles.finalSupport}>
                Need private features or custom product work?{" "}
                <PublicAuthLink
                  signedInHref="/support"
                  signedOutHref="/login?redirect_url=%2Fsupport"
                  className={styles.inlineLink}
                >
                  Request it in support
                </PublicAuthLink>
                .
              </p>
              <p className={styles.finalMicro}>
                No subscription. No card required. Install on your phone from the browser.
              </p>
            </div>

            <div className={styles.finalActions}>
              <Button asChild size="lg">
                <PublicAuthLink signedInHref="/today" signedOutHref="/signup">
                  {isSignedIn ? "Open App" : "Create my free space"} <ArrowRight size={18} />
                </PublicAuthLink>
              </Button>

              <Button asChild size="lg" variant="secondary">
                <TrackedLink href={previewHref} telemetryName="landing.final.preview">
                  {isSignedIn ? "Open the reader" : "Preview first - no account needed"}
                </TrackedLink>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
