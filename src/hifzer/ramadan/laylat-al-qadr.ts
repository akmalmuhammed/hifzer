export type SourceLink = {
  label: string;
  href: string;
};

export type LaylatAnchor = {
  title: string;
  detail: string;
  source: SourceLink;
};

export type NightPlanStep = {
  title: string;
  detail: string;
  anchor: string;
};

export const laylatAlQadrGuide = {
  hero: {
    eyebrow: "Ramadan Dua",
    title: "Laylat al-Qadr, forgiveness, and a night anchored in what is authentic.",
    description:
      "The clearest authenticated supplication for Laylat al-Qadr is the forgiveness dua taught to Aishah. The structure below keeps the night inside verified Sunnah anchors without inventing a fixed ritual script.",
  },
  featuredDua: {
    title: "The dua taught for Laylat al-Qadr",
    arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
    transliteration: "Allahumma innaka 'afuwwun tuhibbul-'afwa fa'fu 'anni.",
    translation: "O Allah, You are Pardoning and love pardon, so pardon me.",
    source: {
      label: "Jami` at-Tirmidhi 3513",
      href: "https://sunnah.com/tirmidhi:3513",
    },
  },
  verifiedAnchors: [
    {
      title: "Seek it in the last ten nights, especially the odd nights.",
      detail:
        "Do not reduce the search to one dramatic night. The Prophetic guidance is to seek Laylat al-Qadr across the last ten, with special attention to the odd nights.",
      source: {
        label: "Sahih al-Bukhari 2017",
        href: "https://sunnah.com/bukhari:2017",
      },
    },
    {
      title: "Stand the night in prayer with faith and hope for reward.",
      detail:
        "The forgiveness promise tied to Laylat al-Qadr is attached to qiyam: standing the night in worship with iman and sincere expectation of reward.",
      source: {
        label: "Sahih al-Bukhari 35",
        href: "https://sunnah.com/bukhari:35",
      },
    },
    {
      title: "Increase effort when the last ten nights begin.",
      detail:
        "The Prophet intensified worship in the last ten nights, tightened his focus, and woke his family. The night should feel more serious, not more casual.",
      source: {
        label: "Sahih al-Bukhari 2024",
        href: "https://sunnah.com/bukhari:2024",
      },
    },
    {
      title: "Center the night on pardon and forgiveness.",
      detail:
        "The signature dua of Laylat al-Qadr is not about spectacle. It is about pardon, mercy, and asking Allah to wipe away what should not remain on your record.",
      source: {
        label: "Jami` at-Tirmidhi 3513",
        href: "https://sunnah.com/tirmidhi:3513",
      },
    },
  ] satisfies ReadonlyArray<LaylatAnchor>,
  stepByStepPlan: [
    {
      title: "Show up for every last-ten night you can.",
      detail:
        "Treat the last ten nights as your search window. If you only prepare for a single night, you are narrower than the authenticated guidance.",
      anchor: "Built from the instruction to seek Laylat al-Qadr in the last ten, especially the odd nights.",
    },
    {
      title: "Open the night with prayer and stay close to qiyam.",
      detail:
        "Anchor the night around standing in prayer after Isha and as much night prayer as you can sustain with sincerity and presence.",
      anchor: "Built from the forgiveness promise attached to standing Laylat al-Qadr in prayer.",
    },
    {
      title: "Keep the forgiveness dua on your tongue throughout the night.",
      detail:
        "Return to the taught dua repeatedly between prayers, after recitation, in sujud, and in the quieter moments when your heart is most present.",
      anchor: "Built from the specific dua taught to Aishah for Laylat al-Qadr.",
    },
    {
      title: "Recite Qur'an and make personal dua without forcing a script.",
      detail:
        "Read what you can with reflection, then ask Allah for forgiveness, steadfastness, guidance, family well-being, and acceptance in your own words as well.",
      anchor: "This keeps the night inside established worship without claiming a fixed prophetic formula that was not specified.",
    },
    {
      title: "Increase effort and bring your household into the night.",
      detail:
        "Reduce distraction, intensify worship, and help the people under your care take part according to their capacity.",
      anchor: "Built from the report that the Prophet intensified his worship and woke his family in the last ten nights.",
    },
    {
      title: "Finish humbly, then return the next night.",
      detail:
        "Do not assume certainty that you found the night and do not build your worship around dramatic signs. Return with the same seriousness on the remaining nights.",
      anchor: "Hifzer product guidance based on seeking the night across the last ten rather than trying to certify it early.",
    },
  ] satisfies ReadonlyArray<NightPlanStep>,
  authenticityBoundary: {
    title: "What is verified, and what is not",
    points: [
      "Verified: seek Laylat al-Qadr in the last ten nights, especially the odd nights.",
      "Verified: stand the night in prayer, and ask Allah for pardon with the dua taught to Aishah.",
      "Verified: increase worship in the last ten nights and wake your family.",
      "Not established as a fixed Sunnah sequence: a required script, a required rak'ah count for the night, or a guaranteed checklist that proves you found it while you are in it.",
    ],
  },
  quranAnchor: {
    title: "Qur'an anchor",
    detail:
      "Surah al-Qadr frames the night as better than a thousand months and a night of peace until dawn.",
    source: {
      label: "Qur'an 97:1-5",
      href: "https://quran.com/97",
    },
  },
  sources: [
    {
      label: "Qur'an 97:1-5",
      href: "https://quran.com/97",
    },
    {
      label: "Jami` at-Tirmidhi 3513",
      href: "https://sunnah.com/tirmidhi:3513",
    },
    {
      label: "Sahih al-Bukhari 35",
      href: "https://sunnah.com/bukhari:35",
    },
    {
      label: "Sahih al-Bukhari 2017",
      href: "https://sunnah.com/bukhari:2017",
    },
    {
      label: "Sahih al-Bukhari 2024",
      href: "https://sunnah.com/bukhari:2024",
    },
  ] satisfies ReadonlyArray<SourceLink>,
} as const;
