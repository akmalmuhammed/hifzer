import { redirect } from "next/navigation";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";
import { NotificationsClient } from "./notifications-client";

export const metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const userId = await resolveClerkUserIdForServer();
  if (!userId) {
    redirect("/login");
  }
  const profile = await getProfileSnapshot(userId);
  return (
    <NotificationsClient
      initial={{
        emailRemindersEnabled: profile?.emailRemindersEnabled ?? true,
        reminderTimeLocal: profile?.reminderTimeLocal ?? "06:00",
        timezone: profile?.timezone ?? "UTC",
      }}
    />
  );
}
