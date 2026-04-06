"use client";

import { FaqSection } from "@/components/landing/faq-section";
import { FinalCta } from "@/components/landing/final-cta";
import { PlatformStrip } from "@/components/landing/platform-strip";
import { QualityGates } from "@/components/landing/quality-gates";
import { SessionWalkthrough } from "@/components/landing/session-walkthrough";

export function LandingDeferredSections() {
  return (
    <>
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <SessionWalkthrough />
      </div>

      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <QualityGates />
      </div>

      <PlatformStrip />

      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <FaqSection />
      </div>

      <div className="mx-auto max-w-[1200px] px-4 pb-4 md:px-8">
        <FinalCta />
      </div>
    </>
  );
}
