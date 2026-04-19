import { requireOnboardingPageAccess } from "@/hifzer/profile/onboarding-gate.server";
import { getQuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/server";
import { OnboardingCompleteClient } from "./complete-client";

export const metadata = {
  title: "Complete",
};

export default async function OnboardingCompletePage() {
  const { userId, profile } = await requireOnboardingPageAccess("complete");
  const initialQuranFoundationStatus = userId
    ? await getQuranFoundationConnectionStatus(userId)
    : null;

  return (
    <OnboardingCompleteClient
      initialQuranFoundationStatus={initialQuranFoundationStatus}
      initialOnboardingStartLane={profile?.onboardingStartLane ?? null}
    />
  );
}
