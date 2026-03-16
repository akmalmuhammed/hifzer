"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BookOpenText,
  Bookmark,
  GraduationCap,
  HandHeart,
  Headphones,
  MoonStar,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import styles from "./landing.module.css";

const FEATURE_CARDS = [
  {
    label: "Hifz",
    title: "Memorize with a review-first path.",
    copy:
      "Sabaq, Sabqi, and Manzil stay clear so missed days do not quietly undo what you already worked for.",
    note: "The dream you delayed can still begin.",
    icon: Bookmark,
    tone: "brand" as const,
  },
  {
    label: "Qur'an",
    title: "Continue exactly where you left off.",
    copy:
      "Resume your place, keep reader preferences nearby, and move through the mushaf without guilt-driven restarting.",
    note: "Return without losing your place.",
    icon: BookOpenText,
    tone: "accent" as const,
  },
  {
    label: "Audio",
    title: "Listen with the reciter you trust.",
    copy:
      "Replay ayahs, keep your preferred reciter close, and let ordinary minutes still carry Qur'an.",
    note: "Turn scattered minutes into remembrance.",
    icon: Headphones,
    tone: "neutral" as const,
  },
  {
    label: "Dua",
    title: "Keep taught words close to the heart.",
    copy:
      "Open repentance, Laylat al-Qadr guidance, and curated duas without turning worship into clutter.",
    note: "Because some days you do not know what to say.",
    icon: HandHeart,
    tone: "warn" as const,
  },
  {
    label: "Progress",
    title: "See growth without vanity.",
    copy:
      "Track reading, Hifz review, and completion history in a way that supports steadiness instead of comparison.",
    note: "Measure by return, not performance.",
    icon: TrendingUp,
    tone: "accent" as const,
  },
  {
    label: "Reminders",
    title: "Receive a gentle nudge when life gets loud.",
    copy:
      "A small reminder can save a lost day, especially when intention is there but attention is not.",
    note: "Mercy often looks like one timely nudge.",
    icon: Bell,
    tone: "brand" as const,
  },
  {
    label: "Ramadan",
    title: "Open a dedicated seasonal worship space.",
    copy:
      "Ramadan surfaces, Laylat al-Qadr guidance, and timely devotion stay ready when the heart is already turning back.",
    note: "Do not spend sacred nights searching for structure.",
    icon: MoonStar,
    tone: "warn" as const,
  },
  {
    label: "Teacher",
    title: "Stay teachable and teacher-friendly.",
    copy:
      "Hifzer is designed to support honest review and learning rhythms that still make sense alongside a teacher.",
    note: "Technology should serve the tradition, not replace it.",
    icon: GraduationCap,
    tone: "neutral" as const,
  },
] as const;

const TODAY_STEPS = [
  {
    step: 1,
    title: "Open to the next meaningful step.",
    time: "Instant",
    copy: "Your reading place, current Hifz need, or guided dua module is already waiting when you arrive.",
  },
  {
    step: 2,
    title: "Spend a few focused minutes where the day needs you.",
    time: "5-15m",
    copy: "Read, review, listen, or make dua in the lane that matters most instead of juggling everything at once.",
  },
  {
    step: 3,
    title: "Leave without losing continuity.",
    time: "1 tap",
    copy: "Tomorrow begins from something real instead of from guesswork, lost place, or guilt.",
  },
] as const;

const RETURN_SUPPORT = [
  {
    title: "Built for real life",
    detail: "Busy parents, students, shift workers, and those returning after long gaps all need a gentler structure.",
    icon: BookOpenText,
  },
  {
    title: "One dominant action per lane",
    detail: "Each surface tries to bring one clear next step forward instead of competing for attention.",
    icon: Headphones,
  },
  {
    title: "Separated with intention",
    detail: "Hifz, Qur'an reading, and dua stay distinct so they do not collapse into one noisy feed.",
    icon: MoonStar,
  },
] as const;

