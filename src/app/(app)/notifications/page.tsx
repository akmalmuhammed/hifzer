import { Bell } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Notifications",
};

export default function NotificationsPage() {
  return (
    <PlaceholderPage
      eyebrow="Notifications"
      title="Notifications"
      subtitle="Reminders, streak nudges, and session prompts."
      icon={<Bell size={18} />}
      message="Notifications not wired yet"
    />
  );
}

