import { JournalClient } from "./journal-client";
import { listSurahs } from "@/hifzer/quran/lookup.server";

export const metadata = {
  title: "Private Journal",
};

export default function JournalPage() {
  const surahs = listSurahs().map((surah) => ({
    surahNumber: surah.surahNumber,
    startAyahId: surah.startAyahId,
    ayahCount: surah.ayahCount,
    nameArabic: surah.nameArabic,
    nameTransliteration: surah.nameTransliteration,
    nameEnglish: surah.nameEnglish,
  }));

  return <JournalClient surahs={surahs} />;
}
