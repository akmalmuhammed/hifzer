import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { RemindersSettingsClient } from "./reminders-client";
import { getProfileSnapshot } from "@/hifzer/profile/server";

export const metadata = {
  title: "Reminders",
};

export default async function ReminderSettingsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const profile = await getProfileSnapshot(userId);
  if (!profile) {
    return (
      <RemindersSettingsClient
        initial={{
          emailRemindersEnabled: true,
          reminderTimeLocal: "06:00",
          timezone: "UTC",
        }}
      />
    );
  }
  return (
    <RemindersSettingsClient
      initial={{
        emailRemindersEnabled: profile.emailRemindersEnabled,
        reminderTimeLocal: profile.reminderTimeLocal,
        timezone: profile.timezone,
      }}
    />
  );
}
