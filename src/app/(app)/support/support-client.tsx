"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCopy, Mail, ShieldCheck } from "lucide-react";
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
      <Card className={`${styles.panel} px-4 py-4`}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[color:var(--kw-ink-2)]" />
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Request paid product work</p>
        </div>
        <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
          Use this for custom development, feature implementation, private workflow help, or other
          software-related Hifzer work tied to your account.
        </p>
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
        subtitle="Report issues, ask for help, or request paid product work directly."
        right={(
          <div className="flex flex-wrap gap-2">
            <Link href="/roadmap">
              <Button variant="secondary" className="gap-2">
                View roadmap <ArrowRight size={15} />
              </Button>
            </Link>
            <a href={mailtoHref}>
              <Button className="gap-2">
                Open email draft <Mail size={15} />
              </Button>
            </a>
          </div>
        )}
      />

      <section className={`kw-fade-in ${styles.hero} px-5 py-5 sm:px-6`}>
        <div className="relative grid gap-3 sm:grid-cols-3">
          <div>
            <Pill tone="accent">Direct support</Pill>
            <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
              Every support thread goes to the core product team directly.
            </p>
          </div>
          <div className={`${styles.tipCard} px-3 py-3`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Response target</p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">Usually within 24-48 hours</p>
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
          <Card className={`${styles.panel} px-4 py-4`}>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[color:var(--kw-ink-2)]" />
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Support policy</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
              Broken experiences are handled first. Feature requests are reviewed against clarity,
              usefulness, and whether they help people return to Hifzer consistently. When you write
              in, include the route, what you expected, and a screenshot if you have one.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="accent">Bug fixes first</Pill>
              <Pill tone="neutral">Roadmap-driven features</Pill>
              <Pill tone="neutral">Direct email support</Pill>
            </div>
            <div className="mt-4 border-t border-[color:var(--kw-border-2)] pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Developer direct</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a href={developerMailtoHref}>
                  <Button variant="secondary" size="sm" className="gap-2">
                    {DEVELOPER_EMAIL} <Mail size={14} />
                  </Button>
                </a>
                <Button variant="ghost" size="sm" className="gap-2" onClick={copyDeveloperEmail}>
                  Copy <ClipboardCopy size={14} />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
