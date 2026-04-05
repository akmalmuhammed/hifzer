import { beautifulNamesModuleDefinition } from "@/hifzer/ramadan/beautiful-names";
import { ruqyahModuleDefinition } from "@/hifzer/ramadan/ruqyah";
import { wealthModuleDefinition } from "@/hifzer/ramadan/wealth";

export type SourceLink = {
  label: string;
  href: string;
};

export type JourneyKind = "authentic" | "guided" | "personal";

export type DuaModuleId = "laylat-al-qadr" | "repentance" | "wealth" | "ruqyah" | "beautiful-names";

export const DEFAULT_DUA_MODULE_ID: DuaModuleId = "laylat-al-qadr";

export type StepSpotlight = {
  arabic: string;
  transliteration: string;
  meaning: string;
  category: string;
  anchorType: "Direct dua" | "Prayer line" | "Qur'an name line" | "Meaning anchor";
};

export type JourneyDua = {
  label?: string;
  intro?: string;
  arabic?: string | null;
  transliteration?: string | null;
  translation: string;
  trackerLabel: string;
  trackerNote: string;
};

export type JourneyEvidence = {
  eyebrow: string;
  title: string;
  detail: string;
  source?: SourceLink;
};

export type CustomDuaSnapshot = {
  id: string;
  moduleId: DuaModuleId;
  title: string;
  arabic: string | null;
  transliteration: string | null;
  translation: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DuaDeckOrderSnapshot = {
  moduleId: DuaModuleId;
  itemKey: string;
  sortOrder: number;
};

export type JourneyStep = {
  id: string;
  moduleId: DuaModuleId;
  kind: JourneyKind;
  eyebrow: string;
  title: string;
  summary: string;
  tags?: string[];
  spotlight?: StepSpotlight;
  practice: string[];
  actionLine?: string;
  reflectionPrompt?: string;
  evidence: JourneyEvidence[];
  sourceLinks: SourceLink[];
  dua?: JourneyDua;
  deckItemKey?: string;
  deckOrder?: number;
};

export type DuaJourneyModule = {
  id: DuaModuleId;
  label: string;
  shortLabel: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  authenticityBoundary: string;
  tone: "accent" | "warn" | "success";
  supportsCustomDeck: boolean;
  steps: JourneyStep[];
};

type BuiltInDeckStep = JourneyStep & {
  deckItemKey: string;
  deckOrder: number;
};

type DuaJourneyModuleDefinition = Omit<DuaJourneyModule, "steps"> & {
  preludeSteps: JourneyStep[];
  deckSteps: BuiltInDeckStep[];
  completionSteps: JourneyStep[];
};

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

function quran(label: string, href: string): SourceLink {
  return { label, href };
}

function hadith(label: string, href: string): SourceLink {
  return { label, href };
}

const laylatPreludeSteps: JourneyStep[] = [
  createStep({
    id: "laylat-seek-night",
    moduleId: "laylat-al-qadr",
    kind: "authentic",
    eyebrow: "Laylat al-Qadr",
    title: "Seek the night across the last ten, and treat every odd night seriously.",
    summary:
      "The Sunnah trains you to search across the last ten nights, especially the odd nights. The experience starts with steadiness, not with gambling on one dramatic evening.",
    practice: [
      "Protect at least one serious block of worship tonight instead of waiting for a perfect future night.",
      "Mark the remaining odd nights now so your worship stays broad and disciplined.",
      "Decide who in your household you will invite or wake gently for worship.",
    ],
    actionLine: "Enter tonight as a seeker, then return again on the remaining last-ten nights.",
    reflectionPrompt: "If you only prepared for one night, widen your intention before you go forward.",
    evidence: [
      {
        eyebrow: "Authentic anchor",
        title: "Seek Laylat al-Qadr in the last ten nights, especially the odd nights.",
        detail:
          "This is the core search pattern. It protects you from narrowing the Sunnah down to one guessed night.",
        source: hadith("Sahih al-Bukhari 2017", "https://sunnah.com/bukhari:2017"),
      },
      {
        eyebrow: "Reported example",
        title: "The Prophet intensified worship and woke his family when the last ten entered.",
        detail:
          "The night should feel more protected and more serious than a normal Ramadan evening.",
        source: hadith("Sahih al-Bukhari 2024", "https://sunnah.com/bukhari:2024"),
      },
    ],
  }),
  createStep({
    id: "laylat-qiyam-core",
    moduleId: "laylat-al-qadr",
    kind: "authentic",
    eyebrow: "Qiyam",
    title: "Keep qiyam at the center, and let dua live inside the prayer.",
    summary:
      "The forgiveness promise for Laylat al-Qadr is attached to standing the night in prayer with faith and hope for reward. The heart of the night is not browsing content. It is standing before Allah.",
    practice: [
      "Make sure tonight contains actual night prayer after Isha, even if your portion is modest.",
      "Use your sujud for the requests that matter most instead of rushing through it.",
      "Read Qur'an calmly enough that the prayer changes your state, not just your checklist.",
    ],
    actionLine: "Build tonight around prayer first, then let the rest of the module support that worship.",
    reflectionPrompt: "Ask yourself whether your plan for the night is prayer-led or content-led.",
    evidence: [
      {
        eyebrow: "Authentic anchor",
        title: "Whoever stands Laylat al-Qadr in prayer with faith and hope for reward is forgiven.",
        detail:
          "The hadith ties forgiveness to qiyam itself, not only to reading supplications outside prayer.",
        source: hadith("Sahih al-Bukhari 35", "https://sunnah.com/bukhari:35"),
      },
      {
        eyebrow: "Reported example",
        title: "The servant is closest to Allah in sujud, so increase dua there.",
        detail:
          "Sujud is not a filler between verses. It is one of the richest moments for repentance and asking.",
        source: hadith("Sahih Muslim 482", "https://sunnah.com/muslim:482"),
      },
    ],
  }),
  createStep({
    id: "laylat-adab-of-dua",
    moduleId: "laylat-al-qadr",
    kind: "authentic",
    eyebrow: "How to ask",
    title: "Begin your asking with praise, salawat, humility, and a lowered voice.",
    summary:
      "A disciplined night still needs disciplined dua. The Prophetic correction is to begin with praise of Allah and salawat upon the Prophet, then ask with humility instead of blurting requests carelessly.",
    practice: [
      "Before your next personal request, open with hamd and salawat.",
      "Lower your voice and lengthen one real request instead of hurrying ten shallow ones.",
      "Let one moment of private, humble dua become the emotional center of the night.",
    ],
    actionLine: "Do not rush into requests. Enter dua with reverence, then ask clearly.",
    reflectionPrompt: "If your dua feels scattered, slow it down until your heart catches up with your tongue.",
    evidence: [
      {
        eyebrow: "Authentic anchor",
        title: "The Prophet corrected a man who made dua without first praising Allah and sending salawat.",
        detail:
          "This is one of the clearest Prophetic lessons on the adab of asking.",
        source: hadith("Jami` at-Tirmidhi 3477", "https://sunnah.com/tirmidhi:3477"),
      },
      {
        eyebrow: "Qur'an anchor",
        title: "Call upon your Lord humbly and privately; Allah is near and responds.",
        detail:
          "The Qur'an frames dua with humility, privacy, and confidence in Allah's nearness.",
        source: quran("Qur'an 2:186 and 7:55", "https://quran.com/2/186"),
      },
    ],
  }),
  createStep({
    id: "laylat-enter-with-tawbah",
    moduleId: "laylat-al-qadr",
    kind: "guided",
    eyebrow: "Tawbah first",
    title: "Enter the night with repentance before you ask for more.",
    summary:
      "Hifzer is structuring the flow here, but the logic is grounded: a night centered on pardon should meet a heart already turning back to Allah and refusing despair.",
    practice: [
      "Name one sin, one pattern, or one broken private habit that you are bringing to Allah tonight.",
      "Ask forgiveness for it specifically, not only in vague language.",
      "If it involved someone else, decide the repair you need to make after the night ends.",
    ],
    actionLine: "Pause before the dua deck and repent from something concrete.",
    reflectionPrompt: "Do not only ask for new blessings. Ask for a washed record and a changed direction.",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Do not despair of the mercy of Allah. Turn back to Him sincerely.",
        detail:
          "Hope is not optional in tawbah. Despair itself contradicts the invitation of these verses.",
        source: quran("Qur'an 39:53-54 and 66:8", "https://quran.com/39/53-54"),
      },
      {
        eyebrow: "Reported example",
        title: "Adam and Hawwa confessed that they had wronged themselves.",
        detail:
          "Their repentance is direct, unornamented, and completely dependent on Allah's forgiveness and mercy.",
        source: quran("Qur'an 7:23", "https://quran.com/7/23"),
      },
    ],
  }),
];

