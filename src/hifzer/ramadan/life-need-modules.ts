import type { JourneyStep } from "./laylat-al-qadr";
import {
  createStep,
  hadith,
  PRESENCE_TRACKER_NOTE,
  quran,
  type BuiltInDeckStep,
  type DuaJourneyModuleDefinition,
} from "./module-helpers";

function deckStep(step: Omit<BuiltInDeckStep, "sourceLinks">): BuiltInDeckStep {
  return createStep(step) as BuiltInDeckStep;
}

const distressPreludeSteps: JourneyStep[] = [
  createStep({
    id: "anxiety-distress-boundary",
    moduleId: "anxiety-distress",
    kind: "authentic",
    eyebrow: "Boundary",
    title: "Bring worry, sadness, and overwhelm to Allah without turning dua into self-help.",
    summary:
      "This module is built around sakinah, karb, ham, huzn, hardship, and refuge. It helps the user name distress before Allah and return to Qur'anic and Prophetic anchors.",
    tags: ["Sakinah", "Worry", "Hardship"],
    practice: [
      "Name the burden plainly: worry, sadness, panic, debt, pressure, or helplessness.",
      "Do not force yourself to sound fine before Allah.",
      "Begin with refuge and tawhid before asking for the feeling to change.",
    ],
    actionLine: "Start by telling the truth to Allah, then let the revealed words carry the next step.",
    reflectionPrompt: "What are you carrying right now that you have not named clearly in dua?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Sakinah is something Allah sends down into believing hearts.",
        detail:
          "The page should not promise instant calm; it should direct the user to the One who sends steadiness when the heart is under weight.",
        source: quran("Qur'an 48:4", "https://quran.com/48/4"),
      },
      {
        eyebrow: "Prophetic anchor",
        title: "The Prophet sought refuge from worry, grief, incapacity, and being overwhelmed.",
        detail:
          "That makes distress a valid category of dua, not a private weakness to hide.",
        source: hadith("Sahih al-Bukhari 6369", "https://sunnah.com/bukhari:6369"),
      },
    ],
  }),
  createStep({
    id: "anxiety-hardship-with-ease",
    moduleId: "anxiety-distress",
    kind: "authentic",
    eyebrow: "Hardship",
    title: "Hold hardship inside Allah's promise of ease, not inside panic.",
    summary:
      "Surah ash-Sharh repeats that ease is with hardship. This step frames overwhelm through revelation before the user enters the dua deck.",
    tags: ["Ease", "Patience", "Hope"],
    practice: [
      "Read the promise slowly before moving to personal requests.",
      "Separate what must be done today from what only Allah controls.",
      "Ask for help without pretending the hardship has disappeared.",
    ],
    actionLine: "Do the next possible obligation and leave the unseen outcome with Allah.",
    reflectionPrompt: "Which part of the hardship is yours to act on, and which part is only Allah's to open?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "With hardship comes ease.",
        detail:
          "The module should keep hardship real while refusing hopelessness.",
        source: quran("Qur'an 94:5-6", "https://quran.com/94/5-6"),
      },
      {
        eyebrow: "Qur'an anchor",
        title: "Allah does not burden a soul beyond what it can bear.",
        detail:
          "This gives the overwhelmed user a revealed frame for capacity and return.",
        source: quran("Qur'an 2:286", "https://quran.com/2/286"),
      },
    ],
  }),
  createStep({
    id: "anxiety-dua-before-spiral",
    moduleId: "anxiety-distress",
    kind: "guided",
    eyebrow: "Flow",
    title: "Move from spiral to refuge, then from refuge to one clear ask.",
    summary:
      "The experience should not ask the user to diagnose themselves. It should give them a safe order: refuge, tawhid, mercy, capacity, then one next step.",
    tags: ["Refuge", "Mercy", "Next step"],
    practice: [
      "Use the first dua for the heaviness itself.",
      "Use the middle duas to restore tawhid and dependence.",
      "End by asking for one concrete opening today.",
    ],
    actionLine: "Do not rush the deck. Let each dua answer one layer of the distress.",
    reflectionPrompt: "If Allah opened only one door today, which door would you ask Him to open?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Yunus called from darkness with tawhid and humility.",
        detail:
          "The Qur'anic model for distress is not performance; it is turning back to Allah from inside the darkness.",
        source: quran("Qur'an 21:87", "https://quran.com/21/87"),
      },
    ],
  }),
];

const distressDeckSteps: BuiltInDeckStep[] = [
  deckStep({
    id: "anxiety-dua-worry-grief",
    moduleId: "anxiety-distress",
    kind: "authentic",
    eyebrow: "Prophetic refuge",
    title: "Allahumma inni a'udhu bika min al-hammi wal-hazan",
    summary:
      "Begin with the comprehensive Prophetic refuge from worry, grief, incapacity, laziness, fear, miserliness, debt pressure, and being overpowered.",
    tags: ["Worry", "Grief", "Debt"],
    practice: [
      "Read it once for the heart, not as a race.",
      "Pause at the part that most matches your current pressure.",
      "Ask Allah to remove both the feeling and the causes behind it.",
    ],
    actionLine: "Let this dua name the heaviness for you.",
    reflectionPrompt: "Which word in this dua names your state most accurately?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "The Prophet used this refuge for worry and grief.",
        detail:
          "This is the primary authentic anchor for the module's anxiety, sadness, and overwhelm lane.",
        source: hadith("Sahih al-Bukhari 6369", "https://sunnah.com/bukhari:6369"),
      },
    ],
    deckItemKey: "worry-grief-refuge",
    deckOrder: 10,
    dua: {
      label: "Authentic dua",
      intro: "Use this when worry and sadness feel heavy in the body and mind.",
      arabic:
        "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْجُبْنِ وَالْبُخْلِ، وَضَلَعِ الدَّيْنِ، وَغَلَبَةِ الرِّجَالِ",
      transliteration:
        "Allahumma inni a'udhu bika min al-hammi wal-hazan, wal-'ajzi wal-kasal, wal-jubni wal-bukhl, wa dala'id-dayn, wa ghalabatir-rijal.",
      translation:
        "O Allah, I seek refuge in You from worry and grief, incapacity and laziness, cowardice and miserliness, heavy debt, and being overpowered.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "anxiety-dua-yunus",
    moduleId: "anxiety-distress",
    kind: "authentic",
    eyebrow: "Qur'anic distress",
    title: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin",
    summary:
      "Yunus called with this from layers of darkness. It returns the distressed heart to tawhid, Allah's perfection, and humble confession.",
    tags: ["Darkness", "Tawhid", "Return"],
    practice: [
      "Read it when you feel trapped inside a situation or inside your own thoughts.",
      "Let the first words restore Allah's oneness before you ask for rescue.",
      "Do not skip the humility at the end.",
    ],
    actionLine: "Answer darkness with tawhid before you answer it with analysis.",
    reflectionPrompt: "Where do you need rescue, and where do you need to return?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "The supplication of Yunus in distress.",
        detail:
          "The verse gives the module a Qur'anic distress anchor without inventing new wording.",
        source: quran("Qur'an 21:87", "https://quran.com/21/87"),
      },
    ],
    deckItemKey: "yunus-distress",
    deckOrder: 20,
    dua: {
      label: "Qur'anic dua",
      intro: "Read it when the heaviness feels like a darkness you cannot exit by yourself.",
      arabic: "لَا إِلَـٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ",
      transliteration: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin.",
      translation: "There is no god but You. Glory be to You. I have truly been among the wrongdoers.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "anxiety-dua-mercy-affairs",
    moduleId: "anxiety-distress",
    kind: "authentic",
    eyebrow: "Distress",
    title: "Allahumma rahmataka arju",
    summary:
      "This distress dua asks Allah for mercy, protection from being left to oneself, and repair of every affair.",
    tags: ["Mercy", "Repair", "Dependence"],
    practice: [
      "Use it when you do not trust your own strength right now.",
      "Pause on 'do not leave me to myself' and mean it.",
      "Name one affair you are asking Allah to repair.",
    ],
    actionLine: "Ask Allah to repair the affair before you try to carry it alone.",
    reflectionPrompt: "Which affair needs Allah's repair most urgently?",
    evidence: [
      {
        eyebrow: "Reported dua",
        title: "A distress supplication preserved in the adhkar collections.",
        detail:
          "The wording keeps the user dependent on Allah's mercy rather than self-sufficiency.",
        source: hadith("Hisn al-Muslim 123", "https://sunnah.com/hisn/124"),
      },
    ],
    deckItemKey: "mercy-repair-affairs",
    deckOrder: 30,
    dua: {
      label: "Distress dua",
      intro: "Use this when the problem feels wider than your ability to hold it together.",
      arabic:
        "اللَّهُمَّ رَحْمَتَكَ أَرْجُو، فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ، لَا إِلَهَ إِلَّا أَنْتَ",
      transliteration:
        "Allahumma rahmataka arju, fala takilni ila nafsi tarfata 'ayn, wa aslih li sha'ni kullah, la ilaha illa ant.",
      translation:
        "O Allah, I hope for Your mercy. Do not leave me to myself even for a blink, rectify all of my affairs, there is no god but You.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "anxiety-dua-karb",
    moduleId: "anxiety-distress",
    kind: "authentic",
    eyebrow: "Karb",
    title: "La ilaha illallahul-'Azimul-Halim",
    summary:
      "The Prophetic dua for severe distress anchors the heart in Allah's greatness, forbearance, and lordship over the heavens, earth, and Throne.",
    tags: ["Karb", "Tawhid", "Awe"],
    practice: [
      "Use it when the distress is bigger than ordinary worry.",
      "Read it slowly enough that Allah's greatness becomes larger than the pressure.",
      "Let it reduce the fear of people, outcomes, and timelines.",
    ],
    actionLine: "Magnify Allah until the problem returns to its real size.",
    reflectionPrompt: "What has become too large in your chest compared with Allah's greatness?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "The Prophet invoked Allah with this at a time of distress.",
        detail:
          "This gives the module a clear authentic karb anchor.",
        source: hadith("Sahih al-Bukhari 6345", "https://sunnah.com/bukhari:6345"),
      },
    ],
    deckItemKey: "karb-greatness",
    deckOrder: 40,
    dua: {
      label: "Authentic distress dua",
      intro: "Use this when fear or pressure feels severe.",
      arabic:
        "لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَوَاتِ وَالْأَرْضِ، رَبُّ الْعَرْشِ الْعَظِيمِ",
      transliteration:
        "La ilaha illallahul-'Azimul-Halim, la ilaha illallah Rabbus-samawati wal-ard, Rabbul-'Arshil-'Azim.",
      translation:
        "There is no god but Allah, the Magnificent, the Forbearing. There is no god but Allah, Lord of the heavens and earth, Lord of the Magnificent Throne.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "anxiety-dua-capacity",
    moduleId: "anxiety-distress",
    kind: "authentic",
    eyebrow: "Capacity",
    title: "Rabbana wa la tuhammilna ma la taqata lana bih",
    summary:
      "This Qur'anic dua asks Allah not to place upon the believer what they cannot bear and to pardon, forgive, and have mercy.",
    tags: ["Overwhelm", "Capacity", "Mercy"],
    practice: [
      "Use it when the day feels heavier than your capacity.",
      "Ask for pardon and mercy, not only lighter circumstances.",
      "Pair the dua with one small next action you can actually do.",
    ],
    actionLine: "Ask Allah for mercy around your limits, then act inside the limit you have.",
    reflectionPrompt: "What is the smallest faithful step you can take after this dua?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "A closing dua of al-Baqarah about burden, pardon, and mercy.",
        detail:
          "This makes overwhelm a direct Qur'anic category of asking.",
        source: quran("Qur'an 2:286", "https://quran.com/2/286"),
      },
    ],
    deckItemKey: "capacity-mercy",
    deckOrder: 50,
    dua: {
      label: "Qur'anic dua",
      intro: "Read this when the burden feels beyond what you can hold.",
      arabic:
        "رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ، وَاعْفُ عَنَّا، وَاغْفِرْ لَنَا، وَارْحَمْنَا",
      transliteration:
        "Rabbana wa la tuhammilna ma la taqata lana bih, wa'fu 'anna, waghfir lana, warhamna.",
      translation:
        "Our Lord, do not place on us what we have no strength to bear. Pardon us, forgive us, and have mercy on us.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
];

