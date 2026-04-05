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

const wealthPreludeSteps: JourneyStep[] = [
  createStep({
    id: "wealth-clarify-goal",
    moduleId: "wealth",
    kind: "authentic",
    eyebrow: "Boundary",
    title: "Ask for wealth, but ask for halal provision, sufficiency, and barakah before status.",
    summary:
      "The Qur'an permits asking for good in this world, but the Sunnah refuses to define wealth as piles of possessions alone. This module treats wealth as lawful provision, freedom from need, and a heart not owned by money.",
    tags: ["Halal rizq", "Barakah", "Contentment"],
    practice: [
      "Name one financial need you are taking to Allah without embarrassment.",
      "Correct the intention: ask for provision that stays halal, useful, and clean.",
      "Do not frame this module as a guaranteed shortcut to luxury or social rank.",
    ],
    actionLine: "Ask for more if you need more, but ask as a servant who still wants a protected heart.",
    reflectionPrompt: "If Allah gave you more money tomorrow, would it make you freer in obedience or busier in distraction?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Believers ask for good in this world and the Hereafter.",
        detail:
          "Seeking worldly good is not outside the Qur'anic path when it remains tied to the Hereafter.",
        source: quran("Qur'an 2:201", "https://quran.com/2/201"),
      },
      {
        eyebrow: "Hadith anchor",
        title: "True wealth is the sufficiency of the soul.",
        detail:
          "The Sunnah keeps wealth from collapsing into raw accumulation by centering inner sufficiency.",
        source: hadith("Sahih al-Bukhari 6446", "https://sunnah.com/bukhari:6446"),
      },
    ],
  }),
  createStep({
    id: "wealth-open-rizq-method",
    moduleId: "wealth",
    kind: "authentic",
    eyebrow: "Openings",
    title: "Taqwa, gratitude, and istighfar are named Qur'anic openings for provision.",
    summary:
      "The Qur'an does not teach wealth as detached hustle. It repeatedly ties openings in provision to taqwa, gratitude, and seeking forgiveness from Allah.",
    tags: ["Taqwa", "Gratitude", "Istighfar"],
    practice: [
      "Pair your dua for money with one concrete act of obedience you know you have been delaying.",
      "Make gratitude specific instead of generic by naming current provisions out loud.",
      "Use istighfar as a sincere return to Allah, not as a mechanical wealth hack.",
    ],
    actionLine: "Before asking for increase, reopen the ethical conditions the Qur'an keeps linking to increase.",
    reflectionPrompt: "Are you asking for rizq while still protecting the habits that constrict it?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Whoever is mindful of Allah, He makes a way out and provides from where he does not expect.",
        detail:
          "These verses make taqwa part of the provision path, not only part of worship language.",
        source: quran("Qur'an 65:2-3", "https://quran.com/65/2-3"),
      },
      {
        eyebrow: "Qur'an anchor",
        title: "If you are grateful, I will surely increase you.",
        detail:
          "Increase is explicitly linked to gratitude rather than entitlement.",
        source: quran("Qur'an 14:7", "https://quran.com/14/7"),
      },
      {
        eyebrow: "Qur'an anchor",
        title: "Seek forgiveness; Allah sends increase in wealth and children.",
        detail:
          "Nuh's call connects repentance and provision without turning either into superstition.",
        source: quran("Qur'an 71:10-12", "https://quran.com/71/10-12"),
      },
    ],
  }),
  createStep({
    id: "wealth-seek-and-spend",
    moduleId: "wealth",
    kind: "authentic",
    eyebrow: "Movement",
    title: "The Qur'an tells you to seek Allah's bounty, and the Sunnah tells you to spend without panic.",
    summary:
      "Provision in Islam is not passive. The Qur'an permits going out to seek Allah's bounty, while the Sunnah trains the believer to spend, support others, and not let fear of poverty choke generosity.",
    tags: ["Work", "Charity", "Trust"],
    practice: [
      "Tie this module to lawful action: work, trade, service, study, or a concrete job step.",
      "Spend on a real need or charity instead of waiting to feel perfectly secure first.",
      "Measure whether your fear of spending is coming from prudence or from spiritual constriction.",
    ],
    actionLine: "Work after prayer, spend when needed, and let trust show up in actual financial behavior.",
    reflectionPrompt: "Do you want provision from Allah while living as if every dollar is only defended by your own grip?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Disperse through the land and seek the bounty of Allah.",
        detail:
          "The verse licenses effort in the marketplace while keeping remembrance alongside it.",
        source: quran("Qur'an 62:10", "https://quran.com/62/10"),
      },
      {
        eyebrow: "Qur'an anchor",
        title: "Whatever you spend, Allah will replace it.",
        detail:
          "This verse directly addresses the fear that generosity will only reduce provision.",
        source: quran("Qur'an 34:39", "https://quran.com/34/39"),
      },
      {
        eyebrow: "Hadith anchor",
        title: "Spend, O son of Adam, and I shall spend on you.",
        detail:
          "The hadith gives a clean Prophetic line against anxious withholding.",
        source: hadith("Sahih al-Bukhari 5352", "https://sunnah.com/bukhari:5352"),
      },
      {
        eyebrow: "Hadith anchor",
        title: "The best charity is while you still hope to be wealthy and fear poverty.",
        detail:
          "It is easiest to delay generosity until later; the Sunnah pushes against that delay.",
        source: hadith("Sahih al-Bukhari 2748", "https://sunnah.com/bukhari:2748"),
      },
    ],
  }),
];

