"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  BookMarked,
  BookOpenText,
  Check,
  Heart,
  LineChart,
  Lock,
  MessageCircleQuestion,
  PenLine,
  Sparkles,
} from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { Button } from "@/components/ui/button";
import { GroundedGuidanceDemo } from "./grounded-guidance-demo";
import styles from "./landing.module.css";

type ShowcaseImage = {
  src: string;
  alt: string;
};

const showcaseImages = {
  dashboard: {
    src: "/landing/showcase/dashboard.webp",
    alt: "Hifzer dashboard with Qur'an progress, hifz review, dua, and journal surfaces.",
  },
  hifz: {
    src: "/landing/showcase/Hifz%20final.webp",
    alt: "Hifzer hifz review screen with structured recall and revision controls.",
  },
  dua: {
    src: "/landing/showcase/Dua.webp",
    alt: "Hifzer dua screen with Arabic, transliteration, and meaning.",
  },
  journal: {
    src: "/landing/showcase/Journal%20final.webp",
    alt: "Hifzer private journal screen with Qur'an reflections.",
  },
} satisfies Record<string, ShowcaseImage>;

const routineSteps = [
  {
    label: "Read",
    title: "Begin where your Qur'an time starts.",
    body: "Open the ayah you were with, choose the reciter, and keep translation or tafsir close.",
  },
  {
    label: "Retain",
    title: "Protect what you are memorizing.",
    body: "See the sabaq, sabqi, and manzil work that needs attention before weak spots fade.",
  },
  {
    label: "Reflect",
    title: "Let the moment stay with you.",
    body: "Save a bookmark, write a private note, or carry a dua into the rest of your day.",
  },
] as const;

const hifzMetrics = [
  ["Sabaq", "2 ayahs", "New memorization for today"],
  ["Sabqi", "7 min", "Recently memorized revision"],
  ["Manzil", "82%", "Long-term retention health"],
  ["Fading soon", "3", "Passages needing care"],
] as const;

const assistantSources = [
  "Official ayah context",
  "Tafsir summaries",
  "Matched ayahs",
  "Source labels",
] as const;

const continuityFeatures = [
  ["Reading place", "Resume from the exact ayah you last touched."],
  ["Hifz review", "Keep sabaq, sabqi, and manzil visible."],
  ["Bookmarks and notes", "Save ayahs, categories, and reflections together."],
  ["Dua and journal", "Return to personal worship moments privately."],
] as const;

const faqs = [
  {
    q: "Who is Hifzer for?",
    a: "For Muslims who want a steadier relationship with the Qur'an, whether they are reading daily, memorizing, revising, making dua, or reflecting privately.",
  },
  {
    q: "Is Hifzer only for hifz students?",
    a: "No. Hifz is a deep part of the app, but the product is built around staying connected to the Qur'an through reading, guidance, duas, and reflection too.",
  },
  {
    q: "What happens after signup?",
    a: "You start with a short setup, then enter the dashboard with the main Qur'an, hifz, dua, and journal tools ready to use.",
  },
  {
    q: "Does Hifzer replace a teacher?",
    a: "No. A teacher still guides recitation and tajweed. Hifzer helps organize the practice, revision, and reflection that happens between lessons.",
  },
  {
    q: "Are my journal entries private?",
    a: "Yes. Your notes and reflections are treated as a private space, not a social feed.",
  },
] as const;

function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

function SectionHeading({
  eyebrow,
  title,
  body,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  body: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <p className={styles.sectionBody}>{body}</p>
    </div>
  );
}

function ScreenCard({
  image,
  label,
  className,
  priority = false,
}: {
  image: ShowcaseImage;
  label: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`${styles.screenCard} ${className ?? ""}`}>
      <div className={styles.screenChrome}>
        <span />
        <span />
        <span />
        <p>{label}</p>
      </div>
      <div className={styles.screenImageWrap}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority={priority}
          sizes="(max-width: 640px) 82vw, (max-width: 1024px) 42vw, 460px"
          className="object-cover object-top"
        />
      </div>
    </div>
  );
}

function HeroChapter() {
  const { isSignedIn } = usePublicAuth();

  return (
    <section className={styles.hero} aria-labelledby="landing-hero-title">
      <div className={styles.heroGlow} />
      <div className={styles.heroGrid}>
        <Reveal className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>Hifzer</p>
          <h1 id="landing-hero-title" className={styles.heroTitle}>
            Keep your Qur&apos;an routine steady.
          </h1>
          <p className={styles.heroSummary}>
            Read from your last ayah, protect your hifz review, ask source-grounded questions, and keep personal reflections in one calm place.
          </p>
          <div className={styles.heroActions}>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <PublicAuthLink
                signedInHref="/dashboard"
                signedOutHref="/signup"
                telemetryName="landing.primary_open_app_click"
                telemetryMeta={{ placement: "hero" }}
              >
                {isSignedIn ? "Open app" : "Start free"} <ArrowRight size={17} />
              </PublicAuthLink>
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
              <TrackedLink
                href="#routine"
                telemetryName="landing.hero_story_click"
                telemetryMeta={{ placement: "hero" }}
              >
                Preview the routine <ArrowRight size={17} />
              </TrackedLink>
            </Button>
          </div>
          <p className={styles.heroMicro}>Free in the browser. No card required.</p>
        </Reveal>

        <Reveal className={styles.heroVisual}>
          <ScreenCard image={showcaseImages.dashboard} label="Daily rhythm" priority className={styles.heroMainScreen} />
          <ScreenCard image={showcaseImages.hifz} label="Hifz" className={styles.heroFloatOne} />
          <ScreenCard image={showcaseImages.dua} label="Dua" className={styles.heroFloatTwo} />
          <ScreenCard image={showcaseImages.journal} label="Journal" className={styles.heroFloatThree} />
        </Reveal>
      </div>
    </section>
  );
}

