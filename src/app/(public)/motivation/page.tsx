import { MotivationClientPage } from "./motivation-client";

export const metadata = {
  title: "Motivation | Hifzer",
  description: "Motivational Hifz and Qur'an creatives.",
  alternates: {
    canonical: "/motivation",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function MotivationPage() {
  return <MotivationClientPage />;
}
