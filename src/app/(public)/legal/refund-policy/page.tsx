import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export const metadata = {
  title: "Refund Policy",
};

const LAST_UPDATED = "February 17, 2026";

export default function LegalRefundPolicyPage() {
  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Pill tone="neutral">Legal</Pill>
      <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
        Refund policy.
        <span className="block text-[rgba(31,54,217,1)]">Clear refunds for every purchase.</span>
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
        Last updated: {LAST_UPDATED}
      </p>

      <div className="mt-10 grid gap-4">
        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">1. Scope</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            This policy applies to all paid subscriptions and one-time payments purchased through
            Hifzer&apos;s checkout provider, Paddle.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">2. Refund window</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            We provide a 30 calendar day money-back guarantee on all charges. This includes
            first-time subscription payments, renewal payments, and one-time payments.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">3. How to request</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Email your request with the purchase email and receipt reference to{" "}
            <a href="mailto:support@hifzer.app" className="font-semibold text-[rgba(31,54,217,1)] hover:underline">
              support@hifzer.app
            </a>
            . You can also contact Paddle Buyer Support directly at{" "}
            <a href="https://paddle.net/" className="font-semibold text-[rgba(31,54,217,1)] hover:underline">
              paddle.net
            </a>
            .
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">4. Processing</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Approved refunds are returned to the original payment method through Paddle.
            Processing timelines depend on your payment provider.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">5. Merchant of record</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Our order process is conducted by our online reseller Paddle.com. Paddle.com is the
            Merchant of Record for all our orders. Paddle provides all customer service inquiries
            and handles returns.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">6. Related policies</h2>
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
