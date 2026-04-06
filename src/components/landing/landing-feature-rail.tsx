"use client";

import { FeatureShowcase } from "@/components/landing/feature-showcase";

const FEATURE_SHOWCASES = [
  {
    boldIntro: "Protect your Hifz before you add more.",
    body: "Hifzer keeps new memorisation and review in one clear daily flow. If yesterday feels weak, it slows things down and helps you fix it first, so progress does not come at the cost of forgetting.",
    imageSrc: "/hifzer app 1.png",
    imageAlt: "Hifzer Hifz session showing Arabic ayah and SRS grade buttons",
    reverse: false,
  },
  {
    boldIntro: "Never lose your Qur'an place again.",
    body: "Hifzer remembers your exact ayah, keeps bookmarks with notes, and helps you return to the same place across your reading routine. You can move by surah or juz and still pick up exactly where you left off.",
    imageSrc: "/hifzer app 1.png",
    imageAlt: "Hifzer Qur'an reading view with progress tracker and audio player",
    reverse: true,
  },
  {
    boldIntro: "When you do not know what to say, start here.",
    body: "Move through guided duas for repentance, provision, protection, Allah's Names, and Laylat al-Qadr without feeling lost. Each step keeps the words, meaning, and your own personal duas close.",
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
