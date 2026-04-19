import { cookies } from "next/headers";
import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { BookmarkSyncAgent } from "@/components/bookmarks/bookmark-sync-agent";
import { AppProviders } from "@/components/providers/app-providers";
import { ProfileHydrator } from "@/components/providers/profile-hydrator";
import { DISTRACTION_FREE_COOKIE, normalizeDistractionFree } from "@/hifzer/focus/distraction-free";
import { onboardingPathForStep } from "@/hifzer/profile/onboarding";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";
import { clerkEnabled } from "@/lib/clerk-config";
import { dbConfigured } from "@/lib/db";
import { resolveInitialThemeState, resolveInitialUiLanguage } from "@/lib/layout-preferences";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const cookieStorePromise = cookies();
  const userIdPromise = clerkEnabled() ? resolveClerkUserIdForServer() : Promise.resolve<string | null>(null);
  const cookieStore = await cookieStorePromise;
  const initialUiLanguage = resolveInitialUiLanguage(cookieStore);
  const initialDistractionFree = normalizeDistractionFree(cookieStore.get(DISTRACTION_FREE_COOKIE)?.value);
  const initialThemeState = resolveInitialThemeState(cookieStore);
  let profile = null;
  let profileFetchFailed = false;

  if (clerkEnabled()) {
    const userId = await userIdPromise;
    if (!userId) {
      redirect("/login");
    }
    try {
      profile = await getProfileSnapshot(userId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { area: "app-layout", operation: "getProfileSnapshot" },
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
    <AppProviders
      initialUiLanguage={initialUiLanguage}
      initialDistractionFree={initialDistractionFree}
      initialThemeState={initialThemeState}
    >
      <AppShell streakEnabled={Boolean(profile?.onboardingCompleted)}>
        <ProfileHydrator profile={profile} />
        <BookmarkSyncAgent />
        {children}
      </AppShell>
    </AppProviders>
  );
}
