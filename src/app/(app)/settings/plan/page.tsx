import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PlanSettingsClient } from "@/app/(app)/settings/plan/plan-client";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata = {
  title: "Plan",
};

const FALLBACK_INITIAL = {
  dailyMinutes: 40,
  practiceDaysPerWeek: 7,
  planBias: "BALANCED" as const,
  hasTeacher: false,
  timezone: "UTC",
};

export default async function PlanSettingsPage() {
  if (!clerkEnabled()) {
    return <PlanSettingsClient initial={FALLBACK_INITIAL} />;
  }

  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const profile = await getProfileSnapshot(userId);
  if (!profile) {
    return <PlanSettingsClient initial={FALLBACK_INITIAL} />;
  }

  return (
    <PlanSettingsClient
      initial={{
        dailyMinutes: profile.dailyMinutes,
        practiceDaysPerWeek: Math.max(1, Math.min(7, profile.practiceDays.length || 7)),
        planBias: profile.planBias,
        hasTeacher: profile.hasTeacher,
        timezone: profile.timezone,
      }}
    />
  );
}
