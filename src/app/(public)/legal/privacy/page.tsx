import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import Link from "next/link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Hifzer collects, uses, stores, and protects your account and progress data.",
  alternates: {
    canonical: "/legal/privacy",
  },
};

const LAST_UPDATED = "September 5, 2026";

export default function LegalPrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-[44rem] px-[1.4rem] pb-24 pt-14 md:pb-32 md:pt-24">
      <Pill tone="neutral">Legal</Pill>
      <h1 className="mt-5 text-balance font-[family-name:var(--font-kw-display)] text-[clamp(2.25rem,4.6vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[color:var(--kw-ink)]">
        Privacy policy.
        <span className="block text-[color:var(--kw-faint)]">How Hifzer handles data.</span>
      </h1>
      <p className="mt-5 max-w-2xl text-[0.94rem] leading-[1.5] text-[color:var(--kw-faint)]">
        Last updated: {LAST_UPDATED}
      </p>

      <div className="mt-10 grid gap-10 border-t border-[color:var(--kw-border-2)] pt-10">
        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">1. Data we collect</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            We may collect account identifiers (for example, Clerk user ID), profile settings,
            session progress, grading events, and usage metadata needed to operate the product.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">2. How we use data</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            We use data to provide your plan, store progress, improve reliability, secure accounts,
            and support optional checkout flows.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">3. Private journal and device storage</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            Signed-out journal entries stay in this browser&apos;s local storage. Signed-in entries are stored in your
            Hifzer account and queued locally while offline. Browser storage is not end-to-end encrypted and can be
            read by someone with access to your unlocked browser profile. Journal text is excluded from product analytics.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">4. Connected services</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            If you connect Quran.com, Hifzer may sync reading position, activity, and bookmarks using the permissions
            you grant. Private journal reflections are sent to Quran.com notes only when you choose the explicit
            journal export action in Settings. Imports and exports create separate copies.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">5. Analytics and error reporting</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            Product analytics use allowlisted event names and coarse dimensions such as route, device class, action
            type, and outcome. Journal text, free-form answers, email addresses, account IDs, tokens, URL queries,
            and stack traces are not included in product analytics. Error reporting may collect technical diagnostics
            needed to investigate failures.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">6. Billing processors</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            Optional support checkout is processed by third-party payment providers (currently Paddle).
            We do not store full payment card details on Hifzer servers.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">7. Audio and uploads</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            Audio assets used for playback are stored in object storage (Cloudflare R2). Playback
            requests may generate access logs at infrastructure providers.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">8. Retention</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            We retain account and progress data for as long as your account is active or as needed to
            provide the service, comply with legal obligations, and resolve disputes.
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">9. Your choices</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            You can update profile preferences in Settings and request account deletion by contacting
            support. Refund handling is described in our{" "}
            <Link href="/legal/refund-policy" className="text-[rgba(var(--kw-accent-rgb),1)] underline underline-offset-2 hover:no-underline">
              Refund policy
            </Link>
            .
          </p>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">10. Contact</h2>
          <p className="mt-3 text-[1.02rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            Privacy requests:{" "}
            <a href="mailto:support@hifzer.com" className="text-[rgba(var(--kw-accent-rgb),1)] underline underline-offset-2 hover:no-underline">
              support@hifzer.com
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
}
