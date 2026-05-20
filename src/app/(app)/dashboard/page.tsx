import { DashboardClient } from "./dashboard-client";

export const metadata = {
  title: "Today",
};

export default async function DashboardPage() {
  return <DashboardClient />;
}
