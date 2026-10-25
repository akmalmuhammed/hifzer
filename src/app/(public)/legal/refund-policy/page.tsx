import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund terms for one-time Hifzer assistance purchases processed through Paddle.",
  alternates: {
    canonical: "/legal/refund-policy",
  },
};

const LAST_UPDATED = "April 21, 2026";

export default function LegalRefundPolicyPage() {
  return (
    <div className="mx-auto w-full max-w-[44rem] px-[1.4rem] pb-24 pt-14 md:pb-32 md:pt-24">
      <Pill tone="neutral">Legal</Pill>
      <h1 className="mt-5 text-balance font-[family-name:var(--font-kw-display)] text-[clamp(2.25rem,4.6vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[color:var(--kw-ink)]">
        Refund policy.
        <span className="block text-[color:var(--kw-faint)]">Clear refunds for every purchase.</span>
      </h1>
      <p className="mt-5 max-w-2xl text-[0.94rem] leading-[1.5] text-[color:var(--kw-faint)]">
        Last updated: {LAST_UPDATED}
      </p>

      <div className="mt-10 grid gap-10 border-t border-[color:var(--kw-border-2)] pt-10">
        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">1. Scope</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            This policy applies to one-time Hifzer assistance purchases processed through Hifzer&apos;s
            checkout provider, Paddle.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">2. Refund window</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            We provide a 30 calendar day money-back guarantee on one-time Hifzer assistance
            charges.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">3. How to request</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            Email your request with the purchase email and receipt reference to{" "}
            <a href="mailto:support@hifzer.com" className="text-[rgba(var(--kw-accent-rgb),1)] underline underline-offset-2 hover:no-underline">
              support@hifzer.com
            </a>
            . You can also contact Paddle Buyer Support directly at{" "}
            <a href="https://paddle.net/" className="text-[rgba(var(--kw-accent-rgb),1)] underline underline-offset-2 hover:no-underline">
              paddle.net
            </a>
            .
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">4. Processing</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            Approved refunds are returned to the original payment method through Paddle.
            Processing timelines depend on your payment provider.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">5. Merchant of record</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            Our order process is conducted by our online reseller Paddle.com. Paddle.com is the
            Merchant of Record for all our orders. Paddle provides all customer service inquiries
            and handles returns.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">6. Related policies</h2>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/legal/terms" className="text-[1.02rem] text-[rgba(var(--kw-accent-rgb),1)] underline underline-offset-2 hover:no-underline">
              Terms of service
            </Link>
            <Link href="/legal/privacy" className="text-[1.02rem] text-[rgba(var(--kw-accent-rgb),1)] underline underline-offset-2 hover:no-underline">
              Privacy policy
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
