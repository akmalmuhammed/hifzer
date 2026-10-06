import Link from "next/link";
import { BellOff, CheckCircle2, CircleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Preferences",
  description: "Manage Hifzer email reminder preferences.",
  robots: {
    index: false,
    follow: false,
  },
};

function messageForStatus(status: string | undefined) {
  if (status === "success") {
    return {
      tone: "success" as const,
      title: "You are unsubscribed",
      body: "Reminder emails have been disabled for your account.",
      icon: <CheckCircle2 size={18} />,
    };
  }
  if (status === "invalid") {
    return {
      tone: "warn" as const,
      title: "Invalid link",
      body: "This unsubscribe link is invalid or expired.",
      icon: <CircleAlert size={18} />,
    };
  }
  return {
    tone: "warn" as const,
    title: "Unable to update preferences",
    body: "We could not process this request right now. Please try again from the latest email.",
    icon: <CircleAlert size={18} />,
  };
}

export default async function UnsubscribePage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const state = messageForStatus(searchParams.status);

  return (
    <div className="mx-auto w-full max-w-[52rem] px-[1.4rem] pb-24 pt-14 text-center md:pb-32 md:pt-24">
      <Pill tone="neutral">Email</Pill>
      <h1 className="mx-auto mt-5 max-w-[56rem] text-balance font-[family-name:var(--font-kw-display)] text-[clamp(2.6rem,5.8vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-[color:var(--kw-ink)]">
        Reminder preferences
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-[clamp(1.1rem,1.6vw,1.3rem)] leading-[1.42] tracking-[-0.014em] text-[color:var(--kw-muted)]">
        You can manage reminder timing and opt-in state any time from app settings.
      </p>

      <Card className="mt-12 text-left rounded-[28px]! border-0! p-7! shadow-none! md:p-9!">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[rgba(var(--kw-accent-rgb),0.1)] text-[rgba(var(--kw-accent-rgb),1)]">
            {state.icon}
          </span>
          <div>
            <p className="text-[1.15rem] font-semibold tracking-[-0.018em] text-[color:var(--kw-ink)]">{state.title}</p>
            <p className="mt-1.5 text-[1rem] leading-[1.55] text-[color:var(--kw-muted)]">{state.body}</p>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-2.5">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[rgba(var(--kw-accent-rgb),1)] px-5 text-[0.94rem] font-medium tracking-[-0.01em] text-white transition-[background-color,transform] duration-200 hover:bg-[rgba(var(--kw-accent-rgb),0.88)] active:scale-[0.98]"
          >
            <BellOff size={16} />
            Back to Hifzer
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-full bg-[color:var(--kw-fill-strong)] px-5 text-[0.94rem] font-medium tracking-[-0.01em] text-[color:var(--kw-ink)] transition-[background-color,transform] duration-200 hover:bg-[color:var(--kw-hover-strong)] active:scale-[0.98]"
          >
            Open account settings
          </Link>
        </div>
      </Card>
    </div>
  );
}
