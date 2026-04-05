import type { DuaJourneyModule, JourneyEvidence, JourneyStep, SourceLink, StepSpotlight } from "./laylat-al-qadr";

type BuiltInDeckStep = JourneyStep & {
  deckItemKey: string;
  deckOrder: number;
};

type ModuleDefinition = Omit<DuaJourneyModule, "steps"> & {
  preludeSteps: JourneyStep[];
  deckSteps: BuiltInDeckStep[];
  completionSteps: JourneyStep[];
};

type NameCategory =
  | "Mercy"
  | "Forgiveness"
  | "Majesty"
  | "Creation"
  | "Provision"
  | "Knowledge"
  | "Guidance"
  | "Protection"
  | "Power"
  | "Justice"
  | "Life"
  | "Unity";

type AnchorKey = string;

type NameAnchor = {
  title: string;
  anchorType: StepSpotlight["anchorType"];
  arabic: string;
  transliteration?: string | null;
  translation: string;
  source: SourceLink;
};

type NameEntry = {
  slug: string;
  nameArabic: string;
  transliteration: string;
  meaning: string;
  category: NameCategory;
  anchorKey: AnchorKey;
  summaryNote?: string;
};

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

const CATEGORY_COPY: Record<
  NameCategory,
  {
    eyebrow: string;
    summary: string;
    action: string;
    reflection: string;
    practice: string[];
  }
> = {
  Mercy: {
    eyebrow: "Mercy and nearness",
    summary: "Ask with softness and hope in Allah's mercy before anything else.",
    action: "Let mercy set the tone of your asking.",
    reflection: "Where do you need mercy before your own self-judgment speaks?",
    practice: [
      "Bring one wound or fear under Allah's mercy.",
      "Keep your wording humble and personal.",
      "Let the name soften you before it comforts you.",
    ],
  },
  Forgiveness: {
    eyebrow: "Forgiveness and return",
    summary: "These names belong with confession, regret, and a real willingness to return.",
    action: "Name the wrong plainly, then ask without despair.",
    reflection: "What would your tawbah sound like if you believed Allah still wanted your return?",
    practice: [
      "Confess one concrete sin instead of staying vague.",
      "Ask for pardon and for a changed direction.",
      "Let the name move you toward repair.",
    ],
  },
  Majesty: {
    eyebrow: "Majesty and awe",
    summary: "These names teach reverence, surrender, and a quieter ego in dua.",
    action: "Ask with reverence and leave control to Allah.",
    reflection: "Which part of your heart still wants control while asking the King?",
    practice: [
      "Pause before asking and let the name reset your posture.",
      "Lower your inner voice even if your tongue is already quiet.",
      "Ask for what is good and leave the form to Allah.",
    ],
  },
  Creation: {
    eyebrow: "Creation and renewal",
    summary: "These names return you to Allah as the One who begins, forms, and remakes.",
    action: "Ask for inward re-creation, not only small improvement.",
    reflection: "What in your life needs re-creation instead of adjustment?",
    practice: [
      "Bring one broken area of life to Allah.",
      "Ask for inner formation before outer success.",
      "Let the name widen your hope in a new beginning.",
    ],
  },
  Provision: {
    eyebrow: "Provision and opening",
    summary: "These names soften panic and teach you to ask without grasping.",
    action: "Ask for opening, sufficiency, and halal relief.",
    reflection: "Where has fear about provision narrowed your trust?",
    practice: [
      "Ask for halal opening, not only more.",
      "Bring one debt, block, or quiet financial fear.",
      "Keep dependence on Allah larger than dependence on your plan.",
    ],
  },
  Knowledge: {
    eyebrow: "Knowledge and wisdom",
    summary: "Use these names when you need clarity, true seeing, and cleaner judgment.",
    action: "Ask for insight and sound judgment.",
    reflection: "What do you need Allah to show you that your own bias keeps hiding?",
    practice: [
      "Ask for knowledge that changes action.",
      "Bring one decision where you need wisdom more than speed.",
      "Ask Allah to purify what you hear and assume.",
    ],
  },
  Guidance: {
    eyebrow: "Guidance and uprightness",
    summary: "These names are for crossroads, confusion, and the slow work of staying straight.",
    action: "Ask for the next obedient step, not only a feeling.",
    reflection: "What guidance have you already been shown but still delayed obeying?",
    practice: [
      "Ask for guidance in one decision and one habit.",
      "Stay willing to move when guidance becomes clear.",
      "Keep the request practical enough to recognize the answer.",
    ],
  },
  Protection: {
    eyebrow: "Protection and care",
    summary: "These names return fear, exposure, and weakness back under Allah's keeping.",
    action: "Bring what you fear into Allah's care.",
    reflection: "What are you trying to secure alone that needs to be handed back to Allah?",
    practice: [
      "Name what needs guarding: faith, family, work, or heart.",
      "Ask for protection from harm and from harmful reactions to harm.",
      "Leave the step with more trust than vigilance.",
    ],
  },
  Power: {
    eyebrow: "Power and decree",
    summary: "These names are for weakness, upheaval, reversal, and asking Allah to alter what feels impossible.",
    action: "Ask boldly, then submit fully.",
    reflection: "Where do you need Allah's power more than your own effort?",
    practice: [
      "Ask for what feels impossible without pretending you control it.",
      "Bring one fear about change, timing, or loss.",
      "Let the name widen what you believe Allah can do next.",
    ],
  },
  Justice: {
    eyebrow: "Justice and truth",
    summary: "These names are for fairness, repair, and asking Allah to settle what people keep distorting.",
    action: "Ask Allah to judge with truth and restore balance.",
    reflection: "What have you left unresolved because truth felt costly?",
    practice: [
      "Bring one conflict that needs truth more than victory.",
      "Ask for justice without forgetting your own flaws.",
      "Let the name make you more honest before more demanding.",
    ],
  },
  Life: {
    eyebrow: "Life and return",
    summary: "These names pull the heart back to life, death, return, and what actually remains.",
    action: "Ask with the akhirah in view, not only the next hour.",
    reflection: "What changes when you remember that Allah outlasts every fear and season?",
    practice: [
      "Bring one anxiety to the scale of resurrection and accountability.",
      "Ask for steadiness that survives changing circumstances.",
      "Let remembrance of death soften attachment to what will not remain.",
    ],
  },
  Unity: {
    eyebrow: "Oneness and sincerity",
    summary: "These names strip distraction away and return the heart to one Lord.",
    action: "Ask with sincerity and undivided dependence.",
    reflection: "What competitor has quietly entered your reliance beside Allah?",
    practice: [
      "Let the name gather your attention into one qiblah of dependence.",
      "Ask with a need you have been carrying in fragmented ways.",
      "Make your reliance cleaner and more exclusive to Allah.",
    ],
  },
};