const laylatDeckSteps: BuiltInDeckStep[] = [
  createStep({
    id: "laylat-dua-forgiveness",
    moduleId: "laylat-al-qadr",
    kind: "authentic",
    eyebrow: "Dua deck",
    title: "Laylat al-Qadr forgiveness dua",
    summary:
      "This is the clearest authenticated supplication taught specifically for Laylat al-Qadr when Aishah asked what she should say if she found the night.",
    practice: [
      "Repeat it between rak'ahs, after recitation, and in the quieter moments where your heart softens.",
      "Do not race through it. Keep the meaning of pardon in front of you.",
    ],
    actionLine: "Let this remain the central line of the night, not a one-time recitation.",
    reflectionPrompt: "Ask for pardon as if you need your record rewritten, not merely softened.",
    evidence: [
      {
        eyebrow: "Authentic anchor",
        title: "Aishah asked what to say if she found Laylat al-Qadr, and the Prophet taught this dua.",
        detail:
          "That makes this the clearest narrated supplication attached specifically to the night.",
        source: hadith("Jami` at-Tirmidhi 3513", "https://sunnah.com/tirmidhi:3513"),
      },
      {
        eyebrow: "Qur'an atmosphere",
        title: "Surah al-Qadr frames the night as better than a thousand months and a night of peace.",
        detail:
          "Use the scale of the night to deepen your asking, not to build superstition around it.",
        source: quran("Qur'an 97:1-5", "https://quran.com/97"),
      },
    ],
    deckItemKey: "builtin:laylat-forgiveness",
    deckOrder: 10,
    dua: {
      arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ العَفْوَ فَاعْفُ عَنِّي",
      transliteration: "Allahumma innaka 'afuwwun tuhibbul-'afwa fa'fu 'anni.",
      translation: "O Allah, You are Pardoning and love pardon, so pardon me.",
      trackerLabel: "Personal repetition counter",
      trackerNote:
        "No authenticated fixed number is established here. Use the counter only to stay focused while your heart remains present.",
    },
  }) as BuiltInDeckStep,
  createStep({
    id: "laylat-dua-sayyid-istighfar",
    moduleId: "laylat-al-qadr",
    kind: "authentic",
    eyebrow: "Dua deck",
    title: "Sayyid al-Istighfar",
    summary:
      "This is the most superior formula of seeking forgiveness taught in the hadith. It gathers servitude, gratitude, confession, and asking for pardon.",
    practice: [
      "Recite it slowly enough to feel both Allah's favor and your own need.",
      "Let the admission of blessing and sin soften your tone before you continue to the next dua.",
    ],
    actionLine: "Use this when your repentance needs more than one short line.",
    reflectionPrompt: "A powerful tawbah often combines confession of sin with confession of blessing.",
    evidence: [
      {
        eyebrow: "Authentic anchor",
        title: "The Prophet described this as the master supplication for forgiveness.",
        detail:
          "Its wording teaches complete repentance: Lordship, servitude, gratitude, confession, and a plea for pardon.",
        source: hadith("Sahih al-Bukhari 6306", "https://sunnah.com/bukhari:6306"),
      },
      {
        eyebrow: "Reported example",
        title: "Its words force honesty: 'I acknowledge Your favor upon me, and I acknowledge my sin.'",
        detail:
          "This is why it works so well on a night centered on forgiveness rather than self-display.",
        source: hadith("Sahih al-Bukhari 6306", "https://sunnah.com/bukhari:6306"),
      },
    ],
    deckItemKey: "builtin:laylat-sayyid-istighfar",
    deckOrder: 20,
    dua: {
      arabic: "اللَّهُمَّ أَنْتَ رَبِّي لا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
      transliteration:
        "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu, a'udhu bika min sharri ma sana'tu, abu'u laka bini'matika 'alayya, wa abu'u bidhanbi, faghfir li fa innahu la yaghfiru-dh-dhunuba illa anta.",
      translation:
        "O Allah, You are my Lord. There is none worthy of worship but You. You created me and I am Your servant. I remain upon Your covenant and promise as much as I can. I seek refuge in You from the evil of what I have done. I acknowledge before You Your favor upon me, and I admit my sin. So forgive me, for none forgives sins except You.",
      trackerLabel: "Personal repetition counter",
      trackerNote:
        "Use the counter as a focus aid only. The hadith gives its virtue, but it does not assign a Laylat al-Qadr-specific repetition count.",
    },
  }) as BuiltInDeckStep,
  createStep({
    id: "laylat-dua-comprehensive-good",
    moduleId: "laylat-al-qadr",
    kind: "authentic",
    eyebrow: "Dua deck",
    title: "Comprehensive dua for all good and protection from all evil",
    summary:
      "Aishah was taught a sweeping supplication that gathers all good, seeks refuge from all evil, and asks for Paradise and protection from the Fire.",
    practice: [
      "Use this after the repentance duas when you want to ask broadly and safely.",
      "Make this your bridge from forgiveness into the rest of your life's needs.",
    ],
    actionLine: "After asking for pardon, ask for all good with one broad, Prophetic request.",
    reflectionPrompt: "A strong night is not only about cleaning the record. It is also about asking for the best future.",
    evidence: [
      {
        eyebrow: "Authentic anchor",
        title: "Aishah was taught a comprehensive dua that gathers all good and protection from all evil.",
        detail:
          "This helps the night end with broad, safe, Prophet-shaped requests instead of scattered speech.",
        source: hadith("Sunan Ibn Majah 3846", "https://sunnah.com/ibnmajah:3846"),
      },
      {
        eyebrow: "Reported example",
        title: "The Prophet loved comprehensive supplications.",
        detail:
          "That makes a gathered dua more faithful to the Sunnah than an anxious flood of disconnected requests.",
        source: hadith("Riyad as-Salihin 1466", "https://sunnah.com/riyadussalihin:1466"),
      },
    ],
    deckItemKey: "builtin:laylat-comprehensive-good",
    deckOrder: 30,
    dua: {
      arabic:
        "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنَ الخَيْرِ كُلِّهِ عَاجِلِهِ وَآجِلِهِ مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ، وَأَعُوذُ بِكَ مِنَ الشَّرِّ كُلِّهِ عَاجِلِهِ وَآجِلِهِ مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ، اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ خَيْرِ مَا سَأَلَكَ عَبْدُكَ وَنَبِيُّكَ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا عَاذَ بِهِ عَبْدُكَ وَنَبِيُّكَ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الجَنَّةَ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ، وَأَعُوذُ بِكَ مِنَ النَّارِ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ، وَأَسْأَلُكَ أَنْ تَجْعَلَ كُلَّ قَضَاءٍ قَضَيْتَهُ لِي خَيْرًا",
      transliteration:
        "Allahumma inni as'aluka min al-khayri kullihi, 'ajilihi wa ajilihi, ma 'alimtu minhu wa ma lam a'lam. Wa a'udhu bika min ash-sharri kullihi, 'ajilihi wa ajilihi, ma 'alimtu minhu wa ma lam a'lam. Allahumma inni as'aluka min khayri ma sa'alaka 'abduka wa nabiyyuka, wa a'udhu bika min sharri ma 'adha bihi 'abduka wa nabiyyuka. Allahumma inni as'aluka al-jannata wa ma qarraba ilayha min qawlin aw 'amalin, wa a'udhu bika min an-nari wa ma qarraba ilayha min qawlin aw 'amalin, wa as'aluka an taj'ala kulla qada'in qadaytahu li khayran.",
      translation:
        "O Allah, I ask You for all good, immediate and later, what I know of it and what I do not know. I seek refuge in You from all evil, immediate and later, what I know of it and what I do not know. O Allah, I ask You for the good that Your servant and Prophet asked You for, and I seek refuge in You from the evil from which Your servant and Prophet sought refuge. O Allah, I ask You for Paradise and whatever brings one nearer to it in word and deed, and I seek refuge in You from the Fire and whatever brings one nearer to it in word and deed. And I ask You to make every decree You decree for me good.",
      trackerLabel: "Personal repetition counter",
      trackerNote:
        "Even one slow recitation can be weighty. The counter is here only to help you stay engaged if you want to repeat it.",
    },
  }) as BuiltInDeckStep,
];

