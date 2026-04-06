"use client";

import { FeatureShowcase } from "@/components/landing/feature-showcase";

const FEATURE_SHOWCASES = [
  {
    boldIntro: "Protect your Hifz before you add more.",
    body: "Hifzer runs your Sabaq, Sabqi, and Manzil in one clear daily flow, then catches weak seams, similar ayahs, and fragile recall before they spread. Warm-up gates, blind recall, and rescue drills protect what you already memorised instead of letting today's new lesson quietly damage yesterday's work.",
    imageSrc: "/hifzer app 1.png",
    imageAlt: "Hifzer Hifz session showing Arabic ayah and SRS grade buttons",
    reverse: false,
  },
  {
    boldIntro: "Never lose your Qur'an place again.",
    body: "Hifzer saves your exact ayah, not just a vague streak. Jump by surah or juz, keep smart bookmarks with notes, mark reading done outside the app, search Qur'anic terms, and return to the same place even when you are offline.",
    imageSrc: "/hifzer app 1.png",
    imageAlt: "Hifzer Qur'an reading view with progress tracker and audio player",
    reverse: true,
  },
  {
    boldIntro: "When you do not know what to say, start here.",
    body: "Move through focused dua journeys for repentance, provision, protection, Allah's Names, and Laylat al-Qadr without feeling lost or performative. Every step keeps the source, meaning, transliteration, repetition support, and your own personal duas close, so the experience feels guided, personal, and honest.",
    imageSrc: "/hifzer app 1.png",
    imageAlt: "Hifzer Dua journey with Arabic text and transliteration",
    reverse: false,
  },
] as const;

export function LandingFeatureRail() {
  return (
    <div className="mx-auto max-w-[1280px] py-4 md:py-6">
      {FEATURE_SHOWCASES.map((feature) => (
        <FeatureShowcase key={feature.boldIntro} {...feature} />
      ))}
    </div>
  );
}
