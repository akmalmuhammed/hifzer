export type AyahId = number;

export type Ayah = {
  id: AyahId; // Global ayah id: 1..6236
  surahNumber: number; // 1..114
  ayahNumber: number; // 1..N within surah
  juzNumber: number; // 1..30
  pageNumber: number; // 1..604 (Madani mushaf)
  hizbQuarter: number; // 1..240
  textUthmani: string;
};

export type SurahInfo = {
  surahNumber: number;
  startAyahId: AyahId;
  endAyahId: AyahId;
  ayahCount: number;
  nameArabic: string;
  nameTransliteration: string;
  nameEnglish: string;
  revelationType: string;
};

export type VerseRef = {
  surahNumber: number;
  ayahNumber: number;
};

export type JuzInfo = {
  juzNumber: number;
  startAyahId: AyahId;
  endAyahId: AyahId;
  ayahCount: number;
};