export function SessionWalkthrough() {
  const reduceMotion = useReducedMotion();
  const { isSignedIn } = usePublicAuth();

  return (
    <>
      <section id="inside" className="py-10 md:py-14">
        <Card className={`${styles.sectionShell} px-5 py-6 sm:px-6 sm:py-7`}>
          <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                What&apos;s inside
              </p>
              <h2 className="kw-marketing-display mt-4 max-w-[14ch] text-balance text-4xl leading-[0.98] tracking-[-0.05em] text-[color:var(--kw-ink)] sm:text-5xl">
                Everything you need for a steadier Islamic routine, in one sacred space.
              </h2>
              <p className="mt-4 max-w-[60ch] text-sm leading-8 text-[color:var(--kw-muted)]">
                Not to perform faith. Not to chase numbers. Just to keep reading, reviewing,
                listening, making dua, and coming back with less friction.
              </p>
            </div>

            <div className={styles.featureGrid}>
              {FEATURE_CARDS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: reduceMotion ? 0 : 0.35, delay: idx * 0.03 }}
                    className={styles.featureCard}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Pill tone={item.tone}>{item.label}</Pill>
                      <span className="grid h-10 w-10 place-items-center rounded-[16px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] text-[color:var(--kw-ink-2)]">
                        <Icon size={16} />
                      </span>
                    </div>
                    <p className="mt-4 text-lg font-semibold leading-7 tracking-tight text-[color:var(--kw-ink)]">
                      {item.title}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{item.copy}</p>
                    <p className="mt-4 text-sm font-semibold text-[color:var(--kw-ink-2)]">{item.note}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]">
            <p className="text-sm leading-7 text-[color:var(--kw-muted)]">
              The real product decision is this: Hifz, Qur&apos;an reading, and dua should not be
              flattened into one noisy feed. Each act of worship keeps its own lane so the return
              can stay clearer and more trustworthy.
            </p>
          </div>
        </Card>
      </section>

      <section id="return-flow" className="py-10 md:py-14">
        <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr] xl:items-stretch">
          <Card className={`${styles.sectionShell} h-full px-5 py-6 sm:px-6`}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
              How the return works
            </p>
            <h2 className="kw-marketing-display mt-4 max-w-[14ch] text-balance text-4xl leading-[0.98] tracking-[-0.05em] text-[color:var(--kw-ink)] sm:text-5xl">
              Open it tired, busy, or interrupted. It still knows how to welcome you back.
            </h2>
            <p className="mt-4 max-w-[62ch] text-sm leading-8 text-[color:var(--kw-muted)]">
              Hifzer is not built for perfect routines. It is built for ordinary returns, when you
              need the next step ready before motivation fully arrives.
            </p>

            <div className="mt-7 space-y-5">
              {TODAY_STEPS.map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: reduceMotion ? 0 : 0.35, delay: idx * 0.05 }}
                  className={styles.timelineStep}
                >
                  <div className={styles.timelineMarker}>{item.step}</div>
                  <div className="rounded-[24px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-base font-semibold tracking-tight text-[color:var(--kw-ink)]">
                        {item.title}
                      </p>
                      <Pill tone="neutral">{item.time}</Pill>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{item.copy}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          <motion.div
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: reduceMotion ? 0 : 0.42 }}
          >
            <Card className={`${styles.asidePanel} h-full px-5 py-6 sm:px-6`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                    Why this feels gentler
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                    One quiet step at a time
                  </p>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-[18px] border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.1)] text-[rgba(var(--kw-accent-rgb),1)]">
                  <ShieldCheck size={18} />
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {RETURN_SUPPORT.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-[22px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-4 py-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[16px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] text-[color:var(--kw-ink-2)]">
                          <Icon size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{item.title}</p>
                          <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">{item.detail}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-[24px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4">
                <p className="text-sm leading-7 text-[color:var(--kw-muted)]">
                  The app tries to reduce resistance before it tries to impress. That is why the
                  next step appears first and the heavier explanation stays out of the way.
                </p>
              </div>

              <div className="mt-6 md:mt-8">
                <Button asChild size="lg" className="w-full gap-2">
                  <PublicAuthLink signedInHref="/today" signedOutHref="/quran-preview">
                    {isSignedIn ? "Return to today's page" : "Preview the reading flow"} <ArrowRight size={16} />
                  </PublicAuthLink>
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </>
  );
}
