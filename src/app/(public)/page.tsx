import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { ProductScreenshot } from "@/components/landing/product-screenshot";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { WhatHifzerDoes } from "@/components/landing/what-hifzer-does";
import { getAppUiCopy } from "@/hifzer/i18n/app-ui-copy";
import { getUiLanguageServer } from "@/hifzer/i18n/server";

export const metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function LandingPage() {
  const language = await getUiLanguageServer();
  const copy = getAppUiCopy(language);

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
          {copy.marketing.motivation}
        </TrackedLink>
      </div>
    </div>
  );
}
