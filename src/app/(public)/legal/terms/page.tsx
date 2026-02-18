import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
};

const LAST_UPDATED = "February 17, 2026";

export default function LegalTermsPage() {
  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Pill tone="neutral">Legal</Pill>
      <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
        Terms of service.
        <span className="block text-[rgba(31,54,217,1)]">Usage rules for Hifzer.</span>
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
        Last updated: {LAST_UPDATED}
      </p>

      <div className="mt-10 grid gap-4">
        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">1. Acceptance of terms</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            By accessing or using Hifzer, you agree to these terms. If you do not agree, do not use
            the service.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">2. Accounts and access</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            You are responsible for maintaining the confidentiality of your account credentials and
            all activity under your account.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">3. Plans, billing, and cancellation</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Hifzer offers Free and Paid plans. Paid subscriptions and other charges are processed by
            our billing provider (currently Paddle). You can cancel subscription renewal at any
            time from your billing portal.
          </p>
          <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
            Our order process is conducted by our online reseller Paddle.com. Paddle.com is the
            Merchant of Record for all our orders. Paddle provides all customer service inquiries
            and handles returns.
          </p>
          <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
            Refund handling is defined in our{" "}
            <Link href="/legal/refund-policy" className="font-semibold text-[rgba(31,54,217,1)] hover:underline">
              Refund policy
            </Link>
            .
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">4. Acceptable use</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            You agree not to misuse the service, interfere with operations, scrape private data, or
            attempt unauthorized access to systems or accounts.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">5. Content and attribution</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Qur&apos;an Arabic text (Tanzil Uthmani), metadata, and English translation (Saheeh
            International via Tanzil) are attributed on{" "}
            <Link href="/legal/sources" className="font-semibold text-[rgba(31,54,217,1)] hover:underline">
              Sources
            </Link>
            . You must keep required attribution intact when redistributing bundled seed data.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">6. Disclaimer</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Hifzer is an educational practice tool and does not replace qualified teachers,
            institutions, or formal religious guidance.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">7. Limitation of liability</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            To the maximum extent permitted by law, Hifzer is provided &quot;as is&quot; without warranties,
            and we are not liable for indirect, incidental, or consequential damages arising from use
            of the service.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">8. Contact</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Questions about these terms:{" "}
            <a href="mailto:support@hifzer.com" className="font-semibold text-[rgba(31,54,217,1)] hover:underline">
              support@hifzer.com
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
}
