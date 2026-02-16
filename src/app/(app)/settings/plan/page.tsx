import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SlidersHorizontal } from "lucide-react";

export const metadata = {
  title: "Plan",
};

export default function PlanSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Plan"
        subtitle="Time budget, practice days, and recalibration (scaffold)."
      />
      <Card>
        <EmptyState
          title="Plan settings not wired yet"
          message="Next step: store onboarding answers in UserProfile and drive the SRS queue builder."
          icon={<SlidersHorizontal size={18} />}
        />
      </Card>
    </div>
  );
}

