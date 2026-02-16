import { Dumbbell } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Practice",
};

export default function PracticePage() {
  return (
    <PlaceholderPage
      eyebrow="Practice"
      title="Practice"
      subtitle="Free drills outside your daily queue (not scheduled)."
      icon={<Dumbbell size={18} />}
      message="Practice drills not wired yet"
    />
  );
}

