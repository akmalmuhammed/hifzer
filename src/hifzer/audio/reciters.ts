export type ReciterOption = {
  id: string;
  label: string;
  description: string;
};

export const QURAN_FOUNDATION_RECITER_PREFIX = "qf:";

export const LOCAL_RECITER_OPTIONS: ReciterOption[] = [
  {
    id: "default",
    label: "System default",
    description: "Uses the reciter configured for this Hifzer deployment.",
  },
  {
    id: "alafasy",
    label: "Mishary Alafasy",
    description: "Clear, familiar recitation that works well for daily reading and review.",
  },
  {
    id: "husary",
    label: "Mahmoud Khalil Al-Husary",
    description: "Steady tajweed-focused pacing suited for careful listening and memorization.",
  },
];

export const RECITER_OPTIONS = LOCAL_RECITER_OPTIONS;

const LOCAL_RECITER_IDS = new Set(LOCAL_RECITER_OPTIONS.map((option) => option.id));

const LOCAL_RECITER_MATCH_TOKENS: Record<string, string[]> = {
  default: ["alafasy", "afasy", "mishary", "mishari"],
  alafasy: ["alafasy", "afasy", "mishary", "mishari"],
  husary: ["husary", "husari", "mahmoud khalil al-husary", "mahmoud khalil al-husari", "murattal"],
};

export function encodeQuranFoundationReciterId(recitationId: number): string {
  return `${QURAN_FOUNDATION_RECITER_PREFIX}${Math.max(1, Math.floor(recitationId))}`;
}

export function parseQuranFoundationReciterId(value: string | null | undefined): number | null {
  if (!value || !value.startsWith(QURAN_FOUNDATION_RECITER_PREFIX)) {
    return null;
  }
  const raw = Number(value.slice(QURAN_FOUNDATION_RECITER_PREFIX.length));
  if (!Number.isFinite(raw) || raw <= 0) {
    return null;
  }
  return Math.floor(raw);
}

export function isLocalReciterId(value: string): boolean {
  return LOCAL_RECITER_IDS.has(value);
}

export function isSupportedReciterId(value: string): boolean {
  return isLocalReciterId(value) || parseQuranFoundationReciterId(value) != null;
}

export function normalizeReciterId(value: string | null | undefined): string {
  if (!value) {
    return "default";
  }
  const trimmed = value.trim();
  return isSupportedReciterId(trimmed) ? trimmed : "default";
}

export function getReciterLabel(reciterId: string): string {
  if (parseQuranFoundationReciterId(reciterId) != null) {
    return "Quran.com reciter";
  }
  return LOCAL_RECITER_OPTIONS.find((option) => option.id === reciterId)?.label ?? "System default";
}

export function getLocalReciterMatchTokens(reciterId: string): string[] {
  return LOCAL_RECITER_MATCH_TOKENS[normalizeReciterId(reciterId)] ?? [];
}
