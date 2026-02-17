import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { BillingSuccessRedirect } from "./success-redirect";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Billing Success",
};

export default function BillingSuccessPage() {
  return (
    <div className="space-y-6">
      <BillingSuccessRedirect />
      <PageHeader
        eyebrow="Billing"
        title="Success"
        subtitle="Your checkout completed successfully."
      />

      <Card>
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Plan updated</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              You will be redirected to Today in a few seconds.
            </p>
            <div className="mt-4">
              <Link href="/today">
                <Button variant="secondary">Go now</Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
