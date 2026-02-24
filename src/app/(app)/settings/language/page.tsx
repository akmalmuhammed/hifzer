import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LanguageSettingsClient } from "./language-client";
import { normalizeQuranTranslationId } from "@/hifzer/quran/translation-prefs";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata = {
  title: "Language",
};

export default async function LanguageSettingsPage() {
  if (!clerkEnabled()) {
    return (
      <LanguageSettingsClient
        initial={{
          quranTranslationId: "en.sahih",
        }}
        persistEnabled={false}
      />
    );
  }

  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const profile = await getProfileSnapshot(userId);

  return (
    <LanguageSettingsClient
      initial={{
        quranTranslationId: normalizeQuranTranslationId(profile?.quranTranslationId),
      }}
      persistEnabled={true}
    />
  );
}