const distressCompletionSteps: JourneyStep[] = [
  createStep({
    id: "anxiety-distress-completion",
    moduleId: "anxiety-distress",
    kind: "guided",
    eyebrow: "Close",
    title: "Leave with refuge, one request, and one next step.",
    summary:
      "This module should end with the user still connected to Allah, not simply soothed. Close by carrying one dua and one practical next step into the day.",
    practice: [
      "Choose the dua that matched your state most closely.",
      "Write one private note if the same worry keeps returning.",
      "Take one lawful next step, even if it is small.",
    ],
    actionLine: "Sakinah is sought from Allah and lived through obedience.",
    reflectionPrompt: "What will you ask again tonight if the heaviness returns?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Allah is sufficient and the best disposer of affairs.",
        detail:
          "End the module by returning control to Allah rather than replaying the spiral.",
        source: quran("Qur'an 3:173", "https://quran.com/3/173"),
      },
    ],
  }),
];

const istikharaPreludeSteps: JourneyStep[] = [
  createStep({
    id: "istikhara-define-matter",
    moduleId: "istikhara-decisions",
    kind: "authentic",
    eyebrow: "Decision",
    title: "Istikhara begins with a real matter, not a vague feeling.",
    summary:
      "The Prophetic teaching says to name the matter. This module helps the user clarify the decision before praying, especially for proposals, marriage concerns, work, study, and family choices.",
    tags: ["Istikhara", "Clarity", "Marriage"],
    practice: [
      "Write the actual decision in one sentence.",
      "Separate facts, fears, and what you do not yet know.",
      "Do not ask istikhara to replace halal due diligence.",
    ],
    actionLine: "Before you ask for direction, name what you are asking about.",
    reflectionPrompt: "What exact decision are you bringing to Allah?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "The Prophet taught istikhara in all matters and told the person to mention the need.",
        detail:
          "This makes the flow broader than a single card for the istikhara dua.",
        source: hadith("Sahih al-Bukhari 6382", "https://sunnah.com/bukhari:6382"),
      },
    ],
  }),
  createStep({
    id: "istikhara-consult-then-trust",
    moduleId: "istikhara-decisions",
    kind: "authentic",
    eyebrow: "Consultation",
    title: "Consult, decide with integrity, then put trust in Allah.",
    summary:
      "The Qur'an joins consultation with tawakkul. This flow should push the user to ask reliable people and then stop trying to control the unseen.",
    tags: ["Shura", "Tawakkul", "Due diligence"],
    practice: [
      "Ask someone trustworthy who understands the issue.",
      "For marriage, check religion, character, compatibility, and practical responsibilities.",
      "After consultation and istikhara, move without demanding a sign Allah did not promise.",
    ],
    actionLine: "Consult well, then let tawakkul begin where your knowledge ends.",
    reflectionPrompt: "Who has enough wisdom and honesty to help you see this clearly?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Consult them in the matter, then rely upon Allah.",
        detail:
          "The flow should hold both shura and tawakkul together.",
        source: quran("Qur'an 3:159", "https://quran.com/3/159"),
      },
      {
        eyebrow: "Marriage anchor",
        title: "Religion and character are central marriage considerations.",
        detail:
          "For proposals, the module should guide the user toward Islamic criteria rather than only emotion or pressure.",
        source: hadith("Sahih al-Bukhari 5090", "https://sunnah.com/bukhari:5090"),
      },
    ],
  }),
  createStep({
    id: "istikhara-release-outcome",
    moduleId: "istikhara-decisions",
    kind: "guided",
    eyebrow: "Acceptance",
    title: "The answer may be ease, obstruction, clarity, or redirection.",
    summary:
      "Istikhara is not a promise of a dream. It is asking Allah to choose, ease what is good, turn away what is harmful, and make the heart pleased with His decree.",
    tags: ["Acceptance", "Redirection", "Ridha"],
    practice: [
      "Watch whether the path opens lawfully or closes without forcing it.",
      "Do not confuse anxiety with revelation.",
      "Ask Allah to make you pleased with the good He chooses.",
    ],
    actionLine: "Do not worship the option. Worship Allah and accept what He opens.",
    reflectionPrompt: "If Allah redirects you, what would surrender look like?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "You may dislike what is good for you or love what is harmful.",
        detail:
          "This is the emotional center of decision-making with tawakkul.",
        source: quran("Qur'an 2:216", "https://quran.com/2/216"),
      },
    ],
  }),
];

