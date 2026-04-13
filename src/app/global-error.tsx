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
        message: props.error?.message ?? "Unknown error",
        stack: props.error?.stack ?? null,
        source: "global-error-boundary",
        path: window.location?.pathname ?? null,
      }),
    }).catch(() => null);
  }, [props.error, errorId]);

  return (
    <html lang="en">
      <body className="kw-canvas min-h-dvh bg-[color:var(--kw-bg)] text-[color:var(--kw-ink)] antialiased">
        <main className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="font-[family-name:var(--font-kw-display)] text-3xl tracking-tight">
            Unexpected error
          </h1>
          <p className="mt-3 text-sm text-[color:var(--kw-muted)]">
            A critical error occurred. Try reloading the page and share the error ID below.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
            Error ID: <span className="text-[color:var(--kw-ink)]">{errorId}</span>
          </p>
          <button
            type="button"
            onClick={() => props.reset()}
            className="mt-6 rounded-2xl border border-[color:var(--kw-border)] bg-white/70 px-4 py-2 text-sm font-semibold shadow-[var(--kw-shadow-soft)]"
          >
            Retry
          </button>
        </main>
      </body>
    </html>
  );
}
