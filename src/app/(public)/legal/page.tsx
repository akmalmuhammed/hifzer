import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export const metadata = {
  title: "Legal",
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
    description: "Subscription and donation refund handling.",
  },
  {
    href: "/legal/sources",
    title: "Sources and attribution",
    description: "Tanzil attribution and dataset credits used by the app.",
  },
] as const;

export default function LegalHubPage() {
  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Pill tone="neutral">Legal</Pill>
      <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
        Policies and sources.
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
        These pages cover terms, privacy, refunds, and Qur&apos;an source attribution.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {LINKS.map((item) => (
          <Card key={item.href}>
            <h2 className="text-base font-semibold text-[color:var(--kw-ink)]">{item.title}</h2>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{item.description}</p>
            <div className="mt-4">
              <Link href={item.href} className="text-sm font-semibold text-[rgba(31,54,217,1)] hover:underline">
                Open page
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
