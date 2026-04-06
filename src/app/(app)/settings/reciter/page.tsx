import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { audioBaseUrl } from "@/hifzer/audio/config";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { getQuranFoundationRecitationCatalog } from "@/hifzer/quran-foundation/content";
import { ReciterSettingsClient } from "./reciter-settings-client";

export const metadata = {
  title: "Reciter",
};

export default async function ReciterSettingsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const [profile, quranFoundationCatalog] = await Promise.all([
    getProfileSnapshot(userId),
    getQuranFoundationRecitationCatalog(),
  ]);
  return (
    <ReciterSettingsClient
      initialReciterId={profile?.reciterId ?? "default"}
      audioConfigured={Boolean(audioBaseUrl())}
      remoteCatalog={quranFoundationCatalog}
    />
  );
}
