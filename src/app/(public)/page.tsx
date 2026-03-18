import { LandingHome } from "@/components/landing/landing-home";

export const metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return <LandingHome />;
}
