"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { QuranFoundationConnectCard } from "@/components/quran/quran-foundation-connect-card";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import type {
  QuranFoundationConnectedOverview,
  QuranFoundationConnectionStatus,
} from "@/hifzer/quran-foundation/types";

type Payload = {
  ok: true;
  status: QuranFoundationConnectionStatus;
  overview: QuranFoundationConnectedOverview | null;
};

const TOOL_LINK_CLASS =
  "inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/80 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] transition hover:bg-white";

function ConnectedQuranSummary(props: {
  status: QuranFoundationConnectionStatus;
  overview: QuranFoundationConnectedOverview | null;
  loading: boolean;
}) {
  const linked = props.status.state === "connected" || props.status.state === "degraded";
  if (!linked) {
    return null;
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={props.status.state === "connected" ? "accent" : "warn"}>Connected Quran</Pill>
            <Pill tone="neutral">Quran.com</Pill>
          </div>
          <p className="mt-3 text-sm font-semibold text-[color:var(--kw-ink)]">
            Your linked Quran.com account is carrying reading context with you.
          </p>
          {props.loading ? (
            <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Loading linked Quran.com summary...</p>
          ) : null}
        </div>
        <Link href="/settings/quran-foundation" className={TOOL_LINK_CLASS}>
          Manage connection
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Resume point</p>
          <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
            {props.overview?.readingSession
              ? `Surah ${props.overview.readingSession.surahNumber}:${props.overview.readingSession.ayahNumber}`
              : props.loading
                ? "Loading..."
                : "Will sync as you read"}
          </p>
        </div>
        <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Quran.com streak</p>
          <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
            {props.overview?.streak
              ? `${props.overview.streak.currentDays} days`
              : props.loading
                ? "Loading..."
                : "No streak data yet"}
          </p>
        </div>
        <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Today&apos;s goal</p>
          <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
            {props.overview?.goalPlan?.remaining ??
              props.overview?.goalPlan?.title ??
              (props.loading ? "Loading..." : "No goal found")}
          </p>
        </div>
        <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Synced extras</p>
          <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
            {props.loading
              ? "Loading..."
              : `${props.overview?.collections?.count ?? 0} collections · ${props.overview?.notes?.count ?? 0} notes`}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function QuranFoundationOverviewCard(props: {
  initialStatus: QuranFoundationConnectionStatus | null;
}) {
  const [status, setStatus] = useState(props.initialStatus);
  const [overview, setOverview] = useState<QuranFoundationConnectedOverview | null>(null);
  const [loading, setLoading] = useState(
    () => props.initialStatus?.state === "connected" || props.initialStatus?.state === "degraded",
  );

  useEffect(() => {
    if (!props.initialStatus || props.initialStatus.state === "not_configured") {
      return;
    }
    if (!(props.initialStatus.state === "connected" || props.initialStatus.state === "degraded")) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/quran-foundation/overview", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as Payload | null;
        if (cancelled || !response.ok || !payload) {
          return;
        }
        setStatus(payload.status);
        setOverview(payload.overview);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [props.initialStatus]);

  if (!status) {
    return null;
  }

  if (status.state === "connected" || status.state === "degraded") {
    return <ConnectedQuranSummary status={status} overview={overview} loading={loading} />;
  }

  return <QuranFoundationConnectCard initialStatus={status} returnTo="/quran" variant="hub" />;
}