const istikharaDeckSteps: BuiltInDeckStep[] = [
  deckStep({
    id: "istikhara-dua-full",
    moduleId: "istikhara-decisions",
    kind: "authentic",
    eyebrow: "Istikhara",
    title: "The istikhara dua",
    summary:
      "The central supplication asks Allah by His knowledge, power, and bounty to decree what is good, turn away what is harmful, and make the heart content.",
    tags: ["Istikhara", "Decision", "Tawakkul"],
    practice: [
      "Pray two non-obligatory rak'at before this dua when you are able.",
      "Mention the specific matter where the dua says 'this matter'.",
      "Do not use this as magic; use it as surrender after due diligence.",
    ],
    actionLine: "Name the matter, ask Allah to choose, and release the unseen.",
    reflectionPrompt: "What would it mean to be pleased with Allah's choice, not just your preferred outcome?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "The Prophetic istikhara wording.",
        detail:
          "This is the main authenticated dua for decisions in this module.",
        source: hadith("Sahih al-Bukhari 6382", "https://sunnah.com/bukhari:6382"),
      },
    ],
    deckItemKey: "istikhara-full",
    deckOrder: 10,
    dua: {
      label: "Authentic istikhara dua",
      intro: "Use after two non-obligatory rak'at when you are seeking Allah's choice in a specific matter.",
      arabic:
        "اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ، وَتَعْلَمُ وَلَا أَعْلَمُ، وَأَنْتَ عَلَّامُ الْغُيُوبِ. اللَّهُمَّ إِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ خَيْرٌ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي فَاقْدُرْهُ لِي وَيَسِّرْهُ لِي ثُمَّ بَارِكْ لِي فِيهِ، وَإِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ شَرٌّ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي فَاصْرِفْهُ عَنِّي وَاصْرِفْنِي عَنْهُ، وَاقْدُرْ لِيَ الْخَيْرَ حَيْثُ كَانَ، ثُمَّ رَضِّنِي بِهِ",
      transliteration:
        "Allahumma inni astakhiruka bi'ilmika, wa astaqdiruka biqudratika, wa as'aluka min fadlikal-'azim. Fa innaka taqdiru wa la aqdir, wa ta'lamu wa la a'lam, wa anta 'allamul-ghuyub. Allahumma in kunta ta'lamu anna hadhal-amra khayrun li fi dini wa ma'ashi wa 'aqibati amri faqdurhu li wa yassirhu li thumma barik li fih. Wa in kunta ta'lamu anna hadhal-amra sharrun li fi dini wa ma'ashi wa 'aqibati amri fasrifhu 'anni wasrifni 'anhu, waqdur liyal-khayra haythu kana, thumma raddini bih.",
      translation:
        "O Allah, I seek Your choice by Your knowledge, Your power by Your ability, and Your great bounty. If this matter is good for my religion, livelihood, and final outcome, decree it, ease it, and bless it for me. If it is harmful for my religion, livelihood, and final outcome, turn it away from me and turn me away from it. Decree good for me wherever it is, then make me pleased with it.",
      trackerLabel: "Presence counter",
      trackerNote:
        "The source teaches the dua with two non-obligatory rak'at and naming the matter. The counter is only a focus aid.",
    },
  }),
  deckStep({
    id: "istikhara-dua-musa-need",
    moduleId: "istikhara-decisions",
    kind: "authentic",
    eyebrow: "Need",
    title: "Rabbi inni lima anzalta ilayya min khayrin faqir",
    summary:
      "Musa made this dua after serving others while in need. It is fitting when the decision involves marriage, work, relocation, or provision.",
    tags: ["Need", "Marriage", "Opening"],
    practice: [
      "Read it after you have acted with adab and still need Allah's opening.",
      "Do not dictate the form of the good; ask for the good Allah sends.",
      "Use it when the next door is not yet visible.",
    ],
    actionLine: "Ask as someone poor before Allah's next opening.",
    reflectionPrompt: "What good are you asking Allah to send without controlling its shape?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Musa's need before Allah.",
        detail:
          "Its story context makes it useful in decisions around future, work, and marriage without making it marriage-only.",
        source: quran("Qur'an 28:24", "https://quran.com/28/24"),
      },
    ],
    deckItemKey: "musa-need",
    deckOrder: 20,
    dua: {
      label: "Qur'anic dua",
      intro: "Use when you need Allah to open a good path after doing what you can.",
      arabic: "رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ",
      transliteration: "Rabbi inni lima anzalta ilayya min khayrin faqir.",
      translation: "My Lord, I am truly in need of whatever good You send down to me.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "istikhara-dua-open-chest",
    moduleId: "istikhara-decisions",
    kind: "authentic",
    eyebrow: "Clarity",
    title: "Rabbishrah li sadri",
    summary:
      "When the decision requires a conversation, proposal discussion, family meeting, or difficult explanation, Musa's dua asks for an opened chest and clear speech.",
    tags: ["Conversation", "Clarity", "Family"],
    practice: [
      "Use before a serious conversation.",
      "Ask for clarity, not victory over the other person.",
      "Speak after dua with truth and restraint.",
    ],
    actionLine: "Ask Allah to open the chest before you open the conversation.",
    reflectionPrompt: "What needs to be said with more clarity and less fear?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Musa asked for an opened chest and untied speech.",
        detail:
          "Decision flows often need guided speech as much as private emotion.",
        source: quran("Qur'an 20:25-28", "https://quran.com/20/25-28"),
      },
    ],
    deckItemKey: "open-chest",
    deckOrder: 30,
    dua: {
      label: "Qur'anic dua",
      intro: "Use before a proposal conversation, family discussion, or hard decision meeting.",
      arabic: "رَبِّ اشْرَحْ لِي صَدْرِي، وَيَسِّرْ لِي أَمْرِي، وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي، يَفْقَهُوا قَوْلِي",
      transliteration:
        "Rabbishrah li sadri, wa yassir li amri, wahlul 'uqdatan min lisani, yafqahu qawli.",
      translation:
        "My Lord, open my chest, ease my affair, and untie the knot from my tongue so they may understand my words.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "istikhara-dua-entrust-affair",
    moduleId: "istikhara-decisions",
    kind: "authentic",
    eyebrow: "Entrust",
    title: "Wa ufawwidu amri ilallah",
    summary:
      "This Qur'anic line helps the user hand the affair back to Allah after consultation, prayer, and a lawful decision.",
    tags: ["Tawakkul", "Release", "Outcome"],
    practice: [
      "Use after you have made the best decision you can.",
      "Do not keep reopening the same fear unless new facts appear.",
      "Ask Allah to watch over what you cannot watch over.",
    ],
    actionLine: "Let the decision leave your grip and enter Allah's care.",
    reflectionPrompt: "What part of the outcome are you still trying to own?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "I entrust my affair to Allah.",
        detail:
          "This is the tawakkul close for a decision flow.",
        source: quran("Qur'an 40:44", "https://quran.com/40/44"),
      },
    ],
    deckItemKey: "entrust-affair",
    deckOrder: 40,
    dua: {
      label: "Qur'anic line",
      intro: "Use when you have done what you can and need to stop gripping the outcome.",
      arabic: "وَأُفَوِّضُ أَمْرِي إِلَى اللَّهِ إِنَّ اللَّهَ بَصِيرٌ بِالْعِبَادِ",
      transliteration: "Wa ufawwidu amri ilallah, innallaha basirun bil-'ibad.",
      translation: "I entrust my affair to Allah. Surely Allah sees His servants.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "istikhara-dua-spouse-family",
    moduleId: "istikhara-decisions",
    kind: "authentic",
    eyebrow: "Marriage",
    title: "Rabbana hablana min azwajina wa dhurriyyatina qurrata a'yun",
    summary:
      "For proposals and spouse concerns, this dua asks for spouses and children who become comfort to the eyes and for leadership in taqwa.",
    tags: ["Marriage", "Family", "Taqwa"],
    practice: [
      "Use when the decision concerns marriage or the future of a household.",
      "Ask for a home that helps obedience, not only attachment.",
      "Let the dua raise the standard from chemistry to righteousness.",
    ],
    actionLine: "Ask for a future that comforts the eyes because it leads toward Allah.",
    reflectionPrompt: "Does this option help your deen, your character, and your future home?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "A dua for spouses, children, and taqwa leadership.",
        detail:
          "This keeps marriage decisions tied to the final purpose of the home.",
        source: quran("Qur'an 25:74", "https://quran.com/25/74"),
      },
    ],
    deckItemKey: "spouse-family-taqwa",
    deckOrder: 50,
    dua: {
      label: "Qur'anic dua",
      intro: "Use for marriage decisions, spouse concerns, and the future of a home.",
      arabic:
        "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ، وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
      transliteration:
        "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yun, waj'alna lil-muttaqina imama.",
      translation:
        "Our Lord, grant us comfort in our spouses and offspring, and make us leaders for the mindful.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
];

