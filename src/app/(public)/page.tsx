import { ComparisonMatrix } from "@/components/landing/comparison-matrix";
import { FaqSection } from "@/components/landing/faq-section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { PricingTeaser } from "@/components/landing/pricing-teaser";
import { ProductScreenshot } from "@/components/landing/product-screenshot";
import { Proof } from "@/components/landing/proof";
import { QualityGates } from "@/components/landing/quality-gates";
import { SessionWalkthrough } from "@/components/landing/session-walkthrough";

export default function LandingPage() {
  return (
    <div className="pb-8">
      <Hero />
      <QualityGates />
      <SessionWalkthrough />
      <ProductScreenshot />
      <Proof />
      <FeatureGrid />
      <ComparisonMatrix />
      <PricingTeaser />
      <FaqSection />
      <FinalCta />
    </div>
  );
}
