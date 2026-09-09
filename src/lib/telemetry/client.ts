"use client";

import { sanitizeProductEvent } from "@/hifzer/telemetry/events";
import { trackGaEvent } from "@/lib/ga/client";

function deviceClass(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

export function trackProductEvent(eventName: string, payload: Record<string, unknown> = {}): boolean {
  const sanitized = sanitizeProductEvent(eventName, {
    ...payload,
    route: typeof window === "undefined" ? undefined : window.location.pathname,
    deviceClass: deviceClass(),
    online: typeof navigator === "undefined" ? undefined : navigator.onLine,
  });
  return sanitized ? trackGaEvent(sanitized.eventName, sanitized.params) : false;
}
