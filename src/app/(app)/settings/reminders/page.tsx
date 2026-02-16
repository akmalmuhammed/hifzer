import { Bell } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = {
  title: "Reminders",
};

export default function ReminderSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Reminders"
        subtitle="Notification schedule (UI scaffold)."
      />
      <Card>
        <EmptyState
          title="Reminders not wired yet"
          message="We will add notification scheduling after onboarding + auth are in place."
          icon={<Bell size={18} />}
        />
      </Card>
    </div>
  );
}

