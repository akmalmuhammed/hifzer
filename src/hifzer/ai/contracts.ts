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
