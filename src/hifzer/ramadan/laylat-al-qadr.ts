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

export type JourneyChapterId = "prophetic" | "repentance" | "asking" | "duas" | "completion";

export type JourneyKind = "authentic" | "guided";

export type JourneyDua = {
  arabic: string;
  transliteration: string;
  translation: string;
  trackerLabel: string;
  trackerNote: string;
};

export type JourneyStep = {
  id: string;
  chapter: JourneyChapterId;
  kind: JourneyKind;
  eyebrow: string;
  title: string;
  summary: string;
  details: string[];
  actionLine?: string;
  tags?: string[];
  sourceLinks: SourceLink[];
  dua?: JourneyDua;
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

export const laylatAlQadrJourney = {
  title: "Laylat al-Qadr guided experience",
  subtitle:
    "A step-by-step night flow for qiyam, repentance, and dua. It is built from authentic anchors and clearly labels where Hifzer is structuring the order for focus.",
  authenticityBoundary:
    "No authenticated fixed Laylat al-Qadr script or required rak'ah count is being claimed here. Where the product arranges a sequence, it is labeled as guided structure rather than fixed Sunnah.",
  chapters: [
    { id: "prophetic", label: "Prophetic focus", description: "What to seek and what the Prophet intensified in the last ten nights." },
    { id: "repentance", label: "Repentance", description: "How to turn back with hope, sincerity, and no persistence in sin." },
    { id: "asking", label: "How to ask", description: "The adab of dua: humility, praise, salawat, sujud, and patience." },
    { id: "duas", label: "Dua deck", description: "Move through the duas in sequence and track your own repetitions." },
    { id: "completion", label: "Completion", description: "Close the night with humility and return on the next remaining night." },
  ] as const,
  steps: [
    {
      id: "seek-last-ten",
      chapter: "prophetic",
      kind: "authentic",
      eyebrow: "Prophetic focus",
      title: "Seek Laylat al-Qadr across the last ten nights, especially the odd nights.",
      summary:
        "The Sunnah does not train you to gamble on one dramatic night. It trains you to seek the night across the last ten, with special attention to the odd nights.",
      details: [
        "Your mentality should be search, not certainty too early.",
        "If you only prepare for one night, your effort is narrower than the Prophetic guidance.",
        "The right starting feeling is urgency with steadiness, not spiritual spectacle.",
      ],
      actionLine: "Begin this experience as if tonight matters, then come back again on the remaining nights.",
      tags: ["Last ten", "Odd nights", "Laylat al-Qadr"],
      sourceLinks: [
        { label: "Sahih al-Bukhari 2017", href: "https://sunnah.com/bukhari:2017" },
        { label: "Riyad as-Salihin 1191", href: "https://sunnah.com/riyadussalihin:1191" },
      ],
    },
    {
      id: "intensify-and-wake-family",
      chapter: "prophetic",
      kind: "authentic",
      eyebrow: "What the Prophet did",
      title: "He intensified worship, woke his family, and gave the last ten a different level of seriousness.",
      summary:
        "The last ten nights were not casual nights. The Prophet increased effort, stayed awake in worship, woke his family, and also observed i'tikaf in the last ten.",
      details: [
        "This changes the tone of the night: fewer distractions, more worship, more seriousness.",
        "Bringing your household into the night, according to their capacity, is part of the Prophetic pattern.",
        "I'tikaf belongs to this atmosphere of seeking and seclusion, even if not everyone can do it.",
      ],
      actionLine: "Reduce noise, prepare your space, and let the night feel more protected than a normal Ramadan evening.",
      tags: ["Wake family", "I'tikaf", "Increase effort"],
      sourceLinks: [
        { label: "Sahih al-Bukhari 2024", href: "https://sunnah.com/bukhari:2024" },
        { label: "Riyad as-Salihin 1268", href: "https://sunnah.com/riyadussalihin:1268" },
      ],
    },
    {
      id: "qiyam-core",
      chapter: "prophetic",
      kind: "authentic",
      eyebrow: "Qiyam",
      title: "The heart of the night is qiyam with faith, hope for reward, and real dua inside the prayer.",
      summary:
        "The forgiveness promise tied to Laylat al-Qadr is attached to standing the night in prayer with iman and seeking reward. Sujud is also a privileged place for dua.",
      details: [
        "The aim is not performance. The aim is honest standing before Allah.",
        "Let your qiyam contain Qur'an, calm recitation, and sujud where you ask deeply.",
        "Do not reduce Laylat al-Qadr to only reading duas without prayer.",
      ],
      actionLine: "Make sure tonight includes actual standing prayer, not only browsing religious content.",
      tags: ["Qiyam", "Forgiveness", "Sujud dua"],
      sourceLinks: [
        { label: "Sahih al-Bukhari 35", href: "https://sunnah.com/bukhari:35" },
        { label: "Sahih Muslim 482", href: "https://sunnah.com/muslim:482" },
      ],
    },
    {
      id: "hifzer-night-flow",
      chapter: "prophetic",
      kind: "guided",
      eyebrow: "Hifzer guided order",
      title: "A focused night flow: qiyam, repentance, quiet dua, Qur'an, then return to dua.",
      summary:
        "This is Hifzer's structured order for the night. It is not claimed as a fixed Prophetic formula, but it keeps you inside the strongest authenticated anchors.",
      details: [
        "Start after Isha with prayer and a protected block of qiyam.",
        "Use sujud and post-prayer moments for repentance and forgiveness.",
        "Read Qur'an with presence, then return to the dua deck with a softer heart and a clearer tongue.",
      ],
      actionLine: "Move through the next steps as a full night arc, not as isolated content cards.",
      tags: ["Guided structure", "No fixed script claimed"],
      sourceLinks: [
        { label: "Sahih al-Bukhari 35", href: "https://sunnah.com/bukhari:35" },
        { label: "Sahih al-Bukhari 2024", href: "https://sunnah.com/bukhari:2024" },
        { label: "Sahih Muslim 482", href: "https://sunnah.com/muslim:482" },
      ],
    },
    {
      id: "repent-with-hope",
      chapter: "repentance",
      kind: "authentic",
      eyebrow: "Repentance",
      title: "Start tawbah with hope, not despair.",
      summary:
        "The Qur'an closes the door on despair. Turn back to Allah in sincere repentance and do not tell yourself your sins are too large for mercy.",
      details: [
        "Repentance begins by returning, not by waiting until you feel worthy.",
        "Hope is not naivety. It is obedience to Allah's invitation to come back.",
        "Tonight is one of the strongest nights to ask for a wiped record and a reopened relationship with your Lord.",
      ],
      actionLine: "Say to yourself plainly: I am returning to Allah tonight, and I will not despair of His mercy.",
      tags: ["No despair", "Sincere tawbah", "Return now"],
      sourceLinks: [
        { label: "Qur'an 39:53-54", href: "https://previous.quran.com/39/53-75" },
        { label: "Qur'an 66:8", href: "https://quran.com/66:8" },
        { label: "Sahih Muslim 2747a", href: "https://sunnah.com/muslim:2747a" },
      ],
    },
    {
      id: "stop-persisting",
      chapter: "repentance",
      kind: "authentic",
      eyebrow: "Repentance method",
      title: "Proper repentance means admitting the wrong, seeking forgiveness, and not choosing persistence.",
      summary:
        "The Qur'anic shape of tawbah is clear: remember Allah, seek forgiveness, and do not knowingly persist in the wrongdoing. Adam's dua teaches confession and need.",
      details: [
        "Name the wrong before Allah instead of hiding behind vague language.",
        "Ask forgiveness because no one forgives sins except Him.",
        "Leave the night with a real resolve not to continue the sin you are repenting from.",
      ],
      actionLine: "Before moving to the dua deck, bring one concrete sin or pattern to mind and repent from it honestly.",
      tags: ["No persistence", "Admit the wrong", "Turn back"],
      sourceLinks: [
        { label: "Qur'an 3:135", href: "https://quran.com/3:135" },
        { label: "Qur'an 7:23", href: "https://quran.com/7:23" },
      ],
    },
    {
      id: "begin-dua-rightly",
      chapter: "asking",
      kind: "authentic",
      eyebrow: "How to ask",
      title: "Begin by praising Allah, sending salawat upon the Prophet, then ask clearly.",
      summary:
        "One of the clearest prophetic corrections on dua is not to rush into requests carelessly. Start with praise of Allah, then salawat, then ask for what you need.",
      details: [
        "This gives your dua adab, focus, and reverence.",
        "It also slows you down so your asking is not just a panicked list.",
        "Once you begin properly, ask for forgiveness, acceptance, guidance, firmness, and what your life truly needs.",
      ],
      actionLine: "Before each dua card below, pause to praise Allah and send blessings on the Prophet.",
      tags: ["Praise first", "Salawat", "Dua etiquette"],
      sourceLinks: [
        { label: "Riyad as-Salihin 1404", href: "https://sunnah.com/riyadussalihin:1404" },
        { label: "Qur'an 40:60", href: "https://previous.quran.com/40/60" },
      ],
    },
    {
      id: "ask-humbly-and-dont-rush",
      chapter: "asking",
      kind: "authentic",
      eyebrow: "How to ask",
      title: "Ask humbly, use sujud, and do not grow impatient with the answer.",
      summary:
        "The Qur'an teaches humility and privacy in dua. The Prophet taught that sujud is a place to increase supplication, and he warned against abandoning dua because the answer did not come on your timetable.",
      details: [
        "Ask with humility, not with entitlement.",
        "Use prostration for the things you need most.",
        "Do not say, 'I asked and I was not answered,' then quit. Keep asking.",
      ],
      actionLine: "If your heart opens in sujud tonight, stay there and ask more instead of rushing to the next task.",
      tags: ["Humility", "Sujud", "Patience in dua"],
      sourceLinks: [
        { label: "Qur'an 7:55", href: "https://legacy.quran.com/07/55-205" },
        { label: "Qur'an 2:186", href: "https://quran.com/al-baqarah/186-187" },
        { label: "Sahih Muslim 482", href: "https://sunnah.com/muslim:482" },
        { label: "Muslim narration via Mishkat 2227", href: "https://sunnah.com/mishkat/9/5" },
      ],
    },
    {
      id: "dua-laylat-al-qadr",
      chapter: "duas",
      kind: "authentic",
      eyebrow: "Dua deck",
      title: "Laylat al-Qadr forgiveness dua",
      summary:
        "This is the clearest authenticated dua taught specifically for Laylat al-Qadr when Aishah asked what to say if she found the night.",
      details: [
        "Keep it central tonight.",
        "Repeat it between rak'ahs, after recitation, and in the quiet moments where your heart softens.",
        "Its center is pardon: asking Allah to wipe away what should not remain on your record.",
      ],
      tags: ["Laylat al-Qadr", "Forgiveness", "Central dua"],
      sourceLinks: [
        { label: "Jami` at-Tirmidhi 3513", href: "https://sunnah.com/tirmidhi:3513" },
      ],
      dua: {
        arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
        transliteration: "Allahumma innaka 'afuwwun tuhibbul-'afwa fa'fu 'anni.",
        translation: "O Allah, You are Pardoning and love pardon, so pardon me.",
        trackerLabel: "Personal repetition counter",
        trackerNote: "No authenticated fixed count is established here. Use the counter as your own focus tracker while your heart remains present.",
      },
    },
    {
      id: "dua-sayyid-al-istighfar",
      chapter: "duas",
      kind: "authentic",
      eyebrow: "Dua deck",
      title: "Sayyid al-Istighfar",
      summary:
        "This is the most superior way of asking forgiveness taught in the hadith. It combines servitude, gratitude, confession, and asking for pardon.",
      details: [
        "Use it when you want your repentance to be fuller and more articulate.",
        "It is especially powerful when you need to admit both Allah's favors and your own failure.",
        "Read it slowly. It is not a short line to rush through.",
      ],
      tags: ["Istighfar", "Confession", "Forgiveness"],
      sourceLinks: [
        { label: "Sahih al-Bukhari 6306", href: "https://sunnah.com/bukhari:6306" },
      ],
      dua: {
        arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
        transliteration:
          "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu, a'udhu bika min sharri ma sana'tu, abu'u laka bini'matika 'alayya, wa abu'u bidhanbi, faghfir li fa innahu la yaghfiru-dh-dhunuba illa anta.",
        translation:
          "O Allah, You are my Lord. There is none worthy of worship but You. You created me and I am Your servant. I remain upon Your covenant and promise as much as I can. I seek refuge in You from the evil of what I have done. I acknowledge before You Your favor upon me, and I admit my sin. So forgive me, for none forgives sins except You.",
        trackerLabel: "Personal repetition counter",
        trackerNote: "The hadith gives its special virtue for day and night recitation. For this experience, use the counter for focused repetition without treating a number as a fixed Sunnah for Laylat al-Qadr.",
      },
    },
    {
      id: "dua-adam",
      chapter: "duas",
      kind: "authentic",
      eyebrow: "Dua deck",
      title: "Adam's repentance dua",
      summary:
        "This Qur'anic dua carries the raw language of repentance: we wronged ourselves, and without Your forgiveness and mercy we are lost.",
      details: [
        "Use this when your tawbah needs brokenness more than eloquence.",
        "It is short enough to repeat and deep enough to stay with you.",
        "It teaches that sin is self-wrong, and salvation is in Allah's forgiveness and mercy.",
      ],
      tags: ["Qur'anic dua", "Repentance", "Mercy"],
      sourceLinks: [
        { label: "Qur'an 7:23", href: "https://quran.com/7:23" },
      ],
      dua: {
        arabic: "رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
        transliteration: "Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna mina-l-khasirin.",
        translation: "Our Lord, we have wronged ourselves. If You do not forgive us and have mercy on us, we will surely be among the losers.",
        trackerLabel: "Personal repetition counter",
        trackerNote: "Use this counter to stay with the meaning. The product is tracking focus, not prescribing a revealed number.",
      },
    },
    {
      id: "dua-abu-bakr",
      chapter: "duas",
      kind: "authentic",
      eyebrow: "Dua deck",
      title: "Abu Bakr's prayer of repentance inside salah",
      summary:
        "This is a direct teaching to Abu Bakr for use in prayer. It is one of the strongest compact formulas for personal wrongdoing and asking for mercy.",
      details: [
        "It fits especially well after qiyam and before ending the prayer or after finishing a prayer block.",
        "Its power is in personal admission: I have wronged myself greatly.",
        "Use it when you want repentance language that is direct and private.",
      ],
      tags: ["Inside salah", "Personal repentance", "Mercy"],
      sourceLinks: [
        { label: "Riyad as-Salihin 1475", href: "https://sunnah.com/riyadussalihin:1475" },
      ],
      dua: {
        arabic: "اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ، وَارْحَمْنِي، إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ",
        transliteration:
          "Allahumma inni zalamtu nafsi zulman kathiran, wa la yaghfiru-dh-dhunuba illa anta, faghfir li maghfiratan min 'indika, warhamni, innaka anta-l-Ghafuru-r-Rahim.",
        translation:
          "O Allah, I have greatly wronged myself, and none forgives sins except You. So grant me forgiveness from Yourself and have mercy on me. Indeed, You are the All-Forgiving, the Most Merciful.",
        trackerLabel: "Personal repetition counter",
        trackerNote: "There is no fixed Laylat al-Qadr repetition count attached to this dua. Use the counter to linger with the meaning.",
      },
    },
    {
      id: "dua-comprehensive-good",
      chapter: "duas",
      kind: "authentic",
      eyebrow: "Dua deck",
      title: "A comprehensive dua for all good and protection from all evil",
      summary:
        "Aishah was taught this sweeping dua that gathers worldly and next-world good, protection from evil, Paradise, and protection from the Fire.",
      details: [
        "Use this when you want the night to include more than forgiveness alone.",
        "It is ideal after the repentance duas, when you want to ask broadly and safely.",
        "It also matches the Prophetic love for comprehensive supplications rather than scattered speech.",
      ],
      tags: ["Comprehensive dua", "All good", "Paradise and protection"],
      sourceLinks: [
        { label: "Sunan Ibn Majah 3846", href: "https://sunnah.com/ibnmajah:3846" },
        { label: "Riyad as-Salihin 1466", href: "https://sunnah.com/riyadussalihin:1466" },
      ],
      dua: {
        arabic:
          "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنَ الْخَيْرِ كُلِّهِ عَاجِلِهِ وَآجِلِهِ مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ، وَأَعُوذُ بِكَ مِنَ الشَّرِّ كُلِّهِ عَاجِلِهِ وَآجِلِهِ مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ، اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ خَيْرِ مَا سَأَلَكَ عَبْدُكَ وَنَبِيُّكَ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا عَاذَ بِهِ عَبْدُكَ وَنَبِيُّكَ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ، وَأَعُوذُ بِكَ مِنَ النَّارِ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ، وَأَسْأَلُكَ أَنْ تَجْعَلَ كُلَّ قَضَاءٍ قَضَيْتَهُ لِي خَيْرًا",
        transliteration:
          "Allahumma inni as'aluka min al-khayri kullihi, 'ajilihi wa ajilihi, ma 'alimtu minhu wa ma lam a'lam. Wa a'udhu bika min ash-sharri kullihi, 'ajilihi wa ajilihi, ma 'alimtu minhu wa ma lam a'lam. Allahumma inni as'aluka min khayri ma sa'alaka 'abduka wa nabiyyuka, wa a'udhu bika min sharri ma 'adha bihi 'abduka wa nabiyyuka. Allahumma inni as'aluka al-jannata wa ma qarraba ilayha min qawlin aw 'amalin, wa a'udhu bika min an-nari wa ma qarraba ilayha min qawlin aw 'amalin, wa as'aluka an taj'ala kulla qada'in qadaytahu li khayran.",
        translation:
          "O Allah, I ask You for all good, immediate and later, what I know of it and what I do not know. I seek refuge in You from all evil, immediate and later, what I know of it and what I do not know. O Allah, I ask You for the good that Your servant and Prophet asked You for, and I seek refuge in You from the evil from which Your servant and Prophet sought refuge. O Allah, I ask You for Paradise and whatever brings one nearer to it in word and deed, and I seek refuge in You from the Fire and whatever brings one nearer to it in word and deed. And I ask You to make every decree You decree for me good.",
        trackerLabel: "Personal repetition counter",
        trackerNote: "Because this is a comprehensive dua, even one slow recitation can be weighty. The counter is here only to help you stay engaged if you want to repeat it.",
      },
    },
    {
      id: "complete-the-night",
      chapter: "completion",
      kind: "guided",
      eyebrow: "Completion",
      title: "Close with humility, then return on the next remaining night.",
      summary:
        "The best ending is not self-certification. It is humility, gratitude, and willingness to return again in the remaining last-ten nights.",
      details: [
        "Do not decide too quickly that tonight was enough.",
        "Take the softness you gained into the next prayer, the next sujud, and the next night.",
        "If you wronged Allah tonight, repent again. If you asked weakly, ask again. The door remains open.",
      ],
      actionLine: "When you finish this journey, return to prayer, Qur'an, or quiet dua before you leave the night.",
      tags: ["Return again", "No self-certification", "Stay humble"],
      sourceLinks: [
        { label: "Sahih al-Bukhari 2017", href: "https://sunnah.com/bukhari:2017" },
        { label: "Qur'an 39:53-54", href: "https://previous.quran.com/39/53-75" },
      ],
    },
  ] satisfies ReadonlyArray<JourneyStep>,
} as const;
