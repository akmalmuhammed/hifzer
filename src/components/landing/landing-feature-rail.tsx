"use client";

import { FeatureShowcase } from "@/components/landing/feature-showcase";

const CORE_POINTS = [
  {
    label: "One place for the routine.",
    body: "Hifzer keeps Qur'an reading, hifz, duas, and private notes in one app so you are not stitching the routine together across separate tools.",
  },
  {
    label: "For readers and hifz students.",
    body: "If you are building a daily reading habit, Hifzer keeps your place. If you are doing hifz, it helps you stay clear on what to learn, what to revise, and what needs more attention.",
  },
  {
    label: "What it replaces.",
    body: "It replaces the mix of a Qur'an app, notes app, adhkar list, and memory alone with one focused companion.",
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
      "Hifzer helps you see what to memorize next, what to revise today, and which parts need extra care, so you spend less time feeling behind and more time building hifz that stays with you.",
    imageSrc: "/landing/showcase/Hifz%20final.png",
    imageAlt: "Hifzer hifz screen showing review controls and recall grading",
  },
  {
    eyebrow: "Dua",
    title: "Keep daily adhkar close and personal.",
    body:
      "Arabic, transliteration, and meaning stay together so the dua feels like part of the day you are living, not a separate list you open once in a while.",
    imageSrc: "/landing/showcase/Dua.png",
    imageAlt: "Hifzer dua screen showing a guided dua with Arabic and translation",
    reverse: true,
  },
  {
    eyebrow: "Journal",
    title: "Turn reflections into faith-based journaling.",
    body:
      "Save lessons from an ayah, a reminder from the day, or a private dua note in one journal built around reflection, not social sharing.",
    imageSrc: "/landing/showcase/Journal%20final.png",
    imageAlt: "Hifzer journal screen showing a private reflection entry",
  },
] as const;

export function LandingFeatureRail() {
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
          Hifzer is the companion app for readers who want continuity and for hifz students who
          want more clarity and consistency. It keeps the parts of the practice that matter most together.
        </p>
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
          The parts that keep the routine usable.
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
