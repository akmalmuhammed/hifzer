import { getCachedDashboardOverview } from "@/hifzer/dashboard/server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";
import { DashboardClient } from "./dashboard-client";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const userId = await resolveClerkUserIdForServer();
  const initialOverview = userId ? await getCachedDashboardOverview(userId) : null;

  return <DashboardClient initialOverview={initialOverview} />;
}
