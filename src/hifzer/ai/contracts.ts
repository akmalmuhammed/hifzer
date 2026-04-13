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

export type QuranAssistantGatewaySuccess = {
  ok: true;
  provider: string;
  model: string;
  query: string;
  answer: string;
  matches: QuranAssistantMatch[];
  groundingTools: string[];
};

export type AyahExplanationGatewayFailure = {
  ok: false;
  status: "not_configured" | "timeout" | "error";
  detail: string;
};

export type AyahExplanationGatewayResponse = AyahExplanationGatewaySuccess | AyahExplanationGatewayFailure;
export type QuranAssistantGatewayResponse = QuranAssistantGatewaySuccess | AyahExplanationGatewayFailure;
