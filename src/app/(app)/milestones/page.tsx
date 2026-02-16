import { Award } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Milestones",
};

export default function MilestonesPage() {
  return (
    <PlaceholderPage
      eyebrow="Milestones"
      title="Milestones"
      subtitle="Achievements, surah completions, and certificates."
      icon={<Award size={18} />}
      message="Milestones not wired yet"
    />
  );
}

