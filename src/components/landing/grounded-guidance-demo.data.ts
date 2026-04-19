import type { AyahExplanationSource, QuranAssistantMatch } from "@/hifzer/ai/contracts";

type DemoTranslation = NonNullable<QuranAssistantMatch["translation"]>;

type LandingGuidanceDemo = {
  currentAyah: {
    verseKey: string;
    surahNumber: number;
    ayahNumber: number;
    arabicText: string;
    translation: DemoTranslation;
  };
  explain: {
    prompt: string;
    summary: string;
    tafsirInsight: {
      title: string;
      detail: string;
      source: string;
    };
    keyThemes: readonly string[];
    sources: readonly AyahExplanationSource[];
  };
  assistant: {
    prompt: string;
    answer: string;
    matches: readonly QuranAssistantMatch[];
  };
  promptOptions: readonly string[];
};

const sahihTranslation = (text: string): DemoTranslation => ({
  text,
  label: "English - Sahih International",
  sourceLabel: "Tanzil",
  direction: "ltr",
});

export const LANDING_GUIDANCE_DEMO: LandingGuidanceDemo = {
  currentAyah: {
    verseKey: "2:153",
    surahNumber: 2,
    ayahNumber: 153,
    arabicText:
      "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ ۚ إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ",
    translation: sahihTranslation(
      "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.",
    ),
  },
  explain: {
    prompt: "Explain this ayah",
    summary:
      "Allah teaches believers to meet pressure with active patience and prayer. The ayah does not treat patience as silence; it joins steadfastness to salah and reassures the believer that Allah is with the patient.",
    tafsirInsight: {
      title: "Patience is paired with worship",
      detail:
        "The guidance is practical: hold steady in obedience, turn to prayer for help, and remember that Allah's nearness belongs to those who remain patient.",
      source: "Tafsir summary",
    },
    keyThemes: ["Sabr", "Prayer", "Allah's help"],
    sources: [
      { label: "Quran 2:153", kind: "quran" },
      { label: "Sahih translation", kind: "translation" },
      { label: "Tafsir summary", kind: "tafsir" },
      { label: "Quran MCP grounded", kind: "other" },
    ],
  },
  assistant: {
    prompt: "Give me verses about patience",
    answer:
      "The Qur'an repeatedly ties patience to reliance on Allah: seek help through patience and prayer, persevere together, and trust that Allah rewards the patient beyond measure.",
    matches: [
      {
        verseKey: "2:153",
        surahNumber: 2,
        ayahNumber: 153,
        arabicText:
          "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ ۚ إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ",
        translation: sahihTranslation(
          "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.",
        ),
        tafsirSummary: "Patience and prayer are presented together as help for believers in trial and obedience.",
        sources: [
          { label: "Quran 2:153", kind: "quran" },
          { label: "Sahih translation", kind: "translation" },
        ],
      },
      {
        verseKey: "39:10",
        surahNumber: 39,
        ayahNumber: 10,
        arabicText:
          "قُلْ يَـٰعِبَادِ ٱلَّذِينَ ءَامَنُوا۟ ٱتَّقُوا۟ رَبَّكُمْ ۚ لِلَّذِينَ أَحْسَنُوا۟ فِى هَـٰذِهِ ٱلدُّنْيَا حَسَنَةٌ ۗ وَأَرْضُ ٱللَّهِ وَٰسِعَةٌ ۗ إِنَّمَا يُوَفَّى ٱلصَّـٰبِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍ",
        translation: sahihTranslation(
          'Say, "O My servants who have believed, fear your Lord. For those who do good in this world is good, and the earth of Allah is spacious. Indeed, the patient will be given their reward without account."',
        ),
        tafsirSummary: "The ayah emphasizes that the reward for sabr is vast and not limited by ordinary measure.",
        sources: [
          { label: "Quran 39:10", kind: "quran" },
          { label: "Sahih translation", kind: "translation" },
        ],
      },
    ],
  },
  promptOptions: [
    "ayah about sadness",
    "where Allah talks about mercy",
    "verses about hardship and ease",
    "What does the Quran say about fear?",
    "Give me verses about patience",
  ],
};