const laylatCompletionSteps: JourneyStep[] = [
  createStep({
    id: "laylat-completion",
    moduleId: "laylat-al-qadr",
    kind: "guided",
    eyebrow: "Completion",
    title: "Close the night humbly, then come back again.",
    summary:
      "A strong ending is not self-certification. It is humility, gratitude, and readiness to return on the remaining nights with the same seriousness.",
    practice: [
      "End with one final private dua before you leave the prayer space.",
      "Carry one repentance decision and one dua request into the next day.",
      "Plan your next last-ten night before sleep, not after Ramadan passes.",
    ],
    actionLine: "Finish softly and return again. Laylat al-Qadr is sought, not claimed.",
    reflectionPrompt: "Do not confuse emotional intensity with certainty that your work is complete.",
    evidence: [
      {
        eyebrow: "Qur'an atmosphere",
        title: "Laylat al-Qadr is a night of peace until dawn.",
        detail:
          "Let that peace shape the way you end the night: grateful, quiet, and still seeking.",
        source: quran("Qur'an 97:1-5", "https://quran.com/97"),
      },
      {
        eyebrow: "Authentic anchor",
        title: "The search continues across the last ten nights.",
        detail:
          "Even a strong night does not release you from returning again while the window remains open.",
        source: hadith("Sahih al-Bukhari 2017", "https://sunnah.com/bukhari:2017"),
      },
    ],
  }),
];

