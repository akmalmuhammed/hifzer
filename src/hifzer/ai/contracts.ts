export type AyahExplanationSourceKind = "quran" | "translation" | "tafsir" | "word_study" | "other";

export type AyahExplanationInsight = {
  title: string;
  detail: string;
  source: string;
};

export type AyahWordNote = {
  term: string;
  detail: string;
};

export type AyahExplanationSource = {
  label: string;
  kind: AyahExplanationSourceKind;
};

export type AyahExplanation = {
  summary: string;
  keyThemes: string[];
  tafsirInsights: AyahExplanationInsight[];
  wordNotes: AyahWordNote[];
  reflectionPrompt: string | null;
  sources: AyahExplanationSource[];
  groundingTools: string[];
};

export type AyahExplanationGatewayRequest = {
  verseKey: string;
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  responseLanguage: string;
  localTranslation: {
    text: string;
    label: string;
    sourceLabel: string | null;
    direction: "ltr" | "rtl";
  } | null;
};

export type AyahExplanationGatewaySuccess = {
  ok: true;
  provider: string;
  model: string;
  verseKey: string;
  explanation: AyahExplanation;
};

export type AyahExplanationGatewayFailure = {
  ok: false;
  status: "not_configured" | "timeout" | "error";
  detail: string;
};

export type AyahExplanationGatewayResponse = AyahExplanationGatewaySuccess | AyahExplanationGatewayFailure;

export type QuranAssistantGatewayRequest = {
  query: string;
  responseLanguage: string;
  currentAyah: {
    verseKey: string;
    surahNumber: number;
    ayahNumber: number;
    arabicText: string;
    localTranslation: {
      text: string;
      label: string;
      sourceLabel: string | null;
      direction: "ltr" | "rtl";
    } | null;
  } | null;
};

export type QuranAssistantAyahMatch = {
  verseKey: string;
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  translationText: string | null;
  translationLabel: string | null;
  sourceUrl: string | null;
  relevanceScore: number | null;
  relevanceReason: string | null;
};

export type QuranAssistantTafsirHighlight = {
  verseKey: string;
  source: string;
  detail: string;
  sourceUrl: string | null;
};

export type QuranAssistantAnswer = {
  summary: string;
  keyTakeaways: string[];
  ayahMatches: QuranAssistantAyahMatch[];
  tafsirHighlights: QuranAssistantTafsirHighlight[];
  followUpPrompt: string | null;
  sources: AyahExplanationSource[];
  groundingTools: string[];
};

export type QuranAssistantMatchTranslation = {
  text: string;
  label: string;
  sourceLabel: string | null;
  direction: "ltr" | "rtl";
} | null;

export type QuranAssistantMatch = {
  verseKey: string;
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  translation: QuranAssistantMatchTranslation;
  tafsirSummary: string;
  sources: AyahExplanationSource[];
};

export type QuranAssistantGatewaySuccess = {
  ok: true;
  provider: string;
  model: string;
  query: string;
  answer: string;
  matches: QuranAssistantMatch[];
  groundingTools: string[];
};

export type QuranAssistantAskGatewaySuccess = {
  ok: true;
  provider: string;
  model: string;
  query: string;
  answer: QuranAssistantAnswer;
};

export type QuranAssistantGatewayFailure = {
  ok: false;
  status: "not_configured" | "timeout" | "error";
  detail: string;
};

export type QuranAssistantGatewayResponse = QuranAssistantGatewaySuccess | QuranAssistantGatewayFailure;
export type QuranAssistantAskGatewayResponse = QuranAssistantAskGatewaySuccess | QuranAssistantGatewayFailure;
