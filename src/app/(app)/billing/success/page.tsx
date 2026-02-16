import { CheckCircle2 } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Billing Success",
};

export default function BillingSuccessPage() {
  return (
    <PlaceholderPage
      eyebrow="Billing"
      title="Success"
      subtitle="Your plan is updated."
      icon={<CheckCircle2 size={18} />}
      message="Success screen not wired yet"
    />
  );
}

