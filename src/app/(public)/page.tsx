import dynamic from "next/dynamic";
import { Hero } from "@/components/landing/hero";
import { MarqueeStrip } from "@/components/landing/marquee-strip";

function SkeletonBlock(props: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-[24px] bg-[color:var(--kw-skeleton)] ${props.className}`} />;
}

function FeatureRailLoading() {
  return (
    <div className="mx-auto max-w-[1280px] py-4 md:py-6">
      <div className="space-y-4 px-3 py-2 sm:px-4 md:px-6 md:py-3">
        <SkeletonBlock className="h-[420px] w-full rounded-[28px]" />
        <SkeletonBlock className="h-[420px] w-full rounded-[28px]" />
        <SkeletonBlock className="h-[420px] w-full rounded-[28px]" />
      </div>
    </div>
  );
}

function DeferredSectionsLoading() {
  return (
    <div aria-hidden="true">
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <SkeletonBlock className="h-[620px] w-full rounded-[32px] py-10 md:py-14" />
      </div>

      <div className="mx-auto mt-10 max-w-[1200px] px-4 md:px-8">
        <SkeletonBlock className="h-[760px] w-full rounded-[32px] py-10 md:py-14" />
      </div>

      <div className="mx-auto mt-10 max-w-[1200px] px-4 md:px-8">
        <SkeletonBlock className="h-[360px] w-full rounded-[32px]" />
      </div>

      <div className="mx-auto mt-10 max-w-[1200px] px-4 md:px-8">
        <SkeletonBlock className="h-[520px] w-full rounded-[32px] py-10 md:py-14" />
      </div>

      <div className="mx-auto mt-10 max-w-[1200px] px-4 pb-4 md:px-8">
        <SkeletonBlock className="h-[340px] w-full rounded-[32px] py-10 md:py-14" />
      </div>
    </div>
  );
}

const LandingFeatureRail = dynamic(
  () => import("@/components/landing/landing-feature-rail").then((mod) => mod.LandingFeatureRail),
  {
    loading: () => <FeatureRailLoading />,
  },
);

const LandingDeferredSections = dynamic(
  () => import("@/components/landing/landing-deferred-sections").then((mod) => mod.LandingDeferredSections),
  {
    loading: () => <DeferredSectionsLoading />,
  },
);

export const metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return (
    <div>
      <Hero />
      <MarqueeStrip />
      <LandingFeatureRail />
      <LandingDeferredSections />
    </div>
  );
}
