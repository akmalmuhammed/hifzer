"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FeatureShowcase } from "@/components/landing/feature-showcase";

const CORE_POINTS = [
  {
    label: "One place for the routine.",
    body: "Hifzer keeps Qur'an reading, hifz, duas, and private notes in one app so you are not stitching the routine together across separate tools.",
  },
  {
    label: "For readers and hifz students.",
    body: "Whether you are building a daily reading habit or trying to keep memorisation steady, Hifzer keeps the next step clear and the whole practice connected.",
  },
  {
    label: "AI help and reader control.",
    body: "Ask for AI explanations, open trusted tafsir, pick the reciter you were looking for, and shape the reader around the way you actually learn.",
  },
] as const;

const CORE_FEATURES: Array<{
  eyebrow: string;
  title: string;
  body: string;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
}> = [
  {
    eyebrow: "Hifz",
    title: "Make hifz feel clear, steady, and easier to keep.",
    body:
      "Know what to memorize next, what to revise today, and which part needs extra care before it slips, so your hifz feels more steady, more intentional, and easier to keep strong.",
    imageSrc: "/landing/showcase/Hifz%20final.png",
    imageAlt: "Hifzer hifz screen showing review controls and recall grading",
  },
  {
    eyebrow: "Qur'an",
    title: "Return to the ayah, reciter, and flow you were already in.",
    body:
      "Open Hifzer and find the same place you left, switch to the reciter you want, and keep AI explanation and tafsir close when you want to understand more without breaking your reading rhythm.",
    imageSrc: "/landing/showcase/dashboard.png",
    imageAlt: "Hifzer Qur'an dashboard and reader surfaces showing reading continuity, reciter access, and AI tools",
    reverse: true,
  },
  {
    eyebrow: "Dua",
    title: "Keep daily adhkar close and personal.",
    body:
      "Arabic, transliteration, and meaning stay together so your adhkar feels close, lived with, and personal, more like a daily way of asking Allah than another checklist to open and close.",
    imageSrc: "/landing/showcase/Dua.png",
    imageAlt: "Hifzer dua screen showing a guided dua with Arabic and translation",
  },
  {
    eyebrow: "Journal",
    title: "Turn reflections into faith-based journaling.",
    body:
      "Keep an Islamic journal for ayah reflections, gratitude, private duas, lessons from the day, and moments you want to carry with you in a space made for worship, not posting.",
    imageSrc: "/landing/showcase/Journal%20final.png",
    imageAlt: "Hifzer journal screen showing a private reflection entry",
    reverse: true,
  },
] as const;

const CAPABILITY_CHIPS = [
  "AI ayah explanations",
  "Pick your reciter",
  "Trusted tafsir",
  "Translation controls",
  "Saved reader filters",
  "Private journaling",
  "Hifz planning",
  "Daily adhkar",
] as const;
const SCROLLING_CAPABILITY_CHIPS = [...CAPABILITY_CHIPS, ...CAPABILITY_CHIPS];

export function LandingFeatureRail() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 md:px-8 md:py-20">
      <div className="mx-auto max-w-[1040px]">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-faint)]">
          Why people open it
        </p>
        <h2 className="kw-marketing-display mt-4 max-w-none text-balance text-4xl leading-[0.96] text-[color:var(--kw-ink)] sm:max-w-[12ch] sm:text-5xl md:text-6xl">
          Keep the Qur&apos;an and hifz routine in one place.
        </h2>
        <p className="mt-5 max-w-none text-sm leading-7 text-[color:var(--kw-muted)] sm:max-w-[58ch] md:text-[15px]">
          Hifzer is the all-in-one companion app for the Muslim who wants one place to read,
          memorize, make dua, and keep Islamic reflections without losing the thread between them.
        </p>
        <div className="mt-6 overflow-hidden rounded-[22px] border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[color:var(--kw-card-strong)] px-3 py-3 shadow-[var(--kw-shadow-soft)] backdrop-blur">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
            <span className="inline-flex h-2 w-2 rounded-full bg-[rgba(var(--kw-accent-rgb),0.85)]" />
            Personal and AI-powered inside Hifzer
          </div>
          <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
            <motion.div
              className="flex w-max gap-2"
              animate={reduceMotion ? undefined : { x: ["0%", "-50%"] }}
              transition={
                reduceMotion
                  ? undefined
                  : {
                      duration: 24,
                      ease: "linear",
                      repeat: Infinity,
                    }
              }
            >
              {SCROLLING_CAPABILITY_CHIPS.map((capability, index) => (
                <span
                  key={`${capability}-${index}`}
                  className="inline-flex min-h-9 items-center rounded-full border border-[rgba(var(--kw-accent-rgb),0.16)] bg-[color:var(--kw-surface)] px-4 text-sm font-medium text-[color:var(--kw-ink)] shadow-[0_10px_24px_rgba(11,18,32,0.05)]"
                >
                  {capability}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[1040px] divide-y divide-[rgba(var(--kw-accent-rgb),0.12)] border-y border-[rgba(var(--kw-accent-rgb),0.12)]">
        {CORE_POINTS.map((point) => (
          <div key={point.label} className="grid gap-3 py-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-8 md:py-7">
            <p className="font-[family-name:var(--font-kw-display)] text-[clamp(1.6rem,3vw,2.7rem)] leading-[1] tracking-tight text-[color:var(--kw-ink)]">
              {point.label}
            </p>
            <p className="max-w-[54ch] text-sm leading-7 text-[color:var(--kw-muted)] md:text-[15px]">
              {point.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-faint)]">
          Core features
        </p>
        <h3 className="kw-marketing-display mt-3 text-balance text-3xl leading-tight text-[color:var(--kw-ink)] sm:text-4xl">
          The parts that make people say they were looking for this.
        </h3>
      </div>

      <div className="mt-8 space-y-6 md:mt-10 md:space-y-8">
        {CORE_FEATURES.map((feature) => (
          <FeatureShowcase
            key={feature.title}
            eyebrow={feature.eyebrow}
            title={feature.title}
            body={feature.body}
            imageSrc={feature.imageSrc}
            imageAlt={feature.imageAlt}
            reverse={feature.reverse}
          />
        ))}
      </div>
    </section>
  );
}
