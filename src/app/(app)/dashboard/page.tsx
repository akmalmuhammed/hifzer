import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { getDashboardOverview } from "@/hifzer/dashboard/server";
import { clerkEnabled } from "@/lib/clerk-config";
import { dbConfigured } from "@/lib/db";
import { DashboardClient } from "./dashboard-client";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const authEnabled = clerkEnabled();

  if (!authEnabled || !dbConfigured()) {
    return <DashboardClient />;
  }

  const { userId } = await auth();
  if (!userId) {
    return <DashboardClient />;
  }

  let initialOverview = null;
  try {
    initialOverview = await getDashboardOverview(userId);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { area: "dashboard-page", operation: "getDashboardOverview" },
      user: { id: userId },
    });
  }

  return <DashboardClient initialOverview={initialOverview} />;
}
