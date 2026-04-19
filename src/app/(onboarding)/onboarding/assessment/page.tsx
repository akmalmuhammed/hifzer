import { requireOnboardingPageAccess } from "@/hifzer/profile/onboarding-gate.server";
import { OnboardingAssessmentClient } from "./assessment-client";

export default async function OnboardingAssessmentPage() {
  const { userId } = await requireOnboardingPageAccess("assessment");

  return <OnboardingAssessmentClient localStorageUserId={userId} />;
}