const repentancePreludeSteps: JourneyStep[] = [
  createStep({
    id: "repentance-hope",
    moduleId: "repentance",
    kind: "authentic",
    eyebrow: "Repentance",
    title: "Start tawbah with hope, not with despair.",
    summary:
      "The Qur'an closes the door on despair. Repentance begins by returning to Allah now, not by waiting until you feel less guilty or more worthy.",
    practice: [
      "Say plainly to yourself that Allah has left the door open for your return.",
      "Drop the sentence 'my case is too far gone' before you go any further.",
      "Bring one matter to Allah tonight that you have delayed out of shame.",
    ],
    actionLine: "Begin tawbah by believing Allah is still calling you back.",
    reflectionPrompt: "Hope is not softness with sin. It is obedience to Allah's invitation to return.",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Do not despair of Allah's mercy; turn back to Him sincerely.",
        detail:
          "These verses make hope part of repentance itself, not an optional emotional extra.",
        source: quran("Qur'an 39:53-54 and 66:8", "https://quran.com/39/53-54"),
      },
      {
        eyebrow: "Reported example",
        title: "Allah is more joyful at the repentance of His servant than a stranded traveler who finds his mount again.",
        detail:
          "This hadith breaks the illusion that Allah receives repentance reluctantly.",
        source: hadith("Sahih Muslim 2747a", "https://sunnah.com/muslim:2747a"),
      },
    ],
  }),
  createStep({
    id: "repentance-confess-and-stop",
    moduleId: "repentance",
    kind: "authentic",
    eyebrow: "Method",
    title: "Proper tawbah includes honest confession and refusal to persist knowingly.",
    summary:
      "The Qur'anic shape of repentance is not vague regret. It is remembering Allah, seeking forgiveness, and refusing persistence in the wrong.",
    practice: [
      "Name the sin clearly before Allah instead of hiding behind general language.",
      "Ask forgiveness for it specifically and make a serious intention to stop.",
      "If you know the pattern, name the trigger that usually drags you back.",
    ],
    actionLine: "Do not only feel bad. Confess, ask, and resolve to leave the sin.",
    reflectionPrompt: "Repentance becomes sharp when you stop speaking around the sin and start naming it.",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "They remember Allah, ask forgiveness for their sins, and do not persist knowingly.",
        detail:
          "This verse gives repentance a clear moral spine: remembrance, forgiveness, and no chosen persistence.",
        source: quran("Qur'an 3:135", "https://quran.com/3/135"),
      },
      {
        eyebrow: "Reported example",
        title: "Adam and Hawwa confessed, 'We have wronged ourselves.'",
        detail:
          "The first repentance in human history is direct, humble, and free of self-justification.",
        source: quran("Qur'an 7:23", "https://quran.com/7/23"),
      },
    ],
  }),
  createStep({
    id: "repentance-change-direction",
    moduleId: "repentance",
    kind: "authentic",
    eyebrow: "Method",
    title: "Sometimes repentance means changing your environment, not only changing your words.",
    summary:
      "The man who killed one hundred was told not to return to the corrupt land he came from. Real tawbah sometimes requires changed routes, changed company, and blocked access to old patterns.",
    practice: [
      "Identify one place, person, app, or private setting that feeds the sin you are leaving.",
      "Write the concrete change you need to make within the next twenty-four hours.",
      "Treat environmental change as part of tawbah, not as extra self-help.",
    ],
    actionLine: "Move away from the path that keeps feeding the sin.",
    reflectionPrompt: "If nothing around the sin changes, your repentance may remain more emotional than structural.",
    evidence: [
      {
        eyebrow: "Reported example",
        title: "The man who killed one hundred was told to go to a righteous land and leave the corrupt land behind.",
        detail:
          "His repentance was accepted while he was moving in the new direction, not while sitting inside the old environment.",
        source: hadith("Sahih Muslim 2766a", "https://sunnah.com/muslim:2766a"),
      },
      {
        eyebrow: "Qur'an anchor",
        title: "Turn to Allah in sincere repentance.",
        detail:
          "Sincerity in tawbah is shown not only by tears, but by a changed course.",
        source: quran("Qur'an 66:8", "https://quran.com/66/8"),
      },
    ],
  }),
  createStep({
    id: "repentance-repair-rights",
    moduleId: "repentance",
    kind: "authentic",
    eyebrow: "Method",
    title: "If your sin reached people, repair what you can before the Hereafter collects the debt.",
    summary:
      "Repentance from wronging people is not complete if you keep their rights in your hand. Return what can be returned, apologize where needed, and undo harm where possible.",
    practice: [
      "List any person you harmed through money, speech, trust, or reputation.",
      "Decide which harm needs return of rights, apology, or quiet repair.",
      "Make one concrete repair move after this session instead of carrying vague guilt forward.",
    ],
    actionLine: "If a human right is involved, do not postpone the repair under the label of repentance.",
    reflectionPrompt: "Some sins are between you and Allah. Others travel with other people into the Day of Judgment.",
    evidence: [
      {
        eyebrow: "Authentic anchor",
        title: "Whoever wronged his brother should settle it today before deeds become the currency.",
        detail:
          "This hadith makes repair urgent because worldly excuses disappear once the Hereafter begins.",
        source: hadith("Sahih al-Bukhari 6534", "https://sunnah.com/bukhari:6534"),
      },
      {
        eyebrow: "Reported warning",
        title: "The bankrupt person arrives with deeds but loses them to those he harmed.",
        detail:
          "That warning makes human rights part of serious tawbah, not a side issue.",
        source: hadith("Sahih Muslim 2581", "https://sunnah.com/muslim:2581"),
      },
    ],
  }),
  createStep({
    id: "repentance-replace-with-good",
    moduleId: "repentance",
    kind: "authentic",
    eyebrow: "Method",
    title: "Seal tawbah by replacing the sin-pattern with righteous action.",
    summary:
      "The Qur'an links repentance to belief and righteous action. A clean break becomes stronger when good deeds start occupying the place the sin used to hold.",
    practice: [
      "Choose one worship act that will directly replace the time or trigger of the sin.",
      "Attach your repentance to a positive routine, not only to an emotional memory.",
      "Make the first replacement action happen within the next day.",
    ],
    actionLine: "Do not leave empty space where the sin used to live. Fill it with good.",
    reflectionPrompt: "A repentance plan is stronger when it includes a substitute, not only a prohibition.",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Allah turns evil deeds into good for those who repent, believe, and work righteousness.",
        detail:
          "The verse joins inner return and outward righteous action in one path.",
        source: quran("Qur'an 25:70-71", "https://quran.com/25/70-71"),
      },
      {
        eyebrow: "Qur'an reminder",
        title: "Good deeds wipe away bad deeds.",
        detail:
          "Follow tawbah with obedient action so the heart and schedule both change.",
        source: quran("Qur'an 11:114", "https://quran.com/11/114"),
      },
    ],
  }),
];

