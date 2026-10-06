import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal",
  description: "Read Hifzer's legal hub for terms, privacy, refund policy, and source attribution.",
  alternates: {
    canonical: "/legal",
  },
};

const LINKS = [
  {
    href: "/legal/terms",
    title: "Terms of service",
    description: "Usage rules, account responsibilities, and billing terms.",
  },
  {
    href: "/legal/privacy",
    title: "Privacy policy",
    description: "How Hifzer collects, uses, and retains your data.",
  },
  {
    href: "/legal/refund-policy",
    title: "Refund policy",
    description: "Subscription and one-time Hifzer support refund handling.",
  },
  {
    href: "/legal/sources",
    title: "Sources and attribution",
    description: "Tanzil attribution and dataset credits used by the app.",
  },
] as const;

export default function LegalHubPage() {
  return (
    <div className="mx-auto w-full max-w-[44rem] px-[1.4rem] pb-24 pt-14 md:pb-32 md:pt-24">
      <Pill tone="neutral">Legal</Pill>
      <h1 className="mt-5 text-balance font-[family-name:var(--font-kw-display)] text-[clamp(2.25rem,4.6vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[color:var(--kw-ink)]">
        Policies and sources.
      </h1>
      <p className="mt-5 max-w-2xl text-[1.15rem] leading-[1.45] tracking-[-0.012em] text-[color:var(--kw-muted)]">
        These pages cover terms, privacy, refunds, and Qur&apos;an source attribution.
      </p>

      <div className="mt-10 grid border-t border-[color:var(--kw-border-2)]">
        {LINKS.map((item) => (
          <Card key={item.href} className="rounded-none! border-x-0! border-t-0! bg-transparent! px-0! py-7! shadow-none!">
            <h2 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">{item.title}</h2>
            <p className="mt-2 text-[1.02rem] leading-[1.5] text-[color:var(--kw-muted)]">{item.description}</p>
            <div className="mt-3">
              <Link href={item.href} className="text-[1.02rem] text-[rgba(var(--kw-accent-rgb),1)] underline-offset-2 hover:underline">
                Open page
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
