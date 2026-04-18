import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { AppProviders } from "@/components/providers/app-providers";
import { ProfileHydrator } from "@/components/providers/profile-hydrator";
import { DISTRACTION_FREE_COOKIE, normalizeDistractionFree } from "@/hifzer/focus/distraction-free";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { clerkEnabled } from "@/lib/clerk-config";
import { resolveInitialThemeState, resolveInitialUiLanguage } from "@/lib/layout-preferences";
import { marketingDisplayFont } from "@/lib/fonts";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const initialUiLanguage = resolveInitialUiLanguage(cookieStore);
  const initialDistractionFree = normalizeDistractionFree(cookieStore.get(DISTRACTION_FREE_COOKIE)?.value);
  const initialThemeState = resolveInitialThemeState(cookieStore);
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
    if (profile?.onboardingCompleted) {
      redirect("/dashboard");
    }
  }

  return (
    <AppProviders
      initialUiLanguage={initialUiLanguage}
      initialDistractionFree={initialDistractionFree}
      initialThemeState={initialThemeState}
    >
      <div className={marketingDisplayFont.variable}>
        <main id="main-content" className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:py-10">
          <ProfileHydrator profile={profile} />
          {children}
        </main>
      </div>
    </AppProviders>
  );
}
