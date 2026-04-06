import { FaqSection } from "@/components/landing/faq-section";
import { FinalCta } from "@/components/landing/final-cta";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { Hero } from "@/components/landing/hero";
import { MarqueeStrip } from "@/components/landing/marquee-strip";
import { PlatformStrip } from "@/components/landing/platform-strip";
import { QualityGates } from "@/components/landing/quality-gates";
import { SessionWalkthrough } from "@/components/landing/session-walkthrough";

export const metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return (
    <div>
      {/* 1. Full-viewport hero with scroll parallax + screenshot peek */}
      <Hero />

      {/* 2. Scrolling feature marquee — thin strip, breaks the section cadence */}
      <MarqueeStrip />

      {/* 3–6. Feature cards */}
      <div className="mx-auto max-w-[1280px] py-4 md:py-6">
        <FeatureShowcase
          boldIntro="Protect your Hifz before you add more."
          body="Hifzer runs your Sabaq, Sabqi, and Manzil in one clear daily flow, then catches weak seams, similar ayahs, and fragile recall before they spread. Warm-up gates, blind recall, and rescue drills protect what you already memorised instead of letting today's new lesson quietly damage yesterday's work."
          imageSrc="/hifzer app 1.png"
          imageAlt="Hifzer Hifz session showing Arabic ayah and SRS grade buttons"
          reverse={false}
        />

        <FeatureShowcase
          boldIntro="Never lose your Qur'an place again."
          body="Hifzer saves your exact ayah, not just a vague streak. Jump by surah or juz, keep smart bookmarks with notes, mark reading done outside the app, search Qur'anic terms, and return to the same place even when you are offline."
          imageSrc="/hifzer app 1.png"
          imageAlt="Hifzer Qur'an reading view with progress tracker and audio player"
          reverse={true}
        />

        <FeatureShowcase
          boldIntro="When you do not know what to say, start here."
          body="Move through focused dua journeys for repentance, provision, protection, Allah's Names, and Laylat al-Qadr without feeling lost or performative. Every step keeps the source, meaning, transliteration, repetition support, and your own personal duas close, so the experience feels guided, personal, and honest."
          imageSrc="/hifzer app 1.png"
          imageAlt="Hifzer Dua journey with Arabic text and transliteration"
          reverse={false}
        />

      </div>

      {/* 7. Daily session flow — live mock UI */}
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <SessionWalkthrough />
      </div>

      {/* 8. Hard differentiator — what competitors don't have */}
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <QualityGates />
      </div>

      {/* 9. Platform clarity */}
      <PlatformStrip />

      {/* 10. FAQ */}
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <FaqSection />
      </div>

      {/* 11. Final conversion */}
      <div className="mx-auto max-w-[1200px] px-4 pb-4 md:px-8">
        <FinalCta />
      </div>
    </div>
  );
}