const repentanceDeckSteps: BuiltInDeckStep[] = [
  createStep({
    id: "repentance-dua-adam",
    moduleId: "repentance",
    kind: "authentic",
    eyebrow: "Dua deck",
    title: "Adam's repentance dua",
    summary:
      "This Qur'anic dua teaches confession without excuses: we wronged ourselves, and without Your forgiveness and mercy we are lost.",
    practice: [
      "Use this when your tawbah needs brokenness more than eloquence.",
      "Repeat it until the language of self-wrong and need settles into your heart.",
    ],
    actionLine: "Let the first human repentance teach yours.",
    reflectionPrompt: "Repentance gets clearer when you stop defending yourself before Allah.",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Adam and Hawwa spoke this dua after their slip.",
        detail:
          "It is short, direct, and completely dependent on Allah's forgiveness and mercy.",
        source: quran("Qur'an 7:23", "https://quran.com/7/23"),
      },
      {
        eyebrow: "Reported example",
        title: "The first human story of repentance begins with confession, not self-justification.",
        detail:
          "That makes this dua ideal when you need to stop hiding from what you did.",
        source: quran("Qur'an 7:23", "https://quran.com/7/23"),
      },
    ],
    deckItemKey: "builtin:repentance-adam",
    deckOrder: 10,
    dua: {
      arabic: "رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
      transliteration: "Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna mina-l-khasirin.",
      translation: "Our Lord, we have wronged ourselves. If You do not forgive us and have mercy on us, we will surely be among the losers.",
      trackerLabel: "Personal repetition counter",
      trackerNote:
        "Use the counter to stay with the meaning. The product is not prescribing a revealed number.",
    },
  }) as BuiltInDeckStep,
  createStep({
    id: "repentance-dua-sayyid-istighfar",
    moduleId: "repentance",
    kind: "authentic",
    eyebrow: "Dua deck",
    title: "Sayyid al-Istighfar",
    summary:
      "This is the master supplication for forgiveness. It trains tawbah through servitude, gratitude, confession, and asking for pardon.",
    practice: [
      "Use it after you have named your sin and renewed your intention to leave it.",
      "Read it slowly so its confessions become yours, not just memorized language.",
    ],
    actionLine: "Move from regret into a full, articulate asking for forgiveness.",
    reflectionPrompt: "A strong istighfar remembers blessings and sins together.",
    evidence: [
      {
        eyebrow: "Authentic anchor",
        title: "The Prophet named this the master supplication for forgiveness.",
        detail:
          "It is one of the strongest hadith-based formulas for structured repentance.",
        source: hadith("Sahih al-Bukhari 6306", "https://sunnah.com/bukhari:6306"),
      },
      {
        eyebrow: "Reported example",
        title: "Its wording includes both gratitude and confession.",
        detail:
          "That balance protects tawbah from becoming either self-loathing or casual speech.",
        source: hadith("Sahih al-Bukhari 6306", "https://sunnah.com/bukhari:6306"),
      },
    ],
    deckItemKey: "builtin:repentance-sayyid-istighfar",
    deckOrder: 20,
    dua: {
      arabic: "اللَّهُمَّ أَنْتَ رَبِّي لا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
      transliteration:
        "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu, a'udhu bika min sharri ma sana'tu, abu'u laka bini'matika 'alayya, wa abu'u bidhanbi, faghfir li fa innahu la yaghfiru-dh-dhunuba illa anta.",
      translation:
        "O Allah, You are my Lord. There is none worthy of worship but You. You created me and I am Your servant. I remain upon Your covenant and promise as much as I can. I seek refuge in You from the evil of what I have done. I acknowledge before You Your favor upon me, and I admit my sin. So forgive me, for none forgives sins except You.",
      trackerLabel: "Personal repetition counter",
      trackerNote:
        "Track focus, not superstition. This counter is your own discipline aid.",
    },
  }) as BuiltInDeckStep,
  createStep({
    id: "repentance-dua-abu-bakr",
    moduleId: "repentance",
    kind: "authentic",
    eyebrow: "Dua deck",
    title: "Abu Bakr's prayer of repentance in salah",
    summary:
      "Abu Bakr asked for a dua to use in his prayer, and the Prophet taught him a compact formula of confession, forgiveness, and mercy.",
    practice: [
      "Use this when you want a short repentance dua inside prayer or after a prayer block.",
      "Let its simplicity train you to speak plainly to Allah about your wrongdoing.",
    ],
    actionLine: "Take this dua into salah, not only outside it.",
    reflectionPrompt: "A short dua can be deeper than a long one when the confession is honest.",
    evidence: [
      {
        eyebrow: "Authentic anchor",
        title: "Abu Bakr asked the Prophet for a dua to say in his prayer.",
        detail:
          "The reply gives one of the strongest compact formulas for personal wrongdoing and asking for mercy.",
        source: hadith("Riyad as-Salihin 1475", "https://sunnah.com/riyadussalihin:1475"),
      },
      {
        eyebrow: "Reported example",
        title: "This dua keeps repentance personal: 'I have greatly wronged myself.'",
        detail:
          "It strips away excuses and moves straight to pardon and mercy.",
        source: hadith("Riyad as-Salihin 1475", "https://sunnah.com/riyadussalihin:1475"),
      },
    ],
    deckItemKey: "builtin:repentance-abu-bakr",
    deckOrder: 30,
    dua: {
      arabic: "اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ، وَارْحَمْنِي، إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ",
      transliteration:
        "Allahumma inni zalamtu nafsi zulman kathiran, wa la yaghfiru-dh-dhunuba illa anta, faghfir li maghfiratan min 'indika, warhamni, innaka anta-l-Ghafuru-r-Rahim.",
      translation:
        "O Allah, I have greatly wronged myself, and none forgives sins except You. So grant me forgiveness from Yourself and have mercy on me. Indeed, You are the All-Forgiving, the Most Merciful.",
      trackerLabel: "Personal repetition counter",
      trackerNote:
        "Use the counter if it helps you remain present. It is not prescribing a fixed number.",
    },
  }) as BuiltInDeckStep,
];

