import { Gauge } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Scoring",
};

export default function ScoringSettingsPage() {
  return (
    <PlaceholderPage
      eyebrow="Settings"
      title="Scoring"
      subtitle="Self-grade now; later AI-grade can output the same Again/Hard/Good/Easy signal."
      icon={<Gauge size={18} />}
      message="Scoring settings not wired yet"
    />
  );
}