const istikharaCompletionSteps: JourneyStep[] = [
  createStep({
    id: "istikhara-completion",
    moduleId: "istikhara-decisions",
    kind: "guided",
    eyebrow: "Close",
    title: "Leave with a decision note, one consultation, and tawakkul.",
    summary:
      "Close by recording the matter, the people consulted, the next lawful step, and what you are entrusting to Allah.",
    practice: [
      "Write the decision in your journal if the matter is heavy.",
      "Choose one next action: ask, pause, investigate, proceed, or decline.",
      "Repeat istikhara if the matter remains live, not as obsessive reassurance.",
    ],
    actionLine: "The flow ends when trust begins to shape action.",
    reflectionPrompt: "What next step can you take without trying to own the unseen?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "After resolve comes tawakkul.",
        detail:
          "Consultation is not complete until the believer relies upon Allah.",
        source: quran("Qur'an 3:159", "https://quran.com/3/159"),
      },
    ],
  }),
];

const healingPreludeSteps: JourneyStep[] = [
  createStep({
    id: "healing-shifa-boundary",
    moduleId: "healing-shifa",
    kind: "authentic",
    eyebrow: "Boundary",
    title: "Ask for shifa while still taking the means Allah has opened.",
    summary:
      "Healing in this module means turning to Allah as ash-Shafi, making authentic dua, visiting and caring for the sick, and not replacing medical care with app content.",
    tags: ["Shifa", "Means", "Care"],
    practice: [
      "Make dua for the sick person by name if appropriate.",
      "Use medical care and family support as lawful means.",
      "Keep the heart attached to Allah, not to the means.",
    ],
    actionLine: "Ask the Healer while taking the means with humility.",
    reflectionPrompt: "Who are you asking Allah to heal, and what means are you responsible to take?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Ibrahim says: when I am ill, He heals me.",
        detail:
          "The module begins with Allah as the source of healing.",
        source: quran("Qur'an 26:80", "https://quran.com/26/80"),
      },
      {
        eyebrow: "Hadith anchor",
        title: "The Prophet used a direct shifa supplication for family illness.",
        detail:
          "This gives the module its main authentic dua anchor.",
        source: hadith("Sahih al-Bukhari 5743", "https://sunnah.com/bukhari:5743"),
      },
    ],
  }),
  createStep({
    id: "healing-visit-with-mercy",
    moduleId: "healing-shifa",
    kind: "authentic",
    eyebrow: "Visiting",
    title: "Visiting and caring for the sick is part of the worship, not extra.",
    summary:
      "This module is for the ill person, the caregiver, and the visitor. It should help them bring dua, tenderness, and remembrance into illness.",
    tags: ["Visit", "Caregiver", "Mercy"],
    practice: [
      "If you are visiting, keep the visit gentle and useful.",
      "If you are caring for parents or family, ask Allah for patience and service with ihsan.",
      "Say what gives hope without making promises you do not control.",
    ],
    actionLine: "Let your visit carry dua, not pressure.",
    reflectionPrompt: "What would make your care more merciful today?",
    evidence: [
      {
        eyebrow: "Sunnah anchor",
        title: "The Prophet would say words of purification and hope when visiting the sick.",
        detail:
          "The sickbed is not only a medical place; it is also a place of mercy and remembrance.",
        source: hadith("Sahih al-Bukhari 3616", "https://sunnah.com/bukhari:3616"),
      },
    ],
  }),
  createStep({
    id: "healing-patience-meaning",
    moduleId: "healing-shifa",
    kind: "guided",
    eyebrow: "Patience",
    title: "Illness can be painful and still held inside Allah's mercy.",
    summary:
      "The Sunnah teaches that fatigue, illness, sorrow, and distress can become expiation. This does not minimize pain; it gives pain an akhirah frame.",
    tags: ["Patience", "Expiation", "Akhirah"],
    practice: [
      "Do not tell the sick person their pain is small.",
      "Ask Allah for healing and reward together.",
      "Let the akhirah frame soften despair without silencing grief.",
    ],
    actionLine: "Ask for shifa fully and for reward through what remains difficult.",
    reflectionPrompt: "Where do you need healing, and where do you need patience while healing is delayed?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "Hardship can erase sins for the believer.",
        detail:
          "This gives illness meaning without turning it into a simplistic slogan.",
        source: hadith("Sahih al-Bukhari 5641", "https://sunnah.com/bukhari:5641"),
      },
    ],
  }),
];

