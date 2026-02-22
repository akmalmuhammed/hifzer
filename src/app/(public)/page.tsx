import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { ProductScreenshot } from "@/components/landing/product-screenshot";
import { TrackedLink } from "@/components/telemetry/tracked-link";
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
      <div className="pb-6 text-center">
        <TrackedLink
          href="/motivation"
          telemetryName="landing.motivation_link"
          className="inline-flex rounded-full border border-[color:var(--kw-border)] bg-[color:var(--kw-surface-soft)] px-5 py-2 text-sm font-semibold text-[color:var(--kw-ink)] transition hover:bg-[color:var(--kw-hover-soft)]"
        >
          Motivation
        </TrackedLink>
      </div>
    </div>
  );
}
