import type { DuaJourneyModule, JourneyEvidence, JourneyStep, SourceLink } from "./laylat-al-qadr";

type BuiltInDeckStep = JourneyStep & {
  deckItemKey: string;
  deckOrder: number;
};

type ModuleDefinition = Omit<DuaJourneyModule, "steps"> & {
  preludeSteps: JourneyStep[];
  deckSteps: BuiltInDeckStep[];
  completionSteps: JourneyStep[];
};

const PRESENCE_TRACKER_NOTE =
  "Use the counter only as a focus aid. This module is not claiming a fixed repetition count unless the source itself establishes one.";

function quran(label: string, href: string): SourceLink {
  return { label, href };
}

function hadith(label: string, href: string): SourceLink {
  return { label, href };
}

function dedupeSources(evidence: JourneyEvidence[]): SourceLink[] {
  const seen = new Set<string>();
  const output: SourceLink[] = [];
  for (const item of evidence) {
    if (!item.source) {
      continue;
    }
    const key = `${item.source.label}|${item.source.href}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(item.source);
  }
  return output;
}

function createStep(step: Omit<JourneyStep, "sourceLinks">): JourneyStep {
  return {
    ...step,
    sourceLinks: dedupeSources(step.evidence),
  };
}

const ruqyahPreludeSteps: JourneyStep[] = [
  createStep({
    id: "ruqyah-clarify-method",
    moduleId: "ruqyah",
    kind: "authentic",
    eyebrow: "Method",
    title: "Ruqyah is Qur'an, dua, and refuge with Allah, not hidden technique.",
    summary:
      "The Prophet permitted ruqyah that is free of shirk, and the Qur'an describes itself as healing and mercy. The lane here is clear recitation, clear supplication, and reliance on Allah.",
    tags: ["Method", "Protection"],
    practice: [
      "Begin with tawhid and presence instead of panic and ritual experimentation.",
      "Stay with Qur'anic recitation and authentic supplications you understand.",
      "Leave anything that depends on hidden formulas, theatrical claims, or suspect wording.",
    ],
    actionLine: "Start this module by making the method clean before you make the recitation longer.",
    reflectionPrompt: "Are you turning to Allah with clarity, or only reacting to fear?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "There is no harm in ruqyah so long as it contains no shirk.",
        detail:
          "This draws a clear boundary for lawful ruqyah: the wording and practice must stay free of polytheism.",
        source: hadith("Sahih Muslim 2200", "https://sunnah.com/muslim:2200"),
      },
      {
        eyebrow: "Qur'an anchor",
        title: "The Qur'an is sent down as healing and mercy for the believers.",
        detail:
          "The healing power in this module begins with the revealed words of Allah, not with occult performance.",
        source: quran("Qur'an 17:82", "https://quran.com/17/82"),
      },
    ],
  }),
  createStep({
    id: "ruqyah-sihr-under-allah",
    moduleId: "ruqyah",
    kind: "authentic",
    eyebrow: "Sihr",
    title: "The Qur'an confirms sihr as harm, but it never escapes Allah's permission or defeat.",
    summary:
      "The Qur'an speaks plainly about magic, yet it also strips it of imagined independence: it harms only by Allah's permission, and Allah nullifies falsehood.",
    tags: ["Sihr", "Protection"],
    practice: [
      "When fear rises, remind yourself that sihr is not an authority outside Allah's decree.",
      "Answer suspicion with refuge, prayer, and recitation before you answer it with speculation.",
      "Do not let the search for hidden causes pull you away from your obligations and ordinary obedience.",
    ],
    actionLine: "Keep the scale right: sihr is real harm, but Allah is greater and falsehood is breakable.",
    reflectionPrompt: "When you fear unseen harm, does your heart grow toward Allah or toward obsession?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "They do not harm anyone through it except by Allah's permission.",
        detail:
          "The verse acknowledges harm yet refuses the idea that magic operates outside the command of Allah.",
        source: quran("Qur'an 2:102", "https://quran.com/2/102"),
      },
      {
        eyebrow: "Qur'an anchor",
        title: "What you have produced is magic; Allah will surely make it useless.",
        detail:
          "The story of Musa teaches confidence in Allah's power to invalidate what the corrupters construct.",
        source: quran("Qur'an 10:81-82", "https://quran.com/10/81-82"),
      },
    ],
  }),
  createStep({
    id: "ruqyah-evil-eye-and-envy",
    moduleId: "ruqyah",
    kind: "authentic",
    eyebrow: "Evil eye",
    title: "The evil eye is real, and the Sunnah answers it with ruqyah, blessing, and calm refuge.",
    summary:
      "The Prophet said the evil eye is real and ordered ruqyah for it. Surah al-Falaq trains the believer to seek refuge from envy when it becomes active harm.",
    tags: ["Evil eye", "Envy", "Protection"],
    practice: [
      "If envy or the evil eye is feared, move first to Qur'an and Prophetic ruqyah instead of dramatic language.",
      "When you admire something in another person, ask Allah to bless it instead of speaking carelessly.",
      "Keep envy, admiration, and protection tied to Allah rather than to superstition.",
    ],
    actionLine: "Treat the evil eye seriously, but never theatrically.",
    reflectionPrompt: "Do your words of admiration protect, or do they sometimes arrive empty of remembrance?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "The evil eye is real.",
        detail:
          "The Sunnah treats it as a real category of harm rather than as a folk superstition.",
        source: hadith("Sahih Muslim 2187", "https://sunnah.com/muslim:2187"),
      },
      {
        eyebrow: "Hadith anchor",
        title: "The Prophet ordered ruqyah for harm from the evil eye.",
        detail:
          "That gives clear Prophetic permission to answer this kind of harm with ruqyah.",
        source: hadith("Sahih al-Bukhari 5738", "https://sunnah.com/bukhari:5738"),
      },
      {
        eyebrow: "Prophetic etiquette",
        title: "Why did you not say, 'May Allah bless you?'",
        detail:
          "The hadith of Sahl ibn Hunayf ties admiration to invoking blessing, not to careless speech.",
        source: hadith("Muwatta Malik 50:2", "https://sunnah.com/malik/50/2"),
      },
    ],
  }),
];

const ruqyahDeckSteps: BuiltInDeckStep[] = [
  createStep({
    id: "ruqyah-dua-al-falaq",
    moduleId: "ruqyah",
    kind: "authentic",
    eyebrow: "Qur'anic shield",
    title: "Surah al-Falaq",
    summary:
      "This surah is the clearest Qur'anic refuge from created harm, darkness, knot-blowing magic, and active envy.",
    tags: ["Qur'an", "Sihr", "Envy"],
    practice: [
      "Recite it when fear of envy, sihr, or sudden harm rises in the chest.",
      "Use it in your nightly protection routine with the other refuge surahs.",
      "Keep the meaning present: you are asking the Lord of daybreak to split the darkness of harm.",
    ],
    actionLine: "Let this surah become a direct reflex when you need refuge.",
    reflectionPrompt: "Which line of al-Falaq feels most alive to the harm you fear right now?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "It explicitly teaches refuge from knot-blowing and envy.",
        detail:
          "This is the most explicit Qur'anic recitation for protection from sihr-shaped harm and envy.",
        source: quran("Qur'an 113:1-5", "https://quran.com/113"),
      },
      {
        eyebrow: "Prophetic practice",
        title: "The Prophet recited the Mu'awwidhat and wiped over his body.",
        detail:
          "The Sunnah turns these surahs into lived protection, not only admired recitation.",
        source: hadith("Sahih al-Bukhari 5017 and 5751", "https://sunnah.com/bukhari:5017"),
      },
    ],
    deckItemKey: "builtin:ruqyah-al-falaq",
    deckOrder: 10,
    dua: {
      label: "Qur'anic recitation",
      intro: "Recite it as refuge, not as a charm. Keep the meanings of sihr, envy, and harm in view.",
      arabic:
        "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ\nمِنْ شَرِّ مَا خَلَقَ\nوَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ\nوَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ\nوَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",
      transliteration:
        "Bismillahir-Rahmanir-Rahim. Qul a'udhu birabbil-falaq. Min sharri ma khalaq. Wa min sharri ghasiqin idha waqab. Wa min sharrin-naffathati fil-'uqad. Wa min sharri hasidin idha hasad.",
      translation:
        "In the name of Allah, the Entirely Merciful, the Especially Merciful. Say, \"I seek refuge in the Lord of daybreak, from the evil of what He created, from the evil of darkness when it settles, from the evil of those who blow on knots, and from the evil of an envier when he envies.\"",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }) as BuiltInDeckStep,
  createStep({
    id: "ruqyah-dua-an-nas",
    moduleId: "ruqyah",
    kind: "authentic",
    eyebrow: "Qur'anic shield",
    title: "Surah an-Nas",
    summary:
      "This surah places refuge in Allah from the retreating whisperer and the pressure that enters hearts from jinn and people.",
    tags: ["Qur'an", "Whispers", "Protection"],
    practice: [
      "Pair it with al-Falaq so outer harm and inner whispering are both answered.",
      "Use it when fear becomes intrusive thoughts, repeated suspicion, or whisper-driven exhaustion.",
      "Recite it as an act of surrender to the Lord, Sovereign, and God of humankind.",
    ],
    actionLine: "Use an-Nas when the harm feels psychological, whispered, or inward.",
    reflectionPrompt: "What changes when you remember that the One protecting you owns and rules the hearts of people?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "It teaches refuge from the retreating whisperer among jinn and mankind.",
        detail:
          "Protection in Islam is not only from external attack but also from inward whispering and agitation.",
        source: quran("Qur'an 114:1-6", "https://quran.com/114"),
      },
      {
        eyebrow: "Prophetic practice",
        title: "The Prophet recited these refuge surahs in his nightly protection routine.",
        detail:
          "The Sunnah makes these recitations ordinary and repeated, not spectacular.",
        source: hadith("Sahih al-Bukhari 5017", "https://sunnah.com/bukhari:5017"),
      },
    ],
    deckItemKey: "builtin:ruqyah-an-nas",
    deckOrder: 20,
    dua: {
      label: "Qur'anic recitation",
      intro: "Recite it slowly enough to feel the refuge from whispering, pressure, and unseen prompting.",
      arabic:
        "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ\nمَلِكِ النَّاسِ\nإِلَهِ النَّاسِ\nمِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ\nالَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ\nمِنَ الْجِنَّةِ وَالنَّاسِ",
      transliteration:
        "Bismillahir-Rahmanir-Rahim. Qul a'udhu birabbin-nas. Malikin-nas. Ilahin-nas. Min sharril-waswasil-khannas. Alladhi yuwaswisu fi sudurin-nas. Minal-jinnati wan-nas.",
      translation:
        "In the name of Allah, the Entirely Merciful, the Especially Merciful. Say, \"I seek refuge in the Lord of humankind, the Sovereign of humankind, the God of humankind, from the evil of the retreating whisperer, who whispers into the hearts of humankind, from among jinn and humankind.\"",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }) as BuiltInDeckStep,
  createStep({
    id: "ruqyah-dua-al-fatihah",
    moduleId: "ruqyah",
    kind: "authentic",
    eyebrow: "Ruqyah recitation",
    title: "Al-Fatihah as ruqyah",
    summary:
      "The Prophet approved al-Fatihah as ruqyah, and the Qur'an itself describes revealed recitation as healing and mercy for the believers.",
    tags: ["Qur'an", "Healing", "Ruqyah"],
    practice: [
      "Recite al-Fatihah over yourself or someone else with calm certainty and dependence on Allah.",
      "Let the words of worship, help, and guidance steady the heart before you ask for relief.",
      "Do not reduce al-Fatihah to technique; receive it as worship and healing together.",
    ],
    actionLine: "Read al-Fatihah here as both praise and ruqyah.",
    reflectionPrompt: "How does your tone change when healing begins with worship and help-seeking?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "How did you know that Surat al-Fatihah is a ruqyah?",
        detail:
          "The Prophet approved the companion's use of al-Fatihah as ruqyah for the afflicted man.",
        source: hadith("Sahih al-Bukhari 5736", "https://sunnah.com/bukhari:5736"),
      },
      {
        eyebrow: "Qur'an anchor",
        title: "The Qur'an is healing and mercy for the believers.",
        detail:
          "This keeps ruqyah grounded in recitation that heals hearts and, by Allah's permission, bodies as well.",
        source: quran("Qur'an 17:82", "https://quran.com/17/82"),
      },
    ],
    deckItemKey: "builtin:ruqyah-al-fatihah",
    deckOrder: 30,
    dua: {
      label: "Qur'anic recitation",
      intro: "Recite al-Fatihah as worship first, then as ruqyah with conviction in Allah's healing.",
      arabic:
        "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ\nالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ\nالرَّحْمَنِ الرَّحِيمِ\nمَالِكِ يَوْمِ الدِّينِ\nإِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ\nاهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ\nصِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
      transliteration:
        "Bismillahir-Rahmanir-Rahim. Alhamdu lillahi Rabbil-'alamin. Ar-Rahmanir-Rahim. Maliki yawmid-din. Iyyaka na'budu wa iyyaka nasta'in. Ihdinas-siratal-mustaqim. Siratal-ladhina an'amta 'alayhim ghayril-maghdubi 'alayhim wa lad-dallin.",
      translation:
        "In the name of Allah, the Entirely Merciful, the Especially Merciful. All praise is for Allah, Lord of the worlds, the Entirely Merciful, the Especially Merciful, Master of the Day of Recompense. You alone we worship, and You alone we ask for help. Guide us to the straight path, the path of those You have blessed, not those who earned anger nor those who went astray.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }) as BuiltInDeckStep,
  createStep({
    id: "ruqyah-dua-jibril",
    moduleId: "ruqyah",
    kind: "authentic",
    eyebrow: "Prophetic ruqyah",
    title: "Jibril's ruqyah for harm, envy, and the evil eye",
    summary:
      "Jibril came to the Prophet and recited a concise ruqyah asking Allah to heal from every harming thing, from the evil eye, and from envy.",
    tags: ["Hadith", "Evil eye", "Healing"],
    practice: [
      "Use it for yourself or for another Muslim with the intention of seeking Allah's healing alone.",
      "Keep the categories in the hadith present: harm, envy, and the evil eye.",
      "Repeat it calmly instead of reaching for dramatic, unsourced phrases.",
    ],
    actionLine: "When the harm feels targeted, return to this exact Prophetic wording.",
    reflectionPrompt: "Can you ask for healing without handing the unseen more weight than Allah?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "Jibril recited this ruqyah for the Prophet.",
        detail:
          "The wording names harm, envy, and the evil eye directly and asks Allah for healing.",
        source: hadith("Sahih Muslim 2186", "https://sunnah.com/muslim:2186"),
      },
      {
        eyebrow: "Hadith anchor",
        title: "The evil eye is real.",
        detail:
          "This keeps the wording grounded in a category of harm the Sunnah explicitly acknowledges.",
        source: hadith("Sahih Muslim 2187", "https://sunnah.com/muslim:2187"),
      },
    ],
    deckItemKey: "builtin:ruqyah-jibril",
    deckOrder: 40,
    dua: {
      label: "Authentic ruqyah",
      intro: "Read it with certainty that healing belongs to Allah alone.",
      arabic:
        "بِاسْمِ اللَّهِ أَرْقِيكَ مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ، مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ، اللَّهُ يَشْفِيكَ، بِاسْمِ اللَّهِ أَرْقِيكَ",
      transliteration:
        "Bismillahi arqika min kulli shay'in yu'dhika, min sharri kulli nafsin aw 'ayni hasidin, Allahu yashfika, bismillahi arqika.",
      translation:
        "In the name of Allah I perform ruqyah for you, from everything that harms you, from the evil of every soul or envious eye. May Allah heal you. In the name of Allah I perform ruqyah for you.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }) as BuiltInDeckStep,
  createStep({
    id: "ruqyah-dua-perfect-words",
    moduleId: "ruqyah",
    kind: "authentic",
    eyebrow: "Protection dua",
    title: "Seeking refuge in Allah's perfect words",
    summary:
      "This concise dua is a Prophetic refuge from the evil of what Allah created, especially useful when entering places, traveling, or feeling exposed.",
    tags: ["Hadith", "Protection"],
    practice: [
      "Use it when arriving somewhere new or whenever you need a broad protective shield.",
      "Keep it simple; this dua's strength is its clarity, not added ritual.",
      "Pair it with the refuge surahs when fear lingers after the first recitation.",
    ],
    actionLine: "Carry this one with you beyond the app because it fits ordinary daily transitions.",
    reflectionPrompt: "How often do you remember to seek refuge before fear fully takes hold?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "Nothing would harm him until he departed from that place.",
        detail:
          "The hadith gives this dua a broad protective role without needing speculative extras.",
        source: hadith("Sahih Muslim 2708a", "https://sunnah.com/muslim:2708a"),
      },
    ],
    deckItemKey: "builtin:ruqyah-perfect-words",
    deckOrder: 50,
    dua: {
      label: "Authentic protection dua",
      intro: "Use this as a broad refuge when you arrive somewhere or feel exposed to harm.",
      arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
      transliteration: "A'udhu bikalimatillahi at-tammati min sharri ma khalaq.",
      translation: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }) as BuiltInDeckStep,
  createStep({
    id: "ruqyah-dua-rabb-an-nas",
    moduleId: "ruqyah",
    kind: "authentic",
    eyebrow: "Healing dua",
    title: "Allahumma Rabb an-Nas, remove the harm and heal",
    summary:
      "When visiting the sick, the Prophet used this direct supplication asking the Lord of humankind to remove harm and grant complete healing.",
    tags: ["Hadith", "Healing"],
    practice: [
      "Use it over yourself, family, or another Muslim while keeping the heart attached to Allah's cure.",
      "Let the phrase 'You are the Healer' rebalance the heart when fear makes created means look ultimate.",
      "Repeat it with tenderness rather than force; this dua is dignified and direct.",
    ],
    actionLine: "End the deck with direct healing language that leaves the matter fully with Allah.",
    reflectionPrompt: "What would change if your first instinct in illness was to say, 'You are the Healer'?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "Remove the harm, Lord of mankind, and heal; You are the Healer.",
        detail:
          "This is one of the most explicit Prophetic healing supplications for illness and affliction.",
        source: hadith("Riyad as-Salihin 902", "https://sunnah.com/riyadussalihin:902"),
      },
    ],
    deckItemKey: "builtin:ruqyah-rabb-an-nas",
    deckOrder: 60,
    dua: {
      label: "Authentic healing dua",
      intro: "Recite it plainly and let the healing remain attributed to Allah alone.",
      arabic:
        "اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، وَاشْفِ، أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا",
      transliteration:
        "Allahumma Rabban-nas, adhhibil-ba'sa, washfi, Antash-Shafi, la shifa'a illa shifa'uka, shifa'an la yughadiru saqaman.",
      translation:
        "O Allah, Lord of mankind, remove the harm and heal; You are the Healer. There is no healing except Your healing, a healing that leaves no illness behind.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }) as BuiltInDeckStep,
];

const ruqyahCompletionSteps: JourneyStep[] = [
  createStep({
    id: "ruqyah-completion",
    moduleId: "ruqyah",
    kind: "guided",
    eyebrow: "Completion",
    title: "Keep protection steady, plain, and free of spectacle.",
    summary:
      "The Sunnah answer to fear is repeated refuge, not performance. Carry the refuge surahs into your night, keep your obedience steady, and return to the authenticated formulas without dramatizing the unseen.",
    tags: ["Method", "Protection"],
    practice: [
      "Keep al-Falaq and an-Nas in your regular nightly routine, not only in emergency moments.",
      "Return to al-Fatihah and the Prophetic duas when fear spikes instead of hunting for novelty.",
      "Let lawful ruqyah sit beside prayer, patience, and ordinary responsible means rather than replacing them.",
    ],
    actionLine: "Leave with a smaller, steadier protection routine rather than a louder one.",
    reflectionPrompt: "Which authenticated recitation from this module do you need to make ordinary tonight?",
    evidence: [
      {
        eyebrow: "Prophetic routine",
        title: "The Prophet recited the refuge surahs before sleep and wiped over his body.",
        detail:
          "That makes protection a repeated nightly practice, not a one-time emergency performance.",
        source: hadith("Sahih al-Bukhari 5017", "https://sunnah.com/bukhari:5017"),
      },
      {
        eyebrow: "Method boundary",
        title: "There is no harm in ruqyah as long as it contains no shirk.",
        detail:
          "The closing boundary remains the same as the opening one: keep ruqyah lawful, clear, and free of polytheism.",
        source: hadith("Sahih Muslim 2200", "https://sunnah.com/muslim:2200"),
      },
    ],
  }),
];

export const ruqyahModuleDefinition: ModuleDefinition = {
  id: "ruqyah",
  label: "Ruqyah & Protection",
  shortLabel: "Ruqyah",
  eyebrow: "Core module",
  title: "Ruqyah, protection, and calm reliance",
  subtitle:
    "A sourced protection module for sihr, evil eye, envy, and harm using Qur'anic recitation and authentic Prophetic ruqyah.",
  description:
    "Move from method and clarity into the refuge surahs, al-Fatihah, and authenticated protective duas without panic, spectacle, or invented ritual claims.",
  authenticityBoundary:
    "Verified anchors: the Qur'an names itself healing, acknowledges sihr, commands refuge from envy and knot-blowing, and the Sunnah establishes lawful ruqyah for evil eye and harm. Hifzer is only sequencing those anchors into one calm guided module.",
  tone: "accent",
  supportsCustomDeck: true,
  preludeSteps: ruqyahPreludeSteps,
  deckSteps: ruqyahDeckSteps,
  completionSteps: ruqyahCompletionSteps,
};
