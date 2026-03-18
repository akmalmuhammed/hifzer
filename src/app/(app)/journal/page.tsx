import { auth } from "@clerk/nextjs/server";
import { JournalClient } from "./journal-client";
import { listPrivateJournalEntries } from "@/hifzer/journal/server";
import type { JournalEntry } from "@/hifzer/journal/local-store";
import { listSurahs } from "@/hifzer/quran/lookup.server";
import { dbConfigured } from "@/lib/db";

export const metadata = {
  title: "Private Journal",
};

export default async function JournalPage() {
  const surahs = listSurahs().map((surah) => ({
    surahNumber: surah.surahNumber,
    startAyahId: surah.startAyahId,
    ayahCount: surah.ayahCount,
    nameArabic: surah.nameArabic,
    nameTransliteration: surah.nameTransliteration,
    nameEnglish: surah.nameEnglish,
  }));

  const { userId } = await auth();
  let initialEntries: JournalEntry[] = [];
  let syncEnabled = Boolean(userId && dbConfigured());

  if (syncEnabled && userId) {
    try {
      initialEntries = await listPrivateJournalEntries(userId);
    } catch {
      syncEnabled = false;
      initialEntries = [];
    }
  }

  return <JournalClient surahs={surahs} initialEntries={initialEntries} syncEnabled={syncEnabled} />;
}
