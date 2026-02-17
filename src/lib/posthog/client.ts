"use client";

import posthog from "posthog-js";

let initialized = false;

function posthogKey(): string | null {
  const value = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  return value && value.trim() ? value.trim() : null;
}

function posthogHost(): string {
  const value = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (value && value.trim()) {
    return value.trim();
  }
  return "https://us.i.posthog.com";
}

export function posthogEnabled(): boolean {
  return Boolean(posthogKey());
}

export function initPosthog() {
  if (initialized || typeof window === "undefined") {
    return;
  }
  const key = posthogKey();
  if (!key) {
    return;
  }

  posthog.init(key, {
    api_host: posthogHost(),
    autocapture: true,
    capture_pageview: false,
    capture_pageleave: true,
    person_profiles: "identified_only",
    persistence: "localStorage+cookie",
    session_recording: {
      maskAllInputs: true,
      blockClass: "ph-no-capture",
      maskTextSelector: ".ph-mask",
    },
  });
  initialized = true;
}

export function capturePosthogEvent(event: string, properties?: Record<string, unknown>) {
  initPosthog();
  if (!posthogEnabled()) {
    return;
  }
  posthog.capture(event, properties);
}

export function posthogInstance() {
  initPosthog();
  return posthog;
}
