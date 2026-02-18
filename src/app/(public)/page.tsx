import { ComparisonMatrix } from "@/components/landing/comparison-matrix";
import { FaqSection } from "@/components/landing/faq-section";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { PricingTeaser } from "@/components/landing/pricing-teaser";
import { ProductScreenshot } from "@/components/landing/product-screenshot";
import { Proof } from "@/components/landing/proof";
import { SessionWalkthrough } from "@/components/landing/session-walkthrough";

export const metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return (
    <div className="pb-8">
      <Hero />
      <SessionWalkthrough />
      <ProductScreenshot />
      <Proof />
      <ComparisonMatrix />
      <PricingTeaser />
      <FaqSection />
      <FinalCta />
    </div>
  );
}
