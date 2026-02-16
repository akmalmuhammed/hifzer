import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export const metadata = {
  title: "Refund Policy",
};

const LAST_UPDATED = "February 16, 2026";

export default function LegalRefundPolicyPage() {
  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Pill tone="neutral">Legal</Pill>
      <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
        Refund policy.
        <span className="block text-[rgba(31,54,217,1)]">Billing clarity for Hifzer.</span>
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
        Last updated: {LAST_UPDATED}
      </p>

      <div className="mt-10 grid gap-4">
        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">1. Scope</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            This refund policy applies to paid subscriptions and one-time charges purchased through
            Hifzer&apos;s checkout provider (currently Paddle).
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">2. Subscription refunds</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            First-time subscription charges may be refunded if requested within 14 calendar days of
            the initial payment date. After this window, charges are generally non-refundable unless
            required by applicable law.
          </p>
          <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
            Renewal charges are billed automatically and are not typically refunded on a prorated
            basis.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">3. Donation payments</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Donations are voluntary and treated as one-time support payments. Donations are generally
            non-refundable.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">4. How to request</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Email your request with the purchase email and receipt reference to{" "}
            <a href="mailto:support@hifzer.app" className="font-semibold text-[rgba(31,54,217,1)] hover:underline">
              support@hifzer.app
            </a>
            . We aim to respond within 3 business days.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">5. Related policies</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/legal/terms" className="text-sm font-semibold text-[rgba(31,54,217,1)] hover:underline">
              Terms of service
            </Link>
            <Link href="/legal/privacy" className="text-sm font-semibold text-[rgba(31,54,217,1)] hover:underline">
              Privacy policy
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

