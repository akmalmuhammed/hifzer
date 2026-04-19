"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowUpRight, BookMarked, CheckCircle2, Link2 } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import {
  getQuranFoundationFeedbackLabel,
  isQuranFoundationReconnectRequired,
} from "@/hifzer/quran-foundation/feedback";
import type { QuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/types";

type QuranFoundationConnectCardProps = {
  initialStatus: QuranFoundationConnectionStatus | null;
  returnTo: string;
  variant: "onboarding" | "hub";
  className?: string;
};

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
  const feedback = useMemo(() => getQuranFoundationFeedbackLabel(searchParams.get("qf")), [searchParams]);
  const status = props.initialStatus;

  if (!status || status.state === "not_configured") {
    return null;
  }

  const linked = status.state === "connected" || status.state === "degraded";
  const reconnectRequired = isQuranFoundationReconnectRequired(status);
  const shouldRender = props.variant === "onboarding" || Boolean(feedback) || status.state !== "connected";

  if (!shouldRender) {
    return null;
  }

  const identityLabel = status.displayName ?? status.email ?? "Quran.com account";
  const title = props.variant === "onboarding"
    ? linked
      ? "Quran.com linked"
      : "Optional Quran.com link"
    : linked
      ? "Quran.com linked"
      : "Link Quran.com";
  const body = linked
    ? reconnectRequired
      ? "Your Quran.com account is saved in Hifzer, but it needs to be reconnected before sync can continue."
      : "Your Quran.com account is linked and ready in Hifzer."
    : "Link Quran.com to bring bookmarks and official Qur'an content into Hifzer.";

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
          </div>

          <p className="mt-4 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">{title}</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{body}</p>

          {linked ? (
            <p className="mt-3 text-sm text-[color:var(--kw-muted)]">
              Connected as <span className="font-semibold text-[color:var(--kw-ink)]">{identityLabel}</span>
              {status.lastSyncedAt ? ` · last synced ${new Date(status.lastSyncedAt).toLocaleString()}` : ""}
            </p>
          ) : null}

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

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {linked ? (
          <>
            {reconnectRequired ? (
              <Button
                onClick={() => {
                  setConnecting(true);
                  window.location.href = `/api/quran-foundation/connect?returnTo=${encodeURIComponent(props.returnTo)}`;
                }}
                loading={connecting}
              >
                Reconnect Quran.com
              </Button>
            ) : (
              <Button asChild>
                <Link href="/settings/quran-foundation">
                  Manage Quran.com
                  <ArrowUpRight size={14} />
                </Link>
              </Button>
            )}
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
