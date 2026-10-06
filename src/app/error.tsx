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
        source: "root-error-boundary",
        path: window.location?.pathname ?? null,
      }),
    }).catch(() => null);
  }, [props.error, errorId]);

  return (
    <div className="mx-auto max-w-[36rem] px-4 py-20 text-center">
      <Card className="p-8! shadow-none!">
        <div className="flex flex-col-reverse items-center gap-5">
          <div>
            <p className="text-[0.84rem] font-semibold text-[color:var(--kw-faint)]">
              Hifzer error boundary
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-kw-display)] text-[2rem] font-semibold leading-[1.1] tracking-[-0.028em] text-[color:var(--kw-ink)]">
              Something went wrong.
            </h1>
            <p className="mt-3 text-[1.02rem] leading-[1.5] text-[color:var(--kw-muted)]">
              Try a reset. If it persists, refresh the page and share the error ID below.
            </p>
            <p className="mt-4 text-[0.84rem] font-medium text-[color:var(--kw-faint)]">
              Error ID: <span className="text-[color:var(--kw-ink)]">{errorId}</span>
            </p>
          </div>
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--kw-pill-warn-bg)] text-[color:var(--kw-ember-600)] [&_svg]:h-6 [&_svg]:w-6">
            <AlertTriangle size={18} />
          </span>
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
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
