import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { PaddleProvider } from "@/components/billing/paddle-provider";
import { ProfileHydrator } from "@/components/providers/profile-hydrator";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { clerkEnabled } from "@/lib/clerk-config";
import { dbConfigured } from "@/lib/db";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  let profile = null;
  let customerEmail: string | null = null;

  if (clerkEnabled()) {
    const { userId } = await auth();
    if (!userId) {
      redirect("/login");
    }
    profile = await getProfileSnapshot(userId);

    if (dbConfigured() && profile && !profile.onboardingCompleted) {
      redirect("/onboarding/welcome");
    }

    const user = await currentUser();
    customerEmail =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      null;
  }

  return (
    <AppShell streakEnabled={Boolean(profile?.onboardingCompleted)}>
      <PaddleProvider
        customerEmail={customerEmail}
        paddleCustomerId={profile?.paddleCustomerId ?? null}
      >
        <ProfileHydrator profile={profile} />
        {children}
      </PaddleProvider>
    </AppShell>
  );
}
