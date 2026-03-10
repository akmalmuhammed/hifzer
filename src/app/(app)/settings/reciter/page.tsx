import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { audioBaseUrl } from "@/hifzer/audio/config";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { ReciterSettingsClient } from "./reciter-settings-client";

export const metadata = {
  title: "Reciter",
};

export default async function ReciterSettingsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const profile = await getProfileSnapshot(userId);
  return (
    <ReciterSettingsClient
      initialReciterId={profile?.reciterId ?? "default"}
      audioConfigured={Boolean(audioBaseUrl())}
    />
  );
}
