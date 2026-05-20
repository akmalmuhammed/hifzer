import { audioBaseUrl } from "@/hifzer/audio/config";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { getQuranFoundationRecitationCatalog } from "@/hifzer/quran-foundation/content";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";
import { clerkEnabled } from "@/lib/clerk-config";
import { ReciterSettingsClient } from "./reciter-settings-client";

export const metadata = {
  title: "Reciter",
};

export default async function ReciterSettingsPage() {
  const userId = clerkEnabled() ? await resolveClerkUserIdForServer() : null;
  if (!userId) {
    const quranFoundationCatalog = await getQuranFoundationRecitationCatalog();
    return (
      <ReciterSettingsClient
        initialReciterId="default"
        audioConfigured={Boolean(audioBaseUrl())}
        remoteCatalog={quranFoundationCatalog}
      />
    );
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
