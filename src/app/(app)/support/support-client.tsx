"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCopy, Mail, ReceiptText, ShieldCheck } from "lucide-react";
import { SupportCheckoutCard } from "@/components/billing/support-checkout-card";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import styles from "./support.module.css";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@hifzer.com";
const DEFAULT_SUBJECT = "Hifzer support request";
const DEFAULT_BODY = [
  "Assalamu alaikum,",
  "",
  "What do you need help with?",
  "",
  "Route / page:",
  "",
  "Device / browser:",
  "",
  "Anything else we should know:",
].join("\n");

const PAYMENT_REASONS = [
  "Unlock premium Hifzer access",
  "One-time checkout through Paddle",
  "Also supports ongoing development",
] as const;

const SUPPORT_POLICY_SECTIONS = [
  {
    title: "Free problem reports",
    points: [
      "Broken pages and blocked flows can still be reported without paying.",
      "Include the page, what happened, and a screenshot if you have one.",
    ],
  },
  {
    title: "One-time premium checkout",
    points: [
      "Paid checkout is for Hifzer premium access with a one-time payment.",
      "It is not a subscription or recurring plan.",
    ],
  },
  {
    title: "Billing and receipts",
    points: [
      "Paddle processes the payment and emails the receipt.",
      "If there is a billing issue, contact support and include the purchase email.",
    ],
  },
] as const;

function encodeMailto(text: string): string {
  return encodeURIComponent(text).replace(/%20/g, "+");
}

export function SupportClient(props: { hasPortal?: boolean }) {
  const { pushToast } = useToast();
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeMailto(DEFAULT_SUBJECT)}&body=${encodeMailto(DEFAULT_BODY)}`;

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      pushToast({ tone: "success", title: "Email copied", message: SUPPORT_EMAIL });
    } catch {
      pushToast({ tone: "warning", title: "Copy failed", message: "Please copy the email manually." });
    }
  }

  function renderSupportPayment() {
    return (
      <Card id="paid-support" className={`${styles.panel} ${styles.paymentPanel} px-4 py-4 sm:px-5 sm:py-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[color:var(--kw-ink-2)]" />
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">One-time premium</p>
            </div>
            <h2 className="mt-3 max-w-[20ch] text-balance text-3xl font-[family-name:var(--font-kw-display)] tracking-tight text-[color:var(--kw-ink)] sm:text-[2.2rem]">
              Unlock Hifzer premium with a one-time payment.
            </h2>
          </div>
          <div className={styles.purchaseBadge}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">
              Checkout
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">No subscription</p>
          </div>
        </div>
        <p className="mt-4 max-w-[62ch] text-sm leading-7 text-[color:var(--kw-muted)]">
          One checkout unlocks premium access and helps support Hifzer development.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {PAYMENT_REASONS.map((reason) => (
            <div key={reason} className={styles.reasonCard}>
              <CheckCircle2 size={15} className="mt-0.5 text-[rgba(var(--kw-accent-rgb),1)]" />
              <p className="text-sm leading-6 text-[color:var(--kw-ink-2)]">{reason}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <SupportCheckoutCard hasPortal={props.hasPortal} />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Help"
        title="How can we help?"
        subtitle="Report problems for free, or use one-time checkout to unlock Hifzer premium."
        right={(
          <div className="flex flex-wrap gap-2">
            <a href={mailtoHref}>
              <Button className="gap-2">
                Report a problem <Mail size={15} />
              </Button>
            </a>
            <Link href="#paid-support">
              <Button variant="secondary" className="gap-2">
                Unlock premium <ArrowRight size={15} />
              </Button>
            </Link>
          </div>
        )}
      />

      <section className={`kw-fade-in ${styles.hero} px-5 py-5 sm:px-6`}>
        <div className="relative grid gap-3 lg:grid-cols-2">
          <div className={styles.choiceCard}>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="accent">Free</Pill>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                Usually 24-48 hours
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-[family-name:var(--font-kw-display)] tracking-tight text-[color:var(--kw-ink)]">
              Report a problem
            </h2>
            <p className="mt-2 max-w-[54ch] text-sm leading-7 text-[color:var(--kw-muted)]">
              Use this for broken pages, blocked flows, confusing behavior, account access problems, or billing
              questions.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={mailtoHref}>
                <Button className="gap-2">
                  Open support email <Mail size={15} />
                </Button>
              </a>
              <Button variant="ghost" className="gap-2" onClick={copyEmail}>
                Copy email <ClipboardCopy size={14} />
              </Button>
            </div>
          </div>

          <div className={styles.choiceCard}>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="brand">One-time</Pill>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                No subscription
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-[family-name:var(--font-kw-display)] tracking-tight text-[color:var(--kw-ink)]">
              Unlock premium
            </h2>
            <p className="mt-2 max-w-[54ch] text-sm leading-7 text-[color:var(--kw-muted)]">
              One payment, no subscription. Premium access plus support for ongoing development.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="#paid-support">
                <Button variant="secondary" className="gap-2">
                  See premium options <ArrowRight size={15} />
                </Button>
              </Link>
              <span className={styles.emailChip}>
                <ReceiptText size={14} />
                Paddle receipt
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <div className="kw-fade-in" style={{ animationDelay: "50ms" }}>
          {renderSupportPayment()}
        </div>

        <div className="kw-fade-in" style={{ animationDelay: "100ms" }}>
          <Card className={`${styles.panel} px-4 py-4 sm:px-5 sm:py-5`}>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[color:var(--kw-ink-2)]" />
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Support policy</p>
            </div>
            <p className="mt-3 max-w-[60ch] text-sm leading-7 text-[color:var(--kw-muted)]">
              Bug reports stay free. One-time payments are for Hifzer premium access, with no subscription.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="accent">Bug reports free</Pill>
              <Pill tone="brand">One-time premium</Pill>
              <Pill tone="neutral">No subscription</Pill>
            </div>
            <div className={`${styles.policyGrid} mt-4`}>
              {SUPPORT_POLICY_SECTIONS.map((section) => (
                <section key={section.title} className={styles.policySection}>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{section.title}</p>
                  <ul className={styles.policyList}>
                    {section.points.map((point) => (
                      <li key={point} className={styles.policyItem}>
                        <span className={styles.policyDot} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