const NAME_ANCHORS: Record<AnchorKey, NameAnchor> = {
  "call-allah-or-rahman": {
    title: "Call upon Allah or call upon Ar-Rahman.",
    anchorType: "Qur'an name line",
    arabic: "ٱدْعُوا۟ ٱللَّهَ أَوِ ٱدْعُوا۟ ٱلرَّحْمَـٰنَ",
    transliteration: "Ud'u Allah awi ud'u Ar-Rahman.",
    translation: "Call upon Allah or call upon Ar-Rahman.",
    source: quran("Qur'an 17:110", "https://quran.com/17/110"),
  },
  wahhab: {
    title: "Indeed, You are Al-Wahhab.",
    anchorType: "Direct dua",
    arabic: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ ٱلْوَهَّابُ",
    transliteration:
      "Rabbana la tuzigh qulubana ba'da idh hadaytana wa hab lana min ladunka rahmah, innaka anta Al-Wahhab.",
    translation:
      "Our Lord, let not our hearts deviate after You have guided us, and grant us from Yourself mercy. Indeed, You are the Bestower.",
    source: quran("Qur'an 3:8", "https://quran.com/3/8"),
  },
  "sami-alim": {
    title: "Indeed, You are As-Sami' Al-'Alim.",
    anchorType: "Direct dua",
    arabic: "رَبَّنَا تَقَبَّلْ مِنَّآ ۖ إِنَّكَ أَنتَ ٱلسَّمِيعُ ٱلْعَلِيمُ",
    transliteration: "Rabbana taqabbal minna, innaka anta As-Sami'u Al-'Alim.",
    translation: "Our Lord, accept from us. Indeed, You are the Hearing, the Knowing.",
    source: quran("Qur'an 2:127", "https://quran.com/2/127"),
  },
  "tawwab-rahim": {
    title: "Indeed, You are At-Tawwab Ar-Rahim.",
    anchorType: "Direct dua",
    arabic: "وَتُبْ عَلَيْنَآ ۖ إِنَّكَ أَنتَ ٱلتَّوَّابُ ٱلرَّحِيمُ",
    transliteration: "Wa tub 'alayna, innaka anta At-Tawwabu Ar-Rahim.",
    translation: "Turn to us in mercy; indeed, You are the Accepting of repentance, the Merciful.",
    source: quran("Qur'an 2:128", "https://quran.com/2/128"),
  },
  "aziz-hakim": {
    title: "Indeed, You are Al-'Aziz Al-Hakim.",
    anchorType: "Direct dua",
    arabic: "وَٱغْفِرْ لَنَا رَبَّنَآ ۖ إِنَّكَ أَنتَ ٱلْعَزِيزُ ٱلْحَكِيمُ",
    transliteration: "Waghfir lana Rabbana, innaka anta Al-'Aziz Al-Hakim.",
    translation: "Forgive us, our Lord. Indeed, You are the Exalted in Might, the Wise.",
    source: quran("Qur'an 60:5", "https://quran.com/60/5"),
  },
  "owner-of-sovereignty": {
    title: "O Allah, Owner of Sovereignty.",
    anchorType: "Direct dua",
    arabic:
      "ٱللَّهُمَّ مَـٰلِكَ ٱلْمُلْكِ تُؤْتِى ٱلْمُلْكَ مَن تَشَآءُ وَتَنزِعُ ٱلْمُلْكَ مِمَّن تَشَآءُ وَتُعِزُّ مَن تَشَآءُ وَتُذِلُّ مَن تَشَآءُ",
    transliteration:
      "Allahumma Malika Al-Mulk, tu'ti Al-Mulka man tasha' wa tanzi'u Al-Mulka mimman tasha' wa tu'izzu man tasha' wa tudhillu man tasha'.",
    translation:
      "O Allah, Owner of Sovereignty, You give sovereignty to whom You will, take it from whom You will, honor whom You will, and humble whom You will.",
    source: quran("Qur'an 3:26", "https://quran.com/3/26"),
  },
  "rauf-rahim": {
    title: "Our Lord, indeed You are Ra'uf and Rahim.",
    anchorType: "Direct dua",
    arabic: "رَبَّنَآ إِنَّكَ رَءُوفٌ رَّحِيمٌ",
    transliteration: "Rabbana innaka Ra'ufun Rahim.",
    translation: "Our Lord, indeed You are Kind and Merciful.",
    source: quran("Qur'an 59:10", "https://quran.com/59/10"),
  },
  "iftah-baynana": {
    title: "Open and decide between us in truth.",
    anchorType: "Direct dua",
    arabic: "رَبَّنَا ٱفْتَحْ بَيْنَنَا وَبَيْنَ قَوْمِنَا بِٱلْحَقِّ وَأَنتَ خَيْرُ ٱلْفَـٰتِحِينَ",
    transliteration: "Rabbana iftah baynana wa bayna qawmina bil-haqq, wa anta Khayru Al-Fatihin.",
    translation: "Our Lord, decide between us and our people in truth, and You are the best of those who open and decide.",
    source: quran("Qur'an 7:89", "https://quran.com/7/89"),
  },
  "anta-waliyyi": {
    title: "You are my protector in this world and the Hereafter.",
    anchorType: "Direct dua",
    arabic: "فَاطِرَ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضِ أَنتَ وَلِىِّۦ فِى ٱلدُّنْيَا وَٱلْـَٔاخِرَةِ",
    transliteration: "Fatira As-Samawati wa Al-Ard, anta waliyyi fi ad-dunya wa al-akhirah.",
    translation: "Creator of the heavens and earth, You are my protector in this world and in the Hereafter.",
    source: quran("Qur'an 12:101", "https://quran.com/12/101"),
  },
  "best-inheritor": {
    title: "You are the best of inheritors.",
    anchorType: "Direct dua",
    arabic: "رَبِّ لَا تَذَرْنِى فَرْدًا وَأَنتَ خَيْرُ ٱلْوَٰرِثِينَ",
    transliteration: "Rabbi la tadharnee fardan wa anta Khayru Al-Warithin.",
    translation: "My Lord, do not leave me alone, while You are the best of inheritors.",
    source: quran("Qur'an 21:89", "https://quran.com/21/89"),
  },
  "forgive-and-have-mercy": {
    title: "Forgive and have mercy.",
    anchorType: "Direct dua",
    arabic: "رَّبِّ ٱغْفِرْ وَٱرْحَمْ وَأَنتَ خَيْرُ ٱلرَّٰحِمِينَ",
    transliteration: "Rabbi ighfir warham wa anta Khayru Ar-Rahimin.",
    translation: "My Lord, forgive and have mercy, and You are the best of the merciful.",
    source: quran("Qur'an 23:118", "https://quran.com/23/118"),
  },
  "name-majesty": {
    title: "He is Allah, the King, the Pure, the Source of Peace...",
    anchorType: "Qur'an name line",
    arabic:
      "هُوَ ٱللَّهُ ٱلَّذِى لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْمَلِكُ ٱلْقُدُّوسُ ٱلسَّلَـٰمُ ٱلْمُؤْمِنُ ٱلْمُهَيْمِنُ ٱلْعَزِيزُ ٱلْجَبَّارُ ٱلْمُتَكَبِّرُ",
    translation:
      "He is Allah, other than whom there is no deity: the Sovereign, the Pure, the Source of Peace, the Granter of Security, the Overseer, the Exalted in Might, the Compeller, the Supreme.",
    source: quran("Qur'an 59:23", "https://quran.com/59/23"),
  },
  "name-creation": {
    title: "He is Allah, the Creator, the Inventor, the Fashioner.",
    anchorType: "Qur'an name line",
    arabic: "هُوَ ٱللَّهُ ٱلْخَـٰلِقُ ٱلْبَارِئُ ٱلْمُصَوِّرُ",
    translation: "He is Allah, the Creator, the Inventor, the Fashioner.",
    source: quran("Qur'an 59:24", "https://quran.com/59/24"),
  },
  "barr-rahim": {
    title: "Indeed, He is Al-Barr, Ar-Rahim.",
    anchorType: "Qur'an name line",
    arabic: "إِنَّهُۥ هُوَ ٱلْبَرُّ ٱلرَّحِيمُ",
    translation: "Indeed, it is He who is the Beneficent, the Merciful.",
    source: quran("Qur'an 52:28", "https://quran.com/52/28"),
  },
  "best-guardian": {
    title: "Allah is the best guardian.",
    anchorType: "Meaning anchor",
    arabic: "فَٱللَّهُ خَيْرٌ حَـٰفِظًا ۖ وَهُوَ أَرْحَمُ ٱلرَّٰحِمِينَ",
    transliteration: "Fa-Allahu khayrun hafidhan wa Huwa Arhamu Ar-Rahimin.",
    translation: "Allah is the best guardian, and He is the most merciful of the merciful.",
    source: quran("Qur'an 12:64", "https://quran.com/12/64"),
  },
  "prepare-guidance": {
    title: "Prepare right guidance for us.",
    anchorType: "Direct dua",
    arabic: "رَبَّنَآ ءَاتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا",
    transliteration: "Rabbana atina min ladunka rahmah wa hayyi' lana min amrina rashada.",
    translation: "Our Lord, grant us from Yourself mercy and prepare for us from our affair right guidance.",
    source: quran("Qur'an 18:10", "https://quran.com/18/10"),
  },
  "guide-me-nearer": {
    title: "Perhaps my Lord will guide me nearer to right conduct.",
    anchorType: "Direct dua",
    arabic: "عَسَىٰٓ أَن يَهْدِيَنِ رَبِّى لِأَقْرَبَ مِنْ هَـٰذَا رَشَدًا",
    transliteration: "Asa an yahdiyani Rabbi li-aqraba min hadha rashada.",
    translation: "Perhaps my Lord will guide me to what is nearer than this to right conduct.",
    source: quran("Qur'an 18:24", "https://quran.com/18/24"),
  },
  "vast-mercy-and-knowledge": {
    title: "You have encompassed all things in mercy and knowledge.",
    anchorType: "Direct dua",
    arabic: "رَبَّنَا وَسِعْتَ كُلَّ شَىْءٍ رَّحْمَةً وَعِلْمًا",
    translation: "Our Lord, You have encompassed all things in mercy and knowledge.",
    source: quran("Qur'an 40:7", "https://quran.com/40/7"),
  },
  "allahumma-antas-salam": {
    title: "O Allah, You are As-Salam, and from You is peace.",
    anchorType: "Direct dua",
    arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالإِكْرَامِ",
    transliteration: "Allahumma anta As-Salam wa minka As-Salam, tabarakta ya Dhal-Jalali wal-Ikram.",
    translation: "O Allah, You are Peace, and from You is peace. Blessed are You, O Owner of Majesty and Honor.",
    source: hadith("Sunan Ibn Majah 928", "https://sunnah.com/ibnmajah:928"),
  },
  "subbuhun-quddusun": {
    title: "Subbuhun Quddusun, Lord of the angels and the Spirit.",
    anchorType: "Prayer line",
    arabic: "سُبُّوحٌ قُدُّوسٌ رَبُّ الْمَلَائِكَةِ وَالرُّوحِ",
    transliteration: "Subbuhun Quddusun Rabbu Al-Mala'ikati wa Ar-Ruh.",
    translation: "Perfectly glorified, perfectly pure, Lord of the angels and the Spirit.",
    source: hadith("Sahih Muslim 487a", "https://sunnah.com/muslim:487a"),
  },
  "greatest-name-badi": {
    title: "O Originator of the heavens and the earth, O Owner of Majesty and Honor, O Ever-Living, O Sustainer.",
    anchorType: "Direct dua",
    arabic:
      "اللَّهُمَّ إِنِّي أَسْأَلُكَ بِأَنَّ لَكَ الْحَمْدَ لَا إِلَهَ إِلَّا أَنْتَ بَدِيعُ السَّمَاوَاتِ وَالأَرْضِ يَا ذَا الْجَلَالِ وَالإِكْرَامِ يَا حَيُّ يَا قَيُّومُ",
    transliteration:
      "Allahumma inni as'aluka bi-anna laka al-hamd, la ilaha illa anta, Badi'a as-samawati wa al-ard, ya Dhal-Jalali wal-Ikram, ya Hayyu ya Qayyum.",
    translation:
      "O Allah, I ask You by the fact that all praise belongs to You, there is no god but You, Originator of the heavens and the earth, O Owner of Majesty and Honor, O Ever-Living, O Sustainer.",
    source: hadith("Sunan an-Nasa'i 1300", "https://sunnah.com/nasai:1300"),
  },
  "greatest-name-wahid": {
    title: "You are Allah, the One, the Eternal Refuge.",
    anchorType: "Direct dua",
    arabic:
      "اللَّهُمَّ إِنِّي أَسْأَلُكَ بِأَنِّي أَشْهَدُ أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ الأَحَدُ الصَّمَدُ الَّذِي لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
    transliteration:
      "Allahumma inni as'aluka bi-anni ashhadu annaka anta Allah, la ilaha illa anta, Al-Ahad As-Samad, alladhi lam yalid wa lam yulad wa lam yakun lahu kufuwan ahad.",
    translation:
      "O Allah, I ask You by my testimony that You are Allah; there is no god but You, the One, the Eternal Refuge, who neither begets nor is born, and there is none comparable to Him.",
    source: hadith("Jami` at-Tirmidhi 3475", "https://sunnah.com/tirmidhi:3475"),
  },
  "night-prayer-majesty": {
    title: "You are the Light, the King, and the Truth.",
    anchorType: "Prayer line",
    arabic: "اللَّهُمَّ لَكَ الْحَمْدُ أَنْتَ نُورُ السَّمَاوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ ... أَنْتَ مَلِكُ السَّمَاوَاتِ وَالأَرْضِ ... أَنْتَ الْحَقُّ",
    transliteration:
      "Allahumma laka al-hamd, anta nuru as-samawati wa al-ard wa man fihinna ... anta Maliku as-samawati wa al-ard ... anta Al-Haqq.",
    translation:
      "O Allah, all praise is Yours. You are the Light of the heavens and the earth and all within them ... You are the King of the heavens and the earth ... You are the Truth.",
    source: hadith("Sunan Ibn Majah 1355", "https://sunnah.com/ibnmajah:1355"),
  },
  "first-last": {
    title: "You are the First, the Last, the Apparent, and the Hidden.",
    anchorType: "Direct dua",
    arabic:
      "اللَّهُمَّ أَنْتَ الأَوَّلُ فَلَيْسَ قَبْلَكَ شَىْءٌ وَأَنْتَ الآخِرُ فَلَيْسَ بَعْدَكَ شَىْءٌ وَأَنْتَ الظَّاهِرُ فَلَيْسَ فَوْقَكَ شَىْءٌ وَأَنْتَ الْبَاطِنُ فَلَيْسَ دُونَكَ شَىْءٌ",
    transliteration:
      "Allahumma anta Al-Awwalu falaysa qablaka shay', wa anta Al-Akhiru falaysa ba'daka shay', wa anta Az-Zahiru falaysa fawqaka shay', wa anta Al-Batinu falaysa dunaka shay'.",
    translation:
      "O Allah, You are the First, so there is nothing before You. You are the Last, so there is nothing after You. You are the Apparent, so there is nothing above You. You are the Hidden, so there is nothing closer than You.",
    source: hadith("Sahih Muslim 2713a", "https://sunnah.com/muslim:2713a"),
  },
  "muqaddim-muakhkhir": {
    title: "You bring forward and You put back.",
    anchorType: "Prayer line",
    arabic: "أَنْتَ الْمُقَدِّمُ وَأَنْتَ الْمُؤَخِّرُ لَا إِلَهَ إِلَّا أَنْتَ",
    transliteration: "Anta Al-Muqaddimu wa anta Al-Mu'akhkhiru, la ilaha illa anta.",
    translation: "You are the One who brings forward and You are the One who puts back. There is no god but You.",
    source: hadith("Sunan Ibn Majah 1355", "https://sunnah.com/ibnmajah:1355"),
  },
  "distress-halim-azim": {
    title: "There is no god but Allah, Al-'Azim, Al-Halim.",
    anchorType: "Direct dua",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ",
    transliteration: "La ilaha illa Allahu Al-'Azimu Al-Halim.",
    translation: "There is no god but Allah, the Magnificent, the Forbearing.",
    source: hadith("Sahih al-Bukhari 6345", "https://sunnah.com/bukhari:6345"),
  },
  "no-mani": {
    title: "None can withhold what You give, and none can give what You withhold.",
    anchorType: "Prayer line",
    arabic: "اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ وَلَا مُعْطِيَ لِمَا مَنَعْتَ",
    transliteration: "Allahumma la mani'a lima a'tayta wa la mu'tiya lima mana'ta.",
    translation: "O Allah, none can withhold what You give, and none can give what You withhold.",
    source: hadith("Sahih al-Bukhari 6330", "https://sunnah.com/bukhari:6330"),
  },
  "al-hakam": {
    title: "Indeed, Allah is Al-Hakam, and to Him belongs judgment.",
    anchorType: "Meaning anchor",
    arabic: "إِنَّ اللَّهَ هُوَ الْحَكَمُ وَإِلَيْهِ الْحُكْمُ",
    transliteration: "Inna Allaha Huwa Al-Hakam wa ilayhi al-hukm.",
    translation: "Indeed, Allah is the Judge, and to Him belongs judgment.",
    source: hadith("Sunan Abi Dawud 4955", "https://sunnah.com/abudawud:4955"),
  },
  "hamid-majid": {
    title: "Indeed, You are Hamid and Majid.",
    anchorType: "Prayer line",
    arabic: "إِنَّكَ حَمِيدٌ مَجِيدٌ",
    transliteration: "Innaka Hamidun Majid.",
    translation: "Indeed, You are Praiseworthy and Glorious.",
    source: hadith("Sahih al-Bukhari 6357", "https://sunnah.com/bukhari:6357"),
  },
  "abu-bakr-repentance": {
    title: "Indeed, You are Al-Ghafur Ar-Rahim.",
    anchorType: "Direct dua",
    arabic:
      "اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ وَارْحَمْنِي إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ",
    transliteration:
      "Allahumma inni zalamtu nafsi zulman kathiran, wa la yaghfiru adh-dhunuba illa anta, faghfir li maghfiratan min 'indika warhamni, innaka anta Al-Ghafuru Ar-Rahim.",
    translation:
      "O Allah, I have greatly wronged myself, and none forgives sins except You, so forgive me with forgiveness from Yourself and have mercy on me. Indeed, You are the All-Forgiving, the Most Merciful.",
    source: hadith("Riyad as-Salihin 1475", "https://sunnah.com/riyadussalihin:1475"),
  },
  "laylat-afuww": {
    title: "You are Al-'Afuww and love pardon, so pardon me.",
    anchorType: "Direct dua",
    arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
    transliteration: "Allahumma innaka 'Afuwwun tuhibbu al-'afwa fa'fu 'anni.",
    translation: "O Allah, You are Pardoning and love pardon, so pardon me.",
    source: hadith("Jami` at-Tirmidhi 3513", "https://sunnah.com/tirmidhi:3513"),
  },
  "ghaffar-promise": {
    title: "Indeed, I am surely Al-Ghaffar.",
    anchorType: "Qur'an name line",
    arabic: "وَإِنِّى لَغَفَّارٌ لِّمَن تَابَ وَءَامَنَ وَعَمِلَ صَـٰلِحًا ثُمَّ ٱهْتَدَىٰ",
    translation:
      "Indeed, I am surely the Perpetual Forgiver of whoever repents, believes, does righteousness, and then stays guided.",
    source: quran("Qur'an 20:82", "https://quran.com/20/82"),
  },
  "wahid-qahhar": {
    title: "Allah, the One, the Prevailing.",
    anchorType: "Qur'an name line",
    arabic: "ٱللَّهُ ٱلْوَٰحِدُ ٱلْقَهَّارُ",
    transliteration: "Allahu Al-Wahidu Al-Qahhar.",
    translation: "Allah, the One, the Prevailing.",
    source: quran("Qur'an 12:39", "https://quran.com/12/39"),
  },
  "provider-strong": {
    title: "Indeed, Allah is Ar-Razzaq ... Al-Matin.",
    anchorType: "Qur'an name line",
    arabic: "إِنَّ ٱللَّهَ هُوَ ٱلرَّزَّاقُ ذُو ٱلْقُوَّةِ ٱلْمَتِينُ",
    transliteration: "Inna Allaha Huwa Ar-Razzaqu Dhu Al-Quwwati Al-Matin.",
    translation: "Indeed, Allah is the Provider, the Possessor of strength, the Firm.",
    source: quran("Qur'an 51:58", "https://quran.com/51/58"),
  },
  "holds-and-expands": {
    title: "Allah constricts and expands.",
    anchorType: "Meaning anchor",
    arabic: "وَٱللَّهُ يَقْبِضُ وَيَبْصُطُ",
    translation: "And Allah constricts and expands.",
    source: quran("Qur'an 2:245", "https://quran.com/2/245"),
  },
  "hearing-seeing": {
    title: "Indeed, Allah is As-Sami' Al-Basir.",
    anchorType: "Qur'an name line",
    arabic: "إِنَّ ٱللَّهَ هُوَ ٱلسَّمِيعُ ٱلْبَصِيرُ",
    translation: "Indeed, Allah is the Hearing, the Seeing.",
    source: quran("Qur'an 40:20", "https://quran.com/40/20"),
  },
  "latif-lima-yasha": {
    title: "Indeed, my Lord is Al-Latif in what He wills.",
    anchorType: "Qur'an name line",
    arabic: "إِنَّ رَبِّى لَطِيفٌ لِّمَا يَشَآءُ",
    translation: "Indeed, my Lord is Subtle in what He wills.",
    source: quran("Qur'an 12:100", "https://quran.com/12/100"),
  },
  "alim-khabir": {
    title: "The Knowing, the Fully Aware.",
    anchorType: "Qur'an name line",
    arabic: "ٱلْعَلِيمُ ٱلْخَبِيرُ",
    translation: "The Knowing, the Fully Aware.",
    source: quran("Qur'an 66:3", "https://quran.com/66/3"),
  },
  "ghafur-shakur": {
    title: "Indeed, our Lord is Al-Ghafur Ash-Shakur.",
    anchorType: "Qur'an name line",
    arabic: "إِنَّ رَبَّنَا لَغَفُورٌ شَكُورٌ",
    translation: "Indeed, our Lord is All-Forgiving and Appreciative.",
    source: quran("Qur'an 35:34", "https://quran.com/35/34"),
  },
  "aliyy-azim": {
    title: "He is Al-'Aliyy Al-'Azim.",
    anchorType: "Qur'an name line",
    arabic: "وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ",
    translation: "And He is the Most High, the Most Great.",
    source: quran("Qur'an 2:255", "https://quran.com/2/255"),
  },
  "kabir-mutaali": {
    title: "The Grand, the Exalted.",
    anchorType: "Qur'an name line",
    arabic: "ٱلْكَبِيرُ ٱلْمُتَعَالِ",
    translation: "The Grand, the Exalted.",
    source: quran("Qur'an 13:9", "https://quran.com/13/9"),
  },
  muqit: {
    title: "Allah is over all things Muqit.",
    anchorType: "Qur'an name line",
    arabic: "وَكَانَ ٱللَّهُ عَلَىٰ كُلِّ شَىْءٍ مُّقِيتًا",
    translation: "And Allah is ever, over all things, a Keeper.",
    source: quran("Qur'an 4:85", "https://quran.com/4/85"),
  },
  hasib: {
    title: "Sufficient is Allah as Hasib.",
    anchorType: "Qur'an name line",
    arabic: "وَكَفَىٰ بِٱللَّهِ حَسِيبًا",
    translation: "And sufficient is Allah as Accountant.",
    source: quran("Qur'an 4:6", "https://quran.com/4/6"),
  },
  "rabbika-alkarim": {
    title: "Your Lord, Al-Karim.",
    anchorType: "Qur'an name line",
    arabic: "مَا غَرَّكَ بِرَبِّكَ ٱلْكَرِيمِ",
    transliteration: "Ma gharraka bi-Rabbika Al-Karim?",
    translation: "What has deceived you concerning your Lord, the Generous?",
    source: quran("Qur'an 82:6", "https://quran.com/82/6"),
  },
  raqib: {
    title: "Indeed, Allah is ever over you Raqib.",
    anchorType: "Qur'an name line",
    arabic: "إِنَّ ٱللَّهَ كَانَ عَلَيْكُمْ رَقِيبًا",
    translation: "Indeed, Allah is ever over you an Observer.",
    source: quran("Qur'an 4:1", "https://quran.com/4/1"),
  },
  "qareeb-mujeeb": {
    title: "Indeed, my Lord is near and responsive.",
    anchorType: "Qur'an name line",
    arabic: "إِنَّ رَبِّى قَرِيبٌ مُّجِيبٌ",
    translation: "Indeed, my Lord is near and responsive.",
    source: quran("Qur'an 11:61", "https://quran.com/11/61"),
  },
  "wasi-alim": {
    title: "Indeed, Allah is Wasi' and 'Alim.",
    anchorType: "Qur'an name line",
    arabic: "إِنَّ ٱللَّهَ وَٰسِعٌ عَلِيمٌ",
    translation: "Indeed, Allah is all-Encompassing and Knowing.",
    source: quran("Qur'an 2:115", "https://quran.com/2/115"),
  },
  "rahim-wadud": {
    title: "Indeed, my Lord is Rahim and Wadud.",
    anchorType: "Qur'an name line",
    arabic: "إِنَّ رَبِّى رَحِيمٌ وَدُودٌ",
    translation: "Indeed, my Lord is Merciful and Affectionate.",
    source: quran("Qur'an 11:90", "https://quran.com/11/90"),
  },
  "resurrects-graves": {
    title: "Allah will resurrect those in the graves.",
    anchorType: "Meaning anchor",
    arabic: "وَأَنَّ ٱللَّهَ يَبْعَثُ مَن فِى ٱلْقُبُورِ",
    translation: "And that Allah will resurrect those in the graves.",
    source: quran("Qur'an 22:7", "https://quran.com/22/7"),
  },
  "muhsi-shahid": {
    title: "Allah has counted it, and Allah is witness over all things.",
    anchorType: "Meaning anchor",
    arabic: "أَحْصَىٰهُ ٱللَّهُ ... وَٱللَّهُ عَلَىٰ كُلِّ شَىْءٍ شَهِيدٌ",
    translation: "Allah has counted it ... and Allah is witness over all things.",
    source: quran("Qur'an 58:6", "https://quran.com/58/6"),
  },
  "hasbuna-allah": {
    title: "Sufficient for us is Allah, and He is the best disposer of affairs.",
    anchorType: "Meaning anchor",
    arabic: "حَسْبُنَا ٱللَّهُ وَنِعْمَ ٱلْوَكِيلُ",
    transliteration: "Hasbuna Allahu wa ni'ma Al-Wakil.",
    translation: "Sufficient for us is Allah, and He is the best Disposer of affairs.",
    source: quran("Qur'an 3:173", "https://quran.com/3/173"),
  },
  "qawiyy-aziz": {
    title: "Indeed, Allah is Al-Qawiyy and Al-'Aziz.",
    anchorType: "Qur'an name line",
    arabic: "إِنَّ ٱللَّهَ لَقَوِىٌّ عَزِيزٌ",
    translation: "Indeed, Allah is Powerful and Exalted in Might.",
    source: quran("Qur'an 22:40", "https://quran.com/22/40"),
  },
  "wali-hamid": {
    title: "He is Al-Waliyy, Al-Hamid.",
    anchorType: "Qur'an name line",
    arabic: "وَهُوَ ٱلْوَلِىُّ ٱلْحَمِيدُ",
    translation: "And He is the Protector, the Praiseworthy.",
    source: quran("Qur'an 42:28", "https://quran.com/42/28"),
  },
  "ghani-hamid": {
    title: "Allah is Al-Ghani, Al-Hamid.",
    anchorType: "Qur'an name line",
    arabic: "وَٱللَّهُ هُوَ ٱلْغَنِىُّ ٱلْحَمِيدُ",
    translation: "And Allah is the Free of need, the Praiseworthy.",
    source: quran("Qur'an 35:15", "https://quran.com/35/15"),
  },
  "begins-and-repeats": {
    title: "Allah begins creation and then repeats it.",
    anchorType: "Meaning anchor",
    arabic: "ٱللَّهُ يَبْدَؤُا۟ ٱلْخَلْقَ ثُمَّ يُعِيدُهُۥ",
    translation: "Allah begins creation and then repeats it.",
    source: quran("Qur'an 10:34", "https://quran.com/10/34"),
  },
  "gives-life-death": {
    title: "He gives life and causes death.",
    anchorType: "Meaning anchor",
    arabic: "يُحْيِۦ وَيُمِيتُ ۖ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ",
    translation: "He gives life and causes death, and He is over all things competent.",
    source: quran("Qur'an 57:2", "https://quran.com/57/2"),
  },
  "maleekin-muqtadir": {
    title: "Near a Sovereign, perfect in ability.",
    anchorType: "Qur'an name line",
    arabic: "عِندَ مَلِيكٍ مُّقْتَدِرٍ",
    translation: "Near a Sovereign, perfect in ability.",
    source: quran("Qur'an 54:55", "https://quran.com/54/55"),
  },
  "allah-is-the-protector": {
    title: "Allah, He is the Protector.",
    anchorType: "Qur'an name line",
    arabic: "فَٱللَّهُ هُوَ ٱلْوَلِىُّ",
    translation: "But Allah, He is the Protector.",
    source: quran("Qur'an 42:9", "https://quran.com/42/9"),
  },
  "remaining-face": {
    title: "The Face of your Lord remains, Owner of Majesty and Honor.",
    anchorType: "Qur'an name line",
    arabic: "وَيَبْقَىٰ وَجْهُ رَبِّكَ ذُو ٱلْجَلَـٰلِ وَٱلْإِكْرَامِ",
    translation: "And the Face of your Lord will remain, Owner of Majesty and Honor.",
    source: quran("Qur'an 55:27", "https://quran.com/55/27"),
  },
  "justice-standing": {
    title: "Allah stands in perfect justice.",
    anchorType: "Meaning anchor",
    arabic: "قَآئِمًۢا بِٱلْقِسْطِ",
    translation: "Maintaining creation in justice.",
    source: quran("Qur'an 3:18", "https://quran.com/3/18"),
  },
  "gathering-day": {
    title: "Our Lord, surely You will gather the people.",
    anchorType: "Direct dua",
    arabic: "رَبَّنَآ إِنَّكَ جَامِعُ ٱلنَّاسِ لِيَوْمٍ لَّا رَيْبَ فِيهِ",
    transliteration: "Rabbana innaka Jami'u an-nasi li-yawmin la rayba fih.",
    translation: "Our Lord, surely You will gather the people for a Day about which there is no doubt.",
    source: quran("Qur'an 3:9", "https://quran.com/3/9"),
  },
  "benefit-and-harm": {
    title: "I do not hold for myself benefit or harm except what Allah wills.",
    anchorType: "Meaning anchor",
    arabic: "لَآ أَمْلِكُ لِنَفْسِى نَفْعًا وَلَا ضَرًّا إِلَّا مَا شَآءَ ٱللَّهُ",
    translation: "I do not hold for myself benefit or harm except what Allah wills.",
    source: quran("Qur'an 7:188", "https://quran.com/7/188"),
  },
  "beautiful-patience": {
    title: "Be patient with beautiful patience.",
    anchorType: "Meaning anchor",
    arabic: "فَٱصْبِرْ صَبْرًا جَمِيلًا",
    translation: "Be patient with beautiful patience.",
    source: quran("Qur'an 70:5", "https://quran.com/70/5"),
  },
  "raises-by-degrees": {
    title: "Allah raises the believers and the people of knowledge by degrees.",
    anchorType: "Meaning anchor",
    arabic: "يَرْفَعِ ٱللَّهُ ٱلَّذِينَ ءَامَنُوا۟ مِنكُمْ وَٱلَّذِينَ أُوتُوا۟ ٱلْعِلْمَ دَرَجَـٰتٍ",
    translation: "Allah raises those who have believed among you and those given knowledge, by degrees.",
    source: quran("Qur'an 58:11", "https://quran.com/58/11"),
  },
  retribution: {
    title: "Indeed, We take retribution from the criminals.",
    anchorType: "Meaning anchor",
    arabic: "إِنَّا مِنَ ٱلْمُجْرِمِينَ مُنتَقِمُونَ",
    translation: "Indeed, We take retribution from the criminals.",
    source: quran("Qur'an 32:22", "https://quran.com/32/22"),
  },
};
const BEAUTIFUL_NAMES: NameEntry[] = [
  { slug: "allah", nameArabic: "اللَّه", transliteration: "Allah", meaning: "The name of Allah Himself", category: "Unity", anchorKey: "greatest-name-wahid" },
  { slug: "ar-rahman", nameArabic: "ٱلرَّحْمَٰن", transliteration: "Ar-Rahman", meaning: "The Entirely Merciful", category: "Mercy", anchorKey: "call-allah-or-rahman" },
  { slug: "ar-rahim", nameArabic: "ٱلرَّحِيم", transliteration: "Ar-Rahim", meaning: "The Especially Merciful", category: "Mercy", anchorKey: "tawwab-rahim" },
  { slug: "al-malik", nameArabic: "ٱلْمَلِك", transliteration: "Al-Malik", meaning: "The King", category: "Majesty", anchorKey: "night-prayer-majesty" },
  { slug: "al-quddus", nameArabic: "ٱلْقُدُّوس", transliteration: "Al-Quddus", meaning: "The Perfectly Pure", category: "Majesty", anchorKey: "subbuhun-quddusun" },
  { slug: "as-salam", nameArabic: "ٱلسَّلَام", transliteration: "As-Salam", meaning: "The Source of Peace", category: "Mercy", anchorKey: "allahumma-antas-salam" },
  { slug: "al-mumin", nameArabic: "ٱلْمُؤْمِن", transliteration: "Al-Mu'min", meaning: "The Granter of Security", category: "Majesty", anchorKey: "name-majesty" },
  { slug: "al-muhaymin", nameArabic: "ٱلْمُهَيْمِن", transliteration: "Al-Muhaymin", meaning: "The Overseer", category: "Majesty", anchorKey: "name-majesty" },
  { slug: "al-aziz", nameArabic: "ٱلْعَزِيز", transliteration: "Al-'Aziz", meaning: "The Exalted in Might", category: "Majesty", anchorKey: "aziz-hakim" },
  { slug: "al-jabbar", nameArabic: "ٱلْجَبَّار", transliteration: "Al-Jabbar", meaning: "The Compeller", category: "Majesty", anchorKey: "name-majesty" },
  { slug: "al-mutakabbir", nameArabic: "ٱلْمُتَكَبِّر", transliteration: "Al-Mutakabbir", meaning: "The Supreme", category: "Majesty", anchorKey: "name-majesty" },
  { slug: "al-khaliq", nameArabic: "ٱلْخَـٰلِق", transliteration: "Al-Khaliq", meaning: "The Creator", category: "Creation", anchorKey: "name-creation" },
  { slug: "al-bari", nameArabic: "ٱلْبَارِئ", transliteration: "Al-Bari'", meaning: "The Originator", category: "Creation", anchorKey: "name-creation" },
  { slug: "al-musawwir", nameArabic: "ٱلْمُصَوِّر", transliteration: "Al-Musawwir", meaning: "The Fashioner", category: "Creation", anchorKey: "name-creation" },
  { slug: "al-ghaffar", nameArabic: "ٱلْغَفَّار", transliteration: "Al-Ghaffar", meaning: "The Constant Forgiver", category: "Forgiveness", anchorKey: "ghaffar-promise" },
  { slug: "al-qahhar", nameArabic: "ٱلْقَهَّار", transliteration: "Al-Qahhar", meaning: "The Prevailing", category: "Power", anchorKey: "wahid-qahhar" },
  { slug: "al-wahhab", nameArabic: "ٱلْوَهَّاب", transliteration: "Al-Wahhab", meaning: "The Bestower", category: "Provision", anchorKey: "wahhab" },
  { slug: "ar-razzaq", nameArabic: "ٱلرَّزَّاق", transliteration: "Ar-Razzaq", meaning: "The Provider", category: "Provision", anchorKey: "provider-strong" },
  { slug: "al-fattah", nameArabic: "ٱلْفَتَّاح", transliteration: "Al-Fattah", meaning: "The Opener", category: "Provision", anchorKey: "iftah-baynana" },
  { slug: "al-alim", nameArabic: "ٱلْعَلِيم", transliteration: "Al-'Alim", meaning: "The All-Knowing", category: "Knowledge", anchorKey: "sami-alim" },
  { slug: "al-qabid", nameArabic: "ٱلْقَابِض", transliteration: "Al-Qabid", meaning: "The Constrictor", category: "Provision", anchorKey: "holds-and-expands" },
  { slug: "al-basit", nameArabic: "ٱلْبَاسِط", transliteration: "Al-Basit", meaning: "The Expander", category: "Provision", anchorKey: "holds-and-expands" },
  { slug: "al-khafid", nameArabic: "ٱلْخَافِض", transliteration: "Al-Khafid", meaning: "The One who lowers", category: "Power", anchorKey: "owner-of-sovereignty", summaryNote: "The Qur'an's clearest direct dua in this register speaks of Allah humbling whom He wills and changing human stations." },
  { slug: "ar-rafi", nameArabic: "ٱلرَّافِع", transliteration: "Ar-Rafi'", meaning: "The One who raises", category: "Power", anchorKey: "raises-by-degrees" },
  { slug: "al-muizz", nameArabic: "ٱلْمُعِزّ", transliteration: "Al-Mu'izz", meaning: "The Giver of honor", category: "Power", anchorKey: "owner-of-sovereignty" },
  { slug: "al-mudhill", nameArabic: "ٱلْمُذِلّ", transliteration: "Al-Mudhill", meaning: "The One who brings low", category: "Power", anchorKey: "owner-of-sovereignty" },
  { slug: "as-sami", nameArabic: "ٱلسَّمِيع", transliteration: "As-Sami'", meaning: "The All-Hearing", category: "Knowledge", anchorKey: "sami-alim" },
  { slug: "al-basir", nameArabic: "ٱلْبَصِير", transliteration: "Al-Basir", meaning: "The All-Seeing", category: "Knowledge", anchorKey: "hearing-seeing" },
  { slug: "al-hakam", nameArabic: "ٱلْحَكَم", transliteration: "Al-Hakam", meaning: "The Judge", category: "Justice", anchorKey: "al-hakam" },
  { slug: "al-adl", nameArabic: "ٱلْعَدْل", transliteration: "Al-'Adl", meaning: "The Utterly Just", category: "Justice", anchorKey: "justice-standing" },
  { slug: "al-latif", nameArabic: "ٱللَّطِيف", transliteration: "Al-Latif", meaning: "The Subtle, Gentle One", category: "Knowledge", anchorKey: "latif-lima-yasha" },
  { slug: "al-khabir", nameArabic: "ٱلْخَبِير", transliteration: "Al-Khabir", meaning: "The Fully Aware", category: "Knowledge", anchorKey: "alim-khabir" },
  { slug: "al-halim", nameArabic: "ٱلْحَلِيم", transliteration: "Al-Halim", meaning: "The Forbearing", category: "Forgiveness", anchorKey: "distress-halim-azim" },
  { slug: "al-azim", nameArabic: "ٱلْعَظِيم", transliteration: "Al-'Azim", meaning: "The Magnificent", category: "Majesty", anchorKey: "distress-halim-azim" },
  { slug: "al-ghafur", nameArabic: "ٱلْغَفُور", transliteration: "Al-Ghafur", meaning: "The Great Forgiver", category: "Forgiveness", anchorKey: "abu-bakr-repentance" },
  { slug: "ash-shakur", nameArabic: "ٱلشَّكُور", transliteration: "Ash-Shakur", meaning: "The Appreciative", category: "Mercy", anchorKey: "ghafur-shakur" },
  { slug: "al-aliyy", nameArabic: "ٱلْعَلِيّ", transliteration: "Al-'Aliyy", meaning: "The Most High", category: "Majesty", anchorKey: "aliyy-azim" },
  { slug: "al-kabir", nameArabic: "ٱلْكَبِير", transliteration: "Al-Kabir", meaning: "The Grand", category: "Majesty", anchorKey: "kabir-mutaali" },
  { slug: "al-hafiz", nameArabic: "ٱلْحَفِيظ", transliteration: "Al-Hafiz", meaning: "The Preserver", category: "Protection", anchorKey: "best-guardian" },
  { slug: "al-muqit", nameArabic: "ٱلْمُقِيت", transliteration: "Al-Muqit", meaning: "The Sustainer", category: "Protection", anchorKey: "muqit" },
  { slug: "al-hasib", nameArabic: "ٱلْحَسِيب", transliteration: "Al-Hasib", meaning: "The Reckoner", category: "Justice", anchorKey: "hasib" },
  { slug: "al-jalil", nameArabic: "ٱلْجَلِيل", transliteration: "Al-Jalil", meaning: "The Majestic", category: "Majesty", anchorKey: "remaining-face", summaryNote: "This card uses the Qur'an's majesty language around Dhu al-Jalal because it is the clearest strong textual anchor in this lane." },
  { slug: "al-karim", nameArabic: "ٱلْكَرِيم", transliteration: "Al-Karim", meaning: "The Generous", category: "Mercy", anchorKey: "rabbika-alkarim" },
  { slug: "ar-raqib", nameArabic: "ٱلرَّقِيب", transliteration: "Ar-Raqib", meaning: "The Watchful", category: "Knowledge", anchorKey: "raqib" },
  { slug: "al-mujib", nameArabic: "ٱلْمُجِيب", transliteration: "Al-Mujib", meaning: "The Responsive", category: "Guidance", anchorKey: "qareeb-mujeeb" },
  { slug: "al-wasi", nameArabic: "ٱلْوَاسِع", transliteration: "Al-Wasi'", meaning: "The All-Encompassing", category: "Knowledge", anchorKey: "wasi-alim" },
  { slug: "al-hakim", nameArabic: "ٱلْحَكِيم", transliteration: "Al-Hakim", meaning: "The Wise", category: "Knowledge", anchorKey: "aziz-hakim" },
  { slug: "al-wadud", nameArabic: "ٱلْوَدُود", transliteration: "Al-Wadud", meaning: "The Loving", category: "Mercy", anchorKey: "rahim-wadud" },
  { slug: "al-majid", nameArabic: "ٱلْمَجِيد", transliteration: "Al-Majid", meaning: "The Glorious", category: "Majesty", anchorKey: "hamid-majid" },
  { slug: "al-baith", nameArabic: "ٱلْبَاعِث", transliteration: "Al-Ba'ith", meaning: "The Resurrector", category: "Life", anchorKey: "resurrects-graves" },
  { slug: "ash-shahid", nameArabic: "ٱلشَّهِيد", transliteration: "Ash-Shahid", meaning: "The Witness", category: "Justice", anchorKey: "muhsi-shahid" },
  { slug: "al-haqq", nameArabic: "ٱلْحَقّ", transliteration: "Al-Haqq", meaning: "The Truth", category: "Life", anchorKey: "night-prayer-majesty" },
  { slug: "al-wakil", nameArabic: "ٱلْوَكِيل", transliteration: "Al-Wakil", meaning: "The Trustee", category: "Protection", anchorKey: "hasbuna-allah" },
  { slug: "al-qawiyy", nameArabic: "ٱلْقَوِيّ", transliteration: "Al-Qawiyy", meaning: "The Strong", category: "Power", anchorKey: "qawiyy-aziz" },
  { slug: "al-matin", nameArabic: "ٱلْمَتِين", transliteration: "Al-Matin", meaning: "The Firm", category: "Power", anchorKey: "provider-strong" },
  { slug: "al-waliyy", nameArabic: "ٱلْوَلِيّ", transliteration: "Al-Waliyy", meaning: "The Protective Friend", category: "Protection", anchorKey: "anta-waliyyi" },
  { slug: "al-hamid", nameArabic: "ٱلْحَمِيد", transliteration: "Al-Hamid", meaning: "The Praiseworthy", category: "Majesty", anchorKey: "wali-hamid" },
  { slug: "al-muhsi", nameArabic: "ٱلْمُحْصِي", transliteration: "Al-Muhsi", meaning: "The Counter, the Enumerator", category: "Justice", anchorKey: "muhsi-shahid" },
  { slug: "al-mubdi", nameArabic: "ٱلْمُبْدِئ", transliteration: "Al-Mubdi'", meaning: "The Originator", category: "Creation", anchorKey: "begins-and-repeats" },
  { slug: "al-muid", nameArabic: "ٱلْمُعِيد", transliteration: "Al-Mu'id", meaning: "The Restorer", category: "Creation", anchorKey: "begins-and-repeats" },
  { slug: "al-muhyi", nameArabic: "ٱلْمُحْيِي", transliteration: "Al-Muhyi", meaning: "The Giver of life", category: "Life", anchorKey: "gives-life-death" },
  { slug: "al-mumit", nameArabic: "ٱلْمُمِيت", transliteration: "Al-Mumit", meaning: "The Causer of death", category: "Life", anchorKey: "gives-life-death" },
  { slug: "al-hayy", nameArabic: "ٱلْحَيّ", transliteration: "Al-Hayy", meaning: "The Ever-Living", category: "Life", anchorKey: "greatest-name-badi" },
  { slug: "al-qayyum", nameArabic: "ٱلْقَيُّوم", transliteration: "Al-Qayyum", meaning: "The Sustainer of all", category: "Life", anchorKey: "greatest-name-badi" },
  { slug: "al-wajid", nameArabic: "ٱلْوَاجِد", transliteration: "Al-Wajid", meaning: "The Finder, the One lacking nothing", category: "Unity", anchorKey: "ghani-hamid", summaryNote: "The module uses a richness and need anchor here because that is the strongest stable textual lane for this commonly taught name." },
  { slug: "al-wahid", nameArabic: "ٱلْوَاحِد", transliteration: "Al-Wahid", meaning: "The One", category: "Unity", anchorKey: "wahid-qahhar" },
  { slug: "al-ahad", nameArabic: "ٱلْأَحَد", transliteration: "Al-Ahad", meaning: "The Unique One", category: "Unity", anchorKey: "greatest-name-wahid" },
  { slug: "as-samad", nameArabic: "ٱلصَّمَد", transliteration: "As-Samad", meaning: "The Eternal Refuge", category: "Unity", anchorKey: "greatest-name-wahid" },
  { slug: "al-qadir", nameArabic: "ٱلْقَادِر", transliteration: "Al-Qadir", meaning: "The Able", category: "Power", anchorKey: "gives-life-death" },
  { slug: "al-muqtadir", nameArabic: "ٱلْمُقْتَدِر", transliteration: "Al-Muqtadir", meaning: "The Perfect in Ability", category: "Power", anchorKey: "maleekin-muqtadir" },
  { slug: "al-muqaddim", nameArabic: "ٱلْمُقَدِّم", transliteration: "Al-Muqaddim", meaning: "The One who brings forward", category: "Power", anchorKey: "muqaddim-muakhkhir" },
  { slug: "al-muakhkhir", nameArabic: "ٱلْمُؤَخِّر", transliteration: "Al-Mu'akhkhir", meaning: "The One who puts back", category: "Power", anchorKey: "muqaddim-muakhkhir" },
  { slug: "al-awwal", nameArabic: "ٱلْأَوَّل", transliteration: "Al-Awwal", meaning: "The First", category: "Life", anchorKey: "first-last" },
  { slug: "al-akhir", nameArabic: "ٱلْآخِر", transliteration: "Al-Akhir", meaning: "The Last", category: "Life", anchorKey: "first-last" },
  { slug: "az-zahir", nameArabic: "ٱلظَّاهِر", transliteration: "Az-Zahir", meaning: "The Manifest", category: "Life", anchorKey: "first-last" },
  { slug: "al-batin", nameArabic: "ٱلْبَاطِن", transliteration: "Al-Batin", meaning: "The Hidden", category: "Life", anchorKey: "first-last" },
  { slug: "al-wali", nameArabic: "ٱلْوَالِي", transliteration: "Al-Wali", meaning: "The Governor, the Disposer", category: "Protection", anchorKey: "allah-is-the-protector" },
  { slug: "al-mutaali", nameArabic: "ٱلْمُتَعَالِي", transliteration: "Al-Muta'ali", meaning: "The Supremely Exalted", category: "Majesty", anchorKey: "kabir-mutaali" },
  { slug: "al-barr", nameArabic: "ٱلْبَرّ", transliteration: "Al-Barr", meaning: "The Good, the Source of goodness", category: "Mercy", anchorKey: "barr-rahim" },
  { slug: "at-tawwab", nameArabic: "ٱلتَّوَّاب", transliteration: "At-Tawwab", meaning: "The One who accepts repentance repeatedly", category: "Forgiveness", anchorKey: "tawwab-rahim" },
  { slug: "al-muntaqim", nameArabic: "ٱلْمُنْتَقِم", transliteration: "Al-Muntaqim", meaning: "The Avenger", category: "Justice", anchorKey: "retribution" },
  { slug: "al-afuww", nameArabic: "ٱلْعَفُوّ", transliteration: "Al-'Afuww", meaning: "The Pardoning", category: "Forgiveness", anchorKey: "laylat-afuww" },
  { slug: "ar-rauf", nameArabic: "ٱلرَّءُوف", transliteration: "Ar-Ra'uf", meaning: "The Kind", category: "Mercy", anchorKey: "rauf-rahim" },
  { slug: "malik-al-mulk", nameArabic: "مَالِكُ ٱلْمُلْك", transliteration: "Malik al-Mulk", meaning: "Owner of all sovereignty", category: "Majesty", anchorKey: "owner-of-sovereignty" },
  { slug: "dhul-jalali-wal-ikram", nameArabic: "ذُو ٱلْجَلَالِ وَٱلْإِكْرَام", transliteration: "Dhul-Jalali wal-Ikram", meaning: "Owner of Majesty and Honor", category: "Majesty", anchorKey: "greatest-name-badi" },
  { slug: "al-muqsit", nameArabic: "ٱلْمُقْسِط", transliteration: "Al-Muqsit", meaning: "The Equitable", category: "Justice", anchorKey: "justice-standing" },
  { slug: "al-jami", nameArabic: "ٱلْجَامِع", transliteration: "Al-Jami'", meaning: "The Gatherer", category: "Justice", anchorKey: "gathering-day" },
  { slug: "al-ghani", nameArabic: "ٱلْغَنِيّ", transliteration: "Al-Ghani", meaning: "The Free of need", category: "Provision", anchorKey: "ghani-hamid" },
  { slug: "al-mughni", nameArabic: "ٱلْمُغْنِي", transliteration: "Al-Mughni", meaning: "The Enricher", category: "Provision", anchorKey: "ghani-hamid", summaryNote: "This card stays near Allah's richness itself because that is the firmest textual lane for asking to be made sufficient." },
  { slug: "al-mani", nameArabic: "ٱلْمَانِع", transliteration: "Al-Mani'", meaning: "The Withholder", category: "Provision", anchorKey: "no-mani" },
  { slug: "ad-darr", nameArabic: "ٱلضَّارّ", transliteration: "Ad-Darr", meaning: "The One who allows harm", category: "Power", anchorKey: "benefit-and-harm" },
  { slug: "an-nafi", nameArabic: "ٱلنَّافِع", transliteration: "An-Nafi'", meaning: "The Giver of benefit", category: "Provision", anchorKey: "benefit-and-harm" },
  { slug: "an-nur", nameArabic: "ٱلنُّور", transliteration: "An-Nur", meaning: "The Light", category: "Guidance", anchorKey: "night-prayer-majesty" },
  { slug: "al-hadi", nameArabic: "ٱلْهَادِي", transliteration: "Al-Hadi", meaning: "The Guide", category: "Guidance", anchorKey: "guide-me-nearer" },
  { slug: "al-badi", nameArabic: "ٱلْبَدِيع", transliteration: "Al-Badi'", meaning: "The Incomparable Originator", category: "Creation", anchorKey: "greatest-name-badi" },
  { slug: "al-baqi", nameArabic: "ٱلْبَاقِي", transliteration: "Al-Baqi", meaning: "The Everlasting", category: "Life", anchorKey: "remaining-face" },
  { slug: "al-warith", nameArabic: "ٱلْوَارِث", transliteration: "Al-Warith", meaning: "The Inheritor", category: "Life", anchorKey: "best-inheritor" },
  { slug: "ar-rashid", nameArabic: "ٱلرَّشِيد", transliteration: "Ar-Rashid", meaning: "The Guide to right conduct", category: "Guidance", anchorKey: "prepare-guidance" },
  { slug: "as-sabur", nameArabic: "ٱلصَّبُور", transliteration: "As-Sabur", meaning: "The Most Patient", category: "Life", anchorKey: "beautiful-patience" },
];