const wealthDeckSteps: BuiltInDeckStep[] = [
  createStep({
    id: "wealth-dua-world-and-hereafter",
    moduleId: "wealth",
    kind: "authentic",
    eyebrow: "Qur'anic dua",
    title: "Rabbana atina fid-dunya hasanah",
    summary:
      "This is the broad Qur'anic dua for worldly good and next-world good. It is the safest anchor when you want provision without shrinking your horizon to money alone.",
    tags: ["Qur'an", "Provision", "Balance"],
    practice: [
      "Use this when you want to ask for more income without losing the Hereafter from the request.",
      "Let dunya hasanah include lawful provision, good work, shelter, debt relief, family ease, and useful means.",
      "Repeat it until the request feels broad, clean, and not narrow.",
    ],
    actionLine: "Begin the deck with the dua that keeps money inside a larger definition of good.",
    reflectionPrompt: "What would it change if your financial dua stayed openly tied to the Hereafter every time?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Our Lord, grant us good in this world and good in the Hereafter.",
        detail:
          "The verse authorizes asking for worldly good without apology, while refusing to isolate it from final success.",
        source: quran("Qur'an 2:201", "https://quran.com/2/201"),
      },
    ],
    deckItemKey: "builtin:wealth-world-and-hereafter",
    deckOrder: 10,
    dua: {
      label: "Qur'anic dua",
      intro: "Ask with breadth here: provision, stability, useful openings, and a good end.",
      arabic: "رَبَّنَآ ءَاتِنَا فِى ٱلدُّنْيَا حَسَنَةًۭ وَفِى ٱلْـَٔاخِرَةِ حَسَنَةًۭ وَقِنَا عَذَابَ ٱلنَّارِ",
      transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar.",
      translation:
        "Our Lord! Grant us the good of this world and the Hereafter, and protect us from the torment of the Fire.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }) as BuiltInDeckStep,
  createStep({
    id: "wealth-dua-musa-need",
    moduleId: "wealth",
    kind: "authentic",
    eyebrow: "Qur'anic dua",
    title: "Rabbi inni lima anzalta ilayya min khayrin faqir",
    summary:
      "Musa asked in a state of exhaustion, service, and need. The wording is simple, dignified, and open-ended: he declares complete need for the good Allah sends.",
    tags: ["Qur'an", "Need", "Rizq"],
    practice: [
      "Use it when you are between openings, financially stretched, or quietly asking for work.",
      "Let the dua keep its humility. It is a needy servant speaking, not a claimant demanding terms.",
      "Pair it with actual service and effort the way Musa served before he asked.",
    ],
    actionLine: "When you feel materially exposed, return to the directness of this Qur'anic line.",
    reflectionPrompt: "Can you ask for provision with humility instead of with internal panic?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "My Lord, I am in desperate need of whatever good You send me.",
        detail:
          "The verse joins service, modesty, and need in one of the clearest Qur'anic prayers for provision.",
        source: quran("Qur'an 28:24", "https://quran.com/28/24"),
      },
    ],
    deckItemKey: "builtin:wealth-musa-need",
    deckOrder: 20,
    dua: {
      label: "Qur'anic dua",
      intro: "Read it as a servant who needs whatever clean opening Allah sends next.",
      arabic: "رَبِّ إِنِّى لِمَآ أَنزَلْتَ إِلَىَّ مِنْ خَيْرٍۢ فَقِيرٌۭ",
      transliteration: "Rabbi inni lima anzalta ilayya min khayrin faqir.",
      translation:
        "My Lord! I am truly in desperate need of whatever provision You may have in store for me.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }) as BuiltInDeckStep,
  createStep({
    id: "wealth-dua-rizqan-tayyiban",
    moduleId: "wealth",
    kind: "authentic",
    eyebrow: "Prophetic dua",
    title: "Allahumma inni as'aluka 'ilman nafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalan",
    summary:
      "This post-Fajr Prophetic dua ties provision to beneficial knowledge and accepted action. It asks for pure provision, not merely large provision.",
    tags: ["Hadith", "Halal rizq", "Morning"],
    practice: [
      "Use it after Fajr or at the start of the workday when you want clean provision more than random gain.",
      "Notice how the hadith ties income to knowledge and deeds; the request is integrated, not isolated.",
      "Keep the adjective tayyib present: lawful, clean, and wholesome provision.",
    ],
    actionLine: "Ask for rizq that stays pure enough to bless the rest of your life.",
    reflectionPrompt: "Are you only asking for more income, or are you asking for income you would be at peace to meet Allah with?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "The Prophet said this after the morning prayer.",
        detail:
          "The wording explicitly asks for beneficial knowledge, wholesome provision, and accepted deeds together.",
        source: hadith("Sunan Ibn Majah 925", "https://sunnah.com/ibnmajah:925"),
      },
    ],
    deckItemKey: "builtin:wealth-rizqan-tayyiban",
    deckOrder: 30,
    dua: {
      label: "Authentic morning dua",
      intro: "Use it as a morning reset so provision stays tied to usefulness and acceptance.",
      arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا",
      transliteration:
        "Allahumma inni as'aluka 'ilman nafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalan.",
      translation:
        "O Allah, I ask You for beneficial knowledge, wholesome provision, and accepted deeds.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }) as BuiltInDeckStep,
  createStep({
    id: "wealth-dua-huda-tuqa-afaf-ghina",
    moduleId: "wealth",
    kind: "authentic",
    eyebrow: "Prophetic dua",
    title: "Allahumma inni as'alukal-huda wat-tuqa wal-'afafa wal-ghina",
    summary:
      "The Prophet asked for guidance, taqwa, chastity, and ghina. Here ghina is not vulgar excess but sufficiency and freedom from humiliating need.",
    tags: ["Hadith", "Sufficiency", "Character"],
    practice: [
      "Use this when you want financial improvement without moral leakage.",
      "Keep the order in mind: guidance and taqwa come before ghina in the wording.",
      "Let this dua restrain the desire to get rich in ways that damage your deen.",
    ],
    actionLine: "Ask for sufficiency in the Prophetic order, not as a detached financial obsession.",
    reflectionPrompt: "Would you still want the money if guidance, taqwa, and chastity were removed from the request?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "The Prophet used to supplicate with this wording.",
        detail:
          "The hadith frames sufficiency as part of a moral package, not as a separate worldly chase.",
        source: hadith("Jami` at-Tirmidhi 3489", "https://sunnah.com/tirmidhi:3489"),
      },
      {
        eyebrow: "Hadith boundary",
        title: "True wealth is self-contentment.",
        detail:
          "That keeps ghina here from being misread as limitless accumulation.",
        source: hadith("Sahih al-Bukhari 6446", "https://sunnah.com/bukhari:6446"),
      },
    ],
    deckItemKey: "builtin:wealth-huda-tuqa-afaf-ghina",
    deckOrder: 40,
    dua: {
      label: "Authentic dua",
      intro: "Recite it when you need wealth framed by guidance, restraint, and inner sufficiency.",
      arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى",
      transliteration: "Allahumma inni as'alukal-huda wat-tuqa wal-'afafa wal-ghina.",
      translation:
        "O Allah, I ask You for guidance, piety, chastity, and sufficiency.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }) as BuiltInDeckStep,
  createStep({
    id: "wealth-dua-halal-suffices",
    moduleId: "wealth",
    kind: "authentic",
    eyebrow: "Prophetic dua",
    title: "Allahummakfini bihalalika 'an haramika wa aghnini bifadlika 'amman siwaka",
    summary:
      "This Prophetic dua is precise: enough lawful provision to keep you away from the unlawful, and enough of Allah's bounty that you are not inwardly dependent on people.",
    tags: ["Hadith", "Halal rizq", "Debt"],
    practice: [
      "Use it when the pressure of bills, debt, or delayed income starts making the unlawful feel tempting.",
      "Read it as a dua for boundaries as much as for money.",
      "Let it make you allergic to haram shortcuts, not only eager for relief.",
    ],
    actionLine: "If financial pressure is pulling you toward compromise, make this your core line.",
    reflectionPrompt: "Where does money pressure currently make the unlawful look more negotiable than it should?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "The Prophet taught this dua for debt and need.",
        detail:
          "The wording asks for lawful sufficiency and freedom from humiliating dependence on creation.",
        source: hadith("Jami` at-Tirmidhi 3563", "https://sunnah.com/tirmidhi:3563"),
      },
    ],
    deckItemKey: "builtin:wealth-halal-suffices",
    deckOrder: 50,
    dua: {
      label: "Authentic dua",
      intro: "Use it when you want provision that protects your deen before it enlarges your budget.",
      arabic: "اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ",
      transliteration:
        "Allahummakfini bihalalika 'an haramika wa aghnini bifadlika 'amman siwaka.",
      translation:
        "O Allah, suffice me with Your lawful against Your prohibited, and make me independent by Your bounty from everyone besides You.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }) as BuiltInDeckStep,
  createStep({
    id: "wealth-dua-debt-and-poverty",
    moduleId: "wealth",
    kind: "authentic",
    eyebrow: "Prophetic dua",
    title: "Iqdi 'anni d-dayna wa aghnini minal-faqr",
    summary:
      "In the bedtime invocation narrated from Abu Hurairah, one version adds this direct request: clear my debt and enrich me instead of poverty.",
    tags: ["Hadith", "Debt", "Poverty"],
    practice: [
      "Use it when debt has become spiritually heavy, not only financially inconvenient.",
      "Keep the moral danger of debt in view; the Sunnah treats it as more than arithmetic.",
      "Pair it with repayment plans, honest speech, and financial restraint.",
    ],
    actionLine: "When debt is choking your decisions, make the request simple and direct.",
    reflectionPrompt: "Is your financial stress only a numbers problem, or is it starting to deform your truthfulness and promises?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "One narrated version adds: pay the debt for me and enrich me instead of poverty.",
        detail:
          "This gives a direct Prophetic wording for debt relief and freedom from poverty inside a broader bedtime invocation.",
        source: hadith("Sunan Abi Dawud 5051", "https://sunnah.com/abudawud:5051"),
      },
      {
        eyebrow: "Hadith warning",
        title: "The Prophet repeatedly sought refuge from debt because it bends speech and promises.",
        detail:
          "Debt is treated as a moral strain, not only a financial one.",
        source: hadith("Sahih al-Bukhari 2397", "https://sunnah.com/bukhari:2397"),
      },
    ],
    deckItemKey: "builtin:wealth-debt-and-poverty",
    deckOrder: 60,
    dua: {
      label: "Authentic dua line",
      intro: "Use this when you need a direct request for debt relief and freedom from poverty.",
      arabic: "اقْضِ عَنِّي الدَّيْنَ وَأَغْنِنِي مِنَ الْفَقْرِ",
      transliteration: "Iqdi 'anni d-dayna wa aghnini minal-faqr.",
      translation: "Pay the debt for me and grant me riches instead of poverty.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }) as BuiltInDeckStep,
];

const wealthCompletionSteps: JourneyStep[] = [
  createStep({
    id: "wealth-completion",
    moduleId: "wealth",
    kind: "guided",
    eyebrow: "Completion",
    title: "Leave asking for more, but leave with a cleaner money ethic too.",
    summary:
      "The authentic wealth lane is not merely more cash. It is worship, lawful seeking, gratitude, generosity, debt seriousness, and a heart that remains richer than its balance sheet.",
    tags: ["Method", "Barakah", "Contentment"],
    practice: [
      "Choose one halal income step and one spending correction to make today.",
      "Keep one wealth dua from this deck attached to Fajr or sleep so it becomes ordinary.",
      "If Allah opens more for you, answer it with gratitude and spending, not with inflation of ego.",
    ],
    actionLine: "End with a money plan that includes worship, lawful effort, and generosity together.",
    reflectionPrompt: "If Allah answered this module with more money, what would prove that the answer was barakah and not only expansion?",
    evidence: [
      {
        eyebrow: "Hadith boundary",
        title: "True wealth is sufficiency in the soul.",
        detail:
          "The closing line remains the same: abundance without inner sufficiency is still a poor condition.",
        source: hadith("Sahih al-Bukhari 6446", "https://sunnah.com/bukhari:6446"),
      },
      {
        eyebrow: "Hadith anchor",
        title: "Devote yourself to worship and Allah fills the chest with richness and relieves poverty.",
        detail:
          "The hadith puts worship back at the center so financial pursuit does not become its own religion.",
        source: hadith("Jami` at-Tirmidhi 2466", "https://sunnah.com/tirmidhi:2466"),
      },
    ],
  }),
];

export const wealthModuleDefinition: ModuleDefinition = {
  id: "wealth",
  label: "Wealth & Provision",
  shortLabel: "Wealth",
  eyebrow: "Core module",
  title: "Halal wealth, provision, and sufficiency",
  subtitle:
    "A sourced module for lawful rizq, barakah, debt relief, and financial steadiness from Qur'anic duas and authentic Prophetic supplications.",
  description:
    "Move from the right boundary into Qur'anic and Prophetic duas for worldly good, wholesome provision, sufficiency, debt relief, and protected financial conduct.",
  authenticityBoundary:
    "Verified anchors: the Qur'an permits asking for worldly good, ties provision to taqwa, gratitude, repentance, and spending, and the Sunnah teaches direct duas for wholesome rizq, sufficiency, and debt relief. Hifzer is only sequencing those anchors into one guided module.",
  tone: "success",
  supportsCustomDeck: true,
  preludeSteps: wealthPreludeSteps,
  deckSteps: wealthDeckSteps,
  completionSteps: wealthCompletionSteps,
};
