import Link from "next/link";
import { BellOff, CheckCircle2, CircleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export const metadata = {
  title: "Email Preferences",
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
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Pill tone="neutral">Email</Pill>
      <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
        Reminder preferences
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
        You can manage reminder timing and opt-in state any time from app settings.
      </p>

      <Card className="mt-8">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
            {state.icon}
          </span>
          <div>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{state.title}</p>
            <p className="mt-1 text-sm leading-7 text-[color:var(--kw-muted)]">{state.body}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href="/welcome"
            className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--kw-border)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] hover:bg-white"
          >
            <BellOff size={16} />
            Back to Hifzer
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-2xl border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] hover:bg-[color:var(--kw-surface-strong)]"
          >
            Open account settings
          </Link>
        </div>
      </Card>
    </div>
  );
}