const repentanceCompletionSteps: JourneyStep[] = [
  createStep({
    id: "repentance-completion",
    moduleId: "repentance",
    kind: "guided",
    eyebrow: "Completion",
    title: "Leave with a repair plan, a worship replacement, and the door of tawbah still open.",
    summary:
      "Repentance is complete when the heart returns, the tongue asks, and the life begins to change. End this module by carrying one repair and one replacement action into the next day.",
    practice: [
      "Choose one repair you owe to Allah and one repair you owe to people.",
      "Choose one good deed that will replace the old sin-pattern this week.",
      "Return to tawbah again whenever you slip instead of surrendering to the fall.",
    ],
    actionLine: "Do not leave with inspiration only. Leave with a changed next step.",
    reflectionPrompt: "A complete feeling after tawbah should produce movement, not just emotion.",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Allah turns to those who repent, believe, and work righteousness.",
        detail:
          "The end of repentance is not only relief. It is a more obedient life.",
        source: quran("Qur'an 25:70-71", "https://quran.com/25/70-71"),
      },
      {
        eyebrow: "Reported reminder",
        title: "Allah loves those who turn back repeatedly and purify themselves.",
        detail:
          "That keeps the door open even when your repentance must be renewed more than once.",
        source: quran("Qur'an 2:222", "https://quran.com/2/222"),
      },
    ],
  }),
];

const MODULE_DEFINITIONS: DuaJourneyModuleDefinition[] = [
  {
    id: "laylat-al-qadr",
    label: "Laylat al-Qadr",
    shortLabel: "Laylat",
    eyebrow: "Ramadan module",
    title: "Laylat al-Qadr guided worship",
    subtitle: "A focused night arc for qiyam, forgiveness, and dua without inventing a fixed ritual script.",
    description:
      "Move through the night in a deliberate order: search, qiyam, adab of dua, repentance, then a sequenced dua deck.",
    authenticityBoundary:
      "Verified anchors: seek the last ten, stand the night in prayer, intensify worship, and use the forgiveness dua taught to Aishah. Hifzer is only structuring the order for focus.",
    tone: "accent",
    supportsCustomDeck: true,
    preludeSteps: laylatPreludeSteps,
    deckSteps: laylatDeckSteps,
    completionSteps: laylatCompletionSteps,
  },
  {
    id: "repentance",
    label: "Repentance",
    shortLabel: "Tawbah",
    eyebrow: "Core module",
    title: "Repentance, repair, and return",
    subtitle: "A step-by-step tawbah experience built from Qur'anic method, authentic hadith, and focused repentance duas.",
    description:
      "Walk through hope, confession, leaving persistence, repairing rights, replacing sin with good, then a repentance dua deck.",
    authenticityBoundary:
      "Verified anchors: no despair, no persistence, truthful confession, repairing rights, and following tawbah with righteous action. Hifzer is only packaging them into one guided sequence.",
    tone: "warn",
    supportsCustomDeck: true,
    preludeSteps: repentancePreludeSteps,
    deckSteps: repentanceDeckSteps,
    completionSteps: repentanceCompletionSteps,
  },
  wealthModuleDefinition,
  ruqyahModuleDefinition,
  beautifulNamesModuleDefinition,
];

type OrderedDeckStep = JourneyStep & {
  deckItemKey: string;
  deckOrder: number;
};

const BUILT_IN_DECK_STEPS: BuiltInDeckStep[] = MODULE_DEFINITIONS.flatMap((definition) => definition.deckSteps);
const BUILT_IN_DECK_ORDER_MAP = new Map(
  BUILT_IN_DECK_STEPS.map((step) => [`${step.moduleId}:${step.deckItemKey}`, step.deckOrder]),
);

