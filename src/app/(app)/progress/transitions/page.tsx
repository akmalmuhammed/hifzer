import { Link2 } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Transitions",
};

export default function TransitionsPage() {
  return (
    <PlaceholderPage
      eyebrow="Progress"
      title="Transitions"
      subtitle="Weak links between ayahs, to schedule targeted link-repair sessions."
      icon={<Link2 size={18} />}
      message="Transitions view not wired yet"
    />
  );
}

