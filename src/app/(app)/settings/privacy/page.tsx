import { Shield } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Privacy",
};

export default function PrivacySettingsPage() {
  return (
    <PlaceholderPage
      eyebrow="Settings"
      title="Privacy"
      subtitle="Audio retention controls, export, and delete policies."
      icon={<Shield size={18} />}
      message="Privacy settings not wired yet"
    />
  );
}