function buildNameEvidence(anchor: NameAnchor): JourneyEvidence[] {
  const evidence: JourneyEvidence[] = [
    {
      eyebrow: anchor.anchorType,
      title: anchor.title,
      detail:
        anchor.anchorType === "Direct dua"
          ? "This card is anchored in a sourced Qur'anic or Prophetic supplication."
          : "This card uses the strongest sourced line we prioritized for this commonly taught name without inventing a short dua.",
      source: anchor.source,
    },
  ];

  if (anchor.anchorType !== "Direct dua") {
    evidence.push({
      eyebrow: "Research note",
      title: "Why this card is framed this way",
      detail:
        "The app is staying honest here: some names are strongest in a prayer line, Qur'anic name line, or meaning anchor rather than one famous short standalone dua.",
    });
  }

  return evidence;
}

function buildBeautifulNameStep(entry: NameEntry, index: number): BuiltInDeckStep {
  const category = CATEGORY_COPY[entry.category];
  const anchor = NAME_ANCHORS[entry.anchorKey];

  return createStep({
    id: `beautiful-name-${entry.slug}`,
    moduleId: "beautiful-names",
    kind: "authentic",
    eyebrow: category.eyebrow,
    title: entry.transliteration,
    summary: `${entry.meaning}. ${entry.summaryNote ?? category.summary}`,
    tags: [entry.category, anchor.anchorType, "Beautiful Names"],
    spotlight: {
      arabic: entry.nameArabic,
      transliteration: entry.transliteration,
      meaning: entry.meaning,
      category: entry.category,
      anchorType: anchor.anchorType,
    },
    practice: category.practice,
    actionLine: category.action,
    reflectionPrompt: entry.summaryNote ?? category.reflection,
    evidence: buildNameEvidence(anchor),
    deckItemKey: `builtin:beautiful-names-${entry.slug}`,
    deckOrder: (index + 1) * 10,
    dua: {
      label: anchor.anchorType === "Direct dua" ? "Authentic dua" : "Authentic anchor",
      intro:
        anchor.anchorType === "Direct dua"
          ? "Recite the source line first, then stay with its meaning before adding your own words."
          : "Read the source line slowly, then ask Allah through the meaning of the name with your own need.",
      arabic: anchor.arabic,
      transliteration: anchor.transliteration ?? null,
      translation: anchor.translation,
      trackerLabel: "Presence counter",
      trackerNote:
        "Use the counter only as a focus aid. This module is not assigning a fixed repetition count to any card.",
    },
  }) as BuiltInDeckStep;
}

