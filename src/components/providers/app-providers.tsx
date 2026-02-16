"use client";

import { useEffect } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/providers/theme-provider";

const ONBOARDED_COOKIE = "hifzer_onboarded_v1";
const ONBOARDING_STORAGE_KEY = "hifzer_onboarding_completed_v1";

function OnboardingCookieSync() {
  useEffect(() => {
    try {
      const completed = window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1";
      if (!completed) {
        return;
      }
      const hasCookie = document.cookie.split(";").some((part) => part.trim() === `${ONBOARDED_COOKIE}=1`);
      if (hasCookie) {
        return;
      }
      const maxAgeSeconds = 60 * 60 * 24 * 365;
      document.cookie = `${ONBOARDED_COOKIE}=1; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
    } catch {
      // Best-effort: never block rendering if storage/cookies are unavailable.
    }
  }, []);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <OnboardingCookieSync />
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}
