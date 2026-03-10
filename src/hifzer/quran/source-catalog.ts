export type QuranDataSourceId =
  | "tanzil"
  | "quranenc"
  | "king-fahd"
  | "quranic-arabic-corpus"
  | "quranfoundation";

export type QuranDataSourceKind = "text" | "translation" | "audio" | "linguistics" | "platform";
export type QuranDataSourceEase = "very_easy" | "easy" | "medium" | "hard";
export type QuranDataSourceCost = "free" | "free_with_terms" | "approval_required" | "legal_review";

export type QuranDataSource = {
  id: QuranDataSourceId;
  name: string;
  shortLabel: string;
  kind: QuranDataSourceKind;
  ease: QuranDataSourceEase;
  effortRank: number;
  cost: QuranDataSourceCost;
  officialUrl: string;
  docsUrl?: string;
  termsUrl?: string;
  setupSummary: string;
  inputRequirements: string[];
  bestFor: string[];
  summary: string;
};

export const QURAN_DATA_SOURCE_OPTIONS: readonly QuranDataSource[] = [
  {
    id: "tanzil",
    name: "Tanzil",
    shortLabel: "Tanzil",
    kind: "text",
    ease: "very_easy",
    effortRank: 1,
    cost: "free_with_terms",
    officialUrl: "https://tanzil.net/download/",
    termsUrl: "https://tanzil.net/docs/Text_License",
    setupSummary: "Direct download. No account or API key is required for the Arabic text export.",
    inputRequirements: [
      "Choose the export format you want to bundle locally.",
      "Keep the Arabic text verbatim and preserve Tanzil attribution.",
    ],
    bestFor: ["Canonical Arabic text", "Metadata integrity", "Pause-mark-aware reader modes"],
    summary: "Best first source for locally bundled Qur'an text and metadata governance.",
  },
  {
    id: "quranenc",
    name: "QuranEnc",
    shortLabel: "QuranEnc",
    kind: "translation",
    ease: "very_easy",
    effortRank: 2,
    cost: "free_with_terms",
    officialUrl: "https://quranenc.com/en/home",
    docsUrl: "https://quranenc.com/en/home/api",
    termsUrl: "https://quranenc.com/en/home",
    setupSummary: "Public translations and API/docs are exposed without OAuth in the official developer entry points.",
    inputRequirements: [
      "Pick the translation/language dataset you want to bundle or sync.",
      "Review the translation-specific policy before shipping it in product.",
    ],
    bestFor: ["Global translation expansion", "Locale-specific onboarding", "Translation comparison mode"],
    summary: "Fastest source for broad multilingual coverage once each target translation is reviewed.",
  },
  {
    id: "king-fahd",
    name: "King Fahd Glorious Qur'an Printing Complex",
    shortLabel: "King Fahd",
    kind: "audio",
    ease: "easy",
    effortRank: 3,
    cost: "free_with_terms",
    officialUrl: "https://qurancomplex.gov.sa/en/translate-sounds/",
    termsUrl: "https://qurancomplex.gov.sa/en/translate-sounds/",
    setupSummary: "Official audio translation assets are available publicly, but integration is closer to asset ingestion than a modern JSON API.",
    inputRequirements: [
      "Select the translation-audio collection you want to support.",
      "Package/cache the assets for the listening experience you want.",
    ],
    bestFor: ["Official-feeling audio translation support", "Accessibility bundles", "Trusted multilingual listening"],
    summary: "Good accessibility and official-reference layer after the core text/translation stack is stable.",
  },
  {
    id: "quranic-arabic-corpus",
    name: "Quranic Arabic Corpus",
    shortLabel: "Corpus",
    kind: "linguistics",
    ease: "medium",
    effortRank: 4,
    cost: "legal_review",
    officialUrl: "https://corpus.quran.com/documentation/",
    docsUrl: "https://corpus.quran.com/download/",
    termsUrl: "https://corpus.quran.com/faq.jsp",
    setupSummary: "Downloadable morphology and syntax data exist, but commercial use should be treated as legal-review-first.",
    inputRequirements: [
      "Provide a contact email for downloads.",
      "Review corpus licensing and commercial-use assumptions before embedding it in product.",
    ],
    bestFor: ["Root and lemma drills", "Grammar-aware memorization hints", "Mutashabihat analysis"],
    summary: "High-value enrichment source once licensing is clarified for your commercial distribution.",
  },
  {
    id: "quranfoundation",
    name: "Quran.Foundation / Quran.com APIs",
    shortLabel: "Quran.com",
    kind: "platform",
    ease: "hard",
    effortRank: 5,
    cost: "approval_required",
    officialUrl: "https://api-docs.quran.com/",
    docsUrl: "https://api-docs.quran.com/docs/quickstart/",
    termsUrl: "https://api-docs.quran.com/request-access/",
    setupSummary: "Richest official API stack, but it requires approved access, client credentials, and OAuth2 flows.",
    inputRequirements: [
      "Request API access and receive client credentials.",
      "Configure OAuth2 and redirect URLs for any user-linked flows.",
    ],
    bestFor: ["Official tafsir/search APIs", "User import/federation", "Managed content APIs"],
    summary: "Most powerful long-term integration, but not the fastest source to land first.",
  },
] as const;

const COST_LABELS: Record<QuranDataSourceCost, string> = {
  free: "Free",
  free_with_terms: "Free with terms",
  approval_required: "Approval required",
  legal_review: "Legal review first",
};

const EASE_LABELS: Record<QuranDataSourceEase, string> = {
  very_easy: "Very easy",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const SOURCE_BY_ID = new Map<QuranDataSourceId, QuranDataSource>(
  QURAN_DATA_SOURCE_OPTIONS.map((source) => [source.id, source]),
);

export function getQuranDataSource(id: QuranDataSourceId): QuranDataSource {
  return SOURCE_BY_ID.get(id) ?? QURAN_DATA_SOURCE_OPTIONS[0];
}

export function listQuranDataSourcesSorted(): QuranDataSource[] {
  return [...QURAN_DATA_SOURCE_OPTIONS].sort((left, right) => left.effortRank - right.effortRank);
}

export function getQuranDataSourceCostLabel(cost: QuranDataSourceCost): string {
  return COST_LABELS[cost];
}

export function getQuranDataSourceEaseLabel(ease: QuranDataSourceEase): string {
  return EASE_LABELS[ease];
}
