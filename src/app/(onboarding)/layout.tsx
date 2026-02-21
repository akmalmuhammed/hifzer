import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { ProfileHydrator } from "@/components/providers/profile-hydrator";
import { PublicBetaBanner } from "@/components/site/public-beta-banner";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { clerkEnabled } from "@/lib/clerk-config";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
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
        tags: { area: "onboarding-layout", operation: "getProfileSnapshot" },
        user: { id: userId },
      });
      profile = null;
    }
  }

  return (
    <>
      <PublicBetaBanner />
      <main id="main-content" className="mx-auto w-full max-w-[900px] px-4 py-10">
        <ProfileHydrator profile={profile} />
        {children}
      </main>
    </>
  );
}
