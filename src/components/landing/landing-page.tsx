import type { CSSProperties } from "react";
import {
  BookMarked,
  BookOpenText,
  ChevronDown,
  ChevronRight,
  Heart,
  PenLine,
  Sparkles,
} from "lucide-react";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { Button } from "@/components/ui/button";
import { GroundedGuidanceDemo } from "./grounded-guidance-demo";
import { CountUp, Reveal } from "./reveal";
import styles from "./landing.module.css";

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
    q: "Is Hifzer free?",
    a: "The core routine is free to start in your browser, with no card required. Optional premium features, where offered, use a one-time purchase rather than a subscription.",
  },
  {
    q: "Who is Hifzer for?",
    a: "For Muslims who want a steadier relationship with the Qur'an, whether they are reading daily, memorizing, revising, making dua, or reflecting privately.",
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
    q: "Do I need a Quran.com account?",
    a: "No. You can use Hifzer without linking Quran.com. Connecting it is optional and helps supported Qur'an activity, such as saved ayahs, follow your account.",
  },
  {
    q: "What happens after signup?",
    a: "You start with a short setup, then enter the dashboard with the main Qur'an, hifz, dua, and journal tools ready to use.",
  },
] as const;

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

/**
 * The hero product shot is built from the app's own labels and copy, so it stays
 * sharp at every size, follows light and dark mode, and never goes stale the way
 * a screenshot does. It is decorative; the text above carries the pitch.
 */
function HeroStage() {
  return (
    <figure className={styles.stage} aria-label="Example of Hifzer: your reading place and today's hifz review">
      <div className={styles.stageCard} style={{ "--i": 0 } as CSSProperties}>
        <div className={styles.stagePills}>
          <span className={styles.stagePill}>2:286</span>
          <span className={`${styles.stagePill} ${styles.stagePillOn}`}>Your place</span>
        </div>
        <p dir="rtl" lang="ar" className={styles.stageAyah}>
          لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا
        </p>
        <p className={styles.stageTranslation}>
          Allah does not charge a soul except [with that within] its capacity.
        </p>
        <div className={styles.stageActions} aria-hidden>
          <span className={styles.stageButton}>Continue reading</span>
          <span className={styles.stageLink}>Listen</span>
        </div>
      </div>

      <div className={styles.stageCard} style={{ "--i": 1 } as CSSProperties}>
        <div className={styles.stageHead}>
          <span className={styles.stageTitle}>Today</span>
          <span className={styles.stageNote}>Example day</span>
        </div>
        <ul className={styles.stageRows}>
          <li>
            <span>Sabaq</span>
            <strong>2 ayahs</strong>
          </li>
          <li>
            <span>Sabqi</span>
            <strong>7 min</strong>
          </li>
          <li>
            <span>Manzil</span>
            <strong>82%</strong>
          </li>
          <li className={styles.stageWarn}>
            <span>Fading soon</span>
            <strong>3</strong>
          </li>
        </ul>
        <div className={styles.stageBar} aria-hidden>
          <span />
        </div>
      </div>
    </figure>
  );
}

function HeroChapter() {
  return (
    <section className={styles.hero} aria-labelledby="landing-hero-title">
      <div className={styles.heroCopy}>
        <p className={styles.heroEyebrow}>The daily Qur&apos;an companion</p>
        <h1 id="landing-hero-title" className={styles.heroTitle}>
          Return to your ayah.<br className="hidden md:inline" /> Keep what you memorized.
        </h1>
        <p className={styles.heroSummary}>
          Pick up at the exact ayah you left. Review what you have memorized before it fades.
          Understand with sources in view, make dua, and reflect privately.
        </p>
        <div className={styles.heroActions}>
          <Button asChild size="lg">
            <TrackedLink
              href="/signup"
              prefetch={false}
              telemetryName="landing.primary_open_app_click"
              telemetryMeta={{ placement: "hero" }}
            >
              Start free
            </TrackedLink>
          </Button>
          <TrackedLink
            href="#routine"
            className={styles.textLink}
            telemetryName="landing.hero_story_click"
            telemetryMeta={{ placement: "hero" }}
          >
            See how it works <ChevronRight size={18} aria-hidden />
          </TrackedLink>
        </div>
        <div className={styles.heroTrust} aria-label="Hifzer trust notes">
          <span>Free in your browser</span>
          <span>No card required</span>
          <span>Private reflections</span>
        </div>
      </div>

      <div className={styles.heroVisual}>
        <HeroStage />
        <p className={styles.sourceLine}>
          Arabic text and Sahih International translation from Tanzil. Tafsir from Quran.com.
        </p>
      </div>
    </section>
  );
}

