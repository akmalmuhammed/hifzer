"use client";

type GaEventValue = string | number | boolean | null | undefined;

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: Record<string, GaEventValue>) => void;
  }
}

export function trackGaEvent(eventName: string, params: Record<string, GaEventValue> = {}): boolean {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return false;
  }
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  );
  window.gtag("event", eventName, filtered);
  return true;
}

