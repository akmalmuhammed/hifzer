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
  title: "Receipts and Buyer Help",
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
      subscriptionStatus = profile.subscriptionStatus;
      currentPeriodEnd = profile.currentPeriodEnd;
      hasPortal = Boolean(profile.paddleCustomerId);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="Receipts and buyer help"
        subtitle="Open Paddle buyer support when it is available for your account and review payment history for your one-time Hifzer support purchases."
      />

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Current billing state
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
              {hasPortal ? "Paddle linked" : "No checkout linked yet"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill tone={hasPortal ? "accent" : "neutral"}>
                {subscriptionStatus ?? "No recurring subscription"}
              </Pill>
              <Pill tone="neutral">Latest billing period end: {formatDate(currentPeriodEnd)}</Pill>
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
              Back to checkout
            </Button>
          </Link>
        </div>
        {!hasPortal ? (
          <p className="mt-3 text-xs text-[color:var(--kw-faint)]">
            This becomes available after your first successful Paddle checkout links a customer record.
          </p>
        ) : null}
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
            <SlidersHorizontal size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">What you can find in Paddle</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Receipt access, saved payment details, and buyer support are handled by Paddle. Since Hifzer is using
              one-time support purchases here, there is no subscription cancellation flow.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
