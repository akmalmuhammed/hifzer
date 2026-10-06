"use client";

import { useEffect, useId } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  const errorId = useId();

  useEffect(() => {
    console.error(props.error);
    Sentry.captureException(props.error, {
      tags: { area: "global-error-boundary" },
      extra: { digest: props.error?.digest ?? null, errorId },
    });

    void fetch("/api/telemetry/error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        errorId,
        digest: props.error?.digest ?? null,
        source: "global-error-boundary",
        path: window.location?.pathname ?? null,
      }),
    }).catch(() => null);
  }, [props.error, errorId]);

  return (
    <html lang="en">
      <body className="kw-canvas min-h-dvh bg-[color:var(--kw-bg)] text-[color:var(--kw-ink)] antialiased">
        <main className="mx-auto max-w-[36rem] px-4 py-24 text-center">
          <h1 className="font-[family-name:var(--font-kw-display)] text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.03em]">
            Unexpected error
          </h1>
          <p className="mt-3 text-[1.06rem] leading-[1.45] text-[color:var(--kw-muted)]">
            A critical error occurred. Try reloading the page and share the error ID below.
          </p>
          <p className="mt-4 text-[0.84rem] font-medium text-[color:var(--kw-faint)]">
            Error ID: <span className="text-[color:var(--kw-ink)]">{errorId}</span>
          </p>
          <button
            type="button"
            onClick={() => props.reset()}
            className="mt-7 inline-flex h-11 items-center justify-center rounded-full bg-[rgba(var(--kw-accent-rgb),1)] px-6 text-[0.94rem] font-medium text-white transition-[background-color,transform] duration-200 hover:bg-[rgba(var(--kw-accent-rgb),0.88)] active:scale-[0.98]"
          >
            Retry
          </button>
        </main>
      </body>
    </html>
  );
}
