import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PaddleProvider } from "@/components/billing/paddle-provider";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { clerkEnabled } from "@/lib/clerk-config";
import { SupportClient } from "./support-client";

export const metadata = {
  title: "Support",
};

export default async function SupportPage() {
  if (!clerkEnabled()) {
    return <SupportClient />;
  }

  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const [profile, user] = await Promise.all([getProfileSnapshot(userId), currentUser()]);
  const customerEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    null;

  return (
    <PaddleProvider
      customerEmail={customerEmail}
      paddleCustomerId={profile?.paddleCustomerId ?? null}
    >
      <SupportClient hasPortal={Boolean(profile?.paddleCustomerId)} />
    </PaddleProvider>
  );
}
