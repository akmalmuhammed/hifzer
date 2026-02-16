import { GraduationCap } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Teacher Mode",
};

export default function TeacherSettingsPage() {
  return (
    <PlaceholderPage
      eyebrow="Settings"
      title="Teacher mode"
      subtitle="A mode for teachers to track multiple students."
      icon={<GraduationCap size={18} />}
      message="Teacher mode not wired yet"
    />
  );
}

