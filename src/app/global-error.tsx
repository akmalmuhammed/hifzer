"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(props.error);
    Sentry.captureException(props.error, {
      tags: { area: "global-error-boundary" },
      extra: { digest: props.error?.digest ?? null },
    });
  }, [props.error]);

  return (
    <html lang="en">
      <body className="kw-canvas min-h-dvh bg-[color:var(--kw-bg)] text-[color:var(--kw-ink)] antialiased">
        <main className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="font-[family-name:var(--font-kw-display)] text-3xl tracking-tight">
            Unexpected error
          </h1>
          <p className="mt-3 text-sm text-[color:var(--kw-muted)]">
            A critical error occurred. Try reloading the page.
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
