import { Flame } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Streak",
};

export default function StreakPage() {
  return (
    <PlaceholderPage
      eyebrow="Streak"
      title="Streak"
      subtitle="Calendar heatmap, streak rules, and recovery protocol."
      icon={<Flame size={18} />}
      message="Streak view not wired yet"
    />
  );
}

