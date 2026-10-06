import Link from "next/link";
import { CheckCircle2, HeartHandshake, Mail, MoveRight } from "lucide-react";
import { EntitlementActivationStatus } from "@/components/billing/entitlement-activation-status";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export const metadata = {
  title: "Thank You",
};

const RECEIPT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@hifzer.com";

export default function BillingThankYouPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="Thank you for supporting Hifzer."
        subtitle="Your payment was received. Keep this page open while Hifzer confirms premium access."
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="sm:p-7!">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[color:var(--kw-pill-success-bg)] text-[color:var(--kw-lime-600)]">
              <CheckCircle2 size={18} />
            </span>
            <div className="min-w-0">
              <Pill tone="success">Payment received</Pill>
              <p className="mt-3 text-[1.5rem] font-[family-name:var(--font-kw-display)] font-semibold leading-[1.12] tracking-[-0.025em] text-[color:var(--kw-ink)] sm:text-[1.75rem]">
                Your one-time Hifzer premium payment went through successfully.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
                Paddle should send your receipt and payment confirmation to the email used during checkout. Your
                purchase also helps support ongoing Hifzer development.
              </p>
              <EntitlementActivationStatus />

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button asChild>
                  <Link href="/dashboard">
                    Return to dashboard <MoveRight size={16} />
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/support">Back to support</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[rgba(var(--kw-accent-rgb),0.1)] text-[rgba(var(--kw-accent-rgb),1)]">
              <HeartHandshake size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">What happens next</p>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                <li>Paddle handles the receipt and buyer support details.</li>
                <li>Your Hifzer account stays available as normal.</li>
                <li>Use the support page if you need billing or receipt follow-up.</li>
              </ul>

              <div className="mt-4 rounded-[16px] bg-[color:var(--kw-fill)] px-4 py-4">
                <div className="flex items-start gap-2">
                  <Mail size={16} className="mt-1 text-[color:var(--kw-ink-2)]" />
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Need help with the receipt?</p>
                    <p className="mt-1 text-sm leading-7 text-[color:var(--kw-muted)]">
                      Paddle usually emails the receipt directly. If something looks off, contact{" "}
                      <a
                        href={`mailto:${RECEIPT_EMAIL}`}
                        className="font-medium text-[rgba(var(--kw-accent-rgb),1)] hover:underline"
                      >
                        {RECEIPT_EMAIL}
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
