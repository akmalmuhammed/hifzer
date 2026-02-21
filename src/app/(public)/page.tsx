import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { ProductScreenshot } from "@/components/landing/product-screenshot";
import { WhatHifzerDoes } from "@/components/landing/what-hifzer-does";

export const metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return (
    <div className="pb-8">
      <Hero />
      <WhatHifzerDoes />
      <ProductScreenshot />
      <FinalCta />
    </div>
  );
}
