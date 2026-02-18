"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trackGaEvent } from "@/lib/ga/client";

const STORAGE_KEYS = {
  lastClickHref: "hifzer_last_click_href_v1",
  lastClickFrom: "hifzer_last_click_from_v1",
  lastClickAt: "hifzer_last_click_at_v1",
  previousPath: "hifzer_previous_path_v1",
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

    const currentPath = `${window.location.pathname}${window.location.search || ""}`;
    const referrer = document.referrer || null;
    const lastClickHref = safeGetSessionItem(STORAGE_KEYS.lastClickHref);
    const lastClickFrom = safeGetSessionItem(STORAGE_KEYS.lastClickFrom);
    const lastClickAt = safeGetSessionItem(STORAGE_KEYS.lastClickAt);
    const previousPath = safeGetSessionItem(STORAGE_KEYS.previousPath);
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
      page_path: window.location.pathname,
      page_query: window.location.search || "",
      page_location: window.location.href,
      referrer: referrer ?? "(none)",
      cause_type: cause,
      last_click_href: lastClickHref ?? "(none)",
      last_click_from: lastClickFrom ?? "(none)",
      last_click_at: lastClickAt ?? "(none)",
      previous_path: previousPath ?? "(none)",
      navigation_type: navType,
      same_origin_referrer: sameOriginReferrer,
    };

    trackGaEvent("page_not_found", payload);
    Sentry.captureMessage(`404 page_not_found:${currentPath}`, {
      level: "warning",
      tags: { cause_type: cause, navigation_type: navType },
      extra: payload,
    });
  }, []);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <Card>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">404</p>
          <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">This page could not be found</h1>
          <p className="text-sm text-[color:var(--kw-muted)]">
            The route does not exist or has moved. We logged this event to improve routing reliability.
          </p>
          <div className="pt-2">
            <Link href="/welcome">
              <Button>Go to Home</Button>
            </Link>
          </div>
        </div>
      </Card>
    </main>
  );
}