const healingDeckSteps: BuiltInDeckStep[] = [
  deckStep({
    id: "healing-dua-rabban-nas",
    moduleId: "healing-shifa",
    kind: "authentic",
    eyebrow: "Shifa",
    title: "Allahumma Rabban-nas, adhhib al-ba's",
    summary:
      "The primary shifa dua asks the Lord of mankind to remove harm and grant a healing that leaves no illness behind.",
    tags: ["Shifa", "Illness", "Ruqyah"],
    practice: [
      "Read it for yourself or another person.",
      "If appropriate, place your hand gently near the place of pain as the Sunnah describes.",
      "Keep the belief clear: there is no healing except Allah's healing.",
    ],
    actionLine: "Ask ash-Shafi directly.",
    reflectionPrompt: "What healing are you asking Allah for by name?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "The Prophet used this shifa dua for illness.",
        detail:
          "This is the central authentic supplication of the healing module.",
        source: hadith("Sahih al-Bukhari 5743", "https://sunnah.com/bukhari:5743"),
      },
    ],
    deckItemKey: "rabban-nas-shifa",
    deckOrder: 10,
    dua: {
      label: "Authentic shifa dua",
      intro: "Use for yourself, family, parents, or someone you are visiting.",
      arabic:
        "اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اشْفِهِ وَأَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا",
      transliteration:
        "Allahumma Rabban-nas, adhhib al-ba's, ishfihi wa Antash-Shafi, la shifa'a illa shifa'uka, shifa'an la yughadiru saqama.",
      translation:
        "O Allah, Lord of mankind, remove the harm and heal. You are the Healer. There is no healing except Your healing, a healing that leaves no illness.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "healing-dua-great-throne",
    moduleId: "healing-shifa",
    kind: "authentic",
    eyebrow: "Visit",
    title: "As'alullahal-'Azim Rabbal-'Arshil-'Azim an yashfiyak",
    summary:
      "A visiting-the-sick supplication asking Allah the Magnificent, Lord of the Magnificent Throne, to heal the person.",
    tags: ["Visit", "Shifa", "Seven"],
    practice: [
      "Use this when visiting or calling someone who is ill.",
      "If you use the narrated seven, do it as a Sunnah-linked practice, not performance.",
      "Say it with gentleness and without pressuring the sick person to respond.",
    ],
    actionLine: "Make the visit carry a real dua.",
    reflectionPrompt: "Who should receive this dua from you today?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "A supplication for the sick said seven times.",
        detail:
          "This is especially useful for a visitor or caregiver lane.",
        source: hadith("Riyad as-Salihin 906", "https://sunnah.com/riyadussalihin:906"),
      },
    ],
    deckItemKey: "great-throne-heal-you",
    deckOrder: 20,
    dua: {
      label: "Visiting-the-sick dua",
      intro: "Use for someone who is ill. Change the wording if you are asking for yourself.",
      arabic: "أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ",
      transliteration: "As'alullahal-'Azim Rabbal-'Arshil-'Azim an yashfiyak.",
      translation: "I ask Allah the Magnificent, Lord of the Magnificent Throne, to heal you.",
      trackerLabel: "Seven-count support",
      trackerNote:
        "The narration mentions saying it seven times when visiting a sick person whose death is not imminent.",
    },
  }),
  deckStep({
    id: "healing-dua-jibril-ruqyah",
    moduleId: "healing-shifa",
    kind: "authentic",
    eyebrow: "Ruqyah",
    title: "Bismillahi arqik",
    summary:
      "Jibril recited this ruqyah for the Prophet. It asks Allah to heal from what harms, including the evil of an envier.",
    tags: ["Ruqyah", "Protection", "Healing"],
    practice: [
      "Use it when harm, illness, or envy is feared.",
      "Keep the wording clear and free from hidden formulas.",
      "Remember that Allah heals; the wording is a means.",
    ],
    actionLine: "Use ruqyah as clear refuge, not fear theatre.",
    reflectionPrompt: "What harm are you asking Allah to remove and heal?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "Jibril performed ruqyah with this wording.",
        detail:
          "It connects healing and protection without leaving the Prophetic boundary.",
        source: hadith("Riyad as-Salihin 908", "https://sunnah.com/riyadussalihin:908"),
      },
    ],
    deckItemKey: "jibril-ruqyah",
    deckOrder: 30,
    dua: {
      label: "Authentic ruqyah",
      intro: "Use when seeking healing and protection from what harms.",
      arabic:
        "بِاسْمِ اللَّهِ أَرْقِيكَ، مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ، مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ، اللَّهُ يَشْفِيكَ، بِاسْمِ اللَّهِ أَرْقِيكَ",
      transliteration:
        "Bismillahi arqik, min kulli shay'in yu'dhik, min sharri kulli nafsin aw 'ayni hasid, Allahu yashfik, bismillahi arqik.",
      translation:
        "In Allah's name I recite over you from everything that harms you, from every soul or envious eye. May Allah heal you. In Allah's name I recite over you.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "healing-dua-ayyub",
    moduleId: "healing-shifa",
    kind: "authentic",
    eyebrow: "Qur'anic pain",
    title: "Anni massaniyad-durru wa anta arhamur-rahimin",
    summary:
      "Ayyub's dua names harm and turns to Allah's mercy without complaint against Allah.",
    tags: ["Pain", "Mercy", "Patience"],
    practice: [
      "Use it when pain has lasted longer than you expected.",
      "Name the harm without losing adab with Allah.",
      "Ask through Allah's mercy before asking through your own endurance.",
    ],
    actionLine: "Tell Allah the harm and hold onto His mercy.",
    reflectionPrompt: "What pain are you naming before the Most Merciful?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Ayyub called upon Allah when touched by harm.",
        detail:
          "This gives the module a Qur'anic lane for chronic pain, recovery, and delayed relief.",
        source: quran("Qur'an 21:83", "https://quran.com/21/83"),
      },
    ],
    deckItemKey: "ayyub-harm-mercy",
    deckOrder: 40,
    dua: {
      label: "Qur'anic dua",
      intro: "Use when illness or pain feels prolonged.",
      arabic: "أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ",
      transliteration: "Anni massaniyad-durru wa anta arhamur-rahimin.",
      translation: "Harm has touched me, and You are the Most Merciful of those who show mercy.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "healing-dua-patient-hope",
    moduleId: "healing-shifa",
    kind: "authentic",
    eyebrow: "Sickbed words",
    title: "La ba'sa, tahurun in sha Allah",
    summary:
      "The Prophet would say this when visiting an ill person: words of hope, purification, and Allah's will.",
    tags: ["Visit", "Hope", "Purification"],
    practice: [
      "Say it gently to someone who is sick.",
      "Do not use it to dismiss their pain.",
      "Follow it with practical care if they need help.",
    ],
    actionLine: "Give hope without minimizing the illness.",
    reflectionPrompt: "How can your words make the sick person feel seen, not dismissed?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "A Prophetic phrase when visiting the sick.",
        detail:
          "It fits the module's visiting and caregiving use case.",
        source: hadith("Sahih al-Bukhari 3616", "https://sunnah.com/bukhari:3616"),
      },
    ],
    deckItemKey: "la-basa-tahurun",
    deckOrder: 50,
    dua: {
      label: "Sickbed phrase",
      intro: "Use as words of hope when visiting or speaking to someone sick.",
      arabic: "لَا بَأْسَ، طَهُورٌ إِنْ شَاءَ اللَّهُ",
      transliteration: "La ba'sa, tahurun in sha Allah.",
      translation: "No harm; may it be purification, if Allah wills.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
];

const healingCompletionSteps: JourneyStep[] = [
  createStep({
    id: "healing-shifa-completion",
    moduleId: "healing-shifa",
    kind: "guided",
    eyebrow: "Close",
    title: "Leave with dua, care, and a means to take.",
    summary:
      "Healing duas should lead to dependence on Allah and responsible care: treatment, rest, service, visiting, or checking on the sick.",
    practice: [
      "Choose one dua to repeat for the sick person.",
      "Choose one practical care action.",
      "If you are the patient, ask for both shifa and patience.",
    ],
    actionLine: "Tie dua to mercy in action.",
    reflectionPrompt: "What care action should follow your dua?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Allah is the One who heals.",
        detail:
          "End the module with the heart returned to Allah as ash-Shafi.",
        source: quran("Qur'an 26:80", "https://quran.com/26/80"),
      },
    ],
  }),
];

const griefPreludeSteps: JourneyStep[] = [
  createStep({
    id: "grief-loss-boundary",
    moduleId: "grief-loss",
    kind: "authentic",
    eyebrow: "Loss",
    title: "Grief is not a failure of iman; it needs return, patience, and mercy.",
    summary:
      "This module is for loss, loneliness, bereavement, and old wounds that still ache. It anchors the user in istirja, sabr, and dua for the deceased.",
    tags: ["Loss", "Loneliness", "Sabr"],
    practice: [
      "Name the loss without rushing to explain it away.",
      "Say istirja as worship, not as emotional denial.",
      "Ask Allah for reward, replacement, mercy, and companionship.",
    ],
    actionLine: "Let grief speak to Allah before it speaks to everyone else.",
    reflectionPrompt: "What loss are you still carrying before Allah?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Those struck by calamity say: to Allah we belong and to Him we return.",
        detail:
          "This is the primary Qur'anic frame for loss.",
        source: quran("Qur'an 2:155-157", "https://quran.com/2/155-157"),
      },
      {
        eyebrow: "Hadith anchor",
        title: "The calamity dua asks for reward and better replacement.",
        detail:
          "It gives grieving users a direct Sunnah-linked action.",
        source: hadith("Hisn al-Muslim 154", "https://sunnah.com/hisn/155"),
      },
    ],
  }),
  createStep({
    id: "grief-complain-to-allah",
    moduleId: "grief-loss",
    kind: "authentic",
    eyebrow: "Loneliness",
    title: "Take the complaint to Allah without pretending the ache is gone.",
    summary:
      "Ya'qub says he complains of sorrow and grief to Allah. That gives the lonely or grieving user permission to be emotionally honest with Allah.",
    tags: ["Sorrow", "Loneliness", "Honesty"],
    practice: [
      "Tell Allah what you miss.",
      "Tell Allah what still hurts.",
      "Do not let loneliness become the reason you stop asking.",
    ],
    actionLine: "The heart can be broken and still turned toward Allah.",
    reflectionPrompt: "What would you say to Allah if you stopped editing yourself?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Ya'qub complains of sorrow and grief only to Allah.",
        detail:
          "This is the module's emotional honesty anchor.",
        source: quran("Qur'an 12:86", "https://quran.com/12/86"),
      },
    ],
  }),
  createStep({
    id: "grief-mercy-for-deceased",
    moduleId: "grief-loss",
    kind: "guided",
    eyebrow: "Mercy",
    title: "Love after death becomes dua, forgiveness, and mercy.",
    summary:
      "For bereavement, the module should help the user move from helpless love to beneficial dua for the person who died.",
    tags: ["Deceased", "Mercy", "Forgiveness"],
    practice: [
      "Make dua for the deceased by name.",
      "Ask Allah to forgive, have mercy, expand the grave, and protect them.",
      "Let the private journal hold memories without turning grief into public performance.",
    ],
    actionLine: "When you cannot serve them with your hands, serve them with dua.",
    reflectionPrompt: "What mercy are you asking Allah to pour over them?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "The Prophet supplicated extensively for the deceased.",
        detail:
          "This makes grief active through mercy and forgiveness.",
        source: hadith("Sahih Muslim 963d", "https://sunnah.com/muslim:963d"),
      },
    ],
  }),
];

