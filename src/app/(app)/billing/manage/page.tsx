import { SlidersHorizontal } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata = {
  title: "Manage Billing",
};

export default function BillingManagePage() {
  return (
    <PlaceholderPage
      eyebrow="Billing"
      title="Manage"
      subtitle="Manage subscription and invoices (Paddle customer portal)."
      icon={<SlidersHorizontal size={18} />}
      message="Billing management not wired yet"
    />
  );
}
