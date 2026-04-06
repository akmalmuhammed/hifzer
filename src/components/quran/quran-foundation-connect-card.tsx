"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowUpRight, BookMarked, CheckCircle2, Link2 } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import type { QuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/types";

type QuranFoundationConnectCardProps = {
  initialStatus: QuranFoundationConnectionStatus | null;
  returnTo: string;
  variant: "onboarding" | "hub";
  className?: string;
};

function feedbackLabel(param: string | null): string | null {
  if (param === "connected") return "Quran.com account linked.";
  if (param === "oauth-failed") return "The Quran.com OAuth exchange failed.";
  if (param === "state-mismatch") return "The Quran.com OAuth state check failed.";
  if (param === "not-configured") return "Quran Foundation env vars are not configured yet.";
  if (param === "sign-in-required") return "Sign in before linking a Quran.com account.";
  return null;
}

function statusTone(state: QuranFoundationConnectionStatus["state"]): "neutral" | "accent" | "warn" {
  if (state === "connected") {
    return "accent";
  }
  if (state === "degraded") {
    return "warn";
  }
  return "neutral";
}

function statusLabel(state: QuranFoundationConnectionStatus["state"]): string {
  if (state === "connected") {
    return "Connected";
  }
  if (state === "degraded") {
    return "Needs attention";
  }
  return "Optional";
}

export function QuranFoundationConnectCard(props: QuranFoundationConnectCardProps) {
  const searchParams = useSearchParams();
  const [connecting, setConnecting] = useState(false);
  const feedback = useMemo(() => feedbackLabel(searchParams.get("qf")), [searchParams]);
  const status = props.initialStatus;

  if (!status || status.state === "not_configured") {
    return null;
  }

  const linked = status.state === "connected" || status.state === "degraded";
  const shouldRender = props.variant === "onboarding" || Boolean(feedback) || status.state !== "connected";

  if (!shouldRender) {
    return null;
  }

  const identityLabel = status.displayName ?? status.email ?? "Quran.com account";
  const title = props.variant === "onboarding"
    ? linked
      ? "Quran.com is linked."
      : "Optional Quran.com link"
    : linked
      ? "Quran.com connection ready"
      : "Bring Quran.com into Hifzer";
  const body = props.variant === "onboarding"
    ? linked
      ? "Your Hifzer account is still powered by Clerk. Quran.com is now connected as an optional reading layer you can manage later from Settings."
      : "Linking is optional. You can finish onboarding right now, or connect Quran.com first so bookmarks and official reader enrichment stay close."
    : linked
      ? "Your Quran.com account is connected. Keep using Hifzer normally, then manage imports, bookmark sync, and connection details from Settings."
      : "Already using Hifzer? Link Quran.com whenever you want. Clerk stays your main sign-in, while Quran.com works as an optional reading connection.";

  return (
    <Card
      className={clsx(
        "border border-[rgba(var(--kw-accent-rgb),0.16)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,248,252,0.94))]",
        props.className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex flex-wrap gap-2">
            <Pill tone={statusTone(status.state)}>{statusLabel(status.state)}</Pill>
            <Pill tone="neutral">Clerk stays primary</Pill>
            {status.contentApiReady ? <Pill tone="brand">Reader enrichment ready</Pill> : null}
          </div>

          <p className="mt-4 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">{title}</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{body}</p>

          {linked ? (
            <p className="mt-3 text-sm text-[color:var(--kw-muted)]">
              Connected as <span className="font-semibold text-[color:var(--kw-ink)]">{identityLabel}</span>
              {status.lastSyncedAt ? ` · last synced ${new Date(status.lastSyncedAt).toLocaleString()}` : ""}
            </p>
          ) : (
            <p className="mt-3 text-sm text-[color:var(--kw-muted)]">
              Skip for now if you want. You can always link later from the Qur&apos;an area or Settings.
            </p>
          )}

          {feedback ? (
            <div className="mt-3 rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/75 px-4 py-3 text-sm text-[color:var(--kw-muted)]">
              {feedback}
            </div>
          ) : null}
        </div>

        <span className="grid h-12 w-12 place-items-center rounded-[22px] border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.10)] text-[rgba(var(--kw-accent-rgb),1)] shadow-[var(--kw-shadow-soft)]">
          {linked ? <CheckCircle2 size={18} /> : <Link2 size={18} />}
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/76 px-4 py-4">
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Keep access simple</p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">
            Clerk remains the only account system Hifzer depends on for sign-in and app access.
          </p>
        </div>
        <div className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/76 px-4 py-4">
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Bring reading data closer</p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">
            Quran.com linking keeps bookmarks nearby today and leaves room for deeper reader sync later.
          </p>
        </div>
        <div className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/76 px-4 py-4">
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Manage it later</p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">
            Connection controls stay in Settings, so nothing about onboarding or daily study becomes a trap.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {linked ? (
          <>
            <Button asChild>
              <Link href="/settings/quran-foundation">
                Manage Quran.com
                <ArrowUpRight size={14} />
              </Link>
            </Button>
            {props.variant === "hub" ? (
              <Button asChild variant="secondary">
                <Link href="/quran/bookmarks">
                  Open bookmarks
                  <BookMarked size={14} />
                </Link>
              </Button>
            ) : null}
          </>
        ) : (
          <Button
            onClick={() => {
              setConnecting(true);
              window.location.href = `/api/quran-foundation/connect?returnTo=${encodeURIComponent(props.returnTo)}`;
            }}
            loading={connecting}
          >
            Link Quran.com
          </Button>
        )}

        <Button asChild variant="ghost">
          <Link href="/settings/quran-foundation">
            Open settings
            <ArrowUpRight size={14} />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
