"use client";

import Link from "next/link";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AppError(props: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(props.error);
    Sentry.captureException(props.error, {
      tags: { area: "app-error-boundary" },
      extra: { digest: props.error?.digest ?? null },
    });
  }, [props.error]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Recovery
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)]">
              Something went wrong.
            </h1>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Try this view again. If your session expired, sign in again; otherwise you can keep reading while the service recovers.
            </p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[rgba(234,88,12,0.28)] bg-[rgba(234,88,12,0.12)] text-[color:var(--kw-ember-600)]">
            <AlertTriangle size={18} />
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => props.reset()} className="gap-2">
            Try view again <ArrowRight size={16} />
          </Button>
          <Link href="/login">
            <Button variant="secondary" className="gap-2">
              Sign in again <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="/quran/read?view=compact&anon=1">
            <Button variant="secondary">Open reader preview</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
