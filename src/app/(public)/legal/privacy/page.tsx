import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
};

const LAST_UPDATED = "February 16, 2026";

export default function LegalPrivacyPage() {
  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Pill tone="neutral">Legal</Pill>
      <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
        Privacy policy.
        <span className="block text-[rgba(31,54,217,1)]">How Hifzer handles data.</span>
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
        Last updated: {LAST_UPDATED}
      </p>

      <div className="mt-10 grid gap-4">
        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">1. Data we collect</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            We may collect account identifiers (for example, Clerk user ID), profile settings,
            session progress, grading events, and usage metadata needed to operate the product.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">2. How we use data</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            We use data to provide your plan, store progress, improve reliability, secure accounts,
            and support billing/entitlements.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">3. Billing processors</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Paid checkout is processed by third-party payment providers (currently Paddle). We do not
            store full payment card details on Hifzer servers.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">4. Audio and uploads</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Audio assets used for playback are stored in object storage (Cloudflare R2). Playback
            requests may generate access logs at infrastructure providers.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">5. Retention</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            We retain account and progress data for as long as your account is active or as needed to
            provide the service, comply with legal obligations, and resolve disputes.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">6. Your choices</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            You can update profile preferences in Settings and request account deletion by contacting
            support. Refund handling is described in our{" "}
            <Link href="/legal/refund-policy" className="font-semibold text-[rgba(31,54,217,1)] hover:underline">
              Refund policy
            </Link>
            .
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">7. Contact</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Privacy requests:{" "}
            <a href="mailto:support@hifzer.com" className="font-semibold text-[rgba(31,54,217,1)] hover:underline">
              support@hifzer.com
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
}
