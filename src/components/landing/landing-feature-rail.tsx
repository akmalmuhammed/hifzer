"use client";

import { FeatureShowcase } from "@/components/landing/feature-showcase";

const CORE_POINTS = [
  {
    label: "Read with continuity.",
    body: "Open the app and return to the exact ayah, surah, and place you last used.",
  },
  {
    label: "Review with structure.",
    body: "Keep Sabaq, Sabqi, and Manzil visible so memorisation does not drift into guesswork.",
  },
  {
    label: "Keep the routine close.",
    body: "Duas and private notes stay beside the Qur'an instead of being split into other tools.",
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
    eyebrow: "Hifz review",
    title: "Keep Sabaq, Sabqi, and Manzil honest.",
    body:
      "Hifzer keeps your review in front of you so weak ayahs surface early, recall stays deliberate, and progress does not depend on memory alone.",
    imageSrc: "/landing/showcase/Hifz%20final.png",
    imageAlt: "Hifzer hifz screen showing review controls and recall grading",
  },
  {
    eyebrow: "Dua",
    title: "Open taught duas without leaving the routine.",
    body:
      "Arabic, transliteration, and meaning stay together, so your daily adhkar feel close to the rest of your Qur'an habit instead of living in another app.",
    imageSrc: "/landing/showcase/Dua.png",
    imageAlt: "Hifzer dua screen showing a guided dua with Arabic and translation",
    reverse: true,
  },
  {
    eyebrow: "Journal",
    title: "Keep reflections private and close to what mattered.",
    body:
      "When an ayah, reminder, or hard day stays with you, save it in your own journal instead of scattering that moment into another notes tool.",
    imageSrc: "/landing/showcase/Journal%20final.png",
    imageAlt: "Hifzer journal screen showing a private reflection entry",
  },
] as const;

export function LandingFeatureRail() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 md:px-8 md:py-20">
      <div className="mx-auto max-w-[1040px]">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-faint)]">
          What Hifzer helps with
        </p>
        <h2 className="kw-marketing-display mt-4 max-w-[12ch] text-balance text-4xl leading-[0.96] text-[color:var(--kw-ink)] sm:text-5xl md:text-6xl">
          Keep the whole Qur&apos;an routine together.
        </h2>
        <p className="mt-5 max-w-[58ch] text-sm leading-7 text-[color:var(--kw-muted)] md:text-[15px]">
          Hifzer is a calm daily companion for reading, hifz review, duas, and private
          reflections. These are the parts that make it useful once you actually start using it.
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
          The main parts people actually come back for.
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
