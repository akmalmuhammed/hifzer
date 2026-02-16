import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProfileHydrator } from "@/components/providers/profile-hydrator";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { clerkEnabled } from "@/lib/clerk-config";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  let profile = null;

  if (clerkEnabled()) {
    const { userId } = await auth();
    if (!userId) {
      redirect("/login");
    }
    profile = await getProfileSnapshot(userId);
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-[900px] px-4 py-10">
      <ProfileHydrator profile={profile} />
      {children}
    </main>
  );
}
