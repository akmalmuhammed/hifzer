import { requireOnboardingPageAccess } from "@/hifzer/profile/onboarding-gate.server";
import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";
import { OnboardingStartPointClient } from "./start-point-client";

function initialSurahNumberFromCursor(surahNumber: number | null | undefined): number {
  return typeof surahNumber === "number" && SURAH_INDEX.some((surah) => surah.surahNumber === surahNumber)
    ? surahNumber
    : 1;
}

export default async function OnboardingStartPointPage() {
  const { profile } = await requireOnboardingPageAccess("start-point");
  const initialSurahNumber = initialSurahNumberFromCursor(profile?.activeSurahNumber);

  return (
    <OnboardingStartPointClient
      initialSurahNumber={initialSurahNumber}
      initialCursorAyahId={profile?.cursorAyahId ?? 1}
    />
  );
}
