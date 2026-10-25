import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import Link from "next/link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Usage rules, account responsibilities, and billing terms for using Hifzer.",
  alternates: {
    canonical: "/legal/terms",
  },
};

const LAST_UPDATED = "April 21, 2026";

export default function LegalTermsPage() {
  return (
    <div className="mx-auto w-full max-w-[44rem] px-[1.4rem] pb-24 pt-14 md:pb-32 md:pt-24">
      <Pill tone="neutral">Legal</Pill>
      <h1 className="mt-5 text-balance font-[family-name:var(--font-kw-display)] text-[clamp(2.25rem,4.6vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[color:var(--kw-ink)]">
        Terms of service.
        <span className="block text-[color:var(--kw-faint)]">Usage rules for Hifzer.</span>
      </h1>
      <p className="mt-5 max-w-2xl text-[0.94rem] leading-[1.5] text-[color:var(--kw-faint)]">
        Last updated: {LAST_UPDATED}
      </p>

      <div className="mt-10 grid gap-10 border-t border-[color:var(--kw-border-2)] pt-10">
        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">1. Acceptance of terms</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            By accessing or using Hifzer, you agree to these terms. If you do not agree, do not use
            the service.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">2. Accounts and access</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            You are responsible for maintaining the confidentiality of your account credentials and
            all activity under your account.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">3. Billing and one-time assistance purchases</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            Hifzer may offer one-time payments for written assistance related to Hifzer software:
            account access, billing questions, setup, and product workflow help. These charges are
            processed by our billing provider, Paddle.
          </p>
          <p className="mt-4 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            These purchases are not donations, subscriptions, generic consulting services, device
            repair services, roadmap control, or guarantees of custom development delivery.
          </p>
          <p className="mt-4 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            Our order process is conducted by our online reseller Paddle.com. Paddle.com is the
            Merchant of Record for all our orders. Paddle provides all customer service inquiries
            and handles returns.
          </p>
          <p className="mt-4 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            Refund handling is defined in our{" "}
            <Link href="/legal/refund-policy" className="text-[rgba(var(--kw-accent-rgb),1)] underline underline-offset-2 hover:no-underline">
              Refund policy
            </Link>
            .
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">4. Acceptable use</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            You agree not to misuse the service, interfere with operations, scrape private data, or
            attempt unauthorized access to systems or accounts.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">5. Content and attribution</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            Qur&apos;an Arabic text (Tanzil Uthmani), metadata, and English translation (Saheeh
            International via Tanzil) are attributed on{" "}
            <Link href="/legal/sources" className="text-[rgba(var(--kw-accent-rgb),1)] underline underline-offset-2 hover:no-underline">
              Sources
            </Link>
            . You must keep required attribution intact when redistributing bundled seed data.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">6. Disclaimer</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            Hifzer is an educational practice tool and does not replace qualified teachers,
            institutions, or formal religious guidance.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">7. Limitation of liability</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            To the maximum extent permitted by law, Hifzer is provided &quot;as is&quot; without warranties,
            and we are not liable for indirect, incidental, or consequential damages arising from use
            of the service.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">8. Contact</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            Questions about these terms:{" "}
            <a href="mailto:support@hifzer.com" className="text-[rgba(var(--kw-accent-rgb),1)] underline underline-offset-2 hover:no-underline">
              support@hifzer.com
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
}
