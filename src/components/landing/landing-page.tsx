import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  BookMarked,
  BookOpenText,
  Check,
  ChevronDown,
  Heart,
  LineChart,
  Lock,
  MessageCircleQuestion,
  PenLine,
  Sparkles,
} from "lucide-react";
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

const hifzGraphBars = [42, 58, 50, 73, 68, 84, 76] as const;

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
    q: "Do I need a Quran.com account?",
    a: "No. You can use Hifzer without linking Quran.com. Connecting it is optional and helps supported Qur'an activity, such as saved ayahs, follow your account.",
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
    q: "How should I use the grounded guidance?",
    a: "Use it to explore matched ayahs, translations, and tafsir context. It is a study aid, not a fatwa service or a replacement for a qualified scholar.",
  },
  {
    q: "Are my journal entries private?",
    a: "Yes. Your notes and reflections are treated as a private space, not a social feed.",
  },
  {
    q: "Is Hifzer free?",
    a: "The core routine is free to start in your browser. Optional premium features, where offered, use a one-time purchase rather than a subscription.",
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
          fetchPriority={priority ? "high" : undefined}
          sizes="(max-width: 640px) 82vw, (max-width: 1024px) 42vw, 460px"
          className="object-cover object-top"
        />
      </div>
    </div>
  );
}