function SignalStrip() {
  const signalPillars = [
    {
      label: "Consistency",
      eyebrow: "Return ready",
      body: "Return without rebuilding the routine every time.",
      accent: "rgba(10, 138, 119, 0.28)",
      edge: "rgba(10, 138, 119, 0.52)",
    },
    {
      label: "Retention",
      eyebrow: "Memory defense",
      body: "Protect memorization before weak spots disappear.",
      accent: "rgba(216, 182, 107, 0.26)",
      edge: "rgba(176, 132, 46, 0.54)",
    },
    {
      label: "Understanding",
      eyebrow: "Source grounded",
      body: "Ask grounded Qur'anic questions without vague guessing.",
      accent: "rgba(58, 108, 92, 0.24)",
      edge: "rgba(36, 78, 70, 0.52)",
    },
    {
      label: "Reflection",
      eyebrow: "Private interior",
      body: "Keep private notes, duas, and ayah moments together.",
      accent: "rgba(111, 115, 81, 0.24)",
      edge: "rgba(87, 92, 61, 0.54)",
    },
  ] as const;

  return (
    <section className={styles.signalStrip} aria-label="What Hifzer is built around">
      {signalPillars.map((item, index) => (
        <article
          key={item.label}
          className={styles.signalItem}
          style={{
            "--signal-accent": item.accent,
            "--signal-edge": item.edge,
          } as CSSProperties}
        >
          <div className={styles.signalItemGlow} aria-hidden />
          <div className={styles.signalTopline}>
            <span className={styles.signalIndex}>{String(index + 1).padStart(2, "0")}</span>
            <span className={styles.signalEyebrow}>{item.eyebrow}</span>
          </div>
          <p className={styles.signalTitle}>{item.label}</p>
          <span className={styles.signalBody}>{item.body}</span>
          <div className={styles.signalRule} aria-hidden>
            <span />
          </div>
        </article>
      ))}
    </section>
  );
}