const griefDeckSteps: BuiltInDeckStep[] = [
  deckStep({
    id: "grief-dua-calamity",
    moduleId: "grief-loss",
    kind: "authentic",
    eyebrow: "Calamity",
    title: "Inna lillahi wa inna ilayhi raji'un",
    summary:
      "The calamity dua returns the loss to Allah, asks for reward, and asks Allah to replace what was lost with better.",
    tags: ["Calamity", "Return", "Replacement"],
    practice: [
      "Say it when the loss is fresh or when the wound returns.",
      "Ask for reward without pretending the pain is easy.",
      "Ask Allah for better in the form He knows is better.",
    ],
    actionLine: "Return the loss to Allah and ask Him not to leave you empty.",
    reflectionPrompt: "What kind of better are you willing to let Allah define?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "A supplication for one afflicted by calamity.",
        detail:
          "This is the module's core grief and loss dua.",
        source: hadith("Hisn al-Muslim 154", "https://sunnah.com/hisn/155"),
      },
    ],
    deckItemKey: "calamity-istirja",
    deckOrder: 10,
    dua: {
      label: "Calamity dua",
      intro: "Use when grief, shock, or an old loss returns.",
      arabic: "إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ، اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي، وَاخْلُفْ لِي خَيْرًا مِنْهَا",
      transliteration:
        "Inna lillahi wa inna ilayhi raji'un. Allahumma'jurni fi musibati, wakhluf li khayran minha.",
      translation:
        "We belong to Allah and to Him we return. O Allah, reward me in my calamity and replace it for me with better.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "grief-dua-yaqub",
    moduleId: "grief-loss",
    kind: "authentic",
    eyebrow: "Sorrow",
    title: "Innama ashku baththi wa huzni ilallah",
    summary:
      "Ya'qub's words give the grieving heart a Qur'anic way to carry sorrow without cutting itself off from Allah.",
    tags: ["Sorrow", "Loneliness", "Complaint"],
    practice: [
      "Use this when the grief is too private for people.",
      "Tell Allah the parts you cannot explain cleanly.",
      "Let the dua keep you connected instead of isolated.",
    ],
    actionLine: "Complain to Allah without complaining about Allah.",
    reflectionPrompt: "What sorrow needs to be spoken only to Allah?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Ya'qub's grief was carried to Allah.",
        detail:
          "This is essential for loneliness and emotionally real grief.",
        source: quran("Qur'an 12:86", "https://quran.com/12/86"),
      },
    ],
    deckItemKey: "yaqub-sorrow",
    deckOrder: 20,
    dua: {
      label: "Qur'anic line",
      intro: "Use when people cannot understand the shape of your grief.",
      arabic: "إِنَّمَا أَشْكُو بَثِّي وَحُزْنِي إِلَى اللَّهِ",
      transliteration: "Innama ashku baththi wa huzni ilallah.",
      translation: "I only complain of my anguish and sorrow to Allah.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "grief-dua-deceased",
    moduleId: "grief-loss",
    kind: "authentic",
    eyebrow: "For the deceased",
    title: "Allahummaghfir lahu warhamhu",
    summary:
      "A funeral supplication asking Allah to forgive, have mercy, give peace, honor the arrival, expand the grave, and protect from punishment.",
    tags: ["Deceased", "Mercy", "Akhirah"],
    practice: [
      "Use for a deceased Muslim by changing the pronoun if needed.",
      "Read slowly and picture mercy reaching them from Allah.",
      "Keep love beneficial by making dua for their akhirah.",
    ],
    actionLine: "Turn love into mercy-seeking for their next life.",
    reflectionPrompt: "Which part of this dua do you most want Allah to grant them?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "A Prophetic funeral supplication.",
        detail:
          "This anchors the bereavement path in authentic dua for the deceased.",
        source: hadith("Sahih Muslim 963d", "https://sunnah.com/muslim:963d"),
      },
    ],
    deckItemKey: "deceased-mercy",
    deckOrder: 30,
    dua: {
      label: "Funeral dua",
      intro: "Use for a deceased Muslim. Adjust pronouns if you are making dua for a woman or multiple people.",
      arabic:
        "اللَّهُمَّ اغْفِرْ لَهُ، وَارْحَمْهُ، وَعَافِهِ، وَاعْفُ عَنْهُ، وَأَكْرِمْ نُزُلَهُ، وَوَسِّعْ مُدْخَلَهُ، وَاغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ، وَنَقِّهِ مِنَ الْخَطَايَا كَمَا نَقَّيْتَ الثَّوْبَ الْأَبْيَضَ مِنَ الدَّنَسِ، وَأَبْدِلْهُ دَارًا خَيْرًا مِنْ دَارِهِ، وَأَهْلًا خَيْرًا مِنْ أَهْلِهِ، وَأَدْخِلْهُ الْجَنَّةَ، وَقِهِ فِتْنَةَ الْقَبْرِ وَعَذَابَ النَّارِ",
      transliteration:
        "Allahummaghfir lahu, warhamhu, wa 'afihi, wa'fu 'anhu, wa akrim nuzulahu, wa wassi' mudkhalahu, waghsilhu bil-ma'i wath-thalji wal-barad, wa naqqihi minal-khataya kama naqqaytath-thawbal-abyada minad-danas, wa abdilhu daran khayran min darihi, wa ahlan khayran min ahlihi, wa adkhilhul-jannah, wa qihi fitnatal-qabri wa 'adhaban-nar.",
      translation:
        "O Allah, forgive him, have mercy on him, grant him well-being, pardon him, honor his arrival, widen his entry, cleanse him, replace his home and family with better, admit him to Paradise, and protect him from the trial of the grave and the Fire.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "grief-dua-ayyub-mercy",
    moduleId: "grief-loss",
    kind: "authentic",
    eyebrow: "Long pain",
    title: "Anni massaniyad-durru wa anta arhamur-rahimin",
    summary:
      "For grief that has become prolonged harm, Ayyub's dua names the pain and reaches for Allah's mercy.",
    tags: ["Long grief", "Mercy", "Pain"],
    practice: [
      "Use when grief has stayed longer than people expect.",
      "Name the harm in front of Allah.",
      "Ask by Allah's mercy, not by your ability to cope.",
    ],
    actionLine: "Let prolonged pain become a direct appeal to mercy.",
    reflectionPrompt: "Where do you need Allah's mercy to meet long pain?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Ayyub called through harm to the Most Merciful.",
        detail:
          "It connects grief with shifa without flattening either module.",
        source: quran("Qur'an 21:83", "https://quran.com/21/83"),
      },
    ],
    deckItemKey: "long-pain-mercy",
    deckOrder: 40,
    dua: {
      label: "Qur'anic dua",
      intro: "Use when grief feels like prolonged harm.",
      arabic: "أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ",
      transliteration: "Anni massaniyad-durru wa anta arhamur-rahimin.",
      translation: "Harm has touched me, and You are the Most Merciful of those who show mercy.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "grief-dua-comfort-hearts",
    moduleId: "grief-loss",
    kind: "authentic",
    eyebrow: "Heart rest",
    title: "Ala bi dhikrillahi tatma'innul-qulub",
    summary:
      "This Qur'anic line does not erase grief. It tells the lonely heart where real rest is found.",
    tags: ["Loneliness", "Dhikr", "Heart"],
    practice: [
      "Use it when loneliness becomes loud.",
      "Pair it with quiet dhikr rather than scrolling through distraction.",
      "Ask Allah to make remembrance feel near again.",
    ],
    actionLine: "Let remembrance become the place your heart returns to.",
    reflectionPrompt: "What remembrance helps your heart return when people are absent?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Hearts find rest in the remembrance of Allah.",
        detail:
          "This gives the loneliness lane a Qur'anic close.",
        source: quran("Qur'an 13:28", "https://quran.com/13/28"),
      },
    ],
    deckItemKey: "heart-rest-dhikr",
    deckOrder: 50,
    dua: {
      label: "Qur'anic line",
      intro: "Use when grief turns into loneliness.",
      arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
      transliteration: "Ala bi dhikrillahi tatma'innul-qulub.",
      translation: "Surely, in the remembrance of Allah do hearts find rest.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
];

const griefCompletionSteps: JourneyStep[] = [
  createStep({
    id: "grief-loss-completion",
    moduleId: "grief-loss",
    kind: "guided",
    eyebrow: "Close",
    title: "Leave with one mercy dua and one human connection.",
    summary:
      "Grief should not end in isolation. Close by making dua, saving a private note if needed, and choosing one safe connection or act of mercy.",
    practice: [
      "Choose one dua for your next grief wave.",
      "Write a private note if the memory needs a place.",
      "Reach out to one safe person or do one act of sadaqah/mercy if you are able.",
    ],
    actionLine: "Carry grief with Allah and do not let it cut every tie.",
    reflectionPrompt: "Who can you reach without performing strength?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "Sorrow and distress can carry expiation for the believer.",
        detail:
          "The close gives grief an akhirah frame without dismissing it.",
        source: hadith("Sahih al-Bukhari 5641", "https://sunnah.com/bukhari:5641"),
      },
    ],
  }),
];

