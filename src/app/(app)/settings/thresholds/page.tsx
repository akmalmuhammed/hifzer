import { SlidersHorizontal } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Thresholds",
};

export default function ThresholdsSettingsPage() {
  return (
    <PlaceholderPage
      eyebrow="Settings"
      title="Thresholds"
      subtitle="Strict / Standard / Lenient (for future AI scoring thresholds)."
      icon={<SlidersHorizontal size={18} />}
      message="Threshold settings not wired yet"
    />
  );
}

