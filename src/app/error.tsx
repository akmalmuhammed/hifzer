"use client";

import Link from "next/link";
import { useEffect, useId } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function RootSegmentError(props: { error: Error & { digest?: string }; reset: () => void }) {
  const errorId = useId();

  useEffect(() => {
    console.error(props.error);
    Sentry.captureException(props.error, {
      tags: { area: "root-error-boundary" },
      extra: { digest: props.error?.digest ?? null, errorId },
    });

    void fetch("/api/telemetry/error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        errorId,
        digest: props.error?.digest ?? null,
        message: props.error?.message ?? "Unknown error",
        stack: props.error?.stack ?? null,
        source: "root-error-boundary",
        path: window.location?.pathname ?? null,
      }),
    }).catch(() => null);
  }, [props.error, errorId]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Hifzer error boundary
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)]">
              Something went wrong.
            </h1>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Try a reset. If it persists, refresh the page and share the error ID below.
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
              Error ID: <span className="text-[color:var(--kw-ink)]">{errorId}</span>
            </p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[rgba(234,88,12,0.28)] bg-[rgba(234,88,12,0.12)] text-[color:var(--kw-ember-600)]">
            <AlertTriangle size={18} />
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => props.reset()} className="gap-2">
            Reset view <ArrowRight size={16} />
          </Button>
          <Link href="/">
            <Button variant="secondary" className="gap-2">
              Back to landing <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
