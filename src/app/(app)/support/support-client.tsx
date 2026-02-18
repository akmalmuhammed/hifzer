"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ClipboardCopy, Mail, MessageSquareText, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import styles from "./support.module.css";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@hifzer.app";

type Category = "bug" | "feature" | "billing" | "feedback";

const CATEGORY_SUBJECT: Record<Category, string> = {
  bug: "Hifzer bug report",
  feature: "Hifzer feature request",
  billing: "Hifzer billing support",
  feedback: "Hifzer product feedback",
};

function encodeMailto(text: string): string {
  return encodeURIComponent(text).replace(/%20/g, "+");
}

export function SupportClient() {
  const { pushToast } = useToast();
  const reduceMotion = useReducedMotion();
  const [category, setCategory] = useState<Category>("bug");
  const [subject, setSubject] = useState(CATEGORY_SUBJECT.bug);
  const [message, setMessage] = useState(
    [
      "Assalamu alaikum,",
      "",
      "Issue summary:",
      "",
      "Expected behavior:",
      "",
      "What happened instead:",
      "",
      "Route / page:",
      "",
      "Screenshots or logs:",
    ].join("\n"),
  );

  const mailtoHref = useMemo(() => {
    const finalSubject = subject.trim() || CATEGORY_SUBJECT[category];
    const finalBody = message.trim();
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeMailto(finalSubject)}&body=${encodeMailto(finalBody)}`;
  }, [category, message, subject]);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      pushToast({ tone: "success", title: "Email copied", message: SUPPORT_EMAIL });
    } catch {
      pushToast({ tone: "warning", title: "Copy failed", message: "Please copy the email manually." });
    }
  }

  const transition = {
    duration: reduceMotion ? 0 : 0.45,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Support"
        title="Talk to the Dev"
        subtitle="Send feedback, report issues, or request features directly."
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

      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
        transition={transition}
        className={`${styles.hero} px-5 py-5 sm:px-6`}
      >
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
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Email</p>
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
      </motion.section>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ ...transition, delay: 0.05 }}
        >
          <Card className={`${styles.panel} px-4 py-4`}>
            <div className="flex items-center gap-2">
              <MessageSquareText size={16} className="text-[color:var(--kw-ink-2)]" />
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Prepare your message</p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Category
                <select
                  value={category}
                  onChange={(event) => {
                    const next = event.target.value as Category;
                    setCategory(next);
                    setSubject(CATEGORY_SUBJECT[next]);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-3 text-sm text-[color:var(--kw-ink)]"
                >
                  <option value="bug">Bug report</option>
                  <option value="feature">Feature request</option>
                  <option value="billing">Billing support</option>
                  <option value="feedback">General feedback</option>
                </select>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Subject
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-3 text-sm text-[color:var(--kw-ink)]"
                />
              </label>
            </div>

            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Message
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={12}
                className="mt-1 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-3 py-2 text-sm text-[color:var(--kw-ink)]"
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              <a href={mailtoHref}>
                <Button className="gap-2">
                  Send via email <Mail size={15} />
                </Button>
              </a>
              <Button variant="secondary" className="gap-2" onClick={copyEmail}>
                Copy email <ClipboardCopy size={15} />
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ ...transition, delay: 0.1 }}
          className="space-y-4"
        >
          <Card className={`${styles.panel} px-4 py-4`}>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">What helps us solve fast</p>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              <li>Route URL and the exact action you clicked.</li>
              <li>Expected behavior vs actual behavior.</li>
              <li>Device and browser details.</li>
              <li>Screenshot or short screen recording when possible.</li>
            </ul>
          </Card>

          <Card className={`${styles.panel} px-4 py-4`}>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[color:var(--kw-ink-2)]" />
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Support policy</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
              Product issues and infrastructure regressions are prioritized first. Feature requests are reviewed
              against roadmap impact and user retention value.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="accent">Bug fixes first</Pill>
              <Pill tone="neutral">Roadmap-driven features</Pill>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