function normalizePositiveOrder(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(1, Math.min(9999, Math.floor(value ?? fallback)));
}

function buildCustomDuaStep(customDua: CustomDuaSnapshot, fallbackOrder: number): OrderedDeckStep {
  const trimmedNote = customDua.note?.trim() || null;
  const evidence: JourneyEvidence[] = [
    {
      eyebrow: "Private source",
      title: "This is your own saved dua.",
      detail:
        "It is stored only under your user and is not being presented as a narrated formula from Qur'an or Sunnah.",
    },
  ];

  if (trimmedNote) {
    evidence.push({
      eyebrow: "Your note",
      title: "Personal context",
      detail: trimmedNote,
    });
  }

  return createStep({
    id: `custom-dua-${customDua.id}`,
    moduleId: customDua.moduleId,
    kind: "personal",
    eyebrow: "Your private dua",
    title: customDua.title,
    summary:
      "A private dua saved only to your account and inserted into this module's guided deck.",
    practice: [
      "Begin with praise of Allah and salawat, then move into your own wording with calm focus.",
      "Use the same slow, present rhythm you use with the authenticated duas in the deck.",
    ],
    actionLine: "Stay present with your own dua before moving to the next card.",
    reflectionPrompt: trimmedNote ?? "Keep your private dua clear, humble, and free of ritual claims that are not authenticated.",
    evidence,
    deckItemKey: `custom:${customDua.id}`,
    deckOrder: fallbackOrder,
    dua: {
      arabic: customDua.arabic,
      transliteration: customDua.transliteration,
      translation: customDua.translation,
      trackerLabel: "Personal repetition counter",
      trackerNote:
        "This counter is only your focus aid. Your private dua is not being assigned an authenticated fixed repetition count.",
    },
  }) as OrderedDeckStep;
}

function buildModuleJourney(
  definition: DuaJourneyModuleDefinition,
  input?: {
    customDuas?: readonly CustomDuaSnapshot[];
    deckOrders?: readonly DuaDeckOrderSnapshot[];
  },
): DuaJourneyModule {
  const customDuas = (input?.customDuas ?? []).filter((entry) => entry.moduleId === definition.id);
  const deckOrders = (input?.deckOrders ?? []).filter((entry) => entry.moduleId === definition.id);
  const orderMap = new Map(
    definition.deckSteps.map((step) => [step.deckItemKey, step.deckOrder]),
  );
  const maxBuiltInOrder = definition.deckSteps.reduce((max, step) => Math.max(max, step.deckOrder), 0);

  const customSteps = customDuas.map((customDua, index) => {
    const fallbackOrder = maxBuiltInOrder + ((index + 1) * 10);
    return buildCustomDuaStep(customDua, fallbackOrder);
  });

  for (const step of customSteps) {
    orderMap.set(step.deckItemKey, step.deckOrder);
  }

  for (const entry of deckOrders) {
    orderMap.set(entry.itemKey, normalizePositiveOrder(entry.sortOrder, orderMap.get(entry.itemKey) ?? maxBuiltInOrder + 10));
  }

  const orderedDeckSteps = [...definition.deckSteps, ...customSteps]
    .sort((left, right) => {
      const leftOrder = normalizePositiveOrder(orderMap.get(left.deckItemKey), left.deckOrder ?? 0);
      const rightOrder = normalizePositiveOrder(orderMap.get(right.deckItemKey), right.deckOrder ?? 0);
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
      return left.title.localeCompare(right.title);
    })
    .map((step) => ({
      ...step,
      deckOrder: normalizePositiveOrder(orderMap.get(step.deckItemKey), step.deckOrder ?? maxBuiltInOrder + 10),
    }));

  return {
    id: definition.id,
    label: definition.label,
    shortLabel: definition.shortLabel,
    eyebrow: definition.eyebrow,
    title: definition.title,
    subtitle: definition.subtitle,
    description: definition.description,
    authenticityBoundary: definition.authenticityBoundary,
    tone: definition.tone,
    supportsCustomDeck: definition.supportsCustomDeck,
    steps: [...definition.preludeSteps, ...orderedDeckSteps, ...definition.completionSteps],
  };
}

export function buildDuaModules(input?: {
  customDuas?: readonly CustomDuaSnapshot[];
  deckOrders?: readonly DuaDeckOrderSnapshot[];
}): DuaJourneyModule[] {
  return MODULE_DEFINITIONS.map((definition) => buildModuleJourney(definition, input));
}

export function getDuaModule(
  moduleId: DuaModuleId,
  input?: {
    customDuas?: readonly CustomDuaSnapshot[];
    deckOrders?: readonly DuaDeckOrderSnapshot[];
  },
): DuaJourneyModule {
  const selectedModule = buildDuaModules(input).find((entry) => entry.id === moduleId);
  if (!selectedModule) {
    return buildDuaModules(input)[0] as DuaJourneyModule;
  }
  return selectedModule;
}

export function defaultDuaDeckOrders(moduleId?: DuaModuleId): DuaDeckOrderSnapshot[] {
  return BUILT_IN_DECK_STEPS
    .filter((step) => !moduleId || step.moduleId === moduleId)
    .map((step) => ({
      moduleId: step.moduleId,
      itemKey: step.deckItemKey,
      sortOrder: step.deckOrder,
    }));
}

export function defaultLaylatAlQadrDeckOrders(): DuaDeckOrderSnapshot[] {
  return defaultDuaDeckOrders(DEFAULT_DUA_MODULE_ID);
}

export function buildLaylatAlQadrJourney(input?: {
  customDuas?: readonly CustomDuaSnapshot[];
  deckOrders?: readonly DuaDeckOrderSnapshot[];
}): DuaJourneyModule {
  return getDuaModule(DEFAULT_DUA_MODULE_ID, input);
}