const beautifulNamesPreludeSteps: JourneyStep[] = [
  createStep({
    id: "beautiful-names-why",
    moduleId: "beautiful-names",
    kind: "authentic",
    eyebrow: "Beautiful Names",
    title: "Ask Allah by His names, not by borrowed spiritual mood.",
    summary:
      "This module begins with the Qur'anic permission itself: call Allah by His beautiful names, then let the name reshape how you ask.",
    practice: [
      "Choose the name that matches the need in front of you.",
      "Begin with praise, then ask with the name that opens the heart most honestly.",
      "Stay inside sourced lines instead of inventing rituals or fixed counts.",
    ],
    actionLine: "Start by learning which name fits the need you are carrying now.",
    reflectionPrompt: "Which need in your life would become clearer if you first named the quality of Allah you are turning toward?",
    tags: ["Method"],
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Call upon Allah or call upon Ar-Rahman.",
        detail: "The Qur'an explicitly opens the door to invoking Allah by His beautiful names.",
        source: quran("Qur'an 17:110", "https://quran.com/17/110"),
      },
      {
        eyebrow: "Prophetic anchor",
        title: "Allah has ninety-nine names; whoever truly enumerates them enters Paradise.",
        detail: "The promise is authentic. This module uses the commonly taught curriculum while attaching researched anchors card by card.",
        source: hadith("Sahih al-Bukhari 7392", "https://sunnah.com/bukhari:7392"),
      },
    ],
  }),
  createStep({
    id: "beautiful-names-how",
    moduleId: "beautiful-names",
    kind: "guided",
    eyebrow: "Method",
    title: "Let the name shape the dua, not just decorate it.",
    summary:
      "Most cards use direct Qur'anic or Prophetic duas. A smaller number use authentic prayer lines, Qur'anic name lines, or meaning anchors when that is the strongest honest fit.",
    practice: [
      "If the card gives a direct dua, keep it central.",
      "If the card gives a name or meaning anchor, read it first and then ask in your own words.",
      "Do not turn the repetition counter into a superstition. It is only there to keep your focus gentle.",
    ],
    actionLine: "Use the explorer below to find the name that matches your current need.",
    reflectionPrompt: "Are you asking Allah with presence, or only collecting familiar phrases?",
    tags: ["Method"],
    evidence: [
      {
        eyebrow: "Research standard",
        title: "Hifzer is not inventing a private liturgy here.",
        detail:
          "The module prefers direct primary-text anchors and labels more indirect cases instead of pretending every name has one equally famous short narrated dua.",
      },
    ],
  }),
  createStep({
    id: "beautiful-names-explorer",
    moduleId: "beautiful-names",
    kind: "guided",
    eyebrow: "Explorer",
    title: "Search by need: mercy, provision, guidance, protection, awe, or return.",
    summary:
      "This module is large on purpose. Search for a name, filter by category, or move slowly step by step if you want the longer route.",
    practice: [
      "If your heart is scattered, start with Mercy, Forgiveness, or Guidance.",
      "If you are overwhelmed by pressure, start with Power or Protection.",
      "If you are numb, begin with Unity or Life so the scale of things returns.",
    ],
    actionLine: "Open one name card and stay with it until the meaning actually reaches your dua.",
    reflectionPrompt: "Which category are you most likely to avoid because it would force a more honest conversation with Allah?",
    tags: ["Method"],
    evidence: [
      {
        eyebrow: "Use pattern",
        title: "One current name is enough.",
        detail:
          "The product is designed to support one present conversation with Allah rather than a rushed sprint through all ninety-nine cards.",
      },
    ],
  }),
];

