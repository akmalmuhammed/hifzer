import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Check, CreditCard, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata = {
  title: "Upgrade",
};

const FREE_FEATURES = [
  "Daily plan and session flow",
  "Per-ayah grading and queueing",
  "Dark mode and standard visuals",
];

const PAID_FEATURES = [
  "Theme and accent personalization",
  "Expanded reciter/audio options",
  "Advanced progress features as they ship",
];

export default async function BillingUpgradePage() {
  let plan: "FREE" | "PAID" = "FREE";
  let hasPortal = false;

  if (clerkEnabled()) {
    const { userId } = await auth();
    if (!userId) {
      redirect("/login");
    }
    const profile = await getProfileSnapshot(userId);
    if (profile) {
      plan = profile.plan;
      hasPortal = Boolean(profile.paddleCustomerId);
    }
  }

  const onPaidPlan = plan === "PAID";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="Upgrade"
        subtitle="Choose your plan. Paid unlocks additional personalization."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Pill tone="neutral">Free</Pill>
              <p className="mt-3 text-3xl font-[family-name:var(--font-kw-display)] tracking-tight text-[color:var(--kw-ink)]">
                $0
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Good for daily consistency and core hifz flow.
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
              <CreditCard size={18} />
            </span>
          </div>

          <ul className="mt-5 space-y-2 text-sm text-[color:var(--kw-muted)]">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 text-[color:var(--kw-ink-2)]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Pill tone="accent">Paid</Pill>
              <p className="mt-3 text-3xl font-[family-name:var(--font-kw-display)] tracking-tight text-[color:var(--kw-ink)]">
                $7<span className="ml-2 text-sm font-semibold text-[color:var(--kw-muted)]">/ month</span>
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                More personalization with subscription billing via Paddle.
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.10)] text-[color:var(--kw-ink)]">
              <Sparkles size={18} />
            </span>
          </div>

          <ul className="mt-5 space-y-2 text-sm text-[color:var(--kw-muted)]">
            {PAID_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 text-[color:var(--kw-ink-2)]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {onPaidPlan ? (
              <Button variant="secondary" disabled>
                Current plan
              </Button>
            ) : (
              <UpgradeButton />
            )}
            {hasPortal ? (
              <Link href="/billing/manage">
                <Button variant="ghost">Manage billing</Button>
              </Link>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
