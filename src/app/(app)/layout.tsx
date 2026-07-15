import { cookies, headers } from "next/headers";
import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { AppShellSideEffects } from "@/components/app/app-shell-side-effects";
import { AppProviders } from "@/components/providers/app-providers";
import { ClerkRouteProvider } from "@/components/providers/clerk-route-provider";
import { DISTRACTION_FREE_COOKIE, normalizeDistractionFree } from "@/hifzer/focus/distraction-free";
import { onboardingPathForStep } from "@/hifzer/profile/onboarding";
import { getAppShellGateProfile } from "@/hifzer/profile/server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";
import { clerkEnabled } from "@/lib/clerk-config";
import { dbConfigured } from "@/lib/db";
import { resolveInitialThemeState, resolveInitialUiLanguage } from "@/lib/layout-preferences";

const HIFZER_PUBLIC_QURAN_DEMO_HEADER = "x-hifzer-public-quran-demo";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const cookieStorePromise = cookies();
  const headerStorePromise = headers();
  const cookieStore = await cookieStorePromise;
  const headerStore = await headerStorePromise;
  const publicQuranDemo = headerStore.get(HIFZER_PUBLIC_QURAN_DEMO_HEADER) === "1";
  const authRequest = {
    headers: headerStore,
    url: `http://${headerStore.get("host") ?? "localhost"}`,
  };
  const userIdPromise = clerkEnabled() && !publicQuranDemo
    ? resolveClerkUserIdForServer(authRequest)
    : Promise.resolve<string | null>(null);
  const initialUiLanguage = resolveInitialUiLanguage(cookieStore);
  const initialDistractionFree = normalizeDistractionFree(cookieStore.get(DISTRACTION_FREE_COOKIE)?.value);
  const initialThemeState = resolveInitialThemeState(cookieStore);
  let profile = null;
  let profileFetchFailed = false;

  if (clerkEnabled() && !publicQuranDemo) {
    const userId = await userIdPromise;
    if (!userId) {
      redirect("/login");
    }
    try {
      profile = await getAppShellGateProfile(userId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { area: "app-layout", operation: "getAppShellGateProfile" },
        user: { id: userId },
      });
      profile = null;
      profileFetchFailed = true;
    }

    if (dbConfigured() && profileFetchFailed) {
      throw new Error("Profile snapshot could not be loaded for the app shell.");
    }

    if (dbConfigured() && !profile) {
      redirect("/onboarding/welcome");
    }

    if (dbConfigured() && profile && !profile.onboardingCompleted) {
      redirect(profile ? onboardingPathForStep(profile.onboardingStep) : "/onboarding/welcome");
    }
  }

  return (
    <ClerkRouteProvider>
      <AppProviders
        initialUiLanguage={initialUiLanguage}
        initialDistractionFree={initialDistractionFree}
        initialThemeState={initialThemeState}
      >
        <AppShell streakEnabled={Boolean(profile?.onboardingCompleted)}>
          <AppShellSideEffects disabled={publicQuranDemo} />
          {children}
        </AppShell>
      </AppProviders>
    </ClerkRouteProvider>
  );
}
