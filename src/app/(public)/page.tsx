import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { LandingDeferredSections } from "@/components/landing/landing-deferred-sections";
import { LandingFeatureRail } from "@/components/landing/landing-feature-rail";
import styles from "@/components/landing/landing.module.css";

const landingTitle = "Hifzer | Qur'an Reading, Review, Duas, and Notes";
const landingDescription =
  "Hifzer is a daily Qur'an companion that keeps your reading place, hifz review, duas, and private notes in one calm app.";
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
    <div className={styles.page}>
      <Hero />
      <div className={styles.afterHero}>
        <LandingFeatureRail />
        <LandingDeferredSections />
      </div>
    </div>
  );
}
