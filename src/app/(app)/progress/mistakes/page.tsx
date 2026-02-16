import { TriangleAlert } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Mistakes",
};

export default function MistakesPage() {
  return (
    <PlaceholderPage
      eyebrow="Progress"
      title="Mistakes"
      subtitle="A historical log per ayah (MVP will use grades; later AI can add word-level highlights)."
      icon={<TriangleAlert size={18} />}
      message="Mistakes view not wired yet"
    />
  );
}

