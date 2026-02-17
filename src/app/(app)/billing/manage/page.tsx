import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { CalendarClock, SlidersHorizontal } from "lucide-react";
import { redirect } from "next/navigation";
import { ManagePortalButton } from "@/components/billing/manage-portal-button";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata = {
  title: "Manage Billing",
};

function formatDate(input: string | null): string {
  if (!input) {
    return "N/A";
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default async function BillingManagePage() {
  let plan: "FREE" | "PAID" = "FREE";
  let subscriptionStatus: string | null = null;
  let currentPeriodEnd: string | null = null;
  let hasPortal = false;

  if (clerkEnabled()) {
    const { userId } = await auth();
    if (!userId) {
      redirect("/login");
    }
    const profile = await getProfileSnapshot(userId);
    if (profile) {
      plan = profile.plan;
      subscriptionStatus = profile.subscriptionStatus;
      currentPeriodEnd = profile.currentPeriodEnd;
      hasPortal = Boolean(profile.paddleCustomerId);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="Manage"
        subtitle="View your subscription status and open the Paddle billing portal."
      />

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Current plan
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
              {plan === "PAID" ? "Paid" : "Free"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill tone={plan === "PAID" ? "accent" : "neutral"}>
                {subscriptionStatus ?? "No active subscription"}
              </Pill>
              <Pill tone="neutral">Renews/ends: {formatDate(currentPeriodEnd)}</Pill>
            </div>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
            <CalendarClock size={18} />
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <ManagePortalButton disabled={!hasPortal} />
          <Link href="/billing/upgrade">
            <Button variant="ghost">
              {plan === "PAID" ? "Back to plans" : "See upgrade options"}
            </Button>
          </Link>
        </div>
        {!hasPortal ? (
          <p className="mt-3 text-xs text-[color:var(--kw-faint)]">
            A billing portal appears after Paddle links your customer record from checkout.
          </p>
        ) : null}
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
            <SlidersHorizontal size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">What you can manage in portal</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Payment method, invoices, subscription cancellation, and renewal controls are handled by Paddle.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
