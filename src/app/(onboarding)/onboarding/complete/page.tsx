import { auth } from "@clerk/nextjs/server";
import { getQuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/server";
import { clerkEnabled } from "@/lib/clerk-config";
import { OnboardingCompleteClient } from "./complete-client";

export const metadata = {
  title: "Complete",
};

export default async function OnboardingCompletePage() {
  const userId = clerkEnabled() ? (await auth()).userId : null;
  const initialQuranFoundationStatus = userId
    ? await getQuranFoundationConnectionStatus(userId)
    : null;

  return <OnboardingCompleteClient initialQuranFoundationStatus={initialQuranFoundationStatus} />;
}
