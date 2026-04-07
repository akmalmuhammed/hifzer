"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCopy, Mail, ShieldCheck } from "lucide-react";
import { SupportCheckoutCard } from "@/components/billing/support-checkout-card";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import styles from "./support.module.css";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@hifzer.com";
const DEVELOPER_EMAIL = process.env.NEXT_PUBLIC_DEVELOPER_EMAIL ?? "akmal@hifzer.com";
const DEFAULT_SUBJECT = "Hifzer support";
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
  "Get direct Hifzer-related help without starting a subscription",
  "Support the product while raising a concrete account or product request",
  "Start with a small one-time payment and only increase it if needed",
] as const;

const SUPPORT_POLICY_SECTIONS = [
  {
    title: "Free support stays free",
    points: [
      "Broken pages, blocked flows, and confusing experiences can be reported without paying.",
      "When you write in, include the route, what you expected, and a screenshot if you have one.",
    ],
  },
  {
    title: "Paid support stays tied to Hifzer",
    points: [
      "Use checkout when you want extra Hifzer support, account-specific help, or to back a concrete product request tied to the app.",
      "Payments support the Hifzer product and related assistance, but they do not buy guaranteed custom development or transfer roadmap control.",
    ],
  },
  {
    title: "What gets the fastest reply",
    points: [
      "A short problem summary, the exact page, and what outcome you need.",
      "If you already know the amount you want to use for paid support, say that upfront so the reply can be more precise.",
    ],
  },
] as const;

function encodeMailto(text: string): string {
  return encodeURIComponent(text).replace(/%20/g, "+");
}

export function SupportClient(props: { hasPortal?: boolean }) {
  const { pushToast } = useToast();
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeMailto(DEFAULT_SUBJECT)}&body=${encodeMailto(DEFAULT_BODY)}`;
  const developerMailtoHref = `mailto:${DEVELOPER_EMAIL}?subject=${encodeMailto("Hifzer developer contact")}`;

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      pushToast({ tone: "success", title: "Email copied", message: SUPPORT_EMAIL });
    } catch {
      pushToast({ tone: "warning", title: "Copy failed", message: "Please copy the email manually." });
    }
  }

  async function copyDeveloperEmail() {
    try {
      await navigator.clipboard.writeText(DEVELOPER_EMAIL);
      pushToast({ tone: "success", title: "Developer email copied", message: DEVELOPER_EMAIL });
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
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Paid Hifzer support</p>
            </div>
            <h2 className="mt-3 max-w-[18ch] text-balance text-3xl font-[family-name:var(--font-kw-display)] tracking-tight text-[color:var(--kw-ink)] sm:text-[2.2rem]">
              Support Hifzer and get direct help without starting a subscription.
            </h2>
          </div>
          <div className={styles.purchaseBadge}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">
              Best fit
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">Product-linked support</p>
          </div>
        </div>
        <p className="mt-4 max-w-[62ch] text-sm leading-7 text-[color:var(--kw-muted)]">
          This is the best fit if you want direct help on a Hifzer issue, need account-specific assistance, or want to
          support the product while raising a concrete improvement request.
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
        eyebrow="Support"
        title="Support"
        subtitle="Get help when something is broken, or make a one-time Hifzer support purchase when you want direct product-linked help."
        right={(
          <div className="flex flex-wrap gap-2">
            <Link href="#paid-support">
              <Button className="gap-2">
                Start paid support <ArrowRight size={15} />
              </Button>
            </Link>
            <a href={mailtoHref}>
              <Button variant="secondary" className="gap-2">
                Open support email <Mail size={15} />
              </Button>
            </a>
          </div>
        )}
      />

      <section className={`kw-fade-in ${styles.hero} px-5 py-5 sm:px-6`}>
        <div className="relative grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <Pill tone="accent">Direct support</Pill>
            <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
              Every message goes straight to the core product team. Broken flows stay the first priority, and one-time
              paid support is available when you want direct Hifzer-related help.
            </p>
          </div>
          <div className={`${styles.tipCard} px-3 py-3`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Response target</p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">Usually within 24-48 hours</p>
          </div>
          <div className={`${styles.tipCard} px-3 py-3`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Paid path</p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">Best for Hifzer-linked help</p>
          </div>
          <div className={`${styles.tipCard} px-3 py-3`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Support email</p>
            <button
              type="button"
              onClick={copyEmail}
              className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--kw-ink)] hover:text-[rgba(var(--kw-accent-rgb),1)]"
            >
              {SUPPORT_EMAIL}
              <ClipboardCopy size={14} />
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
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
              The goal is simple: keep support easy to reach, keep bug help free, and make one-time paid support feel
              clear, product-linked, and worth using when you truly need it.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="accent">Bug help first</Pill>
              <Pill tone="brand">Paid support for Hifzer help</Pill>
              <Pill tone="neutral">Roadmap stays deliberate</Pill>
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
            <div className="mt-5 border-t border-[color:var(--kw-border-2)] pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Developer direct</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                If you need to reach the builder directly, use the address below. For a paid support request, mention the
                Hifzer issue and purchase amount so the reply can stay concrete.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a href={developerMailtoHref}>
                  <Button variant="secondary" size="sm" className="gap-2">
                    {DEVELOPER_EMAIL} <Mail size={14} />
                  </Button>
                </a>
                <Button variant="ghost" size="sm" className="gap-2" onClick={copyDeveloperEmail}>
                  Copy <ClipboardCopy size={14} />
                </Button>
                <Link href="/roadmap">
                  <Button variant="ghost" size="sm" className="gap-2">
                    View roadmap <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
