import type { Metadata } from "next";
import { LandingPageContent } from "@/components/landing/landing-page";

export const revalidate = 60;

const landingTitle = "Hifzer | Daily Qur'an Reading and Hifz";
const landingDescription =
  "Return to your next ayah, protect what you memorized, and keep trusted Qur'an guidance, duas, and private reflection in one daily routine.";
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
  return <LandingPageContent />;
}