const beautifulNamesDeckSteps = BEAUTIFUL_NAMES.map((entry, index) => buildBeautifulNameStep(entry, index));

const beautifulNamesCompletionSteps: JourneyStep[] = [
  createStep({
    id: "beautiful-names-completion",
    moduleId: "beautiful-names",
    kind: "guided",
    eyebrow: "Completion",
    title: "Carry one name into the rest of your dua life instead of only visiting this module.",
    summary:
      "The real outcome is not completion percentage. It is a heart that knows how to ask Allah with a truer sense of who He is.",
    practice: [
      "Choose one name to keep close for the next seven days.",
      "Use it in salah, in sujud, and in one private dua outside the app.",
      "Come back later for a second name only after the first has begun to change your tone with Allah.",
    ],
    actionLine: "Leave with one living name, not only a finished module.",
    reflectionPrompt: "Which name do you most need to keep with you after this session ends?",
    tags: ["Method"],
    evidence: [
      {
        eyebrow: "Module outcome",
        title: "Names should become lived invocation.",
        detail:
          "The goal is not only recall. The goal is that the names begin to govern how you praise, hope, repent, surrender, and ask.",
      },
    ],
  }),
];

export const beautifulNamesModuleDefinition: ModuleDefinition = {
  id: "beautiful-names",
  label: "Allah's Beautiful Names",
  shortLabel: "Names",
  eyebrow: "Core module",
  title: "Allah's Beautiful Names in dua",
  subtitle:
    "A researched, name-by-name journey through the commonly taught 99 names with sourced anchors from the Qur'an and authentic hadith.",
  description:
    "Search the names, open one card at a time, and let each sourced line teach you how to ask Allah with more truth, awe, and tenderness.",
  authenticityBoundary:
    "This module uses the commonly taught 99-name curriculum. Most cards use direct Qur'anic or Prophetic duas. A smaller number use authentic prayer lines, Qur'anic name lines, or meaning anchors where that is the strongest honest textual fit.",
  tone: "success",
  supportsCustomDeck: false,
  preludeSteps: beautifulNamesPreludeSteps,
  deckSteps: beautifulNamesDeckSteps,
  completionSteps: beautifulNamesCompletionSteps,
};
