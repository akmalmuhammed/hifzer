import { cookies } from "next/headers";
import { JournalClient } from "./journal-client";
import { listPrivateJournalEntries } from "@/hifzer/journal/server";
import type { JournalEntry } from "@/hifzer/journal/local-store";
import { listSurahs } from "@/hifzer/quran/lookup.server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";
import {
  DEFAULT_QURAN_TRANSLATION_ID,
  QURAN_TRANSLATION_COOKIE,
  QURAN_TRANSLATION_OPTIONS,
  normalizeQuranTranslationId,
} from "@/hifzer/quran/translation-prefs";
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

  const userId = await resolveClerkUserIdForServer();
  let initialEntries: JournalEntry[] = [];
  const syncEnabled = Boolean(userId && dbConfigured());
  let initialSyncError = false;
  const quranTranslationId = normalizeQuranTranslationId(
    cookieStore.get(QURAN_TRANSLATION_COOKIE)?.value ??
      DEFAULT_QURAN_TRANSLATION_ID,
  );
  const selectedTranslation = QURAN_TRANSLATION_OPTIONS.find((option) => option.id === quranTranslationId);
  const translationDir = selectedTranslation?.rtl ? "rtl" : "ltr";
  const translationAlignClass = selectedTranslation?.rtl ? "text-right" : "text-left";

  if (syncEnabled && userId) {
    try {
      initialEntries = await listPrivateJournalEntries(userId, new Date(), { summary: true });
    } catch {
      initialSyncError = true;
      initialEntries = [];
    }
  }

  return (
    <JournalClient
      surahs={surahs}
      duaOptions={[]}
      initialEntries={initialEntries}
      syncEnabled={syncEnabled}
      initialSyncError={initialSyncError}
      translationDir={translationDir}
      translationAlignClass={translationAlignClass}
    />
  );
}
