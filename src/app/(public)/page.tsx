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
          boldIntro="Memorise without forgetting."
          body="The classical Sabaq, Sabqi, and Manzil structure powered by spaced repetition that adapts to you. You only advance when truly ready, so nothing ever slips away."
          imageSrc="/hifzer app 1.png"
          imageAlt="Hifzer Hifz session showing Arabic ayah and SRS grade buttons"
          reverse={false}
        />

        <FeatureShowcase
          boldIntro="Read every day. Track every ayah."
          body="Follow your reading with ayah-level progress and built-in audio recitation. Daily juz, Fajr recitation or any time you open the app, Hifzer keeps your streak going."
          imageSrc="/hifzer app 1.png"
          imageAlt="Hifzer Qur'an reading view with progress tracker and audio player"
          reverse={true}
        />

        <FeatureShowcase
          boldIntro="Duas grounded in sunnah."
          body="Curated supplication journeys for morning, evening, gratitude and hardship. Every dua is sourced, transliterated and structured for reflection, not just recitation."
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
