import { CommunityRoadmap } from "@/components/landing/community-roadmap";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LegacySection } from "@/components/landing/legacy-section";
import { ProductScreenshot } from "@/components/landing/product-screenshot";
import { SacredMoment } from "@/components/landing/sacred-moment";
import { SessionWalkthrough } from "@/components/landing/session-walkthrough";
import { StatsBar } from "@/components/landing/stats-bar";
import { StorySection } from "@/components/landing/story-section";
import { WhatHifzerDoes } from "@/components/landing/what-hifzer-does";
import { WhyItWorks } from "@/components/landing/why-it-works";
import styles from "@/components/landing/landing.module.css";

export const metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return (
    <div className={`${styles.page} pb-10 md:pb-14`}>
      <Hero />
      <StatsBar />
      <WhatHifzerDoes />
      <ProductScreenshot />
      <SessionWalkthrough />
      <WhyItWorks />
      <HowItWorks />
      <StorySection />
      <LegacySection />
      <SacredMoment />
      <CommunityRoadmap />
      <FinalCta />
    </div>
  );
}
