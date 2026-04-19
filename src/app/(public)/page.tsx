import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Hero } from "@/components/landing/hero";
import { LandingFeatureRail } from "@/components/landing/landing-feature-rail";
import styles from "@/components/landing/landing.module.css";

const LandingDeferredSections = dynamic(() => import("@/components/landing/landing-deferred-sections").then(m => m.LandingDeferredSections));

export const revalidate = 60;

const landingTitle = "Hifzer | Qur'an, Hifz, Dua, and Notes";
const landingDescription =
  "Hifzer is an all-in-one Qur'an companion for daily reading, hifz, dua, and journaling in one app.";
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
      <div className="py-6 text-center text-sm font-medium tracking-wide text-[color:var(--kw-muted)]/80 sm:text-base border-b border-[color:var(--kw-border)] mb-8">
        Trusted by early adopters revolutionizing their Hifz journey
      </div>
      <div className={styles.afterHero}>
        <div id="core-features">
          <LandingFeatureRail />
        </div>
        <LandingDeferredSections />
      </div>
    </div>
  );
}
