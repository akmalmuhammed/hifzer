import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LanguageSettingsClient } from "./language-client";
import { normalizeQuranTranslationId, QURAN_TRANSLATION_COOKIE } from "@/hifzer/quran/translation-prefs";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata = {
  title: "Language",
};

export default async function LanguageSettingsPage() {
  const cookieStore = await cookies();
  const preferredFromCookie = cookieStore.get(QURAN_TRANSLATION_COOKIE)?.value;

  if (!clerkEnabled()) {
    return (
      <LanguageSettingsClient
        initial={{
          quranTranslationId: normalizeQuranTranslationId(preferredFromCookie),
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
        quranTranslationId: normalizeQuranTranslationId(preferredFromCookie ?? profile?.quranTranslationId),
      }}
      persistEnabled={true}
    />
  );
}
