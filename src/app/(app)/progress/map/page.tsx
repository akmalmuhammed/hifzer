import { Map } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Progress Map",
};

export default function ProgressMapPage() {
  return (
    <PlaceholderPage
      eyebrow="Progress"
      title="Map"
      subtitle="A surah/juz map that shows what is memorized, what is due, and where you are weak."
      icon={<Map size={18} />}
      message="Progress map not wired yet"
    />
  );
}

