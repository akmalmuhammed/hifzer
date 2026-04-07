import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { AppProviders } from "@/components/providers/app-providers";
import { ProfileHydrator } from "@/components/providers/profile-hydrator";
import { DISTRACTION_FREE_COOKIE, normalizeDistractionFree } from "@/hifzer/focus/distraction-free";
import { normalizeUiLanguage, UI_LANGUAGE_COOKIE } from "@/hifzer/i18n/ui-language";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import {
  normalizeAccentPreset,
  normalizeThemeMode,
  normalizeThemePreset,
  THEME_ACCENT_COOKIE,
  THEME_MODE_COOKIE,
  THEME_PRESET_COOKIE,
} from "@/hifzer/theme/preferences";
import { clerkEnabled } from "@/lib/clerk-config";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const initialUiLanguage = normalizeUiLanguage(cookieStore.get(UI_LANGUAGE_COOKIE)?.value);
  const initialDistractionFree = normalizeDistractionFree(cookieStore.get(DISTRACTION_FREE_COOKIE)?.value);
  const initialThemeState = {
    mode: normalizeThemeMode(cookieStore.get(THEME_MODE_COOKIE)?.value),
    theme: normalizeThemePreset(cookieStore.get(THEME_PRESET_COOKIE)?.value),
    accent: normalizeAccentPreset(cookieStore.get(THEME_ACCENT_COOKIE)?.value),
  };
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
    <AppProviders
      initialUiLanguage={initialUiLanguage}
      initialDistractionFree={initialDistractionFree}
      initialThemeState={initialThemeState}
    >
      <main id="main-content" className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:py-10">
        <ProfileHydrator profile={profile} />
        {children}
      </main>
    </AppProviders>
  );
}
