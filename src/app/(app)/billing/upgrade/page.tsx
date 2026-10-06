import Link from "next/link";
import { Check, CreditCard, HeartHandshake } from "lucide-react";
import { redirect } from "next/navigation";
import { SupportCheckoutCard } from "@/components/billing/support-checkout-card";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata = {
  title: "One-Time Premium",
};

const CORE_FEATURES = [
  "Daily reading and listening",
  "Bookmarks, translations, and reminders",
  "Core Hifz plan, guided sessions, and daily review",
  "Basic fluency and progress surfaces",
];

const SUPPORT_REASONS = [
  "Unlock premium without starting a subscription",
  "Support ongoing Hifzer development",
  "Use one-time checkout instead of recurring billing",
  "Keep the core app available without a plan change",
];

export default async function BillingUpgradePage() {
  let hasPortal = false;

  if (clerkEnabled()) {
    const userId = await resolveClerkUserIdForServer();
    if (!userId) {
      redirect("/login");
    }
    const profile = await getProfileSnapshot(userId);
    if (profile) {
      hasPortal = Boolean(profile.paddleCustomerId);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="One-time Hifzer premium"
        subtitle="Use one-time Paddle checkout to unlock premium access and support Hifzer development."
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card className="sm:p-7!">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Pill tone="neutral">Core app</Pill>
              <p className="mt-4 text-[3rem] font-[family-name:var(--font-kw-display)] font-semibold leading-[1.05] tracking-[-0.035em] tabular-nums text-[color:var(--kw-ink)]">
                $0
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Reading, Hifz, and dua remain available without a subscription.
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-[color:var(--kw-fill)] text-[color:var(--kw-ink-2)]">
              <CreditCard size={18} />
            </span>
          </div>

          <ul className="mt-5 space-y-2.5 text-[0.94rem] text-[color:var(--kw-ink-2)]">
            {CORE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-[rgba(var(--kw-accent-rgb),1)]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="sm:p-7!">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Pill tone="accent">One-time premium</Pill>
              <p className="mt-4 text-[2.25rem] font-[family-name:var(--font-kw-display)] font-semibold leading-[1.08] tracking-[-0.03em] text-[color:var(--kw-ink)]">
                Flexible premium
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                One payment through Paddle. No recurring billing and no subscription required.
              </p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[rgba(var(--kw-accent-rgb),0.1)] text-[rgba(var(--kw-accent-rgb),1)]">
              <HeartHandshake size={18} />
            </span>
          </div>

          <ul className="mt-5 space-y-2.5 text-[0.94rem] text-[color:var(--kw-ink-2)]">
            {SUPPORT_REASONS.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-[rgba(var(--kw-accent-rgb),1)]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-[color:var(--kw-border-2)] pt-6">
            <SupportCheckoutCard hasPortal={hasPortal} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {hasPortal ? (
              <Link href="/billing/manage">
                <Button variant="ghost">Receipts and buyer help</Button>
              </Link>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
