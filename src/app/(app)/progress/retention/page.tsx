import { LineChart } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Retention",
};

export default function RetentionPage() {
  return (
    <PlaceholderPage
      eyebrow="Progress"
      title="Retention"
      subtitle="Retention rate, station distribution, and review load over time."
      icon={<LineChart size={18} />}
      message="Retention view not wired yet"
    />
  );
}

