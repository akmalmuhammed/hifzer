import { FaqSection } from "@/components/landing/faq-section";
import { FinalCta } from "@/components/landing/final-cta";
import { PlatformStrip } from "@/components/landing/platform-strip";

export function LandingDeferredSections() {
  return (
    <>
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <FaqSection />
      </div>

      <PlatformStrip />

      <div className="mx-auto max-w-[1200px] px-4 pb-4 md:px-8">
        <FinalCta />
      </div>
    </>
  );
}
