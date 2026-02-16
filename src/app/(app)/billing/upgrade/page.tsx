import { CreditCard } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Upgrade",
};

export default function BillingUpgradePage() {
  return (
    <PlaceholderPage
      eyebrow="Billing"
      title="Upgrade"
      subtitle="Choose Free or Paid. Donation is optional."
      icon={<CreditCard size={18} />}
      message="Upgrade flow not wired yet"
    />
  );
}

