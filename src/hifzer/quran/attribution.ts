// These lines are copied verbatim from src/hifzer/quran/data/quran-data.js (Tanzil metadata).
export const TANZIL_QURAN_DATA_JS_HEADER_LINES = [
  "Quran Metadata (ver 1.0)",
  "Copyright (C) 2008-2009 Tanzil.info",
  "License: Creative Commons Attribution 3.0",
] as const;

// These lines are copied verbatim from the footer in https://tanzil.net/trans/en.sahih.
export const TANZIL_SAHIH_TRANSLATION_HEADER_LINES = [
  "Quran Translation",
  "Name: Saheeh International",
  "Translator: Saheeh International",
  "Language: English",
  "ID: en.sahih",
  "Last Update: April 24, 2011",
  "Source: Tanzil.net",
] as const;

export const TANZIL_SAHIH_TRANSLATION_ATTRIBUTION_LINES = [
  "English translation: Saheeh International (en.sahih), sourced from Tanzil.net.",
  "Source URL: https://tanzil.net/trans/en.sahih",
  "Catalog/terms: https://tanzil.net/trans/",
] as const;

// These lines are copied verbatim from src/hifzer/quran/data/SOURCES.md in the reference seed project.
export const HIFZER_SEED_SOURCE_LINES = [
  "Canonical Arabic text: Tanzil Uthmani export (local file, no runtime fetch).",
  "Metadata (page/juz/hizb): provide local JSON mapping keyed by `surahNumber + ayahNumber`.",
] as const;
