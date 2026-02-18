"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { capturePosthogEvent, initPosthog } from "@/lib/posthog/client";

const STORAGE_KEYS = {
  lastClickHref: "hifzer_last_click_href_v1",
  lastClickFrom: "hifzer_last_click_from_v1",
  lastClickAt: "hifzer_last_click_at_v1",
  currentPath: "hifzer_current_path_v1",
  previousPath: "hifzer_previous_path_v1",
} as const;

function captureLinkClick(event: MouseEvent) {
  if (event.defaultPrevented || !(event.target instanceof Element)) {
    return;
  }
  const anchor = event.target.closest("a[href]") as HTMLAnchorElement | null;
  if (!anchor || anchor.dataset.telemetryIgnore === "1") {
    return;
  }

  const rawHref = anchor.getAttribute("href");
  if (!rawHref) {
    return;
  }

  const from = `${window.location.pathname}${window.location.search}`;
  let href = rawHref;
  let external = false;
  try {
    const resolved = new URL(rawHref, window.location.href);
    external = resolved.origin !== window.location.origin;
    href = external
      ? resolved.toString()
      : `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    // Keep raw href.
  }

  Sentry.addBreadcrumb({
    category: "navigation",
    message: `link.click:${href}`,
    level: "info",
    data: { from, href },
  });
  capturePosthogEvent("link_click", {
    from,
    href,
    external,
    target: anchor.target || null,
    text: anchor.textContent?.trim().slice(0, 120) || null,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    button: event.button,
  });

  try {
    window.sessionStorage.setItem(STORAGE_KEYS.lastClickHref, href);
    window.sessionStorage.setItem(STORAGE_KEYS.lastClickFrom, from);
    window.sessionStorage.setItem(STORAGE_KEYS.lastClickAt, String(Date.now()));
  } catch {
    // Ignore storage failures.
  }
}

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const path = useMemo(() => pathname ?? "/", [pathname]);
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    initPosthog();
  }, []);

  useEffect(() => {
    const pathWithSearch = `${path}${window.location.search || ""}`;
    const previous = previousPathRef.current;
    const priorStoredPath = (() => {
      try {
        return window.sessionStorage.getItem(STORAGE_KEYS.currentPath);
      } catch {
        return null;
      }
    })();
    if (previous == null) {
      capturePosthogEvent("page_view", {
        path: pathWithSearch,
        referrer: document.referrer || null,
      });
    } else if (previous !== pathWithSearch) {
      Sentry.addBreadcrumb({
        category: "navigation",
        message: `route.change:${previous}->${pathWithSearch}`,
        level: "info",
      });
      capturePosthogEvent("route_change", {
        from: previous,
        to: pathWithSearch,
      });
    }
    try {
      if (priorStoredPath && priorStoredPath !== pathWithSearch) {
        window.sessionStorage.setItem(STORAGE_KEYS.previousPath, priorStoredPath);
      }
      window.sessionStorage.setItem(STORAGE_KEYS.currentPath, pathWithSearch);
    } catch {
      // Ignore storage failures.
    }
    previousPathRef.current = pathWithSearch;
  }, [path]);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      capturePosthogEvent("client_error", {
        path: `${window.location.pathname}${window.location.search}`,
        message: event.message || "Unknown client error.",
        filename: event.filename || null,
        line: event.lineno || null,
        column: event.colno || null,
        stack: event.error instanceof Error ? event.error.stack || null : null,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "Unhandled rejection";
      capturePosthogEvent("unhandled_rejection", {
        path: `${window.location.pathname}${window.location.search}`,
        message,
        stack: reason instanceof Error ? reason.stack || null : null,
      });
    };

    document.addEventListener("click", captureLinkClick, true);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      document.removeEventListener("click", captureLinkClick, true);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method || "GET").toUpperCase();
      const startedAt = Date.now();
      const resolveUrl = () => {
        if (typeof input === "string") {
          return input;
        }
        if (input instanceof URL) {
          return input.toString();
        }
        return input.url;
      };
      const rawUrl = resolveUrl();

      try {
        const response = await originalFetch(input, init);
        if (rawUrl.includes("/api/") && response.status >= 400) {
          capturePosthogEvent("api_response_error", {
            path: `${window.location.pathname}${window.location.search}`,
            url: rawUrl,
            method,
            status: response.status,
            durationMs: Date.now() - startedAt,
          });
          if (response.status >= 500) {
            Sentry.captureMessage(`API ${response.status} on ${method} ${rawUrl}`, "error");
          }
        }
        return response;
      } catch (error) {
        if (rawUrl.includes("/api/")) {
          capturePosthogEvent("api_request_failed", {
            path: `${window.location.pathname}${window.location.search}`,
            url: rawUrl,
            method,
            message: error instanceof Error ? error.message : String(error),
            durationMs: Date.now() - startedAt,
          });
          Sentry.captureException(error, {
            tags: {
              area: "fetch",
              method,
            },
            extra: {
              url: rawUrl,
            },
          });
        }
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return children;
}
