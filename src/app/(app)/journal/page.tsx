import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { JournalClient } from "./journal-client";
import { loadDuaPageData } from "../dua/dua-page-data";
import { listPrivateJournalEntries } from "@/hifzer/journal/server";
import type { JournalEntry } from "@/hifzer/journal/local-store";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { listSurahs } from "@/hifzer/quran/lookup.server";
import {
  DEFAULT_QURAN_TRANSLATION_ID,
  QURAN_TRANSLATION_COOKIE,
  QURAN_TRANSLATION_OPTIONS,
  normalizeQuranTranslationId,
} from "@/hifzer/quran/translation-prefs";
import { buildDuaModules } from "@/hifzer/ramadan/laylat-al-qadr";
import { dbConfigured } from "@/lib/db";

export const metadata = {
  title: "Private Journal",
};

export default async function JournalPage() {
  const cookieStore = await cookies();
  const surahs = listSurahs().map((surah) => ({
    surahNumber: surah.surahNumber,
    startAyahId: surah.startAyahId,
    ayahCount: surah.ayahCount,
    nameArabic: surah.nameArabic,
    nameTransliteration: surah.nameTransliteration,
    nameEnglish: surah.nameEnglish,
  }));

  const { userId } = await auth();
  const profile = userId ? await getProfileSnapshot(userId) : null;
  const duaState = await loadDuaPageData();
  let initialEntries: JournalEntry[] = [];
  const syncEnabled = Boolean(userId && dbConfigured());
  let initialSyncError = false;
  const quranTranslationId = normalizeQuranTranslationId(
    cookieStore.get(QURAN_TRANSLATION_COOKIE)?.value ??
      profile?.quranTranslationId ??
      DEFAULT_QURAN_TRANSLATION_ID,
  );
  const selectedTranslation = QURAN_TRANSLATION_OPTIONS.find((option) => option.id === quranTranslationId);
  const translationDir = selectedTranslation?.rtl ? "rtl" : "ltr";
  const translationAlignClass = selectedTranslation?.rtl ? "text-right" : "text-left";
  const duaOptions = buildDuaModules({
    customDuas: duaState.customDuas,
    deckOrders: duaState.deckOrders,
  }).flatMap((module) =>
    module.steps.flatMap((step) => {
      if (!step.dua) {
        return [];
      }
      return [
        {
          moduleId: module.id,
          moduleLabel: module.label,
          stepId: step.id,
          title: step.title,
          label: step.dua.label ?? step.eyebrow,
          arabic: step.dua.arabic ?? null,
          transliteration: step.dua.transliteration ?? null,
          translation: step.dua.translation,
          sourceLabel: step.sourceLinks[0]?.label ?? null,
          sourceHref: step.sourceLinks[0]?.href ?? null,
        },
      ];
    }),
  );

  if (syncEnabled && userId) {
    try {
      initialEntries = await listPrivateJournalEntries(userId);
    } catch {
      initialSyncError = true;
      initialEntries = [];
    }
  }

  return (
    <JournalClient
      surahs={surahs}
      duaOptions={duaOptions}
      initialEntries={initialEntries}
      syncEnabled={syncEnabled}
      initialSyncError={initialSyncError}
      reciterId={profile?.reciterId ?? "default"}
      translationDir={translationDir}
      translationAlignClass={translationAlignClass}
    />
  );
}
