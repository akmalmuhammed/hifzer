import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { clerkEnabled } from "@/lib/clerk-config";
import { getProfileSnapshot, type ProfileSnapshot } from "@/hifzer/profile/server";
import {
  canAccessOnboardingStep,
  onboardingPathForStep,
  type OnboardingStep,
} from "@/hifzer/profile/onboarding";

export async function requireOnboardingPageAccess(
  requestedStep: OnboardingStep,
): Promise<{ userId: string | null; profile: ProfileSnapshot | null }> {
  if (!clerkEnabled()) {
    return { userId: null, profile: null };
  }

  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const profile = await getProfileSnapshot(userId);
  if (profile?.onboardingCompleted) {
    redirect("/dashboard");
  }

  if (profile && !canAccessOnboardingStep(profile.onboardingStep, requestedStep)) {
    redirect(onboardingPathForStep(profile.onboardingStep));
  }

  return { userId, profile };
}
