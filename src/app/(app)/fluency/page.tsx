import { Mic } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Fluency",
};

export default function FluencyPage() {
  return (
    <PlaceholderPage
      eyebrow="Fluency"
      title="Fluency track"
      subtitle="A separate track for users who need to build recitation fluency before new memorization."
      icon={<Mic size={18} />}
      message="Fluency track not wired yet"
    />
  );
}

