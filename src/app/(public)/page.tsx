import { FeatureGrid } from "@/components/landing/feature-grid";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { PricingTeaser } from "@/components/landing/pricing-teaser";
import { Proof } from "@/components/landing/proof";

export default function LandingPage() {
  return (
    <div className="pb-8">
      <Hero />
      <Proof />
      <FeatureGrid />
      <PricingTeaser />
      <FinalCta />
    </div>
  );
}