export const laylatAlQadrJourney = buildLaylatAlQadrJourney();

export function buildWealthJourney(input?: {
  customDuas?: readonly CustomDuaSnapshot[];
  deckOrders?: readonly DuaDeckOrderSnapshot[];
}): DuaJourneyModule {
  return getDuaModule("wealth", input);
}

export const wealthJourney = buildWealthJourney();

export function buildRuqyahJourney(input?: {
  customDuas?: readonly CustomDuaSnapshot[];
  deckOrders?: readonly DuaDeckOrderSnapshot[];
}): DuaJourneyModule {
  return getDuaModule("ruqyah", input);
}

export const ruqyahJourney = buildRuqyahJourney();

export function buildBeautifulNamesJourney(input?: {
  customDuas?: readonly CustomDuaSnapshot[];
  deckOrders?: readonly DuaDeckOrderSnapshot[];
}): DuaJourneyModule {
  return getDuaModule("beautiful-names", input);
}

export const beautifulNamesJourney = buildBeautifulNamesJourney();

const featuredLaylatDua = laylatDeckSteps[0];

export const laylatAlQadrGuide = {
  hero: {
    eyebrow: "Ramadan Dua",
    title: "Laylat al-Qadr, forgiveness, and a night anchored in what is authentic.",
    description:
      "The clearest authenticated supplication for Laylat al-Qadr is the forgiveness dua taught to Aishah. Hifzer structures the rest of the experience as a focused journey without claiming a fixed Prophetic ritual script.",
  },
  featuredDua: {
    title: featuredLaylatDua.title,
    arabic: featuredLaylatDua.dua?.arabic ?? "",
    transliteration: featuredLaylatDua.dua?.transliteration ?? "",
    translation: featuredLaylatDua.dua?.translation ?? "",
    source: featuredLaylatDua.sourceLinks[0] as SourceLink,
  },
  verifiedAnchors: [
    {
      title: "Seek the night in the last ten nights, especially the odd nights.",
      detail:
        "Do not reduce Laylat al-Qadr to one guessed evening. The Prophetic method is a search across the last ten.",
      source: hadith("Sahih al-Bukhari 2017", "https://sunnah.com/bukhari:2017"),
    },
    {
      title: "Stand the night in prayer with faith and hope for reward.",
      detail:
        "The forgiveness promise tied to Laylat al-Qadr is attached to qiyam, not only to reading about the night.",
      source: hadith("Sahih al-Bukhari 35", "https://sunnah.com/bukhari:35"),
    },
    {
      title: "Increase effort when the last ten nights begin.",
      detail:
        "The Prophet intensified worship and woke his family, which changes the tone of the night from casual to protected.",
      source: hadith("Sahih al-Bukhari 2024", "https://sunnah.com/bukhari:2024"),
    },
    {
      title: "Center the night on pardon and forgiveness.",
      detail:
        "The signature narrated dua of Laylat al-Qadr is about pardon, not spectacle.",
      source: hadith("Jami` at-Tirmidhi 3513", "https://sunnah.com/tirmidhi:3513"),
    },
  ] as const,
  stepByStepPlan: [
    {
      title: "Seek the night across the last ten.",
      detail:
        "Approach the night as a search that continues, not as a one-night gamble.",
      anchor: "Built from Sahih al-Bukhari 2017.",
    },
    {
      title: "Make qiyam the center of the experience.",
      detail:
        "Anchor the night around actual standing prayer, then let the duas deepen the prayer.",
      anchor: "Built from Sahih al-Bukhari 35 and Sahih Muslim 482.",
    },
    {
      title: "Enter dua with praise, salawat, humility, and tawbah.",
      detail:
        "Begin asking properly, then repent before you move into the dua deck.",
      anchor: "Built from Jami` at-Tirmidhi 3477, Qur'an 39:53-54, and Qur'an 7:23.",
    },
    {
      title: "Keep the forgiveness dua central, then widen into broader duas.",
      detail:
        "Use the taught Laylat al-Qadr dua as the center, then move into istighfar and comprehensive requests.",
      anchor: "Built from Jami` at-Tirmidhi 3513, Sahih al-Bukhari 6306, and Sunan Ibn Majah 3846.",
    },
    {
      title: "Close humbly and come back again.",
      detail:
        "Do not end the night with certainty that the work is done. End it with humility and return.",
      anchor: "Built from Qur'an 97 and Sahih al-Bukhari 2017.",
    },
  ] as const,
  authenticityBoundary: {
    title: "What is verified, and what is not",
    points: [
      "Verified: seek Laylat al-Qadr in the last ten nights, especially the odd nights.",
      "Verified: stand the night in prayer and use the forgiveness dua taught to Aishah.",
      "Verified: increase worship in the last ten nights and wake your family.",
      "Not established as a fixed Sunnah script: a required checklist, a guaranteed sequence, or a mandatory rak'ah count for the night.",
    ],
  },
  quranAnchor: {
    title: "Qur'an anchor",
    detail:
      "Surah al-Qadr frames the night as better than a thousand months and a night of peace until dawn.",
    source: quran("Qur'an 97:1-5", "https://quran.com/97"),
  },
  sources: [
    quran("Qur'an 97:1-5", "https://quran.com/97"),
    hadith("Jami` at-Tirmidhi 3513", "https://sunnah.com/tirmidhi:3513"),
    hadith("Sahih al-Bukhari 35", "https://sunnah.com/bukhari:35"),
    hadith("Sahih al-Bukhari 2017", "https://sunnah.com/bukhari:2017"),
    hadith("Sahih al-Bukhari 2024", "https://sunnah.com/bukhari:2024"),
  ] as const,
} as const;

export function resolveBuiltInDeckOrder(
  moduleId: DuaModuleId,
  itemKey: string,
): number | undefined {
  return BUILT_IN_DECK_ORDER_MAP.get(`${moduleId}:${itemKey}`);
}
