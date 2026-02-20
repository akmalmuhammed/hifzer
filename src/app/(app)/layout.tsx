import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { BookmarkSyncAgent } from "@/components/bookmarks/bookmark-sync-agent";
import { ProfileHydrator } from "@/components/providers/profile-hydrator";
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
    profile = await getProfileSnapshot(userId);

    if (dbConfigured() && profile && !profile.onboardingCompleted) {
      redirect("/onboarding/welcome");
    }
  }

  return (
    <AppShell streakEnabled={Boolean(profile?.onboardingCompleted)}>
      <ProfileHydrator profile={profile} />
      <BookmarkSyncAgent />
      {children}
    </AppShell>
  );
}
