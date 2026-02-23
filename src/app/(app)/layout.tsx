import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { BookmarkSyncAgent } from "@/components/bookmarks/bookmark-sync-agent";
import { ProfileHydrator } from "@/components/providers/profile-hydrator";
import { PublicBetaBanner } from "@/components/site/public-beta-banner";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { clerkEnabled } from "@/lib/clerk-config";
import { dbConfigured } from "@/lib/db";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  let profile = null;

  if (clerkEnabled()) {
    const { userId } = await auth();
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
    }

    // Redirect to onboarding when:
    // 1. Profile is null (creation failed or new user with DB error) - safer than rendering broken app
    // 2. Profile exists but onboarding was never completed
    if (dbConfigured() && (!profile || !profile.onboardingCompleted)) {
      redirect("/onboarding/welcome");
    }
  }

  return (
    <>
      <PublicBetaBanner />
      <AppShell streakEnabled={Boolean(profile?.onboardingCompleted)}>
        <ProfileHydrator profile={profile} />
        <BookmarkSyncAgent />
        {children}
      </AppShell>
    </>
  );
}
