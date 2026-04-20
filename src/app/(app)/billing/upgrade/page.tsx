import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Check, CreditCard, HeartHandshake } from "lucide-react";
import { redirect } from "next/navigation";
import { SupportCheckoutCard } from "@/components/billing/support-checkout-card";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata = {
  title: "One-Time Support",
};

const CORE_FEATURES = [
  "Daily reading and listening",
  "Bookmarks, translations, and reminders",
  "Core Hifz plan, guided sessions, and daily review",
  "Basic fluency and progress surfaces",
];

const SUPPORT_REASONS = [
  "Get Hifzer-related help without starting a subscription",
  "Support the product while raising a concrete improvement request",
  "Pay for Hifzer account assistance or product-linked follow-up",
  "Use one-time checkout instead of a recurring subscription",
];

export default async function BillingUpgradePage() {
  let hasPortal = false;

  if (clerkEnabled()) {
    const { userId } = await auth();
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
        title="One-time Hifzer support"
        subtitle="Use one-time Paddle checkout for Hifzer-related support, account help, and product-linked requests."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Pill tone="neutral">Core app</Pill>
              <p className="mt-3 text-3xl font-[family-name:var(--font-kw-display)] tracking-tight text-[color:var(--kw-ink)]">
                $0
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Reading, Hifz, and dua remain available without a subscription.
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
              <CreditCard size={18} />
            </span>
          </div>

          <ul className="mt-5 space-y-2 text-sm text-[color:var(--kw-muted)]">
            {CORE_FEATURES.map((feature) => (
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
              <Pill tone="accent">One-time support</Pill>
              <p className="mt-3 text-3xl font-[family-name:var(--font-kw-display)] tracking-tight text-[color:var(--kw-ink)]">
                Flexible help
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                One-time checkout for Hifzer-related support through Paddle. No recurring billing and no subscription plan change.
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.10)] text-[color:var(--kw-ink)]">
              <HeartHandshake size={18} />
            </span>
          </div>

          <ul className="mt-5 space-y-2 text-sm text-[color:var(--kw-muted)]">
            {SUPPORT_REASONS.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 text-[color:var(--kw-ink-2)]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6">
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