const familyPreludeSteps: JourneyStep[] = [
  createStep({
    id: "family-home-boundary",
    moduleId: "family-home",
    kind: "authentic",
    eyebrow: "Home",
    title: "Family dua is about amanah, mercy, prayer, and repair.",
    summary:
      "This module is for parents, spouses, children, strained homes, and people asking Allah for a righteous household. It keeps the home tied to worship, not image.",
    tags: ["Home", "Children", "Spouse"],
    practice: [
      "Name the relationship you are bringing into dua.",
      "Ask for righteousness before comfort.",
      "Choose one repair action alongside the dua.",
    ],
    actionLine: "Ask Allah for a home that helps the people inside it obey Him.",
    reflectionPrompt: "Which relationship in your home needs the most mercy right now?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "A dua for spouses, children, and leadership in taqwa.",
        detail:
          "This is the main Qur'anic family anchor.",
        source: quran("Qur'an 25:74", "https://quran.com/25/74"),
      },
      {
        eyebrow: "Hadith anchor",
        title: "Each person is responsible for those under their care.",
        detail:
          "The module treats family as an amanah, not only an emotional need.",
        source: hadith("Sahih al-Bukhari 5200", "https://sunnah.com/bukhari:5200"),
      },
    ],
  }),
  createStep({
    id: "family-mercy-before-control",
    moduleId: "family-home",
    kind: "guided",
    eyebrow: "Mercy",
    title: "Ask for a softer home before asking for everyone to change.",
    summary:
      "Many family duas begin from frustration. This step slows the user down: ask for mercy, prayer, gratitude, and repair in yourself as well as others.",
    tags: ["Mercy", "Repair", "Self"],
    practice: [
      "Make one dua for yourself before making dua about someone else.",
      "Ask Allah to remove harshness from your own words.",
      "Choose one repair that is within your control.",
    ],
    actionLine: "Do not use dua only to change them. Use dua to repair the home through you too.",
    reflectionPrompt: "What part of the tension belongs to your own tongue, absence, or impatience?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Allah placed affection and mercy between spouses.",
        detail:
          "Family peace needs mercy as much as problem-solving.",
        source: quran("Qur'an 30:21", "https://quran.com/30/21"),
      },
      {
        eyebrow: "Hadith anchor",
        title: "Complete faith is tied to good character and kindness to family.",
        detail:
          "The module should make family conduct part of worship.",
        source: hadith("Jami` at-Tirmidhi 2612", "https://sunnah.com/tirmidhi:2612"),
      },
    ],
  }),
  createStep({
    id: "family-parents-children",
    moduleId: "family-home",
    kind: "authentic",
    eyebrow: "Generations",
    title: "Carry parents and children in dua across generations.",
    summary:
      "The Qur'an gives duas for parents, offspring, gratitude, and prayer across descendants. This module should feel useful for parents, adult children, and anyone asking for a righteous home.",
    tags: ["Parents", "Children", "Generations"],
    practice: [
      "Make dua for your parents by name.",
      "Make dua for your children or future children.",
      "Ask Allah to keep prayer alive in your household.",
    ],
    actionLine: "Let your dua move backward to parents and forward to children.",
    reflectionPrompt: "Which generation are you most worried about right now?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "A dua for mercy toward parents.",
        detail:
          "The home module needs a parent-care lane, not only marriage and children.",
        source: quran("Qur'an 17:24", "https://quran.com/17/24"),
      },
      {
        eyebrow: "Qur'an anchor",
        title: "A dua for prayer to be established in descendants.",
        detail:
          "This makes the module useful for long-term family worship.",
        source: quran("Qur'an 14:40", "https://quran.com/14/40"),
      },
    ],
  }),
];

const familyDeckSteps: BuiltInDeckStep[] = [
  deckStep({
    id: "family-dua-spouse-children",
    moduleId: "family-home",
    kind: "authentic",
    eyebrow: "Family comfort",
    title: "Rabbana hablana min azwajina wa dhurriyyatina qurrata a'yun",
    summary:
      "A comprehensive family dua for spouses, children, comfort of the eyes, and becoming examples for the mindful.",
    tags: ["Spouse", "Children", "Taqwa"],
    practice: [
      "Use for your spouse, future spouse, children, or future children.",
      "Ask for comfort that comes through deen and character.",
      "Do not reduce the dua to a perfect-family image.",
    ],
    actionLine: "Ask for a family that helps your eyes rest because it helps your deen.",
    reflectionPrompt: "What would make your home a comfort of the eyes in Allah's sight?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "A dua for spouses, children, and taqwa leadership.",
        detail:
          "This is the central deck item for family and home.",
        source: quran("Qur'an 25:74", "https://quran.com/25/74"),
      },
    ],
    deckItemKey: "spouse-children-comfort",
    deckOrder: 10,
    dua: {
      label: "Qur'anic dua",
      intro: "Use for spouse, future spouse, children, future children, and the spiritual direction of your home.",
      arabic:
        "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ، وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
      transliteration:
        "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yun, waj'alna lil-muttaqina imama.",
      translation:
        "Our Lord, grant us comfort in our spouses and offspring, and make us leaders for the mindful.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "family-dua-parents",
    moduleId: "family-home",
    kind: "authentic",
    eyebrow: "Parents",
    title: "Rabbirhamhuma kama rabbayani saghira",
    summary:
      "A Qur'anic dua for mercy toward parents, especially useful for adult children, caregivers, and anyone carrying parent concerns.",
    tags: ["Parents", "Mercy", "Care"],
    practice: [
      "Make the dua for your parents by name.",
      "If caregiving is difficult, ask for mercy and patience together.",
      "Follow the dua with one act of service if possible.",
    ],
    actionLine: "Ask mercy for those who carried you.",
    reflectionPrompt: "What mercy do you want Allah to show your parents today?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "A direct Qur'anic dua for parents.",
        detail:
          "This keeps parent care in the core family module.",
        source: quran("Qur'an 17:24", "https://quran.com/17/24"),
      },
    ],
    deckItemKey: "parents-mercy",
    deckOrder: 20,
    dua: {
      label: "Qur'anic dua",
      intro: "Use for your parents, especially when you are worried about them or caring for them.",
      arabic: "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
      transliteration: "Rabbirhamhuma kama rabbayani saghira.",
      translation: "My Lord, have mercy on them as they raised me when I was small.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "family-dua-prayer-descendants",
    moduleId: "family-home",
    kind: "authentic",
    eyebrow: "Prayer",
    title: "Rabbij'alni muqimas-salati wa min dhurriyyati",
    summary:
      "Ibrahim's dua asks Allah to make him and his descendants establish prayer. It is a strong anchor for a worship-centered home.",
    tags: ["Prayer", "Children", "Home"],
    practice: [
      "Use it when you worry about prayer in your family.",
      "Ask Allah to make you an example before asking Him to change others.",
      "Pair it with one practical prayer support in the home.",
    ],
    actionLine: "Ask Allah to build salah into the home through you and after you.",
    reflectionPrompt: "What would make prayer easier to return to in your home?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Ibrahim asks Allah to establish prayer in his descendants.",
        detail:
          "This gives parents and future parents a long-term worship anchor.",
        source: quran("Qur'an 14:40", "https://quran.com/14/40"),
      },
    ],
    deckItemKey: "prayer-descendants",
    deckOrder: 30,
    dua: {
      label: "Qur'anic dua",
      intro: "Use when asking Allah to keep prayer alive in you and your family.",
      arabic: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي، رَبَّنَا وَتَقَبَّلْ دُعَاءِ",
      transliteration: "Rabbij'alni muqimas-salati wa min dhurriyyati, Rabbana wa taqabbal du'a.",
      translation: "My Lord, make me one who establishes prayer, and from my descendants. Our Lord, accept my supplication.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "family-dua-righteous-offspring",
    moduleId: "family-home",
    kind: "authentic",
    eyebrow: "Offspring",
    title: "Rabbi hab li min ladunka dhurriyyatan tayyibah",
    summary:
      "Zakariyya's dua asks Allah for good offspring. It serves people hoping for children, raising children, or making dua for future generations.",
    tags: ["Children", "Future", "Righteousness"],
    practice: [
      "Use it if you are asking for children or for children to become righteous.",
      "Ask for tayyibah, not only success or status.",
      "Let the dua hold hope without entitlement.",
    ],
    actionLine: "Ask for children and descendants who are good before they are impressive.",
    reflectionPrompt: "What does 'good offspring' mean beyond worldly success?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "Zakariyya asks Allah for good offspring.",
        detail:
          "This gives the family module a hopeful child-focused dua.",
        source: quran("Qur'an 3:38", "https://quran.com/3/38"),
      },
    ],
    deckItemKey: "righteous-offspring",
    deckOrder: 40,
    dua: {
      label: "Qur'anic dua",
      intro: "Use for children, future children, and righteous descendants.",
      arabic: "رَبِّ هَبْ لِي مِن لَّدُنكَ ذُرِّيَّةً طَيِّبَةً، إِنَّكَ سَمِيعُ الدُّعَاءِ",
      transliteration: "Rabbi hab li min ladunka dhurriyyatan tayyibah, innaka Sami'ud-du'a.",
      translation: "My Lord, grant me from Yourself good offspring. Surely You hear supplication.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
  deckStep({
    id: "family-dua-gratitude-offspring",
    moduleId: "family-home",
    kind: "authentic",
    eyebrow: "Generations",
    title: "Rabbi awzi'ni an ashkura ni'matak",
    summary:
      "This Qur'anic dua asks for gratitude, righteous action, and righteousness in offspring. It is powerful for parents and adult children.",
    tags: ["Gratitude", "Parents", "Children"],
    practice: [
      "Use when you want your family story to become obedience, not only comfort.",
      "Ask Allah to reform you and your offspring together.",
      "Name one blessing you have received through your family.",
    ],
    actionLine: "Ask for gratitude and righteousness to travel through the family line.",
    reflectionPrompt: "Which blessing in your family do you need to thank Allah for more honestly?",
    evidence: [
      {
        eyebrow: "Qur'an anchor",
        title: "A dua for gratitude, righteous action, and righteous offspring.",
        detail:
          "This rounds the module beyond crisis into long-term family faith.",
        source: quran("Qur'an 46:15", "https://quran.com/46/15"),
      },
    ],
    deckItemKey: "gratitude-offspring",
    deckOrder: 50,
    dua: {
      label: "Qur'anic dua",
      intro: "Use when asking Allah to repair you, your gratitude, and your descendants.",
      arabic:
        "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ، وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ، وَأَصْلِحْ لِي فِي ذُرِّيَّتِي",
      transliteration:
        "Rabbi awzi'ni an ashkura ni'matakallati an'amta 'alayya wa 'ala walidayya, wa an a'mala salihan tardah, wa aslih li fi dhurriyyati.",
      translation:
        "My Lord, enable me to be grateful for Your favor upon me and my parents, to do righteous deeds that please You, and make my offspring righteous for me.",
      trackerLabel: "Presence counter",
      trackerNote: PRESENCE_TRACKER_NOTE,
    },
  }),
];

