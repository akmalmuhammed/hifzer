"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trackProductEvent } from "@/lib/telemetry/client";

const STORAGE_KEYS = {
  lastClickHref: "hifzer_last_click_href_v1",
} as const;

function safeGetSessionItem(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function navigationType(): string {
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return nav?.type ?? "unknown";
}

function causeType(input: { currentPath: string; lastClickHref: string | null; referrer: string | null }): string {
  if (input.lastClickHref && input.lastClickHref.startsWith("/")) {
    if (input.lastClickHref === input.currentPath) {
      return "internal_click";
    }
    return "internal_route";
  }
  if (!input.referrer) {
    return "direct_or_unknown";
  }
  try {
    const ref = new URL(input.referrer);
    if (ref.origin === window.location.origin) {
      return "internal_referrer";
    }
    return "external_referrer";
  } catch {
    return "direct_or_unknown";
  }
}

export default function NotFoundPage() {
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) {
      return;
    }
    sentRef.current = true;

    const currentPath = window.location.pathname;
    const referrer = document.referrer || null;
    const lastClickHref = safeGetSessionItem(STORAGE_KEYS.lastClickHref);
    const cause = causeType({ currentPath, lastClickHref, referrer });
    const navType = navigationType();
    const sameOriginReferrer = (() => {
      if (!referrer) {
        return 0;
      }
      try {
        return new URL(referrer).origin === window.location.origin ? 1 : 0;
      } catch {
        return 0;
      }
    })();

    const payload = {
      errorCode: cause,
      mode: navType,
      outcome: sameOriginReferrer ? "same_origin" : "other",
    };

    trackProductEvent("page_not_found", payload);
    Sentry.captureMessage(`404 page_not_found:${currentPath}`, {
      level: "warning",
      tags: { cause_type: cause, navigation_type: navType },
      extra: { path: currentPath, sameOriginReferrer },
    });
  }, []);

  return (
    <main className="mx-auto w-full max-w-[40rem] px-4 py-24 text-center md:py-32">
      <Card className="border-0! bg-transparent! p-0! shadow-none!">
        <div className="space-y-3">
          <p className="text-[1.05rem] font-semibold tabular-nums text-[rgba(var(--kw-accent-rgb),1)]">404</p>
          <h1 className="text-balance font-[family-name:var(--font-kw-display)] text-[clamp(2.2rem,6vw,3.25rem)] font-semibold leading-[1.07] tracking-[-0.032em] text-[color:var(--kw-ink)]">This page could not be found</h1>
          <p className="mx-auto max-w-md text-[1.1rem] leading-[1.45] text-[color:var(--kw-muted)]">
            The route does not exist or has moved. We logged this event to improve routing reliability.
          </p>
          <div className="pt-5">
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </div>
        </div>
      </Card>
    </main>
  );
}
