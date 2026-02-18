import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PaddleProvider } from "@/components/billing/paddle-provider";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { clerkEnabled } from "@/lib/clerk-config";

export default async function BillingLayout({ children }: { children: React.ReactNode }) {
  if (!clerkEnabled()) {
    return children;
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
      {children}
    </PaddleProvider>
  );
}
