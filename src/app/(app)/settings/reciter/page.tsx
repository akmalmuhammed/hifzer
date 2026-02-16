import { Music } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Reciter",
};

export default function ReciterSettingsPage() {
  return (
    <PlaceholderPage
      eyebrow="Settings"
      title="Reciter"
      subtitle="Preview and select reciters. Free includes the default reciter; Paid unlocks more."
      icon={<Music size={18} />}
      message="Reciter selection not wired yet"
    />
  );
}

