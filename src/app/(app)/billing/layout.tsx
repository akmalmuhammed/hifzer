import { currentUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PaddleProvider } from "@/components/billing/paddle-provider";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { resolveClerkUserIdForServer, resolveTestAuthUserIdFromRequest } from "@/hifzer/testing/request-auth";
import { clerkEnabled } from "@/lib/clerk-config";

export default async function BillingLayout({ children }: { children: React.ReactNode }) {
  if (!clerkEnabled()) {
    return children;
  }

  const userId = await resolveClerkUserIdForServer();
  if (!userId) {
    redirect("/login");
  }

  const headerBag = await headers();
  const host = headerBag.get("host")?.trim();
  const proto = headerBag.get("x-forwarded-proto")?.trim() || "http";
  const usingTestAuth = Boolean(resolveTestAuthUserIdFromRequest({
    headers: headerBag,
    url: host ? `${proto}://${host}` : undefined,
  }));
  const [profile, user] = await Promise.all([
    getProfileSnapshot(userId),
    usingTestAuth ? Promise.resolve(null) : currentUser(),
  ]);
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