const familyCompletionSteps: JourneyStep[] = [
  createStep({
    id: "family-home-completion",
    moduleId: "family-home",
    kind: "guided",
    eyebrow: "Close",
    title: "Leave with one dua and one repair action for the home.",
    summary:
      "Family dua should become gentler conduct, better prayer, service to parents, patience with children, and repair where possible.",
    practice: [
      "Choose the dua that matches the relationship you are carrying.",
      "Write one private note if the family strain needs clarity.",
      "Take one repair action: apologize, check in, serve, make prayer easier, or pause a harmful argument.",
    ],
    actionLine: "Ask for a righteous home, then behave like someone building one.",
    reflectionPrompt: "What is the next merciful action your home needs from you?",
    evidence: [
      {
        eyebrow: "Hadith anchor",
        title: "Spending on family with reward-intent counts as charity.",
        detail:
          "The close reminds the user that ordinary family care can become worship.",
        source: hadith("Sahih al-Bukhari 5351", "https://sunnah.com/bukhari:5351"),
      },
    ],
  }),
];

export const distressModuleDefinition: DuaJourneyModuleDefinition = {
  id: "anxiety-distress",
  label: "Anxiety & sadness",
  shortLabel: "Distress",
  eyebrow: "Core module",
  title: "Sakinah for worry, sadness, and overwhelm",
  subtitle: "A Qur'an-and-Sunnah anchored path for distress, hardship, and heavy days.",
  description:
    "Move from naming the burden to refuge, tawhid, mercy, capacity, and one faithful next step.",
  authenticityBoundary:
    "Verified anchors: Qur'anic sakinah and hardship verses, the Prophetic refuge from worry and grief, the distress dua, and the dua of Yunus. Hifzer structures the order without claiming a fixed ritual.",
  tone: "warn",
  supportsCustomDeck: true,
  preludeSteps: distressPreludeSteps,
  deckSteps: distressDeckSteps,
  completionSteps: distressCompletionSteps,
};

export const istikharaModuleDefinition: DuaJourneyModuleDefinition = {
  id: "istikhara-decisions",
  label: "Istikhara & decisions",
  shortLabel: "Istikhara",
  eyebrow: "Decision module",
  title: "Guided istikhara, decisions, and tawakkul",
  subtitle: "A decision flow for proposals, spouse concerns, work, study, family choices, and what to do next.",
  description:
    "Clarify the matter, consult with integrity, pray istikhara, ask for openings, and release the outcome to Allah.",
  authenticityBoundary:
    "Verified anchors: Sahih al-Bukhari's istikhara dua, Qur'anic consultation and tawakkul, and Qur'anic duas for need, speech, and family. Hifzer does not claim dreams or feelings are required signs.",
  tone: "accent",
  supportsCustomDeck: true,
  preludeSteps: istikharaPreludeSteps,
  deckSteps: istikharaDeckSteps,
  completionSteps: istikharaCompletionSteps,
};

export const healingModuleDefinition: DuaJourneyModuleDefinition = {
  id: "healing-shifa",
  label: "Healing & shifa",
  shortLabel: "Shifa",
  eyebrow: "Care module",
  title: "Healing, recovery, and caring for the sick",
  subtitle: "A shifa path for illness, recovery, visiting the sick, and making dua for parents and family.",
  description:
    "Ask Allah as ash-Shafi, make authentic shifa duas, care for the sick with mercy, and take the lawful means.",
  authenticityBoundary:
    "Verified anchors: Qur'anic healing language, Prophetic shifa dua, visiting-the-sick supplications, and ruqyah wording. This module is not medical advice and does not replace treatment.",
  tone: "success",
  supportsCustomDeck: true,
  preludeSteps: healingPreludeSteps,
  deckSteps: healingDeckSteps,
  completionSteps: healingCompletionSteps,
};

export const griefModuleDefinition: DuaJourneyModuleDefinition = {
  id: "grief-loss",
  label: "Grief & loss",
  shortLabel: "Grief",
  eyebrow: "Care module",
  title: "Grief, loneliness, and loss with Allah",
  subtitle: "A guided path for calamity, bereavement, loneliness, and mercy for those who have passed.",
  description:
    "Return the loss to Allah, complain sorrow to Him, make mercy duas for the deceased, and leave with one safe next connection.",
  authenticityBoundary:
    "Verified anchors: Qur'anic istirja, Ya'qub's grief, the calamity dua, and authentic funeral supplications. Hifzer gives a guided order without minimizing grief.",
  tone: "warn",
  supportsCustomDeck: true,
  preludeSteps: griefPreludeSteps,
  deckSteps: griefDeckSteps,
  completionSteps: griefCompletionSteps,
};

export const familyModuleDefinition: DuaJourneyModuleDefinition = {
  id: "family-home",
  label: "Family & home",
  shortLabel: "Family",
  eyebrow: "Home module",
  title: "Family, children, parents, and a home of mercy",
  subtitle: "A practical dua path for spouses, children, parenting, parents, and relationship strain.",
  description:
    "Ask for a righteous home, mercy for parents, children who grow in prayer, and repair actions that turn dua into conduct.",
  authenticityBoundary:
    "Verified anchors: Qur'anic duas for spouses, children, parents, prayer, gratitude, and offspring, with Sunnah reminders about family responsibility and kindness.",
  tone: "success",
  supportsCustomDeck: true,
  preludeSteps: familyPreludeSteps,
  deckSteps: familyDeckSteps,
  completionSteps: familyCompletionSteps,
};