function HeroChapter() {
  return (
    <section className={styles.hero} aria-labelledby="landing-hero-title">
      <div className={styles.heroGlow} />
      <div className={styles.heroGrid}>
        <Reveal className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>A daily Qur&apos;an companion for reading and hifz</p>
          <h1 id="landing-hero-title" className={styles.heroTitle}>
            Return to your ayah. Keep what you memorized.
          </h1>
          <p className={styles.heroSummary}>
            Hifzer brings your next ayah, sabaq, sabqi and manzil review, trusted translation and tafsir, duas, and private reflections into one calm daily routine.
          </p>
          <div className={styles.heroActions}>
            <Button asChild size="lg" className={`${styles.primaryCta} w-full sm:w-auto`}>
              <TrackedLink
                href="/signup"
                prefetch={false}
                telemetryName="landing.primary_open_app_click"
                telemetryMeta={{ placement: "hero" }}
              >
                Start my free routine <ArrowRight size={17} />
              </TrackedLink>
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
              <TrackedLink
                href="#routine"
                telemetryName="landing.hero_story_click"
                telemetryMeta={{ placement: "hero" }}
              >
                See how Hifzer works <ArrowRight size={17} />
              </TrackedLink>
            </Button>
          </div>
          <div className={styles.heroTrust} aria-label="Hifzer trust notes">
            <span>Free in your browser</span>
            <span>No card required</span>
            <span>Private reflections</span>
          </div>
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

function RoutineChapter() {
  return (
    <section id="routine" className={styles.chapter} tabIndex={-1}>
      <div className={styles.chapterGrid}>
        <Reveal>
          <SectionHeading
            eyebrow="Guided routine"
            title="Read, review, reflect, then return."
            body="One calm path keeps your reading place, review, and reflections ready for the next return."
          />
        </Reveal>
        <Reveal className={styles.planBuilder}>
          {routineSteps.map((step, index) => {
            return (
              <article
                key={step.label}
                className={styles.planStep}
                style={{ "--step": index } as CSSProperties}
                aria-labelledby={`routine-step-${index + 1}`}
              >
                <div className={styles.planStepLead}>
                  <div className={styles.planStepBadge}>
                    <span>{step.label}</span>
                    <small>{String(index + 1).padStart(2, "0")}</small>
                  </div>
                </div>
                <div className={styles.planStepCopy}>
                  <h3 id={`routine-step-${index + 1}`}>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
                <div className={styles.planStepState} aria-hidden>
                  <Check size={18} />
                </div>
              </article>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

function HifzChapter() {
  return (
    <section id="hifz" className={styles.chapter} tabIndex={-1}>
      <Reveal>
        <SectionHeading
          eyebrow="Hifz"
          title="Memorization you can actually keep."
          body="See today's new work, recent revision, long-term review, and passages that need care before they fade."
          align="center"
        />
      </Reveal>
      <div className={styles.metricsGrid}>
        <Reveal className={styles.metricsPanel}>
          <div className={styles.retentionRingShell}>
            <div className={styles.retentionRingGlow} aria-hidden />
            <div className={styles.retentionRing}>
              <div>
                <strong>82%</strong>
                <span>retention health</span>
              </div>
            </div>
          </div>
          <div className={styles.retentionCaption}>
            <small>Steady this week</small>
            <strong>Memory is holding, with a few passages asking for repair before they fade.</strong>
          </div>
          <div className={styles.metricGraph} aria-hidden>
            {hifzGraphBars.map((height, index) => (
              <span
                key={`${height}-${index}`}
                style={
                  {
                    height: `${height}%`,
                    "--bar-delay": `${index * 160}ms`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </Reveal>
        <Reveal className={styles.metricCards}>
          {hifzMetrics.map(([label, value, body], index) => (
            <div
              key={label}
              className={styles.metricCard}
              style={{ "--metric-delay": `${index * 120}ms` } as CSSProperties}
            >
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
    <section id="guidance" className={styles.chapter} tabIndex={-1}>
      <div className={`${styles.chapterGrid} ${styles.guidanceGrid}`}>
        <Reveal className={styles.guidanceCopy}>
          <SectionHeading
            eyebrow="Trusted guidance"
            title="Ask with the sources in view."
            body="Explore a question with matched ayahs, translation, and tafsir context beside the answer instead of receiving an unsupported summary."
          />
          <div className={styles.sourceList}>
            {assistantSources.map((source) => (
              <span key={source}>
                <Sparkles size={14} aria-hidden />
                {source}
              </span>
            ))}
          </div>
          <p className={styles.guidanceNote}>
            Built for study and reflection. It does not replace a qualified teacher or scholar.
          </p>
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
    <section id="reader" className={styles.chapter} tabIndex={-1}>
      <div className={styles.readerShell}>
        <Reveal>
          <SectionHeading
            eyebrow="Trusted Qur'an sources"
            title="Meaning and recitation stay beside the ayah."
            body="Choose a trusted translation, tafsir, or reciter without leaving your place. Connect Quran.com only when you want saved Qur'an activity to follow your account."
          />
          <div className={styles.readerApiProof}>
            <span>Meaning and context beside each ayah</span>
            <span>Saved ayahs can follow your account</span>
            <span>Recitation, tafsir, and notes in one flow</span>
          </div>
        </Reveal>
        <Reveal className={styles.readerMock}>
          <div className={styles.readerWindow}>
            <div className={styles.readerWindowBar}>
              <div className={styles.readerWindowDots} aria-hidden>
                <span />
                <span />
                <span />
              </div>
              <p>Reader connected to trusted Qur&apos;an content</p>
            </div>
          <div className={styles.readerApiTopline}>
            <span>Trusted Qur&apos;an content</span>
            <span>Translation, tafsir, and recitation in place</span>
          </div>
          <div className={styles.ayahLine}>
            <span>2:286</span>
            <p dir="rtl" lang="ar">لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا</p>
          </div>
          <div className={styles.readerControls}>
            <span><BookOpenText size={14} /> Read with trusted translation</span>
            <span>Go deeper with tafsir</span>
            <span>Listen with your reciter</span>
            <span><BookMarked size={14} /> Keep saved ayahs close</span>
          </div>
          <div className={styles.readerApiPanel}>
            <div>
              <small>As you read</small>
              <strong>Meaning, recitation, and context stay beside the ayah.</strong>
            </div>
            <span>No tab switching</span>
          </div>
          <div className={styles.readerSignalRow}>
            <span>Official translation choices</span>
            <span>Official tafsir options</span>
            <span>Reciter audio when you need it</span>
          </div>
          <div className={styles.progressTrack}><span /></div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ReflectionChapter() {
  return (
    <section id="reflection" className={styles.chapter} tabIndex={-1}>
      <div className={styles.splitCards}>
        <Reveal className={styles.warmCard}>
          <Heart className={styles.cardIcon} aria-hidden />
          <p className={styles.eyebrow}>Dua</p>
          <h2 className={styles.cardTitle}>Dua that feels present.</h2>
          <p className={styles.cardBody}>
            Return to sourced duas for repentance, hardship, gratitude, and Allah&apos;s names without searching through an endless list.
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
            Keep an ayah and the reflection it inspired together, privately under your account.
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
    <section id="continuity" className={styles.chapter} tabIndex={-1}>
      <Reveal>
        <SectionHeading
          eyebrow="Continuity"
          title="Keep the journey together across days."
          body="Return with your reading place, hifz review, saved ayahs, duas, and reflections already waiting."
          align="center"
        />
      </Reveal>
      <Reveal className={styles.summaryPanel}>
        <div className={styles.syncOrbit}>
          <div className={styles.syncOrbitCore}>
            <small>Daily continuity</small>
            <strong>Return ready</strong>
            <span>Your reading place, review, notes, and duas stay in one calm loop.</span>
          </div>
          <div className={styles.syncOrbitRing} aria-hidden>
            <span className={`${styles.syncOrbitNode} ${styles.syncOrbitNodeTop}`}><BookOpenText size={18} /></span>
            <span className={`${styles.syncOrbitNode} ${styles.syncOrbitNodeRight}`}><LineChart size={18} /></span>
            <span className={`${styles.syncOrbitNode} ${styles.syncOrbitNodeBottom}`}><MessageCircleQuestion size={18} /></span>
            <span className={`${styles.syncOrbitNode} ${styles.syncOrbitNodeLeft}`}><Lock size={18} /></span>
          </div>
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
    <section className={styles.chapter} tabIndex={-1}>
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
            <summary>
              <span>{faq.q}</span>
              <ChevronDown size={18} aria-hidden />
            </summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className={styles.finalCta}>
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className={styles.eyebrow}>Begin gently</p>
        <h2>Make tomorrow&apos;s return to the Qur&apos;an easier.</h2>
        <p>
          Keep your next ayah, review, duas, and reflections ready in one calm place.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className={`${styles.primaryCta} w-full sm:w-auto`}>
            <TrackedLink
              href="/signup"
              prefetch={false}
              telemetryName="landing.final_start_click"
              telemetryMeta={{ placement: "final-cta" }}
            >
              Start my free routine <ArrowRight size={17} />
            </TrackedLink>
          </Button>
          <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
            <TrackedLink href="#routine" telemetryName="landing.final_story_click">
              See how it works
            </TrackedLink>
          </Button>
        </div>
        <span className={styles.noCard}>Free in your browser. No card required.</span>
      </Reveal>
    </section>
  );
}

export function LandingPageContent() {
  return (
    <div className={styles.page}>
      <HeroChapter />
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
