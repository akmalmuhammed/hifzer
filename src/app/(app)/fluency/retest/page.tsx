import { RotateCcw } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Fluency Retest",
};

export default function FluencyRetestPage() {
  return (
    <PlaceholderPage
      eyebrow="Fluency"
      title="Retest"
      subtitle="Re-attempt the fluency check when you are ready."
      icon={<RotateCcw size={18} />}
      message="Retest not wired yet"
    />
  );
}