function RoutineChapter() {
  return (
    <section id="routine" className={styles.chapter}>
      <div className={styles.chapterGrid}>
        <Reveal>
          <SectionHeading
            eyebrow="Guided routine"
            title="Read, review, reflect, then return."
            body="Hifzer keeps the next step clear: continue Qur'an reading, protect memorization, save what matters, and come back tomorrow without rebuilding the routine."
          />
        </Reveal>
        <Reveal className={styles.planBuilder}>
          {routineSteps.map((step, index) => (
            <div key={step.label} className={styles.planStep} style={{ "--step": index } as CSSProperties}>
              <span>{step.label}</span>
              <div>
                <p>{step.title}</p>
                <small>{step.body}</small>
              </div>
              <Check size={18} aria-hidden />
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function HifzChapter() {
  return (
    <section id="hifz" className={styles.chapter}>
      <Reveal>
        <SectionHeading
          eyebrow="Hifz"
          title="Memorization you can actually keep."
          body="Progress only matters when it stays with you. Hifzer helps you see what is new, what is recent, what is long-term, and what needs repair before it slips."
          align="center"
        />
      </Reveal>
      <div className={styles.metricsGrid}>
        <Reveal className={styles.metricsPanel}>
          <div className={styles.retentionRing}>
            <div>
              <strong>82%</strong>
              <span>retention health</span>
            </div>
          </div>
          <div className={styles.metricGraph} aria-hidden>
            <span style={{ height: "42%" }} />
            <span style={{ height: "58%" }} />
            <span style={{ height: "50%" }} />
            <span style={{ height: "73%" }} />
            <span style={{ height: "68%" }} />
            <span style={{ height: "84%" }} />
            <span style={{ height: "76%" }} />
          </div>
        </Reveal>
        <Reveal className={styles.metricCards}>
          {hifzMetrics.map(([label, value, body]) => (
            <div key={label} className={styles.metricCard}>
              <p>{label}</p>
              <strong>{value}</strong>
              <span>{body}</span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function GuidanceChapter() {
  return (
    <section id="guidance" className={styles.chapter}>
      <div className={styles.chapterGrid}>
        <Reveal>
          <SectionHeading
            eyebrow="Trusted guidance"
            title="Start with sources, then ask better questions."
            body="Hifzer keeps AI grounded in ayah references, translation, tafsir summaries, and source labels so answers feel inspectable instead of vague."
          />
          <div className={styles.sourceList}>
            {assistantSources.map((source) => (
              <span key={source}>
                <Sparkles size={14} aria-hidden />
                {source}
              </span>
            ))}
          </div>
        </Reveal>
        <Reveal className={styles.assistantMock}>
          <GroundedGuidanceDemo />
        </Reveal>
      </div>
    </section>
  );
}

function ReaderChapter() {
  return (
    <section id="reader" className={styles.chapter}>
      <div className={styles.readerShell}>
        <Reveal>
          <SectionHeading
            eyebrow="Qur'an reader"
            title="Return exactly where you left off."
            body="Your reading place, reciter, tafsir, bookmarks, and saved filters stay close so returning to the Qur'an feels frictionless."
          />
        </Reveal>
        <Reveal className={styles.readerMock}>
          <div className={styles.ayahLine}>
            <span>2:286</span>
            <p dir="rtl">لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا</p>
          </div>
          <div className={styles.readerControls}>
            <span><BookMarked size={14} /> Bookmarked</span>
            <span>Reciter selected</span>
            <span>68% today</span>
          </div>
          <div className={styles.progressTrack}><span /></div>
        </Reveal>
      </div>
    </section>
  );
}

function ReflectionChapter() {
  return (
    <section id="reflection" className={styles.chapter}>
      <div className={styles.splitCards}>
        <Reveal className={styles.warmCard}>
          <Heart className={styles.cardIcon} aria-hidden />
          <p className={styles.eyebrow}>Dua</p>
          <h2 className={styles.cardTitle}>Dua that feels present.</h2>
          <p className={styles.cardBody}>
            Keep duas for repentance, hardship, gratitude, and Allah&apos;s names in a calm space that feels personal, not like a random list.
          </p>
          <div className={styles.duaChips}>
            <span>Repentance</span>
            <span>Hardship</span>
            <span>Gratitude</span>
            <span>Allah&apos;s names</span>
          </div>
        </Reveal>
        <Reveal className={styles.journalCard}>
          <PenLine className={styles.cardIcon} aria-hidden />
          <p className={styles.eyebrow}>Journal</p>
          <h2 className={styles.cardTitle}>A private space for your Qur&apos;an journey.</h2>
          <p className={styles.cardBody}>
            Attach an ayah, save a reflection, and keep personal notes with the Qur&apos;an moments that shaped your day.
          </p>
          <div className={styles.journalNote}>
            <small>Linked ayah</small>
            <strong>Surah Ad-Duha</strong>
            <span>What did Allah remind me of today?</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ContinuityChapter() {
  return (
    <section id="continuity" className={styles.chapter}>
      <Reveal>
        <SectionHeading
          eyebrow="Continuity"
          title="Keep the journey together across days."
          body="Your Qur'an place, hifz review, saved ayahs, duas, and private reflections stay connected without turning worship into a spreadsheet."
          align="center"
        />
      </Reveal>
      <Reveal className={styles.summaryPanel}>
        <div className={styles.syncOrbit} aria-hidden>
          <span><BookOpenText size={18} /></span>
          <span><LineChart size={18} /></span>
          <span><MessageCircleQuestion size={18} /></span>
          <span><Lock size={18} /></span>
        </div>
        <div className={styles.summaryStats}>
          {continuityFeatures.map(([label, body]) => (
            <div key={label}>
              <strong>{label}</strong>
              <span>{body}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function FaqChapter() {
  return (
    <section className={styles.chapter}>
      <Reveal>
        <SectionHeading
          eyebrow="Questions"
          title="Before you begin."
          body="A few honest answers about what Hifzer is, what it is not, and how it fits around real Qur'an practice."
          align="center"
        />
      </Reveal>
      <div className={styles.faqList}>
        {faqs.map((faq) => (
          <details key={faq.q} className={styles.faqItem}>
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function ClosingCta() {
  const { isSignedIn } = usePublicAuth();

  return (
    <section className={styles.finalCta}>
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className={styles.eyebrow}>Begin gently</p>
        <h2>The Qur&apos;an was never meant to stay at the edge of your life.</h2>
        <p>
          Build a real relationship with the Qur&apos;an through memorization, trusted guidance, duas, and reflection.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <PublicAuthLink
              signedInHref="/dashboard"
              signedOutHref="/signup"
              telemetryName="landing.final_start_click"
              telemetryMeta={{ placement: "final-cta" }}
            >
              {isSignedIn ? "Open app" : "Start free"} <ArrowRight size={17} />
            </PublicAuthLink>
          </Button>
          <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
            <TrackedLink href="#routine" telemetryName="landing.final_story_click">
              Preview the routine
            </TrackedLink>
          </Button>
        </div>
        <span className={styles.noCard}>No card required. Start free in the browser.</span>
      </Reveal>
    </section>
  );
}

export function LandingPageContent() {
  return (
    <div className={styles.page}>
      <HeroChapter />
      <SignalStrip />
      <RoutineChapter />
      <HifzChapter />
      <GuidanceChapter />
      <ReaderChapter />
      <ReflectionChapter />
      <ContinuityChapter />
      <FaqChapter />
      <ClosingCta />
    </div>
  );
}
