import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { LandingDeferredSections } from "@/components/landing/landing-deferred-sections";
import { LandingFeatureRail } from "@/components/landing/landing-feature-rail";

const landingTitle = "Hifzer | Qur'an Reading, Review, Duas, and Notes";
const landingDescription =
  "Keep your place, your review, your duas, and your private notes in one place.";
const landingImage = "/opengraph-image";

export const metadata: Metadata = {
  title: {
    absolute: landingTitle,
  },
  description: landingDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: landingTitle,
    description: landingDescription,
    url: "/",
    siteName: "Hifzer",
    type: "website",
    images: [
      {
        url: landingImage,
        width: 1200,
        height: 630,
        alt: "Hifzer landing page share image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: landingTitle,
    description: landingDescription,
    images: [landingImage],
  },
};

export default function LandingPage() {
  return (
    <div>
      <Hero />
      <LandingFeatureRail />
      <LandingDeferredSections />
    </div>
  );
}