function RoutineChapter() {
  return (
    <section id="routine" className={styles.chapter} tabIndex={-1}>
      <Reveal>
        <SectionHeading
          eyebrow="Guided routine"
          title="Read, review, reflect, then return."
          body="One calm path keeps your reading place, review, and reflections ready for the next return."
          align="center"
        />
      </Reveal>
      <div className={styles.planBuilder}>
        {routineSteps.map((step, index) => (
          <Reveal key={step.label} delay={index * 90}>
            <article className={styles.planStep} aria-labelledby={`routine-step-${index + 1}`}>
              <div className={styles.planStepBadge}>
                <span>{step.label}</span>
                <small aria-hidden>{String(index + 1).padStart(2, "0")}</small>
              </div>
              <div className={styles.planStepCopy}>
                <h3 id={`routine-step-${index + 1}`}>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ReaderChapter() {
  return (
    <section id="reader" className={styles.chapter} tabIndex={-1}>
      <Reveal>
        <div className={styles.readerShell}>
          <div>
            <SectionHeading
              eyebrow="Read"
              title="Meaning and recitation stay beside the ayah."
              body="Choose a trusted translation, tafsir, or reciter without leaving your place. Connect Quran.com only when you want saved Qur'an activity to follow your account."
            />
            <div className={styles.readerApiProof}>
              <span>Meaning and context beside each ayah</span>
              <span>Saved ayahs can follow your account</span>
              <span>Recitation, tafsir, and notes in one flow</span>
            </div>
          </div>
          <div className={styles.readerMock}>
            <div className={styles.readerWindow}>
              <div className={styles.ayahLine}>
                <span>2:286</span>
                <p dir="rtl" lang="ar">لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا</p>
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
              <div className={styles.progressTrack}><span /></div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function HifzChapter() {
  return (
    <section id="hifz" className={styles.chapter} tabIndex={-1}>
      <Reveal>
        <SectionHeading
          eyebrow="Memorize"
          title="Memorization you can actually keep."
          body="See today's new work, recent revision, long-term review, and passages that need care before they fade."
          align="center"
        />
      </Reveal>
      <div className={styles.metricsGrid}>
        <Reveal className={styles.metricsPanel}>
          <div className={styles.retentionRingShell}>
            <div className={styles.retentionRing}>
              <div>
                <strong><CountUp to={82} /></strong>
                <span>retention health</span>
              </div>
            </div>
          </div>
          <div className={styles.retentionCaption}>
            <small>Example day</small>
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
        <div className={styles.metricCards}>
          {hifzMetrics.map(([label, value, body], index) => (
            <Reveal key={label} delay={index * 80} className={styles.metricCard}>
              <p>{label}</p>
              <strong>{value}</strong>
              <span>{body}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function GuidanceChapter() {
  return (
    <section id="guidance" className={styles.chapter} tabIndex={-1}>
      <div className={styles.chapterGrid}>
        <Reveal className={styles.guidanceCopy}>
          <SectionHeading
            eyebrow="Understand"
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
        <Reveal className={styles.assistantMock} delay={120}>
          <GroundedGuidanceDemo />
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
          <p className={styles.eyebrow}>Reflect: Dua</p>
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
        <Reveal className={styles.journalCard} delay={120}>
          <PenLine className={styles.cardIcon} aria-hidden />
          <p className={styles.eyebrow}>Reflect: Journal</p>
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
      <div className={styles.factGrid}>
        {continuityFeatures.map(([label, body], index) => (
          <Reveal key={label} delay={index * 80} className={styles.factTile}>
            <strong>{label}</strong>
            <span>{body}</span>
          </Reveal>
        ))}
      </div>
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
      <Reveal>
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
      </Reveal>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className={styles.finalCta}>
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className={styles.eyebrow}>Begin gently</p>
        <h2>Make tomorrow&apos;s return to the Qur&apos;an easier.</h2>
        <p>Keep your next ayah, review, duas, and reflections ready in one calm place.</p>
        <div className={styles.finalActions}>
          <Button asChild size="lg">
            <TrackedLink
              href="/signup"
              prefetch={false}
              telemetryName="landing.final_start_click"
              telemetryMeta={{ placement: "final-cta" }}
            >
              Start free
            </TrackedLink>
          </Button>
          <TrackedLink href="#routine" className={styles.textLink} telemetryName="landing.final_story_click">
            See how it works <ChevronRight size={18} aria-hidden />
          </TrackedLink>
        </div>
        <span className={styles.noCard}>
          Free in your browser. No card required. Optional premium features, where offered, are a one-time purchase, never a subscription.
        </span>
      </Reveal>
    </section>
  );
}

export function LandingPageContent() {
  return (
    <div className={styles.page}>
      <HeroChapter />
      <RoutineChapter />
      <ReaderChapter />
      <HifzChapter />
      <GuidanceChapter />
      <ReflectionChapter />
      <ContinuityChapter />
      <FaqChapter />
      <ClosingCta />
    </div>
  );
}
