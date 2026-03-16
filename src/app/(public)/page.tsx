import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { ProductScreenshot } from "@/components/landing/product-screenshot";
import { SessionWalkthrough } from "@/components/landing/session-walkthrough";
import { WhatHifzerDoes } from "@/components/landing/what-hifzer-does";
import { WhyItWorks } from "@/components/landing/why-it-works";

export const metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return (
    <div className="pb-10 md:pb-14">
      <Hero />
      <WhatHifzerDoes />
      <SessionWalkthrough />
      <ProductScreenshot />
      <WhyItWorks />
      <FinalCta />
    </div>
  );
}
